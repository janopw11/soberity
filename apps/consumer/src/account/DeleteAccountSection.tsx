import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing, typography } from '@soberity/design-tokens';

import { useAuthStatus } from '../auth/AuthStatusContext';
import { mapAuthError } from '../auth/errors';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Dialog, SettingsIcon, SettingsRow, TextField } from '../ui';
import { deleteAccount, hasPendingDeletion } from './accountSecurity';
import { useAccountSecurityDeps } from './useAccountSecurityDeps';

/** Destructive row in the account list; confirmation happens in a modal that asks for the password. */
export default function DeleteAccountSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <SettingsRow
        icon="trash"
        label={t('account.deleteButton')}
        destructive
        onPress={() => setOpen(true)}
        testID="account-delete"
      />
      <Dialog
        visible={open}
        title={t('account.deleteButton')}
        closeLabel={t('common.close')}
        onClose={() => setOpen(false)}
        testID="account-delete-dialog"
      >
        <DeleteAccountForm />
      </Dialog>
    </>
  );
}

function DeleteAccountForm() {
  const { t } = useTranslation();
  const { user } = useAuthStatus();
  const securityDeps = useAccountSecurityDeps();
  const { colors } = useThemePreferences();

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [password, setPassword] = useState('');

  const uid = user?.uid ?? null;
  const canDelete = password.length > 0 && !busy;
  const actionLabel = pendingDeletion
    ? t('settings.deleteResumeButton')
    : t('settings.deleteButton');

  useEffect(() => {
    if (!uid) return;
    void hasPendingDeletion(uid).then(setPendingDeletion);
  }, [uid]);

  const submit = async () => {
    setNotice(null);
    if (!securityDeps || !canDelete) return;

    setBusy(true);
    try {
      // On success the session ends and the app returns to the guest area.
      await deleteAccount(securityDeps, password);
    } catch (error) {
      setPendingDeletion(await hasPendingDeletion(securityDeps.uid));
      setNotice(t(`auth.errors.${mapAuthError(error)}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {pendingDeletion ? (
        <Alert variant="warning" message={t('settings.deletePending')} />
      ) : null}
      {notice ? <Alert variant="danger" message={notice} /> : null}

      <TextField
        accentLabel
        label={t('settings.passwordToConfirmLabel')}
        value={password}
        onChangeText={setPassword}
        secureToggle
        showPasswordLabel={t('auth.showPassword')}
        hidePasswordLabel={t('auth.hidePassword')}
        autoComplete="password"
        textContentType="password"
        testID="account-delete-password"
      />
      <View style={styles.warning}>
        <SettingsIcon name="alert" color={colors.danger} size={18} />
        <Text style={[styles.warningLabel, { color: colors.danger }]}>
          {t('settings.deleteWarningTitle')}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityState={{ disabled: !canDelete, busy }}
        disabled={!canDelete}
        onPress={() => void submit()}
        style={styles.confirm}
        testID="account-delete-confirm"
      >
        <Text
          style={[
            styles.confirmLabel,
            { color: canDelete ? colors.danger : colors.textMuted },
          ]}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space4,
  },
  warningLabel: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: typography.label.fontWeight,
  },
  confirm: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.space16,
  },
  confirmLabel: {
    textAlign: 'center',
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
  },
});
