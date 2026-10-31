import { useTranslation } from 'react-i18next';

import UnavailableScreen from '../../src/UnavailableScreen';

export default function AccountRoute() {
  const { t } = useTranslation();
  return (
    <UnavailableScreen
      title={t('account.title')}
      description={t('account.description')}
    />
  );
}
