import { useTranslation } from 'react-i18next';
import { Screen, Alert } from '../ui';
export default function CircleAdminScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Alert message={t('circles.webAdmin')} />
    </Screen>
  );
}
