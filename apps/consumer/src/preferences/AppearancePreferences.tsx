import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type KeyDownEvent,
} from 'react-native';

import {
  radii,
  spacing,
  typography,
  type ColorScheme,
} from '@soberity/design-tokens';

import type { SupportedLanguage } from '../i18n';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { setAccountLanguage } from '../profile/accountLanguage';
import { Alert } from '../ui/Alert';
import { useThemePreferences } from './ThemePreferencesContext';

export function AppearancePreferences() {
  const { t } = useTranslation();
  const {
    theme,
    colors,
    language,
    error,
    ready,
    setTheme,
    setLanguage,
    applyLanguage,
  } = useThemePreferences();
  const { status, user, getIdToken } = useAuthStatus();
  const styles = createStyles(colors);

  const chooseTheme = (value: ColorScheme) => {
    void setTheme(value);
  };
  const chooseLanguage = (value: SupportedLanguage) => {
    // Signed-in users change their account language; guests keep the device choice.
    if (status === 'authenticated' && user) {
      void setAccountLanguage(
        { uid: user.uid, getToken: getIdToken, applyLanguage },
        value,
      );
      return;
    }
    void setLanguage(value);
  };

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.heading}>
        {t('preferences.title')}
      </Text>
      {error ? (
        <Alert
          variant="danger"
          title={t('preferences.errorTitle')}
          message={t('preferences.errorMessage')}
        />
      ) : null}
      <Text style={styles.label}>{t('preferences.theme')}</Text>
      <View
        accessibilityLabel={t('preferences.theme')}
        accessibilityRole="group"
        style={styles.options}
      >
        <PreferenceButton
          label={t('preferences.plumSoft')}
          selected={theme === 'dark'}
          disabled={!ready}
          onPress={() => chooseTheme('dark')}
          styles={styles}
        />
        <PreferenceButton
          label={t('preferences.violet')}
          selected={theme === 'light'}
          disabled={!ready}
          onPress={() => chooseTheme('light')}
          styles={styles}
        />
      </View>
      <Text style={styles.label}>{t('preferences.language')}</Text>
      <View
        accessibilityLabel={t('preferences.language')}
        accessibilityRole="group"
        style={styles.options}
      >
        <PreferenceButton
          label={t('preferences.english')}
          selected={language === 'en'}
          disabled={!ready}
          onPress={() => chooseLanguage('en')}
          styles={styles}
        />
        <PreferenceButton
          label={t('preferences.polish')}
          selected={language === 'pl'}
          disabled={!ready}
          onPress={() => chooseLanguage('pl')}
          styles={styles}
        />
      </View>
    </View>
  );
}

function PreferenceButton({
  label,
  selected,
  disabled,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      aria-pressed={selected}
      aria-disabled={disabled}
      onKeyDown={(event: KeyDownEvent) => {
        const key = event.nativeEvent.key;
        if (!disabled && (key === ' ' || key === 'Enter')) {
          event.preventDefault();
          onPress();
        }
      }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        focused && styles.focused,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.optionLabel, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    container: { gap: spacing.space8 },
    heading: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    label: {
      ...typography.label,
      color: colors.textSecondary,
      marginTop: spacing.space8,
    },
    options: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.space8,
    },
    option: {
      flexGrow: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.space12,
      paddingVertical: spacing.space8,
      borderRadius: radii.sm,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    selected: {
      borderColor: colors.focusRing,
      backgroundColor: colors.surfaceAlt,
    },
    focused: { borderColor: colors.focusRing },
    pressed: { opacity: 0.78 },
    disabled: { opacity: 0.6 },
    optionLabel: {
      ...typography.label,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    selectedLabel: { color: colors.primary },
  });
}
