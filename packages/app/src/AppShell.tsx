import { APP_NAME, layout, space } from '@sartre/tokens';
import { Button, Text, useTheme } from '@sartre/ui';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { DevToolbar } from './DevToolbar';
import { routes, useNav } from './nav';
import { useSettings } from './settings';
import { useLibrary } from './store';

/** Page chrome: a quiet top bar, centered content column, prototype toolbar. */
export function AppShell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const nav = useNav();
  const { settings } = useSettings();
  const { library } = useLibrary();

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
            {settings.viewer === 'owner' ? <Button label="Log a book" onPress={() => nav.push(routes.log())} /> : null}
          </View>
          {children}
        </View>
      </ScrollView>
      <DevToolbar />
    </View>
  );
}
