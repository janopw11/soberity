import 'leaflet/dist/leaflet.css';
import { divIcon, type LeafletMouseEvent } from 'leaflet';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

type Props = {
  apiKey: string;
  latitude: number;
  longitude: number;
  zoom: number;
  onPlace: (latitude: number, longitude: number) => void;
};

const ATTRIBUTION =
  '© <a href="https://www.geoapify.com/">Geoapify</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Admin preview map. Dragging the marker or clicking the map confirms and moves the stored point. */
export default function LocationPreviewMap({
  apiKey,
  latitude,
  longitude,
  zoom,
  onPlace,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useThemePreferences();
  const tiles = theme === 'dark' ? 'dark-matter' : 'positron';
  const pin = useMemo(
    () =>
      divIcon({
        className: 'ev-map-pin',
        html: '<span></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    [],
  );
  return (
    <div
      className="ev-map"
      role="region"
      aria-label={t('eventEditor.location.mapLabel')}
    >
      <MapContainer
        className="ev-map-canvas"
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
      >
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/${tiles}/{z}/{x}/{y}.png?apiKey=${apiKey}`}
          attribution={ATTRIBUTION}
        />
        <PlaceOnClick onPlace={onPlace} />
        <Recenter latitude={latitude} longitude={longitude} />
        <Marker
          position={[latitude, longitude]}
          icon={pin}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const point = event.target.getLatLng();
              onPlace(point.lat, point.lng);
            },
          }}
        />
      </MapContainer>
      <p className="ev-hint">{t('eventEditor.location.mapHint')}</p>
    </div>
  );
}

function PlaceOnClick({ onPlace }: { onPlace: Props['onPlace'] }) {
  useMapEvents({
    click: (event: LeafletMouseEvent) =>
      onPlace(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

function Recenter({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [map, latitude, longitude]);
  return null;
}
