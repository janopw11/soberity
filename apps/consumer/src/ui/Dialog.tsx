import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from './SettingsIcon';

type DialogProps = {
  visible: boolean;
  /** Plain heading text. Ignored when `header` is given. */
  title?: string | undefined;
  /** Custom header content, e.g. an icon with a warning line. */
  header?: ReactNode;
  /** Accessible name of the X button in the header. */
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  testID?: string | undefined;
};

/** Centered modal with an optional header and an X close button. Closes on Escape/Back and on backdrop tap; children unmount when hidden. */
export function Dialog({
  visible,
  title,
  header,
  closeLabel,
  onClose,
  children,
  testID,
}: DialogProps) {
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  let headerContent: ReactNode = <View style={styles.spacer} />;
  if (header) {
    headerContent = <View style={styles.headerContent}>{header}</View>;
  } else if (title) {
    headerContent = (
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          accessibilityRole="none"
          accessibilityViewIsModal
          testID={testID}
          style={styles.card}
        >
          <View style={styles.header}>
            {headerContent}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              hitSlop={8}
              style={styles.close}
              testID={testID ? `${testID}-close` : undefined}
            >
              <SettingsIcon
                name="close"
                color={colors.textSecondary}
                size={22}
              />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.content}>{children}</View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.space16,
      backgroundColor: colors.backdrop,
    },
    card: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '90%',
      borderRadius: radii.xl,
      backgroundColor: colors.background,
      padding: spacing.space24,
      gap: spacing.space16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.space8,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.space8,
    },
    spacer: { flex: 1 },
    title: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: typography.h2.fontSize,
      lineHeight: typography.h2.lineHeight,
      fontWeight: typography.h2.fontWeight,
    },
    close: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { gap: spacing.space16 },
  });
}
