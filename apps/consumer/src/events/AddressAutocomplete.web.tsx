import '@geoapify/geocoder-autocomplete/styles/minimal.css';
import {
  GeoapifyContext,
  GeoapifyGeocoderAutocomplete,
} from '@geoapify/react-geocoder-autocomplete';
import { useTranslation } from 'react-i18next';
import { addressSelection, type AddressSelection } from './addressSelection';

type Props = {
  initialValue: string;
  disabled?: boolean;
  onInput: (text: string) => void;
  onSelect: (selection: AddressSelection) => void;
};

/**
 * Address search for the admin event editor. Uses the Geoapify React integration with a
 * public, origin-restricted key from EXPO_PUBLIC_GEOAPIFY_API_KEY. Without the key it falls
 * back to plain text, so no coordinates can be produced.
 */
export default function AddressAutocomplete({
  initialValue,
  disabled,
  onInput,
  onSelect,
}: Props) {
  const { t, i18n } = useTranslation();
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!apiKey) {
    return (
      <input
        value={initialValue}
        disabled={disabled}
        onChange={(event) => onInput(event.target.value)}
      />
    );
  }
  return (
    <GeoapifyContext apiKey={apiKey}>
      <GeoapifyGeocoderAutocomplete
        placeholder={t('eventEditor.location.search')}
        lang={i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'}
        limit={8}
        debounceDelay={300}
        value={initialValue}
        onUserInput={(text: string) => {
          if (!disabled) onInput(text);
        }}
        placeSelect={(feature: { properties?: unknown } | null) => {
          if (feature?.properties)
            onSelect(
              addressSelection(
                feature.properties as Parameters<typeof addressSelection>[0],
              ),
            );
        }}
      />
    </GeoapifyContext>
  );
}
