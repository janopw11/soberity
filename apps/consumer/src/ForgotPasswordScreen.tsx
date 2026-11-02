import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import { validateEmail } from './auth/validation';
import { Alert, Button, Screen, SettingsGroup, TextField } from './ui';
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
        <View style={styles.actions}>
          <View style={styles.divider} />
          <SettingsGroup>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/sign-in')}
              style={styles.groupAction}
              testID="forgot-password-back"
            >
              <Text style={styles.groupActionLabel}>
                {t('forgotPassword.backToSignIn')}
              </Text>
            </Pressable>
          </SettingsGroup>
        </View>
      </Screen>
    );
  }

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
        errorText={emailError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        testID="forgot-password-email"
      />

      <View style={styles.actions}>
        <Button
          label={t('forgotPassword.submit')}
          onPress={() => void submit()}
          loading={submitting}
          disabled={submitting}
          testID="forgot-password-submit"
        />

        <View style={styles.divider} />

        <SettingsGroup>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/sign-in')}
            style={styles.groupAction}
            testID="forgot-password-back"
          >
            <Text style={styles.groupActionLabel}>
              {t('forgotPassword.backToSignIn')}
            </Text>
          </Pressable>
        </SettingsGroup>
      </View>
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
