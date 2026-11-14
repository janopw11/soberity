import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState } from '../ui';
import {
  getParticipation,
  setEventInterest,
  type ParticipationState,
} from './eventInterestsApi';

/** Existing Going Sober RSVP, with a public aggregate and private per-account state. */
export function EventGoingButton({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { status, user, getIdToken } = useAuthStatus();
  const signedIn = status === 'authenticated';
  const key = `${eventId}:${signedIn ? user?.uid : 'guest'}`;
  const generation = useRef(0);
  const busy = useRef(false);
  const [attempt, retry] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data: ParticipationState | null;
    failed: boolean;
    saving: boolean;
    message?: string;
  } | null>(null);
  const current = state?.key === key ? state : null;

  useFocusEffect(
    useCallback(() => {
      const request = ++generation.current;
      busy.current = false;
      setState({ key, data: null, failed: false, saving: false });
      void (async () => {
        try {
          const token = signedIn ? await getIdToken() : undefined;
          if (signedIn && !token) throw new Error('No token.');
          const data = await getParticipation(eventId, token ?? undefined);
          if (generation.current === request)
            setState({ key, data, failed: false, saving: false });
        } catch {
          if (generation.current === request)
            setState({ key, data: null, failed: true, saving: false });
        }
      })();
      return () => {
        generation.current++;
      };
    }, [eventId, key, signedIn, getIdToken, attempt]),
  );

  const toggle = async () => {
    if (!signedIn) {
      router.push('/sign-in');
      return;
    }
    if (!current?.data || current.failed || busy.current) return;
    busy.current = true;
    const request = generation.current;
    const next = !current.data.declared;
    setState({ key, data: current.data, failed: false, saving: true });
    try {
      const token = await getIdToken();
      if (request !== generation.current) return;
      if (!token) throw new Error('No token.');
      await setEventInterest(eventId, token, next);
      // Reconcile from the server, never increment a local count or assume a write succeeded.
      const data = await getParticipation(eventId, token);
      if (request === generation.current)
        setState({
          key,
          data,
          failed: false,
          saving: false,
          message: data.declared ? 'joined' : 'cancelled',
        });
    } catch {
      if (request === generation.current)
        setState({ key, data: null, failed: true, saving: false });
    } finally {
      if (request === generation.current) busy.current = false;
    }
  };

  return (
    <View style={styles.wrap} testID="event-going">
      {!current || (!current.data && !current.failed) ? (
        <LoadingState label={t('events.going.loading')} />
      ) : current.failed ? (
        <>
          <Alert variant="danger" message={t('events.going.error')} />
          <Button
            label={t('events.going.retry')}
            variant="secondary"
            onPress={() => retry((value) => value + 1)}
          />
        </>
      ) : current.data ? (
        <>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.count, { color: colors.textPrimary }]}
            testID="event-participant-count"
          >
            {t('events.going.participants', {
              count: current.data.participant_count,
            })}
          </Text>
          {current.data.declared ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.count, { color: colors.textPrimary }]}
            >
              {t('events.going.joined')}
            </Text>
          ) : null}
          {current.data.can_join || current.data.declared ? (
            <Button
              variant={current.data.declared ? 'secondary' : 'success'}
              label={
                !signedIn
                  ? t('events.going.guestCta')
                  : current.data.declared
                    ? t('events.going.cancel')
                    : t('events.going.join')
              }
              onPress={() => void toggle()}
              loading={current.saving}
              disabled={current.saving}
              testID="event-going-button"
              style={styles.action}
            />
          ) : (
            <Text style={[styles.note, { color: colors.textMuted }]}>
              {t('events.going.closed')}
            </Text>
          )}
          {current.message === 'cancelled' ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.note, { color: colors.textPrimary }]}
            >
              {t('events.going.cancelled')}
            </Text>
          ) : null}
        </>
      ) : null}
      <Text style={[styles.note, { color: colors.textMuted }]}>
        {t('events.going.note')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    gap: spacing.space8,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  action: { minHeight: 52, width: '100%', maxWidth: 360, flexShrink: 1 },
  count: { ...typography.bodyStrong, textAlign: 'center' },
  note: { ...typography.caption },
});
