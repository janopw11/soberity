import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateNewPassword,
} from './auth/validation';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  hasPendingDeletion,
  type AccountSecurityDeps,
} from './account/accountSecurity';
import { profileApi } from './profile/profileApi';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { Alert, Button, Screen, TextField } from './ui';

type Notice = {
  variant: 'success' | 'danger' | 'warning';
  text: string;
} | null;

export default function AccountSettingsScreen() {
  const { t } = useTranslation();
  const { user, getIdToken, accountActions } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);

  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<'password' | 'email' | 'delete' | null>(
    null,
  );
  const [pendingDeletion, setPendingDeletion] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    void hasPendingDeletion(uid).then(setPendingDeletion);
  }, [uid]);

  const deps = (): AccountSecurityDeps | null => {
    if (!uid) return null;
    return {
      uid,
      getToken: getIdToken,
      reauthenticate: accountActions.reauthenticate,
      updatePassword: accountActions.updatePassword,
      verifyNewEmail: accountActions.verifyNewEmail,
      deleteUser: accountActions.deleteUser,
      deleteBackendData: (token) => profileApi.deleteData(token),
    };
  };

  const fail = (error: unknown) =>
    setNotice({
      variant: 'danger',
      text: t(`auth.errors.${mapAuthError(error)}`),
    });

  const submitPassword = async () => {
    const securityDeps = deps();
    const validation = validateNewPassword({
      password: newPassword,
      confirmPassword,
    });
    setNotice(null);
    setFieldError(null);
    if (!securityDeps) return;
    if (!currentPassword)
      return setFieldError(t('settings.currentPasswordRequired'));
    if (validation.password || validation.confirmPassword) {
      return setFieldError(
        t(
          `auth.fieldErrors.${validation.password ?? validation.confirmPassword}`,
          {
            min: PASSWORD_MIN_LENGTH,
          },
        ),
      );
    }

    setBusy('password');
    try {
      await changePassword(securityDeps, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({ variant: 'success', text: t('settings.passwordChanged') });
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  };

  const submitEmail = async () => {
    const securityDeps = deps();
    setNotice(null);
    setFieldError(null);
    if (!securityDeps) return;
    const emailError = validateEmail(newEmail);
    if (emailError) return setFieldError(t(`auth.fieldErrors.${emailError}`));
    if (!emailPassword)
      return setFieldError(t('settings.currentPasswordRequired'));

    setBusy('email');
    try {
      await changeEmail(securityDeps, emailPassword, newEmail.trim());
      setEmailPassword('');
      setNewEmail('');
      setNotice({ variant: 'success', text: t('settings.emailLinkSent') });
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  };

  const submitDelete = async () => {
    const securityDeps = deps();
    setNotice(null);
    setFieldError(null);
    if (!securityDeps) return;
    if (!deletePassword)
      return setFieldError(t('settings.currentPasswordRequired'));
    if (!deleteConfirmed)
      return setFieldError(t('settings.deleteConfirmRequired'));

    setBusy('delete');
    try {
      // On success the session ends and the app returns to the guest area.
      await deleteAccount(securityDeps, deletePassword);
    } catch (error) {
      setPendingDeletion(await hasPendingDeletion(securityDeps.uid));
      setNotice({
        variant: 'danger',
        text: t(`auth.errors.${mapAuthError(error)}`),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen avoidKeyboard>
      <Text accessibilityRole="header" style={styles.title}>
        {t('settings.title')}
      </Text>

      {notice ? <Alert variant={notice.variant} message={notice.text} /> : null}
      {fieldError ? (
        <Alert
          variant="danger"
          title={t('auth.errorTitle')}
          message={fieldError}
        />
      ) : null}

      <Text accessibilityRole="header" style={styles.section}>
        {t('settings.passwordSection')}
      </Text>
      <TextField
        label={t('settings.currentPasswordLabel')}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="password"
        textContentType="password"
        testID="settings-current-password"
      />
      <TextField
        label={t('settings.newPasswordLabel')}
        helperText={t('auth.passwordHelper', { min: PASSWORD_MIN_LENGTH })}
        value={newPassword}
        onChangeText={setNewPassword}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="new-password"
        textContentType="newPassword"
        testID="settings-new-password"
      />
      <TextField
        label={t('auth.confirmPasswordLabel')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="new-password"
        textContentType="newPassword"
        testID="settings-confirm-password"
      />
      <Button
        label={t('settings.changePasswordButton')}
        onPress={() => void submitPassword()}
        loading={busy === 'password'}
        disabled={busy !== null}
        testID="settings-change-password"
      />

      <Text accessibilityRole="header" style={styles.section}>
        {t('settings.emailSection')}
      </Text>
      <Text style={styles.body}>{t('settings.emailHelp')}</Text>
      <TextField
        label={t('settings.newEmailLabel')}
        value={newEmail}
        onChangeText={setNewEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        testID="settings-new-email"
      />
      <TextField
        label={t('settings.passwordToConfirmLabel')}
        value={emailPassword}
        onChangeText={setEmailPassword}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="password"
        textContentType="password"
        testID="settings-email-password"
      />
      <Button
        label={t('settings.changeEmailButton')}
        variant="secondary"
        onPress={() => void submitEmail()}
        loading={busy === 'email'}
        disabled={busy !== null}
        testID="settings-change-email"
      />

      <Text accessibilityRole="header" style={styles.section}>
        {t('settings.deleteSection')}
      </Text>
      <Alert
        variant="warning"
        title={t('settings.deleteWarningTitle')}
        message={t('settings.deleteWarning')}
      />
      {pendingDeletion ? (
        <Alert variant="warning" message={t('settings.deletePending')} />
      ) : null}
      <TextField
        label={t('settings.passwordToConfirmLabel')}
        value={deletePassword}
        onChangeText={setDeletePassword}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="password"
        textContentType="password"
        testID="settings-delete-password"
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: deleteConfirmed }}
        onPress={() => setDeleteConfirmed((value) => !value)}
        style={styles.checkbox}
      >
        <Text style={styles.body}>
          {deleteConfirmed ? '☑ ' : '☐ '}
          {t('settings.deleteConfirmLabel')}
        </Text>
      </Pressable>
      <Button
        label={
          pendingDeletion
            ? t('settings.deleteResumeButton')
            : t('settings.deleteButton')
        }
        variant="destructive"
        onPress={() => void submitDelete()}
        loading={busy === 'delete'}
        disabled={busy !== null}
        testID="settings-delete-account"
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
    section: {
      color: colors.textPrimary,
      fontSize: typography.h2.fontSize,
      lineHeight: typography.h2.lineHeight,
      fontWeight: typography.h2.fontWeight,
      marginTop: spacing.space16,
    },
    body: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    checkbox: {
      minHeight: 48,
      justifyContent: 'center',
      borderRadius: radii.md,
    },
  });
}
