import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { directionUrls, type PreciseCoordinates } from './mapModel';
import { mapButtonStyle } from './mapControls';

type Props = PreciseCoordinates & {
  title: string;
  onClose: () => void;
};

/** Asks which map app should open the event location. Opened by tapping the location on Event Details. */
export default function DirectionsChooser({
  title,
  latitude,
  longitude,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const urls = directionUrls({ latitude, longitude, title });

  useEffect(() => {
    const onKey = (key: KeyboardEvent) => {
      if (key.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="directions-chooser-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          display: 'grid',
          gap: 12,
          padding: 16,
          borderRadius: 16,
          background: colors.surface,
          color: colors.textPrimary,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2
            id="directions-chooser-title"
            style={{ margin: 0, flex: 1, fontSize: 16, color: colors.primary }}
          >
            {t('events.map.chooserTitle')}
          </h2>
          <button
            type="button"
            aria-label={t('events.map.close')}
            onClick={onClose}
            style={{
              ...mapButtonStyle(colors, 'secondary', 'compact'),
              minWidth: 48,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
        <a
          href={urls.google}
          target="_blank"
          rel="noopener noreferrer"
          style={mapButtonStyle(colors, 'primary', 'compact')}
        >
          {t('events.map.googleMaps')}
        </a>
        <a
          href={urls.apple}
          target="_blank"
          rel="noopener noreferrer"
          style={mapButtonStyle(colors, 'primary', 'compact')}
        >
          {t('events.map.appleMaps')}
        </a>
      </div>
    </div>
  );
}
