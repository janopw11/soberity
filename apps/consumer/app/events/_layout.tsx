import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';

export default function EventsLayout() {
  const { t } = useTranslation();
  const options = useAppHeaderOptions();
  return <Stack screenOptions={options}>
    <Stack.Screen name="index" options={{ title: t('events.title') }} />
    <Stack.Screen name="[id]" options={{ title: t('events.detailTitle') }} />
  </Stack>;
}
