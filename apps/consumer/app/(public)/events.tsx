import { useTranslation } from 'react-i18next';

import UnavailableScreen from '../../src/UnavailableScreen';

export default function EventsRoute() {
  const { t } = useTranslation();
  return (
    <UnavailableScreen
      title={t('events.title')}
      description={t('events.description')}
    />
  );
}
