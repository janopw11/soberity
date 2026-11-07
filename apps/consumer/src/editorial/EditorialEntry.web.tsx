import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { SettingsGroup, SettingsRow } from '../ui';
import { editorialRequest, type Membership } from './editorialApi';
import { eventEditorRequest } from '../events/eventEditorApi';

export default function EditorialEntry() {
  const { getIdToken, user } = useAuthStatus();
  const { t } = useTranslation();
  const [allowed, setAllowed] = useState(false);
  const [eventsAllowed, setEventsAllowed] = useState(false);
  useEffect(() => {
    let current = true;
    setAllowed(false);
    setEventsAllowed(false);
    void (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const [editorial, events] = await Promise.allSettled([
          editorialRequest<Membership>(token, '/me'),
          eventEditorRequest(token, '?page=0&size=1'),
        ]);
        if (current) {
          setAllowed(
            editorial.status === 'fulfilled' &&
              editorial.value.roles.length > 0,
          );
          setEventsAllowed(events.status === 'fulfilled');
        }
      } catch {
        /* Access is checked again by the workspace and every backend operation. */
      }
    })();
    return () => {
      current = false;
    };
  }, [getIdToken, user?.uid]);
  return allowed || eventsAllowed ? (
    <SettingsGroup>
      {allowed ? (
        <>
          <SettingsRow
            label={t('editorial.title')}
            showChevron
            onPress={() => router.push('/editorial')}
          />
          <SettingsRow
            label={t('weekly.editorTitle')}
            showChevron
            onPress={() => router.push('/editorial-weekly')}
          />
          <SettingsRow
            label={t('learning.editor.title')}
            showChevron
            onPress={() => router.push('/editorial-quizzes')}
          />
        </>
      ) : null}
      {eventsAllowed ? (
        <SettingsRow
          label={t('eventEditor.title')}
          showChevron
          onPress={() => router.push('/editorial-events')}
        />
      ) : null}
    </SettingsGroup>
  ) : null;
}
