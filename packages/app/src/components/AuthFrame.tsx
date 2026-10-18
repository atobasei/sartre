import { APP_NAME, space } from '@sartre/tokens';
import { Text, useTheme } from '@sartre/ui';
import type { ReactNode } from 'react';
import { ScrollView, TextInput, View, type TextInputProps } from 'react-native';

/** The quiet, centered column sign-in and handle steps share (no app chrome yet). */
export function AuthFrame({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space[5] }}>
      <View style={{ width: '100%', maxWidth: 380, alignSelf: 'center', gap: space[5] }}>
        <Text variant="heading" style={{ fontWeight: '600', letterSpacing: -0.3 }}>
          {APP_NAME.toLowerCase()}
        </Text>
        {children}
      </View>
    </ScrollView>
  );
}

export function Field(props: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
          color: colors.text,
          backgroundColor: colors.bg,
        },
        props.style,
      ]}
    />
  );
}
