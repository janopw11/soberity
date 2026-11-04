import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '../../src/ui';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';

export default function AuthenticatedLayout() {
  const { t } = useTranslation();
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: t('common.appName'),
          headerTitle: () => <AppLogo />,
        }}
      />
      <Stack.Screen name="editorial-weekly" options={{ title: t('weekly.editorTitle') }} />
      <Stack.Screen name="editorial-quizzes" options={{ title: t('learning.editor.title') }} />
      <Stack.Screen
        name="editorial-evidence"
        options={{ title: t('editorial.evidence') }}
      />
      <Stack.Screen
        name="editorial"
        options={{ title: t('editorial.title') }}
      />
      <Stack.Screen name="account" options={{ title: t('account.title') }} />
      <Stack.Screen
        name="account-personal-data"
        options={{ title: t('account.sections.personalData') }}
      />
      <Stack.Screen
        name="account-password"
        options={{ title: t('account.sections.password') }}
      />
      <Stack.Screen
        name="account-preferences"
        options={{ title: t('account.sections.preferences') }}
      />
    </Stack>
  );
}

