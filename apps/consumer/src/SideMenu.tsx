import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { navigationItems, scienceNavigationItems } from './navigation';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/** Header hamburger opens the shared navigation without reducing screen width. */
export default function SideMenu() {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  // Modal content on iOS does not reliably receive the safe-area top inset.
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const close = () => setOpen(false);

  const toggle = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? t('navigation.close') : t('navigation.open')}
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen(!open)}
      onFocus={() => setFocused('toggle')}
      onBlur={() => setFocused(null)}
      style={styles.toggle}
    >
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro static asset
        source={require('../assets/images/menu-icon.png')}
        style={styles.menuIcon}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
        importantForAccessibility="no"
      />
    </Pressable>
  );

  const item = (
    id: string,
    image: number,
    href?: '/' | '/science' | '/events',
  ) => {
    const label = t(`navigation.features.${id}`);
    const selected = pathname === href || (id === 'science' && pathname.startsWith('/science/'));
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
        <Image
          source={image}
          style={styles.iconImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessible={false}
          importantForAccessibility="no"
        />
        <Text style={styles.label}>{label}</Text>
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
            edges={['left', 'bottom']}
            style={[styles.panel, { paddingTop: insets.top }]}
            accessibilityViewIsModal
          >
            <ScrollView contentContainerStyle={styles.content}>
              {navigationItems.map((entry) => (
                <View key={entry.id}>
                  {item(entry.id, entry.image, 'href' in entry ? entry.href : undefined)}
                  {entry.id === 'science' ? (
                    <View style={styles.submenu}>
                      {scienceNavigationItems.map((section) => {
                        const id = `science-${section.id}`;
                        const selected = section.id === 'articles'
                          ? pathname === '/science' || /^\/science\/(post|article|evidence)\//.test(pathname)
                          : section.id === 'quizzes'
                            ? pathname === section.href || pathname.startsWith('/science/quiz/') || pathname === '/science/learn'
                            : pathname === section.href;
                        return (
                          <Pressable
                            key={section.id}
                            accessibilityRole="link"
                            accessibilityState={{ selected }}
                            onPress={() => { close(); router.replace(section.href); }}
                            onFocus={() => setFocused(id)}
                            onBlur={() => setFocused(null)}
                            style={({ pressed }) => [styles.item, styles.submenuItem, selected && styles.selected, pressed && styles.pressed, focused === id && styles.focused]}
                          >
                            <Image
                              source={section.image}
                              style={styles.iconImage}
                              resizeMode="contain"
                              accessibilityIgnoresInvertColors
                              accessible={false}
                              importantForAccessibility="no"
                            />
                            <Text style={styles.label}>{t(`navigation.scienceSections.${section.id}`)}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.backdrop },
    panel: {
      flex: 1,
      width: '85%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    toggle: {
      minHeight: 48,
      minWidth: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuIcon: { width: 28, height: 28 },
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
    submenu: {
      marginLeft: spacing.space32 + spacing.space12,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingLeft: spacing.space8,
      paddingTop: spacing.space4,
      paddingBottom: spacing.space8,
      gap: spacing.space4,
    },
    submenuItem: { paddingHorizontal: spacing.space12 },
    selected: { backgroundColor: colors.surfaceAlt },
    pressed: { backgroundColor: colors.border },
    focused: { borderColor: colors.focusRing },
    iconImage: { width: 28, height: 28, minWidth: 32 },
    label: {
      ...typography.label,
      color: colors.textPrimary,
      flex: 1,
      minWidth: 0,
    },
  });
}
