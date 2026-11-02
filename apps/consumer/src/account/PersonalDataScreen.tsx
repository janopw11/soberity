import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStatus } from '../auth/AuthStatusContext';
import { mapAuthError } from '../auth/errors';
import { BackendUnavailableError } from '../auth/identityApi';
import { profileApi } from '../profile/profileApi';
import {
  Alert,
  Button,
  InlineEditRow,
  Screen,
  SettingsGroup,
  SettingsRow,
} from '../ui';

type Notice = {
  variant: 'success' | 'danger';
  text: string;
} | null;

export default function PersonalDataScreen() {
  const { t } = useTranslation();
  const { user, getIdToken } = useAuthStatus();

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  const uid = user?.uid ?? null;
  const dirty = username.trim() !== savedUsername.trim();
  const canSave = dirty && !saving;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setLoadFailed(false);
    try {
      const token = await getIdToken();
      if (!token) throw new BackendUnavailableError();
      // provision returns the existing profile; guest choices are only sent by the sync on sign-in.
      const profile = await profileApi.provision(token, null);
      setUsername(profile.displayName ?? '');
      setSavedUsername(profile.displayName ?? '');
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [getIdToken, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = () => {
    setNotice(null);
    setEditing(true);
  };

  const save = async () => {
    if (!canSave) return;
    setNotice(null);
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) throw new BackendUnavailableError();
      const profile = await profileApi.update(token, {
        displayName: username.trim(),
      });
      setUsername(profile.displayName ?? '');
      setSavedUsername(profile.displayName ?? '');
      setEditing(false);
      setNotice({ variant: 'success', text: t('profile.saved') });
    } catch (error) {
      setNotice({
        variant: 'danger',
        text: t(`auth.errors.${mapAuthError(error)}`),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <SettingsGroup>
          <SettingsRow label={t('profile.loading')} />
        </SettingsGroup>
      </Screen>
    );
  }

  if (loadFailed) {
    return (
      <Screen>
        <Alert
          variant="danger"
          title={t('profile.loadErrorTitle')}
          message={t('profile.loadErrorMessage')}
        />
        <Button label={t('profile.retry')} onPress={() => void load()} />
      </Screen>
    );
  }

  const hasSavedUsername = savedUsername.trim().length > 0;

  return (
    <Screen avoidKeyboard>
      {notice ? <Alert variant={notice.variant} message={notice.text} /> : null}

      <SettingsGroup>
        <SettingsRow
          icon="mail"
          labelAsHint
          label={t('account.emailLabel')}
          value={user?.email ?? ''}
          testID="account-email"
        />
        <InlineEditRow
          icon="person"
          label={t('profile.displayNameLabel')}
          displayValue={
            hasSavedUsername
              ? savedUsername
              : t('profile.displayNamePlaceholder')
          }
          displayIsPlaceholder={!hasSavedUsername}
          editing={editing}
          onStartEdit={startEdit}
          draft={username}
          onChangeDraft={setUsername}
          placeholder={t('profile.displayNamePlaceholder')}
          saveLabel={t('profile.saveButton')}
          canSave={canSave}
          saving={saving}
          onSave={() => void save()}
          maxLength={50}
          testID="account-username"
        />
      </SettingsGroup>
    </Screen>
  );
}
