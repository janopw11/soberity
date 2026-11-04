import { useTranslation } from 'react-i18next';
import { Alert, Screen } from '../ui';
export default function EventEditorScreen() {
  const { t } = useTranslation();
  return <Screen><Alert message={t('eventEditor.webOnly')} /></Screen>;
}
