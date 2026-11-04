import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { SettingsGroup, SettingsRow } from '../ui';
import { editorialRequest, type Membership } from './editorialApi';

export default function EditorialEntry() {
  const { getIdToken, user } = useAuthStatus();
  const { t } = useTranslation();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let current = true;
    setAllowed(false);
    void (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const member = await editorialRequest<Membership>(token, '/me');
        if (current) setAllowed(member.roles.length > 0);
      } catch {
        /* Access is checked again by the workspace and every backend operation. */
      }
    })();
    return () => {
      current = false;
    };
  }, [getIdToken, user?.uid]);
  return allowed ? (
    <SettingsGroup>
      <SettingsRow
        label={t('editorial.title')}
        showChevron
        onPress={() => router.push('/editorial')}
      />
      <SettingsRow label={t('weekly.editorTitle')} showChevron onPress={() => router.push('/editorial-weekly')} />
      <SettingsRow label={t('learning.editor.title')} showChevron onPress={() => router.push('/editorial-quizzes')} />
    </SettingsGroup>
  ) : null;
}
