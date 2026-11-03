import { useTranslation } from 'react-i18next';
import { Alert, Screen } from '../ui';
export default function QuizEditorialScreen() {
  const { t } = useTranslation();
  return <Screen><Alert message={t('editorial.webOnly')} /></Screen>;
}
