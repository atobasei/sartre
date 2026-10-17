import { APP_NAME, themes } from '@sartre/tokens';
import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { Suspense, type ReactNode } from 'react';
import { WebPrototype } from './providers';
import { StyleRegistry } from './style-registry';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: 'Track what you finish. Rank it honestly. Share the ones that matter.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} style={{ background: themes.paper.colors.bg }}>
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StyleRegistry>
          <Suspense>
            <WebPrototype>{children}</WebPrototype>
          </Suspense>
        </StyleRegistry>
      </body>
    </html>
  );
}
