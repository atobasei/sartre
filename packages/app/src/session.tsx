import type { Profile } from '@sartre/core';
import type { Backend, SessionUser } from '@sartre/firebase';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Who is signed in, and how far through sign-up they are. Only mounted with
// `data=firebase`; in mock mode useSession() returns null and nothing here runs.

export type SessionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'signedOut' }
  | { status: 'needsVerification'; user: SessionUser }
  | { status: 'needsUsername'; user: SessionUser }
  | { status: 'ready'; user: SessionUser; profile: Profile };

export interface Session {
  state: SessionState;
  backend: Backend;
  /** UsernameScreen calls this once the username is claimed. */
  setProfile(profile: Profile): void;
  /** VerifyEmailScreen calls this after the user follows the link. Resolves false if still unverified. */
  recheckVerification(): Promise<boolean>;
}

const SessionContext = createContext<Session | null>(null);

// Firestore retries unreachable or missing databases indefinitely; give up and say so.
const PROFILE_TIMEOUT_MS = 12_000;
const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms))]);

export function SessionProvider({ getBackend, children }: { getBackend: () => Backend; children: ReactNode }) {
  // Created on the client only: SSR renders the 'loading' state and never touches Firebase.
  const [backend, setBackend] = useState<Backend | null>(null);
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => setBackend(getBackend()), [getBackend]);
  useEffect(() => backend?.onUser(setUser), [backend]);

  // Every change of user (or of their verification) re-derives the step they're on.
  useEffect(() => {
    if (!backend || user === undefined) return;
    if (!user) return setState({ status: 'signedOut' });
    if (!user.emailVerified) return setState({ status: 'needsVerification', user });
    let current = true;
    setState({ status: 'loading' });
    withTimeout(backend.getProfile(user.uid), PROFILE_TIMEOUT_MS).then(
      (profile) => current && setState(profile ? { status: 'ready', user, profile } : { status: 'needsUsername', user }),
      (e: unknown) => {
        console.error(e);
        if (current) {
          setState({
            status: 'error',
            message: backend.usingEmulators ? 'Can’t reach the Firebase emulators. Start them with `pnpm emulators`.' : 'Can’t reach the server.',
          });
        }
      },
    );
    return () => {
      current = false;
    };
  }, [backend, user]);

  const session = useMemo<Session | null>(
    () =>
      backend && {
        state,
        backend,
        setProfile: (profile) => setState((s) => ('user' in s ? { status: 'ready', user: s.user, profile } : s)),
        async recheckVerification() {
          const fresh = await backend.refreshUser();
          // reload() doesn't fire onAuthStateChanged, so hand the new state over ourselves.
          if (fresh?.emailVerified) setUser(fresh);
          return Boolean(fresh?.emailVerified);
        },
      },
    [backend, state],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/** Null in mock mode (and for the first client render in Firebase mode). */
export const useSession = () => useContext(SessionContext);
