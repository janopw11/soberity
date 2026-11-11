import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button } from '../ui';
import { getEventInterest, setEventInterest } from './eventInterestsApi';

/**
 * "Going sober" on Event Details. A private note for the signed-in user only; it does not book,
 * issue a ticket or notify the organizer. Guests are sent to sign in first.
 */
export function EventGoingButton({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { status, getIdToken } = useAuthStatus();
  const [declared, setDeclared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const signedIn = status === 'authenticated';

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    setFailed(false);
    void (async () => {
      try {
        const token = await getIdToken();
        if (!token) throw new Error('No token.');
        const value = await getEventInterest(eventId, token);
        if (active) setDeclared(value);
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId, signedIn, getIdToken]);

  const toggle = async () => {
    if (!signedIn) {
      router.push('/sign-in');
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No token.');
      const next = !declared;
      await setEventInterest(eventId, token, next);
      setDeclared(next);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const label = !signedIn
    ? t('events.going.guestCta')
    : declared
      ? t('events.going.active')
      : t('events.going.action');

  return (
    <View style={styles.wrap} testID="event-going">
      <Button
        variant={declared ? 'secondary' : 'primary'}
        label={label}
        onPress={() => void toggle()}
        loading={loading}
        disabled={loading}
        testID="event-going-button"
        style={styles.action}
      />
      <Text style={[styles.note, { color: colors.textMuted }]}>
        {t('events.going.note')}
      </Text>
      {failed ? (
        <Alert variant="danger" message={t('events.going.error')} />
      ) : null}
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
  note: { ...typography.caption },
});
