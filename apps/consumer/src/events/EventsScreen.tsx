import { lazy, Suspense, useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
const EventMap = lazy(() => import('./EventMap'));
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import {
  Alert,
  Button,
  LoadingState,
  Screen,
  SettingsIcon,
  TextField,
} from '../ui';
import { Pagination } from '../ui/Pagination';
import { EventCard } from './EventCard';
import { CurrentEventLocation } from './CurrentEventLocation';
import { useEventLocation } from './EventLocationContext';
import { EventFiltersSheet } from './EventFiltersSheet';
import { EventCategoryChips } from './EventCategoryChips';
import { EventDateFilter } from './EventDateFilter';
import { EventLocationSearch, type EventLocation } from './EventLocationSearch';
import { eventsGet, type EventPage } from './eventsApi';
import {
  eventFilterQuery,
  initialEventFilters,
  prepareEventFilters,
  type EventFilters,
} from './eventFilters';

type AppliedFilters = {
  query: string;
  values: EventFilters;
  location: EventLocation | null;
};
const emptyAppliedFilters: AppliedFilters = {
  query: eventFilterQuery(initialEventFilters),
  values: initialEventFilters,
  location: null,
};

export default function EventsScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { enterEvents, leaveEvents } = useEventLocation();
  useFocusEffect(
    useCallback(() => {
      enterEvents();
      return leaveEvents;
    }, [enterEvents, leaveEvents]),
  );
  const [draft, setDraft] = useState(initialEventFilters);
  const [location, setLocation] = useState<EventLocation | null>(null);
  const [locationPending, setLocationPending] = useState(false);
  const [invalidLocation, setInvalidLocation] = useState(false);
  const [locationRevision, setLocationRevision] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterButtonFocused, setFilterButtonFocused] = useState(false);
  const [filterButtonHovered, setFilterButtonHovered] = useState(false);
  const [applied, setApplied] = useState(emptyAppliedFilters),
    [page, setPage] = useState(0),
    [attempt, retry] = useState(0),
    [invalid, setInvalid] = useState(false);
  const [result, setResult] = useState<{
    key: string;
    data: EventPage | null;
    error: boolean;
  } | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const canMap = true;
  const appliedFilterCount = [
    applied.values.name.trim(),
    applied.values.category,
    applied.values.countryId || applied.values.cityId,
    applied.values.from || applied.values.to,
  ].filter(Boolean).length;
  const query = `${applied.query}${applied.query ? '&' : ''}page=${page}&size=12`;
  const data = result?.key === query ? result.data : null,
    error = result?.key === query && result.error;
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setResult(null);
      const timeout = setTimeout(() => {
        setResult({ key: query, data: null, error: true });
        controller.abort();
      }, 20000);
      void eventsGet<EventPage>(`?${query}`, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted)
            setResult({ key: query, data, error: false });
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setResult({ key: query, data: null, error: true });
        })
        .finally(() => clearTimeout(timeout));
      return () => {
        clearTimeout(timeout);
        controller.abort();
      };
    }, [query, attempt]),
  );
  const resetDraft = () => {
    setDraft(initialEventFilters);
    setLocation(null);
    setLocationPending(false);
    setInvalidLocation(false);
    setLocationRevision((value) => value + 1);
    setInvalid(false);
  };
  const apply = () => {
    if (locationPending) {
      setInvalidLocation(true);
      return;
    }
    try {
      const values = prepareEventFilters(draft);
      const query = eventFilterQuery(values);
      setApplied({ query, values, location });
      setFiltersOpen(false);
      setPage(0);
      setInvalid(false);
    } catch {
      setInvalid(true);
    }
  };
  return (
    <Screen maxWidth={1040} avoidKeyboard>
      <View style={styles.toolbar}>
        <EventCategoryChips
          value={applied.values.category}
          onChange={(category) => {
            if (category === applied.values.category) return;
            const values = { ...applied.values, category };
            setApplied({ ...applied, values, query: eventFilterQuery(values) });
            setDraft(values);
            setPage(0);
            setInvalid(false);
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('events.openFilters')}
          accessibilityState={{ expanded: filtersOpen }}
          accessibilityValue={{
            text: t('events.appliedFilters', { count: appliedFilterCount }),
          }}
          testID="events-open-filters"
          onFocus={() => setFilterButtonFocused(true)}
          onBlur={() => setFilterButtonFocused(false)}
          onHoverIn={() => setFilterButtonHovered(true)}
          onHoverOut={() => setFilterButtonHovered(false)}
          onPress={() => {
            setDraft(applied.values);
            setLocation(applied.location);
            setLocationPending(false);
            setInvalidLocation(false);
            setInvalid(false);
            setFiltersOpen(true);
          }}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor:
                pressed || filterButtonHovered
                  ? colors.surfaceAlt
                  : 'transparent',
            },
          ]}
        >
          <View
            style={[
              styles.filterFace,
              {
                backgroundColor: colors.listSurface,
                borderColor: filterButtonFocused
                  ? colors.focusRing
                  : 'transparent',
              },
            ]}
          >
            <SettingsIcon name="filter" color={colors.primary} size={18} />
          </View>
          {appliedFilterCount > 0 ? (
            <View
              pointerEvents="none"
              style={[styles.filterCount, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.filterCountLabel, { color: colors.onPrimary }]}
              >
                {appliedFilterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <View style={styles.locationRow}>
        <View style={styles.locationGrow}>
          <CurrentEventLocation />
        </View>
        {canMap ? (
          <View
            accessibilityRole="tablist"
            style={[
              styles.viewSwitch,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
              },
            ]}
          >
            {(['list', 'map'] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="tab"
                accessibilityState={{ selected: view === option }}
                onPress={() => setView(option)}
                style={[
                  styles.viewOption,
                  view === option ? { backgroundColor: colors.surface } : null,
                ]}
              >
                <Text
                  style={[
                    styles.viewLabel,
                    {
                      color:
                        view === option ? colors.primary : colors.textMuted,
                    },
                  ]}
                >
                  {t(`events.view.${option}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <EventFiltersSheet
        visible={filtersOpen}
        title={t('events.filtersTitle')}
        closeLabel={t('events.close')}
        onClose={() => setFiltersOpen(false)}
        footer={
          <View style={styles.actions}>
            <Button
              label={t('events.resetDraft')}
              variant="tertiary"
              onPress={resetDraft}
              style={styles.resetButton}
            />
            <Button
              label={t('events.apply')}
              onPress={apply}
              style={styles.actionButton}
            />
          </View>
        }
      >
        <TextField
          compact
          variant="soft"
          leadingIcon="search"
          label={t('events.searchName')}
          placeholder={t('events.searchPlaceholder')}
          maxLength={200}
          value={draft.name}
          onChangeText={(name) =>
            setDraft((previous) => ({ ...previous, name }))
          }
          returnKeyType="search"
          onSubmitEditing={apply}
        />
        <EventLocationSearch
          key={`${filtersOpen ? 'location-open' : 'location-closed'}-${locationRevision}`}
          value={location}
          onPendingChange={setLocationPending}
          onChange={(value) => {
            setInvalidLocation(false);
            setLocation(value);
            setDraft((previous) => ({
              ...previous,
              countryId: value
                ? value.kind === 'country'
                  ? value.record.id
                  : value.record.country_id
                : '',
              cityId: value?.kind === 'city' ? value.record.id : '',
            }));
          }}
        />
        {invalidLocation ? (
          <Alert
            variant="danger"
            message={t('events.locations.selectSuggestion')}
          />
        ) : null}
        <EventDateFilter
          value={draft}
          onChange={(dates) => {
            setDraft((previous) => ({ ...previous, ...dates }));
            setInvalid(false);
          }}
        />
        {invalid ? (
          <Alert variant="danger" message={t('events.dateError')} />
        ) : null}
      </EventFiltersSheet>
      {canMap && view === 'map' ? (
        <Suspense fallback={<LoadingState label={t('events.loading')} />}>
          <EventMap query={applied.query} />
        </Suspense>
      ) : error ? (
        <EventLoadError onRetry={() => retry((value) => value + 1)} />
      ) : !data ? (
        <LoadingState label={t('events.loading')} />
      ) : !data.items.length ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.emptyLabel, { color: colors.primary }]}
          >
            {t('events.emptyTitle')}
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
            {t('events.emptyHint')}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {data.items.map((event) => (
              <View key={event.id} style={styles.cardSlot}>
                <EventCard event={event} />
              </View>
            ))}
          </View>
          <Pagination
            page={data.page}
            size={data.size}
            total={data.total}
            onPageChange={setPage}
            label={t('events.page', {
              page: data.page + 1,
              pages: Math.max(1, Math.ceil(data.total / data.size)),
              count: data.total,
            })}
          />
        </>
      )}
    </Screen>
  );
}
function EventLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.error, { backgroundColor: colors.listSurface }]}
    >
      <View style={styles.errorIcon}>
        <SettingsIcon name="alert" color={colors.textMuted} size={22} />
      </View>
      <View style={styles.errorCopy}>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
          {t('events.loadErrorTitle')}
        </Text>
        <Text
          style={[styles.errorDescription, { color: colors.textSecondary }]}
        >
          {t('events.loadErrorDescription')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('events.retry')}
          onPress={onRetry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={({ pressed }) => [
            styles.retry,
            {
              backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
              borderColor: focused ? colors.focusRing : 'transparent',
            },
          ]}
        >
          <SettingsIcon name="refresh" color={colors.primary} size={16} />
          <Text style={[styles.retryLabel, { color: colors.primary }]}>
            {t('events.retry')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  locationRow: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
  },
  locationGrow: { flex: 1, minWidth: 0 },
  viewSwitch: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.pill,
    padding: 2,
    gap: 2,
  },
  viewOption: {
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: spacing.space12,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewLabel: { fontSize: 13, fontWeight: '600' },
  toolbar: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.space4,
  },
  filterButton: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterFace: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterCount: {
    position: 'absolute',
    top: spacing.space4,
    right: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: spacing.space4,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountLabel: { ...typography.caption },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.space8,
    flexWrap: 'wrap',
  },
  actionButton: { flexGrow: 1, flexBasis: 140 },
  resetButton: {
    flexGrow: 0,
    flexBasis: 88,
    paddingHorizontal: spacing.space12,
  },
  error: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.space12,
    padding: spacing.space16,
    borderRadius: radii.lg,
  },
  errorIcon: { paddingTop: spacing.space4 },
  errorCopy: { flex: 1, minWidth: 0, gap: spacing.space4 },
  errorTitle: { ...typography.bodyStrong },
  errorDescription: { ...typography.small },
  retry: {
    minHeight: 48,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.space8,
  },
  retryLabel: { ...typography.small, fontWeight: '600' },
  empty: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
    paddingVertical: spacing.space8,
    paddingHorizontal: spacing.space16,
    borderRadius: 0,
    borderWidth: 1,
    gap: spacing.space4,
  },
  emptyLabel: { ...typography.small, textAlign: 'center' },
  emptyDescription: { ...typography.caption, textAlign: 'center' },
  grid: { alignItems: 'center', gap: spacing.space16 },
  cardSlot: { width: '100%', maxWidth: 800, minWidth: 0 },
});
