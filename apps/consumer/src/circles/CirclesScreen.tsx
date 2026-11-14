import { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
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
import { EventFiltersSheet } from '../events/EventFiltersSheet';
import { EventSelect } from '../events/EventSelect';
import { circleCategories, type CirclePage } from './circlesApi';

import { useCircleData } from './useCircleData';
import { CircleCard } from './CircleCard';

const emptyFilters = { q: '', category: '', mine: false };

export function CircleList({ preview = false }: { preview?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [applied, setApplied] = useState(emptyFilters);
  const [draft, setDraft] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterButtonFocused, setFilterButtonFocused] = useState(false);
  const [filterButtonHovered, setFilterButtonHovered] = useState(false);
  const { category, mine, q } = applied;
  const appliedFilterCount = [q, category, mine].filter(Boolean).length;
  const apply = () => {
    setApplied({ ...draft, q: draft.q.trim() });
    setPage(0);
    setFiltersOpen(false);
  };
  const params = new URLSearchParams({
    page: String(page),
    size: preview ? '3' : '12',
    ...(category ? { category } : {}),
    ...(q ? { q } : {}),
  });
  const { data, error, reload } = useCircleData<CirclePage>(
    `${mine ? '/me/circles' : '/circles'}?${params}`,
  );
  return (
    <View style={styles.section}>
      {!preview ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('circles.openFilters')}
            accessibilityState={{ expanded: filtersOpen }}
            accessibilityValue={{
              text: t('events.appliedFilters', { count: appliedFilterCount }),
            }}
            testID="circles-open-filters"
            onFocus={() => setFilterButtonFocused(true)}
            onBlur={() => setFilterButtonFocused(false)}
            onHoverIn={() => setFilterButtonHovered(true)}
            onHoverOut={() => setFilterButtonHovered(false)}
            onPress={() => {
              setDraft(applied);
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
                style={[
                  styles.filterCount,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.filterCountLabel, { color: colors.onPrimary }]}
                >
                  {appliedFilterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
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
                  onPress={() => setDraft(emptyFilters)}
                />
                <Button label={t('circles.apply')} onPress={apply} />
              </View>
            }
          >
            <TextField
              compact
              variant="soft"
              accentLabel
              leadingIcon="search"
              label={t('circles.search')}
              placeholder={t('circles.searchPlaceholder')}
              maxLength={120}
              value={draft.q}
              onChangeText={(q) => setDraft((previous) => ({ ...previous, q }))}
              returnKeyType="search"
              onSubmitEditing={apply}
            />
            <EventSelect
              label={t('circles.category')}
              value={draft.category}
              options={[
                { value: '', label: t('circles.allCategories') },
                ...circleCategories.map((value) => ({
                  value,
                  label: t(`circles.categories.${value}`),
                })),
              ]}
              onChange={(category) =>
                setDraft((previous) => ({ ...previous, category }))
              }
            />
            <EventSelect
              label={t('circles.scope')}
              value={draft.mine ? 'mine' : 'all'}
              options={[
                { value: 'all', label: t('circles.all') },
                { value: 'mine', label: t('circles.mine') },
              ]}
              onChange={(value) =>
                setDraft((previous) => ({
                  ...previous,
                  mine: value === 'mine',
                }))
              }
            />
          </EventFiltersSheet>
        </>
      ) : null}
      {error ? (
        <>
          <Alert variant="danger" message={t('circles.error')} />
          <Button label={t('circles.retry')} onPress={reload} />
        </>
      ) : !data ? (
        <LoadingState label={t('circles.loading')} />
      ) : !data.items.length ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t('circles.empty')}
        </Text>
      ) : (
        <View style={styles.grid}>
          {data.items.map((circle) => (
            <View
              key={circle.id}
              style={{
                width: width >= 1000 ? '32%' : width >= 700 ? '48%' : '100%',
              }}
            >
              <CircleCard circle={circle} onChanged={reload} />
            </View>
          ))}
        </View>
      )}
      {preview ? (
        <Button
          label={t('circles.explore')}
          variant="tertiary"
          onPress={() => router.push('/circles')}
        />
      ) : data && data.items.length > 0 ? (
        <Pagination
          page={data.page}
          size={data.size}
          total={data.total}
          onPageChange={setPage}
          label={t('circles.page', {
            page: data.page + 1,
            pages: Math.max(1, Math.ceil(data.total / Math.max(1, data.size))),
            count: data.total,
          })}
        />
      ) : null}
    </View>
  );
}
export default function CirclesScreen() {
  return (
    <Screen>
      <CircleList />
    </Screen>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.space16 },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space12 },
  body: { ...typography.body },
});
