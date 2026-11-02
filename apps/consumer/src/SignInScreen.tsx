import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import { hasFieldErrors, validateSignIn } from './auth/validation';
import { Alert, Button, Screen, SettingsGroup, TextField } from './ui';
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
        testID="sign-in-email"
      />
      <TextField
        accentLabel
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

      <View style={styles.actions}>
        <Button
          label={t('auth.signInSubmit')}
          onPress={() => void submit()}
          loading={submitting}
          disabled={submitting}
          testID="sign-in-submit"
        />

        <View style={styles.divider} />

        <View>
          <SettingsGroup>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/forgot-password')}
              style={styles.groupAction}
              testID="sign-in-forgot-password"
            >
              <Text style={styles.groupActionLabel}>
                {t('auth.forgotPasswordLink')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/sign-up')}
              style={styles.groupAction}
              testID="sign-in-to-sign-up"
            >
              <Text style={styles.groupActionLabel}>
                {t('auth.noAccountLink')}
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
    actions: {
      gap: spacing.space8,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
  });
}
