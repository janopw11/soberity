import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@soberity/design-tokens';

import { mapAuthError } from '../auth/errors';
import { PASSWORD_MIN_LENGTH, validatePassword } from '../auth/validation';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Screen, TextField } from '../ui';
import { changePassword } from './accountSecurity';
import { useAccountSecurityDeps } from './useAccountSecurityDeps';

type Field = 'current' | 'next' | 'confirm';

type Notice = {
  variant: 'success' | 'danger';
  text: string;
} | null;

const EMPTY_VALUES: Record<Field, string> = {
  current: '',
  next: '',
  confirm: '',
};
const NO_ERRORS: Record<Field, string | null> = {
  current: null,
  next: null,
  confirm: null,
};

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const securityDeps = useAccountSecurityDeps();

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState(NO_ERRORS);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const filled = (Object.keys(values) as Field[]).every(
    (field) => values[field].length > 0,
  );

  const update = (field: Field) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: null }));
  };

  const validate = (): Record<Field, string | null> => {
    const passwordError = validatePassword(values.next);
    return {
      current: values.current ? null : t('settings.currentPasswordRequired'),
      next: passwordError
        ? t(`auth.fieldErrors.${passwordError}`, { min: PASSWORD_MIN_LENGTH })
        : null,
      confirm: !values.confirm
        ? t('auth.fieldErrors.required')
        : values.confirm !== values.next
          ? t('auth.fieldErrors.passwordMismatch')
          : null,
    };
  };

  const submit = async () => {
    setNotice(null);
    if (!securityDeps || !filled || busy) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setBusy(true);
    try {
      await changePassword(securityDeps, values.current, values.next);
      setValues(EMPTY_VALUES);
      setErrors(NO_ERRORS);
      setNotice({ variant: 'success', text: t('settings.passwordChanged') });
    } catch (error) {
      setNotice({
        variant: 'danger',
        text: t(`auth.errors.${mapAuthError(error)}`),
      });
    } finally {
      setBusy(false);
    }
  };

  const actionActive = filled && !busy;

  return (
    <Screen avoidKeyboard>
      {notice ? <Alert variant={notice.variant} message={notice.text} /> : null}

      <View style={styles.form}>
        <TextField
          accentLabel
          label={t('settings.currentPasswordLabel')}
          value={values.current}
          onChangeText={update('current')}
          errorText={errors.current ?? undefined}
          secureToggle
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
          autoComplete="password"
          textContentType="password"
          testID="account-current-password"
        />
        <TextField
          accentLabel
          label={t('settings.newPasswordLabel')}
          helperText={t('auth.passwordHelper', { min: PASSWORD_MIN_LENGTH })}
          errorText={errors.next ?? undefined}
          value={values.next}
          onChangeText={update('next')}
          secureToggle
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
          autoComplete="new-password"
          textContentType="newPassword"
          testID="account-new-password"
        />
        <TextField
          accentLabel
          label={t('auth.confirmPasswordLabel')}
          value={values.confirm}
          onChangeText={update('confirm')}
          errorText={errors.confirm ?? undefined}
          secureToggle
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
          autoComplete="new-password"
          textContentType="newPassword"
          testID="account-confirm-password"
        />

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.changePasswordButton')}
            accessibilityState={{ disabled: !actionActive, busy }}
            disabled={!actionActive}
            onPress={() => void submit()}
            hitSlop={8}
            style={styles.action}
            testID="account-change-password"
          >
            <Text
              style={[
                styles.actionLabel,
                { color: actionActive ? colors.primary : colors.textMuted },
              ]}
            >
              {t('settings.changePasswordButton')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.space16 },
  footer: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
  },
});
