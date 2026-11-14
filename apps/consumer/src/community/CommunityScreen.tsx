import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Screen } from '../ui';
import { CommunityCard } from './CommunityCards';

export default function CommunityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  return (
    <Screen>
      <View style={styles.navGrid}>
        {(['circles', 'discussions'] as const).map((kind) => (
          <View key={kind} style={{ width: width >= 600 ? '48.5%' : '100%' }}>
            <CommunityCard title={t(`community.${kind}.title`)} description={t(`community.${kind}.description`)} icon={kind === 'circles' ? 'people' : 'flask'} onPress={() => router.push(kind === 'circles' ? '/circles' : '/discussions')} />
          </View>
        ))}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
