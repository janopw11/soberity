import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import { Alert, Button, EmptyState, Screen } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/**
 * Shown when the backend reports an unverified e-mail (HTTP 403). Sending the
 * The Firebase verification e-mail is sent after signup; this screen handles
 * resend throttling and checking the refreshed backend session.
 */
export default function VerificationPendingScreen() {
  const { t } = useTranslation();
  const { resendVerificationEmail, refreshVerificationStatus, signOut } =
    useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<{
    variant: 'success' | 'danger';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (cooldownUntil <= now) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil, now]);

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const resend = async () => {
    setMessage(null);
    setSubmitting(true);
    try {
      await resendVerificationEmail();
      setCooldownUntil(Date.now() + 60_000);
      setNow(Date.now());
      setMessage({
        variant: 'success',
        text: t('verificationPending.resendSuccess'),
      });
    } catch (error) {
      setMessage({
        variant: 'danger',
        text: t(`auth.errors.${mapAuthError(error)}`),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refresh = async () => {
    setMessage(null);
    setChecking(true);
    try {
      await refreshVerificationStatus();
    } catch (error) {
      setMessage({
        variant: 'danger',
        text: t(`auth.errors.${mapAuthError(error)}`),
      });
    } finally {
      setChecking(false);
    }
  };

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
        {message ? (
          <Alert variant={message.variant} message={message.text} />
        ) : null}
        <Button
          label={t('verificationPending.resendButton')}
          variant="secondary"
          onPress={() => void resend()}
          loading={submitting}
          disabled={submitting || cooldownSeconds > 0}
        />
        <Text style={styles.helper}>
          {cooldownSeconds > 0
            ? t('verificationPending.resendCooldown', {
                seconds: cooldownSeconds,
              })
            : t('verificationPending.resendHelper')}
        </Text>
        <Button
          label={t('verificationPending.refreshButton')}
          onPress={() => void refresh()}
          loading={checking}
          disabled={checking}
        />
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
