import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState, TextField } from '../ui';
import { Pagination } from '../ui/Pagination';
import {
  locationsGet,
  type CityLocationRecord,
  type LocationRecord,
} from './discoveryApi';
import { locationLabel } from './LocationSelect';
import { useDialogDropdown } from '../ui/DialogDropdown';
import { EventDropdownOption } from './EventDropdownOption';

export type EventLocation =
  | { kind: 'country'; record: LocationRecord }
  | { kind: 'city'; record: CityLocationRecord };

function labelFor(value: EventLocation, language: string) {
  const name = locationLabel(value.record, language);
  if (value.kind === 'country') return name;
  const country =
    (language === 'pl'
      ? value.record.country_label_pl
      : value.record.country_label_en) || value.record.country_name;
  return [name, country].filter(Boolean).join(', ');
}

/** Shared inline autocomplete; submitted filters always contain selected dictionary IDs. */
export function EventLocationSearch({
  value,
  onChange,
  onPendingChange,
}: {
  value: EventLocation | null;
  onChange: (value: EventLocation | null) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const language = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [query, setQuery] = useState(value ? labelFor(value, language) : '');
  const [editing, setEditing] = useState(false);
  const dropdown = useDialogDropdown(editing && !!query.trim(), () =>
    setEditing(false),
  );
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    countries: LocationRecord[];
    cities: CityLocationRecord[];
    total: number;
  } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!editing || !query.trim()) return;
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
        size: '10',
      });
      void Promise.all([
        page === 0
          ? locationsGet(`/countries?${params}`, controller.signal)
          : Promise.resolve({ items: [] }),
        locationsGet<CityLocationRecord>(
          `/cities?${params}`,
          controller.signal,
        ),
      ])
        .then(([countries, cities]) => {
          if (!controller.signal.aborted)
            setResult({
              countries: countries.items,
              cities: cities.items,
              total: cities.total,
            });
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
  }, [query, editing, language, page, attempt]);
  const choose = (location: EventLocation) => {
    onChange(location);
    onPendingChange(false);
    setQuery(labelFor(location, language));
    setEditing(false);
  };
  return (
    <View
      ref={dropdown.anchor}
      style={[styles.field, { zIndex: editing && query.trim() ? 50 : 0 }]}
      {...(Platform.OS === 'web'
        ? {
            onKeyDown: (event: {
              key?: string;
              nativeEvent?: { key?: string };
              stopPropagation: () => void;
            }) => {
              if (
                editing &&
                (event.key ?? event.nativeEvent?.key) === 'Escape'
              ) {
                event.stopPropagation();
                setEditing(false);
              }
            },
          }
        : {})}
    >
      <TextField
        compact
        variant="soft"
        leadingIcon="location"
        label={t('events.location')}
        value={query}
        placeholder={t('events.locations.compactPlaceholder')}
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={200}
        onFocus={() => {
          if (query.trim() && !value) setEditing(true);
        }}
        onChangeText={(text) => {
          setQuery(text);
          setEditing(true);
          setPage(0);
          setResult(null);
          setError(false);
          onChange(null);
          onPendingChange(!!text.trim());
        }}
      />
      {editing && query.trim() ? (
        <View
          ref={dropdown.menuRef}
          style={[
            styles.suggestions,
            dropdown.menuStyle,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {error ? (
            <>
              <Alert variant="danger" message={t('events.locations.error')} />
              <Button
                variant="tertiary"
                label={t('events.retry')}
                onPress={() => {
                  setError(false);
                  setResult(null);
                  setAttempt(attempt + 1);
                }}
              />
            </>
          ) : !result ? (
            <LoadingState label={t('events.locations.loading')} />
          ) : !result.countries.length && !result.cities.length ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.caption, { color: colors.textSecondary }]}
            >
              {t('events.locations.empty')}
            </Text>
          ) : (
            <>
              <ScrollView
                style={[
                  styles.list,
                  {
                    height: Math.min(
                      (result.countries.length + result.cities.length) * 56,
                      Math.max(
                        48,
                        dropdown.menuHeight - (result.total > 10 ? 72 : 0),
                      ),
                    ),
                  },
                ]}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                accessibilityLabel={t('events.location')}
              >
                {result.countries.map((record) => (
                  <EventDropdownOption
                    key={record.id}
                    label={locationLabel(record, language)}
                    description={t('events.country')}
                    onPress={() => choose({ kind: 'country', record })}
                  />
                ))}
                {result.cities.map((record) => (
                  <EventDropdownOption
                    key={record.id}
                    label={labelFor({ kind: 'city', record }, language)}
                    description={[
                      record.region,
                      record.district,
                      ...(result.cities.some(
                        (other) =>
                          other.id !== record.id &&
                          labelFor(
                            { kind: 'city', record: other },
                            language,
                          ) === labelFor({ kind: 'city', record }, language),
                      )
                        ? [`#${record.geoname_id}`]
                        : []),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    onPress={() => choose({ kind: 'city', record })}
                  />
                ))}
              </ScrollView>
              {result.total > 10 ? (
                <Pagination
                  page={page}
                  size={10}
                  total={result.total}
                  onPageChange={(nextPage) => {
                    setPage(nextPage);
                    setResult(null);
                    setError(false);
                  }}
                  label={t('events.locationPage', {
                    page: page + 1,
                    pages: Math.ceil(result.total / 10),
                    count: result.total,
                  })}
                />
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.space8, position: 'relative' },
  suggestions: {
    gap: spacing.space4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    overflow: 'hidden',
    elevation: 2,
  },
  list: { maxHeight: 192, borderRadius: radii.md },
  caption: { ...typography.caption },
});
