import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { Alert, Button, SettingsIcon } from '../ui';
import { circleImage, circleRequest, type Circle } from './circlesApi';

export function CircleCover({ circle }: { circle: Circle }) {
  const { colors } = useThemePreferences();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [circle.cover_id]);
  return circle.cover_id && !failed ? (
    <Image
      source={{ uri: circleImage(circle.cover_id) }}
      accessibilityLabel={circle.cover_alt ?? circle.name}
      style={styles.cover}
      onError={() => setFailed(true)}
    />
  ) : (
    <View
      style={[
        styles.cover,
        styles.fallback,
        { backgroundColor: colors.surfaceAlt },
      ]}
    >
      <SettingsIcon
        name={
          circle.category === 'FITNESS'
            ? 'basketball'
            : circle.category === 'OUTDOORS'
              ? 'globe'
              : circle.category === 'NIGHTLIFE'
                ? 'calendar'
                : 'people'
        }
        color={colors.primary}
        size={40}
      />
    </View>
  );
}
export function CircleMembership({
  circle,
  onChanged,
}: {
  circle: Circle;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { status, user, getIdToken } = useAuthStatus();
  const [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const lock = useRef(false);
  const revision = useRef(0);
  useEffect(() => {
    revision.current++;
    lock.current = false;
    setBusy(false);
    setFailed(false);
    return () => {
      revision.current++;
    };
  }, [user?.uid, circle.id]);
  const change = async () => {
    if (status !== 'authenticated') {
      router.push('/sign-in');
      return;
    }
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setFailed(false);
    const request = revision.current;
    try {
      const token = await getIdToken();
      if (request !== revision.current) return;
      if (!token) throw new Error('No session');
      await circleRequest(
        `/me/circles/${circle.id}`,
        token,
        circle.joined ? 'DELETE' : 'PUT',
      );
      if (request === revision.current) onChanged();
    } catch {
      if (request === revision.current) setFailed(true);
    } finally {
      if (request === revision.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  };
  return (
    <View style={styles.copy}>
      {failed ? (
        <>
          <Alert variant="danger" message={t('circles.writeError')} />
          <Button
            variant="secondary"
            label={t('circles.retry')}
            onPress={onChanged}
          />
        </>
      ) : (
        <Button
          label={
            status !== 'authenticated'
              ? t('circles.signIn')
              : circle.joined
                ? t('circles.leave')
                : t('circles.join')
          }
          variant={circle.joined ? 'secondary' : 'primary'}
          disabled={busy || (!circle.active && !circle.joined)}
          loading={busy}
          onPress={() => void change()}
        />
      )}
    </View>
  );
}
export function CircleCard({
  circle,
  onChanged,
}: {
  circle: Circle;
  onChanged: () => void;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <CircleCover circle={circle} />
      <View style={styles.copy}>
        <Text style={[styles.small, { color: colors.primary }]}>
          {t(`circles.categories.${circle.category}`)}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.textPrimary }]}
        >
          {circle.name}
        </Text>
        <Text
          numberOfLines={3}
          style={[styles.body, { color: colors.textSecondary }]}
        >
          {circle.description}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.small, { color: colors.textMuted }]}
        >
          {t('circles.members', { count: circle.member_count })}
          {circle.joined ? ` · ${t('circles.joined')}` : ''}
        </Text>
        {!circle.active ? (
          <Text style={{ color: colors.textMuted }}>
            {t('circles.inactive')}
          </Text>
        ) : (
          <Button
            label={t('circles.details')}
            variant="tertiary"
            onPress={() =>
              router.push({
                pathname: '/circles/[id]',
                params: { id: circle.id },
              })
            }
          />
        )}
        <CircleMembership circle={circle} onChanged={onChanged} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.xl, overflow: 'hidden', flex: 1 },
  cover: { width: '100%', height: 176 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  copy: { padding: spacing.space16, gap: spacing.space8 },
  title: { ...typography.h3 },
  small: { ...typography.small },
  body: { ...typography.body },
});
