import { handleProblem, normalizeHandle, suggestHandle, type HandleProblem, type Profile } from '@sartre/core';
import { authErrorMessage, type SessionUser } from '@sartre/firebase';
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

/**
 * The only sign-up question. The username is permanent and unique (it's the
 * /@username URL, stored as `handle`); the display name starts as the username
 * and is edited later from the profile.
 */
export function UsernameScreen({ session, user }: { session: Session; user: SessionUser }) {
  const nav = useNav();
  const { settings } = useSettings();
  const [username, setUsername] = useState(() => suggestHandle(user.email ?? ''));
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const normalized = normalizeHandle(username);
  const problem = handleProblem(normalized);
  const ready = !problem && !busy;

  const submit = async () => {
    if (!ready) return;
    const profile: Profile = {
      uid: user.uid,
      handle: normalized,
      displayName: normalized,
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
      if ((e as Error).name === 'HandleTakenError') {
        setError(`@${normalized} is taken.`);
      } else {
        console.error(e);
        setError(authErrorMessage(e));
      }
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      <Text variant="title">Choose a username</Text>
      <Text variant="body" tone="muted">
        It’s your profile’s address and can’t be changed later. Your display name can.
      </Text>
      <View style={{ gap: space[2] }}>
        <Field
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={submit}
          placeholder="Username"
          autoComplete="username"
          textContentType="username"
          accessibilityLabel="Username"
          maxLength={21}
          autoFocus
        />
        <Text variant="mono" tone={username && problem ? 'accent' : 'faint'}>
          {username && problem ? PROBLEMS[problem] : `/@${normalized || 'username'}`}
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
