import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { typography, colors } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { Alert, Button, EmptyState, Screen } from './ui';

/**
 * Placeholder for the "verification-pending" auth state: reached once a user
 * has an account but has not confirmed their email yet. Real sign-up and
 * email verification land in P0-I06/P0-I07; this screen only reserves the
 * route and guard contract for now.
 */
export default function VerificationPendingScreen() {
  const { t } = useTranslation();
  const { setStatus } = useAuthStatus();

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
          onPress={() => setStatus('guest')}
        />
      </EmptyState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  helper: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    color: colors.textSecondary,
  },
});
