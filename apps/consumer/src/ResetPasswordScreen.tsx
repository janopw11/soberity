import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import {
  hasFieldErrors,
  validateNewPassword,
  PASSWORD_MIN_LENGTH,
} from './auth/validation';
import { Alert, Button, EmptyState, Screen, TextField } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

type CodeState =
  | { status: 'checking' }
  | { status: 'ready'; email: string }
  | { status: 'invalid'; errorKey: string }
  | { status: 'offline' }
  | { status: 'done' };

type FormErrors = Partial<
  Record<'password' | 'confirmPassword', string | undefined>
>;

/** Reached from the password reset e-mail. The code is checked before any form is shown. */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { checkPasswordResetCode, confirmPasswordReset } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const { oobCode: rawCode } = useLocalSearchParams<{
    oobCode?: string | string[];
  }>();
  const oobCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  const [codeState, setCodeState] = useState<CodeState>({ status: 'checking' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkCode = useCallback(async () => {
    if (!oobCode) {
      setCodeState({ status: 'invalid', errorKey: 'invalidActionCode' });
      return;
    }
    setCodeState({ status: 'checking' });
    try {
      const email = await checkPasswordResetCode(oobCode);
      setCodeState({ status: 'ready', email });
    } catch (error) {
      const errorKey = mapAuthError(error);
      setCodeState(
        errorKey === 'network'
          ? { status: 'offline' }
          : { status: 'invalid', errorKey },
      );
    }
  }, [checkPasswordResetCode, oobCode]);

  useEffect(() => {
    void checkCode();
  }, [checkCode]);

  const submit = async () => {
    if (!oobCode) return;
    const validation = validateNewPassword({ password, confirmPassword });
    if (hasFieldErrors(validation)) {
      setErrors({
        password: validation.password
          ? t(`auth.fieldErrors.${validation.password}`, {
              min: PASSWORD_MIN_LENGTH,
            })
          : undefined,
        confirmPassword: validation.confirmPassword
          ? t(`auth.fieldErrors.${validation.confirmPassword}`)
          : undefined,
      });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await confirmPasswordReset(oobCode, password);
      setCodeState({ status: 'done' });
    } catch (error) {
      const errorKey = mapAuthError(error);
      if (
        errorKey === 'invalidActionCode' ||
        errorKey === 'expiredActionCode'
      ) {
        setCodeState({ status: 'invalid', errorKey });
      } else {
        setFormError(t(`auth.errors.${errorKey}`));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (codeState.status === 'checking') {
    return (
      <Screen>
        <EmptyState
          eyebrow={t('resetPassword.badge')}
          title={t('resetPassword.checkingTitle')}
          description={t('resetPassword.checkingDescription')}
        />
      </Screen>
    );
  }

  if (codeState.status === 'offline') {
    return (
      <Screen>
        <EmptyState
          eyebrow={t('resetPassword.badge')}
          title={t('resetPassword.offlineTitle')}
          description={t('auth.errors.network')}
        >
          <Button
            label={t('resetPassword.retryButton')}
            onPress={() => void checkCode()}
            testID="reset-password-retry"
          />
        </EmptyState>
      </Screen>
    );
  }

  if (codeState.status === 'invalid') {
    return (
      <Screen>
        <EmptyState
          eyebrow={t('resetPassword.badge')}
          title={t('resetPassword.invalidTitle')}
          description={t('resetPassword.invalidDescription')}
        >
          <Alert
            variant="danger"
            message={t(`auth.errors.${codeState.errorKey}`)}
          />
          <Button
            label={t('resetPassword.requestNewButton')}
            onPress={() => router.replace('/forgot-password')}
          />
          <Link href="/sign-in" style={styles.link}>
            {t('forgotPassword.backToSignIn')}
          </Link>
        </EmptyState>
      </Screen>
    );
  }

  if (codeState.status === 'done') {
    return (
      <Screen>
        <EmptyState
          eyebrow={t('resetPassword.badge')}
          title={t('resetPassword.successTitle')}
          description={t('resetPassword.successDescription')}
        >
          <Alert
            variant="success"
            message={t('resetPassword.successMessage')}
          />
          <Button
            label={t('resetPassword.signInButton')}
            onPress={() => router.replace('/sign-in')}
          />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen avoidKeyboard>
      <Text accessibilityRole="header" style={styles.title}>
        {t('resetPassword.title')}
      </Text>
      <Text style={styles.intro}>
        {t('resetPassword.intro', { email: codeState.email })}
      </Text>

      {formError ? (
        <Alert
          variant="danger"
          title={t('auth.errorTitle')}
          message={formError}
        />
      ) : null}

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
        testID="reset-password-new"
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
        testID="reset-password-confirm"
      />

      <Button
        label={t('resetPassword.submit')}
        onPress={() => void submit()}
        loading={submitting}
        disabled={submitting}
        testID="reset-password-submit"
      />
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
