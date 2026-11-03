import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';

export default function ScienceLayout() {
  const { t } = useTranslation();
  const headerOptions = useAppHeaderOptions();
  return (
    <Stack screenOptions={{
      title: t('science.title'),
      ...headerOptions,
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="quizzes" options={{ title: t('learning.quizzes') }} />
      <Stack.Screen name="learn" options={{ title: t('learning.title') }} />
      <Stack.Screen name="flashcards" options={{ title: t('learning.flashcards') }} />
      <Stack.Screen name="quiz/[id]" options={{ title: t('learning.quizzes') }} />
      <Stack.Screen name="post/[id]" options={{ title: t('discover.article') }} />
      <Stack.Screen name="article/[id]" options={{ title: t('discover.article') }} />
      <Stack.Screen name="evidence/[id]" options={{ title: t('discover.evidence') }} />
    </Stack>
  );
}
