import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
export function CircleCard({ circle }: { circle: Circle }) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const router = useRouter();
  const [coverFailed, setCoverFailed] = useState(false);
  useEffect(() => setCoverFailed(false), [circle.cover_id]);
  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={circle.name}
        accessibilityHint={t('circles.details')}
        onPress={() =>
          router.push({ pathname: '/circles/[id]', params: { id: circle.id } })
        }
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        {circle.cover_id && !coverFailed ? (
          <ImageBackground
            source={{ uri: circleImage(circle.cover_id) }}
            imageStyle={styles.cardImage}
            onError={() => setCoverFailed(true)}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityLabel={circle.cover_alt ?? circle.name}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.surfaceAlt },
            ]}
          />
        )}
      </Pressable>
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        accessibilityRole="header"
        style={[styles.title, { color: colors.primary }]}
      >
        {circle.name}
      </Text>
      <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
        {circle.member_count === 0
          ? t('circles.beFirst')
          : t('circles.activeMembers', { count: circle.member_count })}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  item: { width: '100%', alignItems: 'center', gap: spacing.space8 },
  card: {
    width: '88%',
    borderWidth: 1,
    borderRadius: radii.pill,
    overflow: 'hidden',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.space16,
    ...Platform.select({ web: { transition: 'transform 140ms ease-out' } }),
  },
  cardImage: { borderRadius: radii.pill },
  cover: { width: '100%', height: 176, resizeMode: 'cover' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', gap: spacing.space12, maxWidth: '100%' },
  title: {
    ...typography.bodyStrong,
    textAlign: 'center',
    paddingHorizontal: spacing.space8,
  },
  small: { ...typography.small },
  memberCount: { ...typography.small, textAlign: 'center' },
});
