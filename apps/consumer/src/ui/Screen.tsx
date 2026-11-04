import { useRef, type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

type ScreenProps = PropsWithChildren<{
  /** Wraps content in a ScrollView. Defaults to true. */
  scroll?: boolean;
  /** Maximum responsive content width on wide (web) viewports. */
  maxWidth?: number;
  /** Optional layout for the inner content, e.g. a footer at the page bottom. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Wraps content in a KeyboardAvoidingView for screens with text inputs. */
  avoidKeyboard?: boolean;
  /** Scroll viewport for lightweight visibility-triggered presentation. */
  onViewportChange?: (viewport: { offsetY: number; height: number; scrolled: boolean }) => void;
}>;

export function Screen({
  children,
  scroll = true,
  maxWidth = 1120,
  contentStyle,
  avoidKeyboard = false,
  onViewportChange,
}: ScreenProps) {
  const offset = useRef(0);
  const scrolled = useRef(false);
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const content = (
    <View style={[styles.content, { maxWidth }, contentStyle]}>{children}</View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      onLayout={onViewportChange ? event => onViewportChange({ offsetY: offset.current, height: event.nativeEvent.layout.height, scrolled: scrolled.current }) : undefined}
      onScroll={onViewportChange ? event => {
        if (Math.abs(event.nativeEvent.contentOffset.y - offset.current) > 0.5) scrolled.current = true;
        offset.current = event.nativeEvent.contentOffset.y;
        onViewportChange({ offsetY: offset.current, height: event.nativeEvent.layoutMeasurement.height, scrolled: scrolled.current });
      } : undefined}
      scrollEventThrottle={onViewportChange ? 32 : undefined}
    >
      {content}
    </ScrollView>
  ) : (
    <View style={styles.flexFill}>{content}</View>
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
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

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flexFill: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.space16,
      paddingTop: spacing.space8,
      paddingBottom: spacing.space24,
    },
    content: { width: '100%', alignSelf: 'center', gap: spacing.space24 },
  });
}
