import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { Alert, Button, EmptyState, Screen } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/**
 * Shown when the backend reports an unverified e-mail (HTTP 403). Sending the
 * verification e-mail and resending it are implemented in P0-I07.
 */
export default function VerificationPendingScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  return (
    <Screen>
      <EmptyState
        eyebrow={t('verificationPending.badge')}
        title={t('verificationPending.title')}
        description={t('verificationPending.description')}
      >
        <Alert
          title={t('verificationPending.alertTitle')}
          message={t('verificationPending.alertMessage')}
        />
        <Button
          label={t('verificationPending.resendButton')}
          variant="secondary"
          disabled
        />
        <Text style={styles.helper}>
          {t('verificationPending.resendHelper')}
        </Text>
        <Button
          label={t('common.backToWelcome')}
          variant="tertiary"
          onPress={() => void signOut()}
        />
      </EmptyState>
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    helper: {
      fontSize: typography.small.fontSize,
      lineHeight: typography.small.lineHeight,
      color: colors.textSecondary,
    },
  });
}
