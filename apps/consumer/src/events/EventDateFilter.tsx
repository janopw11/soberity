import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { EventDateSelect } from './EventDateSelect';
import {
  DATE_PRESETS,
  presetCalendarRange,
  type DatePreset,
} from './calendarDates';
import type { EventFilters } from './eventFilters';

export function EventDateFilter({
  value,
  onChange,
}: {
  value: EventFilters;
  onChange: (dates: Pick<EventFilters, 'from' | 'to' | 'datePreset'>) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const preset =
    value.datePreset ?? (value.from || value.to ? 'custom' : 'any');
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {t('events.dates.label')}
      </Text>
      <View style={styles.presets}>
        {DATE_PRESETS.map((code) => (
          <DatePresetChip
            key={code}
            label={t(
              code === 'custom'
                ? 'events.customDateChip'
                : `events.datePresets.${code}`,
            )}
            selected={preset === code}
            onPress={() =>
              onChange({
                datePreset: code,
                ...(code === 'custom'
                  ? { from: value.from, to: value.to }
                  : presetCalendarRange(code)),
              })
            }
          />
        ))}
      </View>
      {preset === 'custom' ? (
        <EventDateSelect
          label={t('events.datePresets.custom')}
          from={value.from}
          to={value.to}
          onChange={(from, to) => onChange({ from, to, datePreset: 'custom' })}
        />
      ) : null}
    </View>
  );
}

function DatePresetChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={styles.target}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.chip,
            {
              backgroundColor:
                selected || pressed ? colors.surfaceAlt : colors.listSurface,
              borderColor: focused
                ? colors.focusRing
                : selected
                  ? colors.primary
                  : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.chipLabel,
              {
                color: selected ? colors.primary : colors.textSecondary,
                fontWeight: selected ? '600' : '400',
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  field: { gap: spacing.space4 },
  label: { ...typography.caption },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.space8,
  },
  target: { minHeight: 48, minWidth: 48, justifyContent: 'center' },
  chip: {
    minHeight: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.space12,
    paddingVertical: spacing.space4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: { ...typography.small },
});
