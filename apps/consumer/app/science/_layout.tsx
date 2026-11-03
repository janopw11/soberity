import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemePreferences } from '../../src/preferences/ThemePreferencesContext';
export default function ScienceLayout() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  return <Stack screenOptions={{ title: t('science.title'), headerShadowVisible: false, headerTintColor: colors.textPrimary, headerStyle: { backgroundColor: colors.background }, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="index" /><Stack.Screen name="post/[id]" options={{ title: t('discover.article') }} /><Stack.Screen name="article/[id]" options={{ title: t('discover.article') }} /><Stack.Screen name="evidence/[id]" options={{ title: t('discover.evidence') }} /></Stack>;
}
