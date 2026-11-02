import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  hasFieldErrors,
  validateSignUp,
} from './auth/validation';
import { Alert, Button, Screen, SettingsGroup, TextField } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

type FormErrors = Partial<
  Record<
    'email' | 'displayName' | 'password' | 'confirmPassword',
    string | undefined
  >
>;

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const translateField = (key: string | undefined) =>
    key
      ? t(`auth.fieldErrors.${key}`, {
          min: PASSWORD_MIN_LENGTH,
          max: DISPLAY_NAME_MAX_LENGTH,
        })
      : undefined;

  const submit = async () => {
    const validation = validateSignUp({
      email,
      displayName,
      password,
      confirmPassword,
    });
    if (hasFieldErrors(validation)) {
      setErrors({
        email: translateField(validation.email),
        displayName: translateField(validation.displayName),
        password: translateField(validation.password),
        confirmPassword: translateField(validation.confirmPassword),
      });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim() || null);
      router.replace('/verification-pending');
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
        accentLabel
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
        accentLabel
        label={t('profile.displayNameLabel')}
        helperText={t('auth.usernameHelper')}
        value={displayName}
        onChangeText={setDisplayName}
        errorText={errors.displayName}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        testID="sign-up-username"
      />
      <TextField
        accentLabel
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
        accentLabel
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

      <View style={styles.actions}>
        <Button
          label={t('auth.signUpSubmit')}
          onPress={() => void submit()}
          loading={submitting}
          disabled={submitting}
          testID="sign-up-submit"
        />

        <View style={styles.divider} />

        <View>
          <SettingsGroup>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/sign-in')}
              style={styles.groupAction}
              testID="sign-up-to-sign-in"
            >
              <Text style={styles.groupActionLabel}>
                {t('auth.haveAccountLink')}
              </Text>
            </Pressable>
          </SettingsGroup>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    title: {
      color: colors.primary,
      fontSize: typography.h2.fontSize,
      lineHeight: typography.h2.lineHeight,
      fontWeight: typography.h2.fontWeight,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      marginBottom: spacing.space8,
    },
    actions: {
      gap: spacing.space8,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    groupAction: {
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.space16,
    },
    groupActionLabel: {
      color: colors.primary,
      textAlign: 'center',
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: typography.label.fontWeight,
    },
  });
}
