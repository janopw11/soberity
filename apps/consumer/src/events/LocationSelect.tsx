import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import {
  Alert,
  Button,
  Dialog,
  LoadingState,
  SettingsGroup,
  SettingsRow,
  TextField,
} from '../ui';
import { Pagination } from '../ui/Pagination';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import {
  locationsGet,
  type LocationPage,
  type LocationRecord,
} from './discoveryApi';

export function locationLabel(
  value: LocationRecord,
  language: string,
  city = false,
) {
  const name = language === 'pl' ? value.label_pl : value.label_en;
  return [
    name || value.name,
    ...(city ? [value.region, value.district, `#${value.geoname_id}`] : []),
  ]
    .filter(Boolean)
    .join(' · ');
}
/** Two independent searchable record pickers. Free text is never submitted as a selected location. */
export function LocationSelect({
  kind,
  countryId,
  value,
  onChange,
}: {
  kind: 'countries' | 'cities';
  countryId?: string | undefined;
  value: LocationRecord | null;
  onChange: (value: LocationRecord | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [page, setPage] = useState(0),
    [attempt, retry] = useState(0);
  const [result, setResult] = useState<LocationPage | null>(null),
    [error, setError] = useState(false);
  const city = kind === 'cities',
    language = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const label = t(city ? 'events.city' : 'events.country');
  const disabled = city && !countryId;
  useEffect(() => {
    setOpen(false);
    setQuery('');
    setPage(0);
  }, [countryId]);
  useEffect(() => {
    if (!open || disabled) return;
    setResult(null);
    setError(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setError(true);
      controller.abort();
    }, 20000);
    const debounce = setTimeout(() => {
      const params = new URLSearchParams({
        q: query.trim(),
        locale: language,
        page: String(page),
        size: '20',
      });
      if (city && countryId) params.set('countryId', countryId);
      void locationsGet(`/${kind}?${params}`, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setResult(data);
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(true);
        })
        .finally(() => clearTimeout(timeout));
    }, 300);
    return () => {
      clearTimeout(timeout);
      clearTimeout(debounce);
      controller.abort();
    };
  }, [open, disabled, city, countryId, kind, query, page, language, attempt]);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
      <Button
        variant="secondary"
        testID={`events-${kind}`}
        disabled={disabled}
        label={
          value
            ? locationLabel(value, language, city)
            : t(
                city
                  ? 'events.locations.chooseCity'
                  : 'events.locations.chooseCountry',
              )
        }
        accessibilityHint={
          disabled ? t('events.locations.countryFirst') : label
        }
        onPress={() => {
          setQuery('');
          setPage(0);
          setOpen(true);
        }}
      />
      <Dialog
        visible={open}
        title={label}
        closeLabel={t('events.close')}
        onClose={() => setOpen(false)}
        testID={`events-${kind}-dialog`}
      >
        <TextField
          label={t(
            city
              ? 'events.locations.searchCities'
              : 'events.locations.searchCountries',
          )}
          value={query}
          maxLength={200}
          autoCorrect={false}
          autoCapitalize="none"
          onChangeText={(text) => {
            setQuery(text);
            setPage(0);
          }}
        />
        <Button
          variant="tertiary"
          label={t('events.any')}
          onPress={() => {
            onChange(null);
            setOpen(false);
          }}
        />
        {error ? (
          <>
            <Alert variant="danger" message={t('events.locations.error')} />
            <Button
              label={t('events.retry')}
              variant="secondary"
              onPress={() => retry((value) => value + 1)}
            />
          </>
        ) : !result ? (
          <LoadingState label={t('events.locations.loading')} />
        ) : result.items.length === 0 ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...typography.small, color: colors.textSecondary }}
          >
            {t('events.locations.empty')}
          </Text>
        ) : (
          <>
            <SettingsGroup>
              {result.items.map((option) => (
                <SettingsRow
                  key={option.id}
                  label={locationLabel(option, language, city)}
                  multilineLabel
                  selected={value?.id === option.id}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                />
              ))}
            </SettingsGroup>
            <Pagination
              page={result.page}
              size={result.size}
              total={result.total}
              onPageChange={setPage}
              label={t('discover.page', {
                page: result.page + 1,
                pages: Math.max(1, Math.ceil(result.total / result.size)),
                count: result.total,
              })}
            />
          </>
        )}
        <LocationAttribution />
      </Dialog>
    </View>
  );
}
export function LocationAttribution() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [error, setError] = useState(false);
  const open = (url: string) => {
    void Linking.openURL(url).catch(() => setError(true));
  };
  return (
    <View style={styles.credit}>
      <Text style={{ ...typography.caption, color: colors.textMuted }}>
        {t('events.locations.attribution')}
      </Text>
      <View style={styles.links}>
        <Button
          label="GeoNames"
          variant="tertiary"
          onPress={() => open('https://www.geonames.org/')}
        />
        <Button
          label="CC BY 4.0"
          variant="tertiary"
          onPress={() => open('https://creativecommons.org/licenses/by/4.0/')}
        />
      </View>
      {error ? (
        <Alert variant="danger" message={t('events.detail.actionError')} />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: spacing.space4 },
  label: { ...typography.label },
  credit: { gap: spacing.space4 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 },
});
