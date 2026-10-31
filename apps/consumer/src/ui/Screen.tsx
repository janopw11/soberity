import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@soberity/design-tokens';

type ScreenProps = PropsWithChildren<{
  /** Wraps content in a ScrollView. Defaults to true. */
  scroll?: boolean;
  /** Maximum responsive content width on wide (web) viewports. */
  maxWidth?: number;
  /** Wraps content in a KeyboardAvoidingView for screens with text inputs. */
  avoidKeyboard?: boolean;
}>;

export function Screen({
  children,
  scroll = true,
  maxWidth = 1120,
  avoidKeyboard = false,
}: ScreenProps) {
  const content = (
    <View style={[styles.content, { maxWidth }]}>{children}</View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : (
    <View style={styles.flexFill}>{content}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flexFill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flexFill: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.space16,
    paddingVertical: spacing.space24,
  },
  content: { width: '100%', alignSelf: 'center', gap: spacing.space24 },
});
