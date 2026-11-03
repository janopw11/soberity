import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { Button, Screen } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/** Public entry screen. The member news feed is only in the protected route group. */
export default function GuestWelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemePreferences();

  return (
    <Screen maxWidth={800}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.primary }]}
      >
        {t('welcome.title')}
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {t('welcome.intro')}
      </Text>
      <View style={styles.actions}>
        <Button label={t('discover.browse')} variant="secondary" onPress={() => router.push('/science')} />
        <Button
          label={t('welcome.signInButton')}
          onPress={() => router.push('/sign-in')}
          testID="welcome-sign-in"
        />
        <Button
          label={t('welcome.signUpButton')}
          variant="secondary"
          onPress={() => router.push('/sign-up')}
          testID="welcome-sign-up"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, paddingTop: spacing.space16 },
  body: { ...typography.body },
  actions: { gap: spacing.space12, maxWidth: 420 },
});
