import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Screen } from '../ui';
import BlogWorkspace from './BlogWorkspace';
import { useAuthStatus } from '../auth/AuthStatusContext';

export default function EditorialScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStatus();
  if (Platform.OS !== 'web')
    return (
      <Screen>
        <Alert message={t('editorial.webOnly')} />
      </Screen>
    );
  return <BlogWorkspace key={user?.uid} />;
}
