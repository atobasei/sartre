import { handleProblem, normalizeHandle, suggestHandle, type HandleProblem, type Profile } from '@sartre/core';
import type { SessionUser } from '@sartre/firebase';
import { space } from '@sartre/tokens';
import { Button, Text } from '@sartre/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthFrame, Field } from '../components/AuthFrame';
import { routes, useNav } from '../nav';
import type { Session } from '../session';
import { useSettings } from '../settings';

const PROBLEMS: Record<HandleProblem, string> = {
  short: 'At least 3 characters.',
  long: '20 characters at most.',
  chars: 'Letters, numbers and underscores only.',
};

/** First sign-in only: a name and a handle, which becomes the profile URL. */
export function HandleScreen({ session, user }: { session: Session; user: SessionUser }) {
  const nav = useNav();
  const { settings } = useSettings();
  const [name, setName] = useState(user.displayName ?? '');
  const [handle, setHandle] = useState(() => suggestHandle(user.displayName ?? user.email ?? ''));
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const normalized = normalizeHandle(handle);
  const problem = handleProblem(normalized);
  const ready = !problem && name.trim().length > 0 && !busy;

  const submit = async () => {
    if (!ready) return;
    const profile: Profile = {
      uid: user.uid,
      handle: normalized,
      displayName: name.trim().slice(0, 60),
      avatarUrl: user.photoURL,
      banner: { type: 'topFour' },
      theme: settings.theme,
      privacy: 'completions',
      joinedAt: new Date().toISOString(),
    };
    setBusy(true);
    setError(undefined);
    try {
      await session.backend.claimHandle(profile);
      session.setProfile(profile);
      nav.replace(routes.profile(profile.handle));
    } catch (e) {
      setError((e as Error).name === 'HandleTakenError' ? `@${normalized} is taken.` : 'That didn’t work. Try again.');
      if ((e as Error).name !== 'HandleTakenError') console.error(e);
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      <Text variant="title">Your profile</Text>
      <View style={{ gap: space[2] }}>
        <Text variant="label" tone="muted">
          Name
        </Text>
        <Field value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" accessibilityLabel="Name" maxLength={60} />
      </View>
      <View style={{ gap: space[2] }}>
        <Text variant="label" tone="muted">
          Handle
        </Text>
        <Field value={handle} onChangeText={setHandle} onSubmitEditing={submit} accessibilityLabel="Handle" maxLength={21} />
        <Text variant="mono" tone={handle && problem ? 'accent' : 'faint'}>
          {handle && problem ? PROBLEMS[problem] : `/@${normalized || 'handle'}`}
        </Text>
      </View>
      {error ? (
        <Text variant="small" tone="accent">
          {error}
        </Text>
      ) : null}
      <Button label="Continue" size="lg" disabled={!ready} onPress={submit} />
    </AuthFrame>
  );
}
