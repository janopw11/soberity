import { Stack } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../../src/preferences/ThemePreferencesContext';
import { useTranslation } from 'react-i18next';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';

export default function ScienceLayout() {
  const { t } = useTranslation();
  const headerOptions = useAppHeaderOptions();
  return (
    <Stack
      screenOptions={{
        title: t('science.title'),
        ...headerOptions,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('discover.articles'),
          headerTitle: () => <ScienceTitle section="articles" />,
        }}
      />
      <Stack.Screen
        name="quizzes"
        options={{
          title: t('learning.quizzes'),
          headerTitle: () => <ScienceTitle section="quizzes" />,
        }}
      />
      <Stack.Screen name="learn" options={{ title: t('learning.title') }} />
      <Stack.Screen
        name="flashcards"
        options={{ title: t('learning.flashcards') }}
      />
      <Stack.Screen
        name="quiz/[id]"
        options={{ title: t('learning.quizzes') }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{ title: t('discover.article') }}
      />
      <Stack.Screen
        name="article/[id]"
        options={{ title: t('discover.article') }}
      />
      <Stack.Screen
        name="evidence/[id]"
        options={{ title: t('discover.evidence') }}
      />
    </Stack>
  );
}

function ScienceTitle({ section }: { section: 'articles' | 'quizzes' }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  return (
    <View style={styles.title}>
      <Image
        source={
          section === 'articles'
            ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- existing brand asset
              require('../../assets/images/articles-icon-ocean.png')
            : // eslint-disable-next-line @typescript-eslint/no-require-imports -- existing brand asset
              require('../../assets/images/quizzes-icon-ocean.png')
        }
        style={styles.icon}
        resizeMode="contain"
        accessible={false}
        importantForAccessibility="no"
      />
      <Text
        accessibilityRole="header"
        style={[styles.label, { color: colors.primary }]}
      >
        {t(section === 'articles' ? 'discover.articles' : 'learning.quizzes')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.space8 },
  icon: { width: 32, height: 32 },
  label: { ...typography.h3, flexShrink: 1 },
});
