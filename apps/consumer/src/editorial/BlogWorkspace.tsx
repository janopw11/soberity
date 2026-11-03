import { useTranslation } from 'react-i18next';
import { Alert, Screen } from '../ui';
export default function BlogWorkspace() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Alert message={t('editorial.webOnly')} />
    </Screen>
  );
}
