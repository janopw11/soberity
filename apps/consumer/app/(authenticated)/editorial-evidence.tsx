import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import EditorialPanel from '../../src/editorial/EditorialPanel';
import { Alert, Screen } from '../../src/ui';
export default function LegacyEvidenceWorkspace() {
  const { t } = useTranslation();
  return Platform.OS === 'web' ? (
    <EditorialPanel />
  ) : (
    <Screen>
      <Alert message={t('editorial.webOnly')} />
    </Screen>
  );
}
