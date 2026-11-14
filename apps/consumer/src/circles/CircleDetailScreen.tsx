import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState, Screen } from '../ui';
import { EventCard } from '../events/EventCard';
import type { EventPage } from '../events/eventsApi';
import { useCircleData } from './useCircleData';
import type { Circle } from './circlesApi';
import { CircleCover, CircleMembership } from './CircleCard';
export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const {
    data: circle,
    error,
    reload,
  } = useCircleData<Circle>(`/circles/${encodeURIComponent(id ?? '')}`);
  const [page, setPage] = useState(0);
  const related = useCircleData<EventPage>(
    `/circles/${encodeURIComponent(id ?? '')}/events?page=${page}&size=12`,
  );
  return (
    <Screen maxWidth={900}>
      {error ? (
        <>
          <Alert variant="danger" message={t('circles.unavailable')} />
          <Button label={t('circles.retry')} onPress={reload} />
        </>
      ) : !circle ? (
        <LoadingState label={t('circles.loading')} />
      ) : (
        <>
          <CircleCover circle={circle} />
          <Text style={{ ...typography.label, color: colors.primary }}>
            {t(`circles.categories.${circle.category}`)}
          </Text>
          <Text
            accessibilityRole="header"
            style={{ ...typography.h1, color: colors.textPrimary }}
          >
            {circle.name}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            {circle.description}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...typography.bodyStrong, color: colors.textPrimary }}
          >
            {t('circles.members', { count: circle.member_count })}
            {circle.joined ? ` · ${t('circles.joined')}` : ''}
          </Text>
          <CircleMembership circle={circle} onChanged={reload} />
          <Text
            accessibilityRole="header"
            style={{ ...typography.h2, color: colors.textPrimary }}
          >
            {t('circles.guidelines')}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            {circle.guidelines}
          </Text>
          <Text
            accessibilityRole="header"
            style={{ ...typography.h2, color: colors.textPrimary }}
          >
            {t('circles.events')}
          </Text>
          {related.error ? (
            <>
              <Alert variant="danger" message={t('circles.error')} />
              <Button label={t('circles.retry')} onPress={related.reload} />
            </>
          ) : !related.data ? (
            <LoadingState label={t('circles.loading')} />
          ) : (
            <>
              {!related.data.items.length ? (
                <Text style={{ color: colors.textSecondary }}>
                  {t('circles.noEvents')}
                </Text>
              ) : (
                related.data.items.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
              <View style={{ flexDirection: 'row', gap: spacing.space12 }}>
                <Button
                  label={t('circles.previous')}
                  disabled={!page}
                  onPress={() => setPage((x) => x - 1)}
                />
                <Button
                  label={t('circles.next')}
                  disabled={
                    (page + 1) * related.data.size >= related.data.total
                  }
                  onPress={() => setPage((x) => x + 1)}
                />
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
