import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import { BackendUnavailableError } from './auth/identityApi';
import { readAccountLocale } from './profile/accountLocale';
import { setAccountLanguage } from './profile/accountLanguage';
import {
  PROFILE_INTERESTS,
  profileApi,
  type Profile,
  type ProfileInterest,
} from './profile/profileApi';
import type { SupportedLanguage } from './i18n';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { Alert, Button, Screen, TextField } from './ui';

type Notice = {
  variant: 'success' | 'danger' | 'warning';
  text: string;
} | null;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, getIdToken } = useAuthStatus();
  const { colors, applyLanguage, language } = useThemePreferences();
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState<ProfileInterest[]>([]);
  const [localePending, setLocalePending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const uid = user?.uid ?? null;

  const fill = useCallback((profile: Profile) => {
    setDisplayName(profile.displayName ?? '');
    setCity(profile.city ?? '');
    setInterests(profile.interests);
  }, []);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      const token = await getIdToken();
      if (!token) throw new BackendUnavailableError();
      // provision returns the existing profile; guest choices are only sent by the sync on sign-in.
      fill(await profileApi.provision(token, null));
      const cache = await readAccountLocale(uid);
      setLocalePending(cache?.pending ?? false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fill, getIdToken, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleInterest = (interest: ProfileInterest) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((value) => value !== interest)
        : [...current, interest],
    );
  };

  const save = async () => {
    setNotice(null);
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) throw new BackendUnavailableError();
      fill(
        await profileApi.update(token, {
          displayName: displayName.trim(),
          city: city.trim(),
          interests,
        }),
      );
      setNotice({ variant: 'success', text: t('profile.saved') });
    } catch (error) {
      setNotice({
        variant: 'danger',
        text: t(`auth.errors.${mapAuthError(error)}`),
      });
    } finally {
      setSaving(false);
    }
  };

  const chooseLocale = async (locale: SupportedLanguage) => {
    if (!uid) return;
    setNotice(null);
    const result = await setAccountLanguage(
      { uid, getToken: getIdToken, applyLanguage },
      locale,
    );
    setLocalePending(!result.saved);
    setNotice(
      result.saved
        ? { variant: 'success', text: t('profile.localeSaved') }
        : { variant: 'warning', text: t('profile.localePending') },
    );
  };

  if (loading) {
    return (
      <Screen>
        <Text style={styles.body}>{t('profile.loading')}</Text>
      </Screen>
    );
  }

  if (loadFailed) {
    return (
      <Screen>
        <Alert
          variant="danger"
          title={t('profile.loadErrorTitle')}
          message={t('profile.loadErrorMessage')}
        />
        <Button label={t('profile.retry')} onPress={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen avoidKeyboard>
      <Text accessibilityRole="header" style={styles.title}>
        {t('profile.title')}
      </Text>
      <Text style={styles.body}>{t('profile.intro')}</Text>

      {notice ? <Alert variant={notice.variant} message={notice.text} /> : null}

      <View style={styles.section}>
        <Text style={styles.label}>{t('profile.languageLabel')}</Text>
        <View style={styles.row}>
          {(['en', 'pl'] as const).map((locale) => (
            <OptionChip
              key={locale}
              label={
                locale === 'en'
                  ? t('preferences.english')
                  : t('preferences.polish')
              }
              selected={language === locale}
              onPress={() => void chooseLocale(locale)}
              colors={colors}
            />
          ))}
        </View>
        {localePending ? (
          <Text style={styles.helper}>{t('profile.localePendingHint')}</Text>
        ) : null}
      </View>

      <TextField
        label={t('profile.displayNameLabel')}
        value={displayName}
        onChangeText={setDisplayName}
        helperText={t('profile.displayNameHelper')}
        maxLength={50}
        testID="profile-display-name"
      />
      <TextField
        label={t('profile.cityLabel')}
        value={city}
        onChangeText={setCity}
        maxLength={100}
        testID="profile-city"
      />

      <View style={styles.section}>
        <Text style={styles.label}>{t('profile.interestsLabel')}</Text>
        <View style={styles.row}>
          {PROFILE_INTERESTS.map((interest) => (
            <OptionChip
              key={interest}
              label={t(`profile.interest.${interest}`)}
              selected={interests.includes(interest)}
              onPress={() => toggleInterest(interest)}
              colors={colors}
              role="checkbox"
            />
          ))}
        </View>
      </View>

      <Button
        label={t('profile.saveButton')}
        onPress={() => void save()}
        loading={saving}
        disabled={saving}
        testID="profile-save"
      />
    </Screen>
  );
}

type OptionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemePreferences>['colors'];
  role?: 'radio' | 'checkbox';
};

function OptionChip({
  label,
  selected,
  onPress,
  colors,
  role = 'radio',
}: OptionChipProps) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingHorizontal: spacing.space16,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.surfaceAlt : colors.surface,
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.primary : colors.textPrimary,
          fontSize: typography.label.fontSize,
          fontWeight: typography.label.fontWeight,
        }}
      >
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    title: {
      color: colors.textPrimary,
      fontSize: typography.h1.fontSize,
      lineHeight: typography.h1.lineHeight,
      fontWeight: typography.h1.fontWeight,
    },
    body: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    helper: {
      color: colors.textSecondary,
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
    },
    label: {
      color: colors.textPrimary,
      fontSize: typography.label.fontSize,
      fontWeight: typography.label.fontWeight,
    },
    section: { gap: spacing.space8 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 },
  });
}
