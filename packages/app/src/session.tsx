import type { Profile } from '@sartre/core';
import type { Backend, EmailLinkResult, SessionUser } from '@sartre/firebase';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Who is signed in, and whether they have a profile yet. Only mounted with
// `data=firebase`; in mock mode useSession() returns null and nothing here runs.

export type SessionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'signedOut'; emailLink: EmailLinkResult }
  | { status: 'needsHandle'; user: SessionUser }
  | { status: 'ready'; user: SessionUser; profile: Profile };

export interface Session {
  state: SessionState;
  backend: Backend;
  /** HandleScreen calls this once the handle is claimed. */
  setProfile(profile: Profile): void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ getBackend, children }: { getBackend: () => Backend; children: ReactNode }) {
  // Created on the client only: SSR renders the 'loading' state and never touches Firebase.
  const [backend, setBackend] = useState<Backend | null>(null);
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => setBackend(getBackend()), [getBackend]);

  useEffect(() => {
    if (!backend) return;
    let emailLink: EmailLinkResult = 'none';
    let latest = 0;
    backend.completeEmailLink().then(
      (result) => {
        emailLink = result;
        setState((s) => (s.status === 'signedOut' ? { ...s, emailLink: result } : s));
      },
      (e: unknown) => console.error('Email link sign-in failed', e),
    );
    return backend.onUser(async (user) => {
      const call = ++latest;
      if (!user) return setState({ status: 'signedOut', emailLink });
      setState({ status: 'loading' });
      try {
        const profile = await backend.getProfile(user.uid);
        if (call !== latest) return; // a newer sign-in/out happened meanwhile
        setState(profile ? { status: 'ready', user, profile } : { status: 'needsHandle', user });
      } catch (e) {
        console.error(e);
        if (call === latest) setState({ status: 'error', message: backend.usingEmulators ? 'Can’t reach the Firebase emulators. Start them with `pnpm emulators`.' : 'Can’t reach the server.' });
      }
    });
  }, [backend]);

  const session = useMemo<Session | null>(
    () =>
      backend && {
        state,
        backend,
        setProfile: (profile) => setState((s) => ('user' in s ? { status: 'ready', user: s.user, profile } : s)),
      },
    [backend, state],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/** Null in mock mode (and for the first client render in Firebase mode). */
export const useSession = () => useContext(SessionContext);
