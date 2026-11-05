import { useCallback, type RefObject } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import { useEventLocation } from './EventLocationContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState } from '../ui';
import { ChapterHeading } from '../ChapterHeading';
import { EventTicket } from './EventTicket';

export function NearbyEvents({
  reveal,
  animationPlayed,
  onSectionLayout,
  onTicketLayout,
}: {
  reveal: boolean;
  animationPlayed: RefObject<boolean>;
  onSectionLayout: (event: LayoutChangeEvent) => void;
  onTicketLayout: (event: LayoutChangeEvent) => void;
}) {
  const { t } = useTranslation(),
    { colors } = useThemePreferences();
  const { enabled, result, enterHome, leaveHome, refresh } = useEventLocation();
  useFocusEffect(
    useCallback(() => {
      enterHome();
      return leaveHome;
    }, [enterHome, leaveHome]),
  );
  if (!enabled) return null;
  return (
    <View
      style={styles.section}
      onLayout={onSectionLayout}
      testID="nearby-events"
    >
      <ChapterHeading icon="calendar">{t('home.eventsNearYou')}</ChapterHeading>
      {result.status === 'ready' && result.data ? (
        <>
          <Text style={{ ...typography.small, color: colors.textSecondary }}>
            {t('events.nearby.radius', { radius: result.data.radiusKm })}
          </Text>
          {result.data.items.length ? (
            result.data.items.map((event, index) => (
              <View
                key={event.id}
                onLayout={index === 0 ? onTicketLayout : undefined}
              >
                <EventTicket
                  event={event}
                  reveal={index === 0 && reveal}
                  animationPlayed={animationPlayed}
                />
              </View>
            ))
          ) : (
            <Text
              accessibilityLiveRegion="polite"
              style={{ ...typography.body, color: colors.textPrimary }}
            >
              {t('events.nearby.empty')}
            </Text>
          )}
        </>
      ) : result.status === 'unavailable' ? (
        <>
          <Alert variant="info" message={t('events.nearby.unavailable')} />
          <Button
            variant="secondary"
            label={t('events.retry')}
            onPress={() => {
              void refresh();
            }}
          />
        </>
      ) : result.status === 'error' ? (
        <>
          <Alert variant="danger" message={t('events.error')} />
          <Button
            variant="secondary"
            label={t('events.retry')}
            onPress={() => {
              void refresh();
            }}
          />
        </>
      ) : (
        <LoadingState label={t('events.nearby.loading')} />
      )}
      <Link
        href="/events"
        style={{
          ...typography.bodyStrong,
          color: colors.primary,
          paddingVertical: spacing.space12,
        }}
        testID="nearby-event-base"
      >
        {t('events.nearby.browse')}
      </Link>
    </View>
  );
}
const styles = StyleSheet.create({ section: { gap: spacing.space16 } });
