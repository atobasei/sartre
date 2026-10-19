import { authErrorMessage, isExpectedAuthError, type SessionUser } from '@sartre/firebase';
import { space } from '@sartre/tokens';
import { Button, Text } from '@sartre/ui';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthFrame } from '../components/AuthFrame';
import type { Session } from '../session';

/** Password accounts verify their email before choosing a username (rules enforce it too). */
export function VerifyEmailScreen({ session, user }: { session: Session; user: SessionUser }) {
  const { backend } = session;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'muted' | 'accent' }>();

  const run = async (action: () => Promise<string | undefined>) => {
    setBusy(true);
    setMessage(undefined);
    try {
      const text = await action();
      if (text) setMessage({ text, tone: 'muted' });
    } catch (e) {
      if (!isExpectedAuthError(e)) console.error(e);
      setMessage({ text: authErrorMessage(e), tone: 'accent' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      <Text variant="title">Check your email</Text>
      <Text variant="body" tone="muted">
        We sent a link to {user.email}. Open it to confirm the address, then come back here.
      </Text>
      {backend.usingEmulators ? (
        <Text variant="small" tone="faint">
          Emulator: nothing is emailed. The link is printed in the emulator terminal and listed in the Emulator UI under Authentication.
        </Text>
      ) : null}
      <View style={{ gap: space[3] }}>
        <Button
          label="I’ve verified it"
          size="lg"
          disabled={busy}
          onPress={() => run(async () => ((await session.recheckVerification()) ? undefined : 'Not verified yet. Open the link in the email first.'))}
        />
        <Button
          label="Resend the email"
          kind="secondary"
          disabled={busy}
          onPress={() => run(async () => (await backend.resendVerification(), 'Sent again.'))}
        />
        <Button label="Use a different account" kind="ghost" disabled={busy} onPress={() => run(async () => (await backend.signOut(), undefined))} />
      </View>
      {message ? (
        <Text variant="small" tone={message.tone}>
          {message.text}
        </Text>
      ) : null}
    </AuthFrame>
  );
}
