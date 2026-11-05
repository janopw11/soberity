import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ComponentRef,
} from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from './SettingsIcon';
import {
  DialogDropdownTouches,
  DialogDropdownViewport,
  type DropdownOutsideTouch,
} from './DialogDropdown';

type DialogProps = {
  visible: boolean;
  /** Plain heading text. Ignored when `header` is given. */
  title?: string | undefined;
  /** Custom header content, e.g. an icon with a warning line. */
  header?: ReactNode;
  /** Accessible name of the X button in the header. */
  closeLabel: string;
  showCloseButton?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  testID?: string | undefined;
};

/** Centered modal with an optional header and an X close button. Closes on Escape/Back and on backdrop tap; children unmount when hidden. */
export function Dialog({
  visible,
  title,
  header,
  closeLabel,
  showCloseButton = true,
  onClose,
  footer,
  children,
  testID,
}: DialogProps) {
  const { colors } = useThemePreferences();
  const dropdownViewport = useRef<ComponentRef<typeof ScrollView>>(null);
  const dropdownTouches = useRef(new Set<DropdownOutsideTouch>());
  const registerDropdownTouch = useCallback((handler: DropdownOutsideTouch) => {
    dropdownTouches.current.add(handler);
    return () => {
      dropdownTouches.current.delete(handler);
    };
  }, []);
  const styles = createStyles(colors);
  const [visibleHeight, setVisibleHeight] = useState<number | undefined>();
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setVisibleHeight(viewport.height);
    update();
    viewport.addEventListener('resize', update);
    return () => viewport.removeEventListener('resize', update);
  }, [visible]);

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={Platform.OS !== 'web'}
        style={[
          styles.backdrop,
          visibleHeight === undefined
            ? undefined
            : { maxHeight: visibleHeight },
        ]}
        onStartShouldSetResponderCapture={(event) => {
          if (Platform.OS !== 'web') {
            const { pageX, pageY } = event.nativeEvent;
            dropdownTouches.current.forEach((handler) => handler(pageX, pageY));
          }
          return false;
        }}
      >
        <Pressable
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          {...(Platform.OS === 'web'
            ? {
                onKeyDown: (event: {
                  key?: string;
                  nativeEvent?: { key?: string };
                  stopPropagation: () => void;
                }) => {
                  if ((event.key ?? event.nativeEvent?.key) === 'Escape') {
                    event.stopPropagation();
                    onClose();
                  }
                },
              }
            : {})}
          accessibilityRole="none"
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          testID={testID}
          style={styles.card}
        >
          <View style={styles.header}>
            {headerContent}
            {showCloseButton ? (
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
            ) : null}
          </View>
          <ScrollView
            ref={dropdownViewport}
            keyboardShouldPersistTaps="handled"
          >
            <DialogDropdownViewport.Provider value={dropdownViewport}>
              <DialogDropdownTouches.Provider value={registerDropdownTouch}>
                <View style={styles.content}>{children}</View>
              </DialogDropdownTouches.Provider>
            </DialogDropdownViewport.Provider>
          </ScrollView>
          {footer}
        </View>
      </KeyboardAvoidingView>
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
