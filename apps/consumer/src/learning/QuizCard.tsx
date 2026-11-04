import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui/SettingsIcon';
import { mediaUri } from '../science/scienceApi';
import type { QuizSummary } from './learningApi';

/** One accessible action for the entire quiz card; background is presentation only. */
export function QuizCard({
  quiz,
  onStart,
}: {
  quiz: QuizSummary;
  onStart: () => void;
}) {
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const result = quiz.completion;
  const accent = !result
    ? colors.primary
    : result.percentage < 40
      ? colors.danger
      : result.percentage < 80
        ? colors.quizMedium
        : colors.success;
  const surface = !result
    ? colors.listSurface
    : result.percentage < 40
      ? colors.quizLowSurface
      : result.percentage < 80
        ? colors.quizMediumSurface
        : colors.quizHighSurface;
  const image = quiz.cover_id && !imageFailed;
  const titleColor = colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={quiz.title}
      accessibilityHint={t(
        result ? 'learning.retakeQuizShort' : 'learning.startQuizShort',
      )}
      onPress={onStart}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: surface,
          borderColor: focused
            ? colors.focusRing
            : hovered || result
              ? accent
              : colors.border,
          transform: [{ scale: pressed ? 0.99 : 1 }],
          ...(focused && Platform.OS === 'web'
            ? {
                outlineColor: colors.focusRing,
                outlineWidth: 2,
                outlineStyle: 'solid' as const,
                outlineOffset: 2,
              }
            : {}),
        },
      ]}
    >
      {image ? (
        <>
          <Image
            source={{ uri: mediaUri(quiz.cover_id!) }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
            accessible={false}
            onError={() => setImageFailed(true)}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.eventImageScrim },
            ]}
          />
        </>
      ) : null}
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <View style={[styles.iconTile, { backgroundColor: colors.surfaceAlt }]} accessible={false}>
            <SettingsIcon name="question" size={28} color={colors.primary} />
          </View>
          <View style={styles.headingCopy}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: titleColor }, image && { backgroundColor: colors.surface, padding: spacing.space8, borderRadius: radii.sm }]}
        >
          {quiz.title}
        </Text>
        <Text
          style={[
            styles.count,
            { color: image ? colors.eventImageText : colors.textMuted },
          ]}
        >
          {t('learning.questionCount', { count: quiz.question_count })}
        </Text>
          </View>
        </View>
        <View style={[styles.footer, { borderTopColor: image ? colors.eventImageText : colors.border }, image && { backgroundColor: colors.surface, borderRadius: radii.sm, paddingHorizontal: spacing.space8 }]}>
          <View style={styles.action} accessible={false}>
            <Text style={[styles.actionLabel, { color: colors.primary }]}>
              {t(result ? 'learning.retakeQuizShort' : 'learning.startQuizShort')}
            </Text>
            <SettingsIcon name="chevron" size={18} color={colors.primary} />
          </View>
        {result ? (
          <Text style={[styles.score, { color: accent }, image && {
            backgroundColor: surface,
            paddingHorizontal: spacing.space8,
            paddingVertical: spacing.space4 / 2,
            borderRadius: radii.sm,
          }]}>
            {t('learning.resultPercentage', { percentage: result.percentage })}
          </Text>
        ) : null}
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    width: 800,
    maxWidth: '100%',
    minWidth: 0,
    alignSelf: 'center',
    minHeight: 144,
    borderWidth: 2,
    borderRadius: radii.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  content: { padding: spacing.space16, gap: spacing.space16 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.space16 },
  iconTile: { width: 56, height: 56, flexShrink: 0, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, minWidth: 0, gap: spacing.space8 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.space12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.space12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.space4, flexShrink: 1 },
  actionLabel: { ...typography.label, flexShrink: 1 },
  title: { ...typography.bodyStrong },
  count: { ...typography.caption },
  score: { ...typography.caption, fontWeight: '600', alignSelf: 'flex-end', textAlign: 'right' },
});
