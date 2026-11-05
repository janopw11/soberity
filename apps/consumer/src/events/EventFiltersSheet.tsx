import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui/SettingsIcon';
import {
  DialogDropdownTouches,
  DialogDropdownViewport,
  type DropdownOutsideTouch,
} from '../ui/DialogDropdown';

/** Events-only sheet: the form and its applied/draft state stay owned by EventsScreen. */
export function EventFiltersSheet({
  visible,
  title,
  closeLabel,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { colors } = useThemePreferences();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [presented, setPresented] = useState(visible);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [visualHeight, setVisualHeight] = useState<number | undefined>();
  const [closeFocused, setCloseFocused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const close = useRef(onClose);
  close.current = onClose;
  const viewport = useRef<ComponentRef<typeof ScrollView>>(null);
  const touches = useRef(new Set<DropdownOutsideTouch>());
  const registerTouch = useCallback((handler: DropdownOutsideTouch) => {
    touches.current.add(handler);
    return () => {
      touches.current.delete(handler);
    };
  }, []);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReducedMotion(value);
      })
      .catch(() => {
        if (active) setReducedMotion(true);
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (visible) setPresented(true);
  }, [visible]);
  useEffect(() => {
    if (!presented) return;
    if (visible) drag.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reducedMotion === false ? 220 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setPresented(false);
    });
    return () => animation.stop();
  }, [visible, presented, reducedMotion, progress, drag]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !presented) return;
    const visual = window.visualViewport;
    if (!visual) return;
    const resize = () => setVisualHeight(visual.height);
    resize();
    visual.addEventListener('resize', resize);
    return () => visual.removeEventListener('resize', resize);
  }, [presented]);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) =>
          drag.setValue(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 72 || (gesture.dy > 12 && gesture.vy > 0.7))
            close.current();
          else if (reducedMotion !== false) drag.setValue(0);
          else
            Animated.spring(drag, {
              toValue: 0,
              useNativeDriver: Platform.OS !== 'web',
              damping: 24,
              stiffness: 220,
            }).start();
        },
        onPanResponderTerminate: () => drag.setValue(0),
      }),
    [drag, reducedMotion],
  );
  if (!presented) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={Platform.OS !== 'web'}
        style={[
          styles.root,
          { paddingTop: insets.top + spacing.space16 },
          visualHeight === undefined ? undefined : { maxHeight: visualHeight },
        ]}
        onStartShouldSetResponderCapture={(event) => {
          if (Platform.OS !== 'web') {
            const { pageX, pageY } = event.nativeEvent;
            touches.current.forEach((handler) => handler(pageX, pageY));
          }
          return false;
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.backdrop, opacity: progress },
          ]}
        />
        <Pressable
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <Animated.View
          testID="events-filters-dialog"
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
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
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              transform: [
                {
                  translateY: Animated.add(
                    progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height, 0],
                    }),
                    drag,
                  ),
                },
              ],
            },
          ]}
        >
          <View
            style={styles.handleTarget}
            {...pan.panHandlers}
            accessible={false}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.header} {...pan.panHandlers}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.textPrimary }]}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              testID="events-filters-dialog-close"
              onPress={onClose}
              onFocus={() => setCloseFocused(true)}
              onBlur={() => setCloseFocused(false)}
              style={({ pressed }) => [
                styles.close,
                {
                  backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                  borderColor: closeFocused ? colors.focusRing : 'transparent',
                },
              ]}
            >
              <SettingsIcon name="close" color={colors.textMuted} size={20} />
            </Pressable>
          </View>
          <ScrollView
            ref={viewport}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}
          >
            <DialogDropdownViewport.Provider value={viewport}>
              <DialogDropdownTouches.Provider value={registerTouch}>
                {children}
              </DialogDropdownTouches.Provider>
            </DialogDropdownViewport.Provider>
          </ScrollView>
          <View
            style={[
              styles.footer,
              {
                paddingBottom: Math.max(insets.bottom, spacing.space16),
                backgroundColor: colors.surface,
              },
            ]}
          >
            {footer}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '94%',
    alignSelf: 'center',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  handleTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.space24,
  },
  handle: {
    width: spacing.space40,
    height: spacing.space4,
    borderRadius: radii.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.space16,
    paddingRight: spacing.space8,
    paddingBottom: spacing.space4,
  },
  title: { ...typography.h3, flex: 1 },
  close: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
  },
  content: {
    paddingHorizontal: spacing.space16,
    paddingTop: spacing.space4,
    paddingBottom: spacing.space12,
    gap: spacing.space12,
  },
  footer: { paddingHorizontal: spacing.space16, paddingTop: spacing.space12 },
});
