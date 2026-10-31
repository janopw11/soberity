import { useTranslation } from 'react-i18next';

import UnavailableScreen from '../../src/UnavailableScreen';

export default function ScienceRoute() {
  const { t } = useTranslation();
  return (
    <UnavailableScreen
      title={t('science.title')}
      description={t('science.description')}
    />
  );
}
