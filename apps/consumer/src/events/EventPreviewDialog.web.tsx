import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { directionUrls, type PreciseCoordinates } from './mapModel';
import { mapButtonStyle } from './mapControls';
import type { DiscoveryEvent } from './eventsApi';

type Props = {
  event: DiscoveryEvent & PreciseCoordinates;
  locale: 'en' | 'pl';
  onClose: () => void;
};

/** Compact dialog shown over the map when a marker is clicked: title, date and three actions. */
export function EventPreviewDialog({ event, locale, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const directions = directionUrls({
    latitude: event.latitude,
    longitude: event.longitude,
    title: event.title,
  });
  const when = new Date(event.starts_at).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: event.timezone,
  });
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="event-preview-title"
      style={{
        display: 'grid',
        gap: 8,
        width: 240,
        padding: 12,
        color: colors.textPrimary,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'grid', gap: 2, minWidth: 0, flex: 1 }}>
          <strong
            id="event-preview-title"
            style={{
              fontSize: 15,
              lineHeight: 1.25,
              color: colors.primary,
              overflowWrap: 'anywhere',
            }}
          >
            {event.title}
          </strong>
          <span style={{ fontSize: 13, color: colors.textMuted }}>{when}</span>
        </div>
        <button
          type="button"
          aria-label={t('events.map.close')}
          onClick={onClose}
          style={{
            ...mapButtonStyle(colors, 'secondary', 'compact'),
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
      <Link
        href={{ pathname: '/events/[id]', params: { id: event.id } }}
        asChild
      >
        <a style={mapButtonStyle(colors, 'primary', 'compact')}>
          {t('events.map.viewDetails')}
        </a>
      </Link>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <a
          href={directions.google}
          target="_blank"
          rel="noopener noreferrer"
          style={mapButtonStyle(colors, 'secondary', 'compact')}
        >
          {t('events.map.googleMaps')}
        </a>
        <a
          href={directions.apple}
          target="_blank"
          rel="noopener noreferrer"
          style={mapButtonStyle(colors, 'secondary', 'compact')}
        >
          {t('events.map.appleMaps')}
        </a>
      </div>
    </div>
  );
}
