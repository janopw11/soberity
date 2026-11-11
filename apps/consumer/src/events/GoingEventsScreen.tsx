import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, LoadingState, Screen } from '../ui';
import { EventCard } from './EventCard';
import { listEventInterests } from './eventInterestsApi';
import type { EventPage } from './eventsApi';

/** The signed-in user's own "going sober" events, soonest first. Visible only to that account. */
export function GoingEventsScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { getIdToken } = useAuthStatus();
  const [state, setState] = useState<{
    loading: boolean;
    data: EventPage | null;
    error: boolean;
  }>({ loading: true, data: null, error: false });

  const load = useCallback(async () => {
    setState({ loading: true, data: null, error: false });
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No token.');
      const data = await listEventInterests(token);
      setState({ loading: false, data, error: false });
    } catch {
      setState({ loading: false, data: null, error: true });
    }
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <Text
        style={[styles.title, { color: colors.primary }]}
        accessibilityRole="header"
      >
        {t('events.going.profileTitle')}
      </Text>
      {state.loading ? (
        <LoadingState label={t('events.loading')} />
      ) : state.error ? (
        <Alert variant="danger" message={t('events.going.error')} />
      ) : !state.data || state.data.items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          {t('events.going.profileEmpty')}
        </Text>
      ) : (
        <View style={styles.list}>
          {state.data.items.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, marginBottom: spacing.space16 },
  empty: { ...typography.body },
  list: { gap: spacing.space16 },
});
