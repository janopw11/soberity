import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import {
  PASSWORD_MIN_LENGTH,
  hasFieldErrors,
  validateSignUp,
} from './auth/validation';
import { Alert, Button, Screen, TextField } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

type FormErrors = Partial<
  Record<'email' | 'password' | 'confirmPassword', string | undefined>
>;

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const translateField = (key: string | undefined) =>
    key
      ? t(`auth.fieldErrors.${key}`, { min: PASSWORD_MIN_LENGTH })
      : undefined;

  const submit = async () => {
    const validation = validateSignUp({ email, password, confirmPassword });
    if (hasFieldErrors(validation)) {
      setErrors({
        email: translateField(validation.email),
        password: translateField(validation.password),
        confirmPassword: translateField(validation.confirmPassword),
      });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
    } catch (error) {
      setFormError(t(`auth.errors.${mapAuthError(error)}`));
      setSubmitting(false);
    }
  };

  return (
    <Screen avoidKeyboard>
      <Text accessibilityRole="header" style={styles.title}>
        {t('auth.signUpTitle')}
      </Text>
      <Text style={styles.intro}>{t('auth.signUpIntro')}</Text>

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
        errorText={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        testID="sign-up-email"
      />
      <TextField
        label={t('auth.passwordLabel')}
        helperText={t('auth.passwordHelper', { min: PASSWORD_MIN_LENGTH })}
        value={password}
        onChangeText={setPassword}
        errorText={errors.password}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="new-password"
        textContentType="newPassword"
        testID="sign-up-password"
      />
      <TextField
        label={t('auth.confirmPasswordLabel')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        errorText={errors.confirmPassword}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="new-password"
        textContentType="newPassword"
        testID="sign-up-confirm-password"
      />

      <Button
        label={t('auth.signUpSubmit')}
        onPress={() => void submit()}
        loading={submitting}
        disabled={submitting}
        testID="sign-up-submit"
      />

      <Link href="/sign-in" style={styles.link}>
        {t('auth.haveAccountLink')}
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
