import { space } from '@sartre/tokens';
import { Button, Text } from '@sartre/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthFrame, Field } from '../components/AuthFrame';
import type { Session } from '../session';

type Phase = { kind: 'idle' } | { kind: 'busy' } | { kind: 'sent'; email: string } | { kind: 'error'; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Google first, an emailed link as the fallback. No passwords. */
export function SignInScreen({ session, emailLink }: { session: Session; emailLink: 'none' | 'needsEmail' | 'done' }) {
  const { backend } = session;
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const busy = phase.kind === 'busy';
  const finishing = emailLink === 'needsEmail';

  const run = async (action: () => Promise<unknown>, after?: Phase) => {
    setPhase({ kind: 'busy' });
    try {
      await action();
      setPhase(after ?? { kind: 'idle' });
    } catch (e) {
      console.error(e);
      const message = (e as Error).name === 'UnsupportedError' ? (e as Error).message : 'That didn’t work. Try again.';
      setPhase({ kind: 'error', message });
    }
  };

  const submitEmail = () => {
    const address = email.trim();
    if (!EMAIL.test(address)) return setPhase({ kind: 'error', message: 'That doesn’t look like an email address.' });
    if (finishing) return run(() => backend.completeEmailLink(address));
    run(() => backend.sendEmailLink(address), { kind: 'sent', email: address });
  };

  if (phase.kind === 'sent') {
    return (
      <AuthFrame>
        <Text variant="title">Check your email</Text>
        <Text variant="body" tone="muted">
          A sign-in link is on its way to {phase.email}. Open it on this device.
        </Text>
        {backend.usingEmulators ? (
          <Text variant="small" tone="faint">
            Emulator: nothing is emailed. The link is printed in the emulator terminal and listed in the Emulator UI under Authentication.
          </Text>
        ) : null}
        <View style={{ alignItems: 'flex-start' }}>
          <Button label="Use a different address" kind="ghost" onPress={() => setPhase({ kind: 'idle' })} />
        </View>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <Text variant="title">{finishing ? 'Confirm your email' : 'Sign in'}</Text>
      {finishing ? (
        <Text variant="body" tone="muted">
          This link was opened on a different device or browser. Enter the address it was sent to.
        </Text>
      ) : (
        <>
          <Button label="Continue with Google" size="lg" disabled={busy} onPress={() => run(() => backend.signInWithGoogle())} />
          <Text variant="small" tone="faint" align="center">
            or
          </Text>
        </>
      )}
      <View style={{ gap: space[3] }}>
        <Field
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={submitEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          accessibilityLabel="Email"
          editable={!busy}
        />
        <Button label={finishing ? 'Finish signing in' : 'Email me a link'} kind="secondary" disabled={busy} onPress={submitEmail} />
      </View>
      {phase.kind === 'error' ? (
        <Text variant="small" tone="accent">
          {phase.message}
        </Text>
      ) : null}
    </AuthFrame>
  );
}
