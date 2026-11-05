import { Stack } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import { useAppHeaderOptions } from '../../src/navigation/useAppHeaderOptions';
import { useThemePreferences } from '../../src/preferences/ThemePreferencesContext';

export default function EventsLayout() {
  const { t } = useTranslation();
  const options = useAppHeaderOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen
        name="index"
        options={{
          title: t('events.title'),
          headerTitle: () => <EventsTitle />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: t('events.detailTitle') }} />
    </Stack>
  );
}

function EventsTitle() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  return (
    <View style={styles.title}>
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- existing brand asset
        source={require('../../assets/images/events-icon-ocean.png')}
        style={styles.icon}
        resizeMode="contain"
        accessible={false}
        importantForAccessibility="no"
      />
      <Text
        accessibilityRole="header"
        style={[styles.label, { color: colors.primary }]}
      >
        {t('events.title')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.space8 },
  icon: { width: 32, height: 32 },
  label: { ...typography.h3, flexShrink: 1 },
});
