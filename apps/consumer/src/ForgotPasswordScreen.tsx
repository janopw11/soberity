import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import { validateEmail } from './auth/validation';
import { Alert, Button, Screen, TextField } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { requestPasswordReset } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(t(`auth.fieldErrors.${error}`));
      return;
    }

    setEmailError(undefined);
    setFormError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error) {
      setFormError(t(`auth.errors.${mapAuthError(error)}`));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <Text accessibilityRole="header" style={styles.title}>
          {t('forgotPassword.sentTitle')}
        </Text>
        <Alert variant="success" message={t('forgotPassword.sentMessage')} />
        <Link href="/sign-in" style={styles.link}>
          {t('forgotPassword.backToSignIn')}
        </Link>
      </Screen>
    );
  }

  return (
    <Screen avoidKeyboard>
      <Text accessibilityRole="header" style={styles.title}>
        {t('forgotPassword.title')}
      </Text>
      <Text style={styles.intro}>{t('forgotPassword.intro')}</Text>

      {formError ? (
        <Alert
          variant="danger"
          title={t('auth.errorTitle')}
          message={formError}
        />
      ) : null}

      <TextField
        label={t('auth.emailLabel')}
        value={email}
        onChangeText={setEmail}
        errorText={emailError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        testID="forgot-password-email"
      />

      <Button
        label={t('forgotPassword.submit')}
        onPress={() => void submit()}
        loading={submitting}
        disabled={submitting}
        testID="forgot-password-submit"
      />

      <Link href="/sign-in" style={styles.link}>
        {t('forgotPassword.backToSignIn')}
      </Link>
    </Screen>
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
    intro: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      marginBottom: spacing.space8,
    },
    link: {
      color: colors.primary,
      fontSize: typography.bodyStrong.fontSize,
      fontWeight: typography.bodyStrong.fontWeight,
      textDecorationLine: 'underline',
      paddingVertical: spacing.space12,
      minHeight: 48,
    },
  });
}
