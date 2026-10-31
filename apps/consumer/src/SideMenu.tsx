import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@soberity/design-tokens';

import { navigationItems } from './navigation';

/** Header hamburger opens the shared navigation without reducing screen width. */
export default function SideMenu() {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const close = () => setOpen(false);

  const toggle = (inMenu = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={inMenu ? t('navigation.close') : t('navigation.open')}
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen(!open)}
      onFocus={() => setFocused('toggle')}
      onBlur={() => setFocused(null)}
      style={({ pressed }) => [
        styles.toggle,
        pressed && styles.pressed,
        focused === 'toggle' && styles.focused,
      ]}
    >
      <View accessible={false} style={styles.hamburger}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </View>
    </Pressable>
  );

  const item = (
    id: string,
    icon: string,
    href?: '/' | '/science' | '/events',
  ) => {
    const label = t(`navigation.features.${id}`);
    const selected = pathname === href;
    return (
      <Pressable
        key={id}
        accessibilityRole={href ? 'link' : 'button'}
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled: !href }}
        disabled={!href}
        onPress={() => {
          close();
          if (href) router.replace(href);
        }}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
        style={({ pressed }) => [
          styles.item,
          selected && styles.selected,
          pressed && styles.pressed,
          focused === id && styles.focused,
        ]}
      >
        <Text
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {icon}
        </Text>
        <Text style={styles.label}>
          {selected ? '› ' : ''}
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <>
      {toggle()}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            style={StyleSheet.absoluteFill}
            onPress={close}
            testID="menu-backdrop"
          />
          <SafeAreaView
            testID="side-menu"
            style={styles.panel}
            accessibilityViewIsModal
          >
            <View style={styles.top}>
              {toggle(true)}
              <Text style={styles.brand}>{t('common.appName')}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
              {navigationItems.map((entry) =>
                item(
                  entry.id,
                  entry.icon,
                  'href' in entry ? entry.href : undefined,
                ),
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.backdrop },
  panel: {
    flex: 1,
    width: '85%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.space8,
    gap: spacing.space8,
  },
  brand: { ...typography.h3, color: colors.primary, flexShrink: 1 },
  toggle: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: radii.sm,
  },
  hamburger: { gap: spacing.space4 },
  line: {
    width: spacing.space24,
    height: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.textPrimary,
  },
  content: { padding: spacing.space8, gap: spacing.space16 },
  item: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space12,
    padding: spacing.space8,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { backgroundColor: colors.surfaceAlt },
  pressed: { backgroundColor: colors.border },
  focused: { borderColor: colors.focusRing },
  icon: { ...typography.h3, textAlign: 'center', minWidth: 32 },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
});
