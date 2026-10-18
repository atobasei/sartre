import { APP_NAME, layout, space } from '@sartre/tokens';
import { Button, Text, useTheme } from '@sartre/ui';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DevToolbar } from './DevToolbar';
import { routes, useNav } from './nav';
import { useSession } from './session';
import { useSettings } from './settings';
import { useLibrary } from './store';

/** Page chrome: a quiet top bar, centered content column, prototype toolbar. */
export function AppShell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const nav = useNav();
  const { settings } = useSettings();
  const { library } = useLibrary();
  const session = useSession();

  return (
    <View style={{ flex: 1, minHeight: '100%', backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', paddingHorizontal: layout.gutter }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space[4] }}>
            <Pressable onPress={() => nav.push(routes.profile(library.profile.handle))} accessibilityRole="link">
              <Text variant="heading" style={{ fontWeight: '600', letterSpacing: -0.3 }}>
                {APP_NAME.toLowerCase()}
              </Text>
            </Pressable>
            {settings.viewer === 'owner' ? (
              <View style={{ flexDirection: 'row', gap: space[2] }}>
                {session ? <Button label="Sign out" kind="ghost" onPress={() => session.backend.signOut()} /> : null}
                <Button label="Log a book" onPress={() => nav.push(routes.log())} />
              </View>
            ) : null}
          </View>
          {children}
        </View>
      </ScrollView>
      <DevToolbar />
    </View>
  );
}
