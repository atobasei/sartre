import { authErrorMessage, isExpectedAuthError } from '@sartre/firebase';
import { space } from '@sartre/tokens';
import { Button, Text } from '@sartre/ui';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AuthFrame, Field } from '../components/AuthFrame';
import type { Session } from '../session';

type Mode = 'signIn' | 'signUp' | 'reset';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Matches the password policy to set in the Firebase console, which enforces it server-side. */
export const PASSWORD_MIN = 8;

const TITLES: Record<Mode, string> = { signIn: 'Sign in', signUp: 'Create account', reset: 'Reset password' };
const ACTIONS: Record<Mode, string> = { signIn: 'Sign in', signUp: 'Create account', reset: 'Send reset link' };

/** Google, or email and password. */
export function SignInScreen({ session }: { session: Session }) {
  const { backend } = session;
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const switchTo = (next: Mode) => {
    setMode(next);
    setError(undefined);
    setNotice(undefined);
  };

  const run = async (action: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      if (done) setNotice(done);
    } catch (e) {
      if (!isExpectedAuthError(e)) console.error(e);
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const address = email.trim();
    if (!EMAIL.test(address)) return setError('That doesn’t look like an email address.');
    if (mode === 'reset') {
      return run(() => backend.sendPasswordReset(address), 'If there’s an account for that email, a reset link is on its way.');
    }
    if (!password) return setError('Enter your password.');
    if (mode === 'signUp') {
      if (password.length < PASSWORD_MIN) return setError(`Use at least ${PASSWORD_MIN} characters.`);
      return run(() => backend.signUpWithPassword(address, password));
    }
    run(() => backend.signInWithPassword(address, password));
  };

  return (
    <AuthFrame>
      <Text variant="title">{TITLES[mode]}</Text>
      {mode !== 'reset' ? (
        <>
          <Button label="Continue with Google" size="lg" disabled={busy} onPress={() => run(() => backend.signInWithGoogle())} />
          <Text variant="small" tone="faint" align="center">
            or
          </Text>
        </>
      ) : (
        <Text variant="body" tone="muted">
          We’ll email you a link to choose a new password.
        </Text>
      )}
      <View style={{ gap: space[3] }}>
        <Field
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={submit}
          placeholder="Email"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          accessibilityLabel="Email"
          editable={!busy}
        />
        {mode !== 'reset' ? (
          <Field
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            placeholder={mode === 'signUp' ? `Password (${PASSWORD_MIN}+ characters)` : 'Password'}
            secureTextEntry
            autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
            textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
            accessibilityLabel="Password"
            editable={!busy}
          />
        ) : null}
        <Button label={ACTIONS[mode]} kind="secondary" disabled={busy} onPress={submit} />
      </View>
      {error ? (
        <Text variant="small" tone="accent">
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text variant="small" tone="muted">
          {notice}
        </Text>
      ) : null}
      <View style={{ gap: space[2] }}>
        {mode === 'signIn' ? (
          <>
            <TextLink label="Forgot password?" onPress={() => switchTo('reset')} />
            <TextLink label="New here? Create an account" onPress={() => switchTo('signUp')} />
          </>
        ) : (
          <TextLink label="Have an account? Sign in" onPress={() => switchTo('signIn')} />
        )}
      </View>
    </AuthFrame>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
      <Text variant="small" tone="muted" style={{ textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}
