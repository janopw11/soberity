import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { Alert, Button } from '../ui';
import { ReadingCard, ReadingText } from '../science/readingUi';
import { learningRequest } from './learningApi';

export default function ProgressControl({ enabled, busy = false, onChange }: {
  enabled: boolean; busy?: boolean; onChange: (enabled: boolean) => void;
}) {
  const { status, getIdToken } = useAuthStatus();
  const { t } = useTranslation();
  const [clearing, setClearing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState(false);
  const [cleared, setCleared] = useState(false);
  if (status !== 'authenticated') return <ReadingText muted>{t('learning.guestProgress')}</ReadingText>;
  async function forget() {
    setClearing(true); setError(false);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Session unavailable');
      await learningRequest('/api/v1/me/learning', { method: 'DELETE', token });
      onChange(false); setConfirm(false); setCleared(true);
    } catch { setError(true); } finally { setClearing(false); }
  }
  return <ReadingCard>
    <ReadingText muted>{t('learning.progressPrivacy')}</ReadingText>
    <Button label={t(enabled ? 'learning.disableSave' : 'learning.enableSave')} variant="secondary" disabled={busy || clearing} onPress={() => { setCleared(false); onChange(!enabled); }} />
    <Button label={t('learning.forget')} variant="tertiary" disabled={busy || clearing} onPress={() => setConfirm(value => !value)} />
    {confirm ? <><ReadingText>{t('learning.forgetConfirm')}</ReadingText><Button label={t('learning.confirmForget')} variant="secondary" loading={clearing} onPress={() => { void forget(); }} /></> : null}
    {error ? <Alert variant="danger" message={t('learning.saveError')} /> : null}
    {cleared ? <Alert variant="success" message={t('learning.forgotten')} /> : null}
  </ReadingCard>;
}
