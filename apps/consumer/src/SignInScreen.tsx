import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import { hasFieldErrors, validateSignIn } from './auth/validation';
import { Alert, Button, Screen, TextField } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

type FormErrors = Partial<Record<'email' | 'password', string | undefined>>;

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const translateField = (key: string | undefined) =>
    key ? t(`auth.fieldErrors.${key}`) : undefined;

  const submit = async () => {
    const validation = validateSignIn({ email, password });
    if (hasFieldErrors(validation)) {
      setErrors({
        email: translateField(validation.email),
        password: translateField(validation.password),
      });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setFormError(t(`auth.errors.${mapAuthError(error)}`));
      setSubmitting(false);
    }
  };

  return (
    <Screen avoidKeyboard>
      <Text accessibilityRole="header" style={styles.title}>
        {t('auth.signInTitle')}
      </Text>
      <Text style={styles.intro}>{t('auth.signInIntro')}</Text>

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
        testID="sign-in-email"
      />
      <TextField
        label={t('auth.passwordLabel')}
        value={password}
        onChangeText={setPassword}
        errorText={errors.password}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="password"
        textContentType="password"
        testID="sign-in-password"
      />

      <Button
        label={t('auth.signInSubmit')}
        onPress={() => void submit()}
        loading={submitting}
        disabled={submitting}
        testID="sign-in-submit"
      />

      <Link href="/sign-up" style={styles.link}>
        {t('auth.noAccountLink')}
      </Link>
      <Link href="/forgot-password" style={styles.link}>
        {t('auth.forgotPasswordLink')}
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
