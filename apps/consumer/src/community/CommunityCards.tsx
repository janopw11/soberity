import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui';
import type { SettingsIconName } from '../ui/SettingsIcon';

export function CommunityCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: SettingsIconName;
  onPress?: (() => void) | undefined;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cardContent = (
    <>
      <View style={styles.row}>
        <SettingsIcon name={icon} size={26} color={colors.primary} />
        <Text style={[styles.status, { color: colors.textMuted }]}>
          {onPress ? '↗' : t('community.soon')}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{description}</Text>
    </>
  );
  const sharedStyle = ({ pressed }: { pressed: boolean }) => [
    styles.card,
    {
      backgroundColor: hovered || pressed ? colors.surfaceAlt : colors.listSurface,
      borderColor: focused ? colors.focusRing : 'transparent',
    },
  ];
  const interactions = {
    accessibilityRole: 'button' as const,
    accessibilityState: { disabled: !onPress },
    disabled: !onPress,
    onPress,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onHoverIn: () => setHovered(true),
    onHoverOut: () => setHovered(false),
  };
  return icon === 'people' || icon === 'flask' ? (
    <Pressable {...interactions} style={sharedStyle}>
      <ImageBackground
        source={icon === 'people' ? require('../../assets/images/community-circles.jpg') : require('../../assets/images/community-discussions.jpg')}
        resizeMode="cover"
        imageStyle={styles.coverImage}
        style={styles.imageCard}
        accessibilityLabel={title}
      >
        <View style={[styles.imageContent, icon === 'people' ? styles.circlesPanel : styles.discussionsPanel]}>
          <View style={styles.row}>
            <SettingsIcon name={icon} size={26} color="#FFFFFF" />
            <Text style={[styles.status, styles.imageText]}>{onPress ? '↗' : t('community.soon')}</Text>
          </View>
          <Text style={[styles.title, styles.imageText]}>{title}</Text>
          <Text style={[styles.body, styles.imageText]}>{description}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  ) : (
    <Pressable {...interactions} style={sharedStyle}>{cardContent}</Pressable>
  );
}

/** Explicit unavailable states, ready to be replaced with real domain data in later phases. */
function UnavailableCard({
  kind,
  icon,
}: {
  kind: 'circles' | 'discussions';
  icon: SettingsIconName;
}) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  return (
    <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt }]}>
      <SettingsIcon name={icon} size={28} color={colors.primary} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('community.soon')}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t(`community.${kind}.empty`)}
        </Text>
      </View>
    </View>
  );
}
export function CircleCard() {
  return <UnavailableCard kind="circles" icon="people" />;
}
export function DiscussionCard() {
  return <UnavailableCard kind="discussions" icon="flask" />;
}
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    gap: spacing.space12,
    flex: 1,
  },
  imageCard: { minHeight: 300, justifyContent: 'flex-end' },
  coverImage: { borderRadius: radii.lg },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 19, 34, 0.72)' },
  imageContent: { padding: spacing.space16, gap: spacing.space8 },
  circlesPanel: { backgroundColor: 'rgba(0, 84, 125, 0.96)' },
  discussionsPanel: { backgroundColor: 'rgba(2, 19, 34, 0.96)' },
  imageText: { color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.space8,
  },
  title: { ...typography.bodyStrong },
  body: { ...typography.small },
  status: { ...typography.caption },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.space24,
    borderRadius: radii.lg,
    gap: spacing.space16,
  },
  copy: { flex: 1, gap: spacing.space8 },
});
