import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';
export default function DiscussionsLayout() {
  const { t } = useTranslation();
  const options = useAppHeaderOptions();
  return (
    <Stack screenOptions={{ ...options, title: t('discussions.title') }} />
  );
}
