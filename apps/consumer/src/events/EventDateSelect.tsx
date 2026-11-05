import { useId, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { SettingsIcon } from '../ui';
import { FilterIconButton } from './FilterIconButton';

type DateMode = 'range' | 'month' | 'year';
const modes: DateMode[] = ['range', 'month', 'year'];
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const readDay = (value: string) => new Date(`${value}T12:00:00`);

function inferMode(from: string, to: string): DateMode {
  if (!from || !to) return 'range';
  const first = readDay(from),
    last = readDay(to);
  if (first.getFullYear() !== last.getFullYear() || first.getDate() !== 1)
    return 'range';
  if (first.getMonth() === 0 && last.getMonth() === 11 && last.getDate() === 31)
    return 'year';
  if (
    first.getMonth() === last.getMonth() &&
    last.getDate() ===
      new Date(last.getFullYear(), last.getMonth() + 1, 0).getDate()
  )
    return 'month';
  return 'range';
}

/** One date field; every mode emits inclusive local calendar days to the existing API adapter. */
export function EventDateSelect({
  from,
  to,
  onChange,
  label,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
}) {
  const { t, i18n } = useTranslation();
  const fieldLabel = label ?? t('events.dates.label');
  const { colors } = useThemePreferences();
  const panelId = useId();
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB';
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mode, setMode] = useState<DateMode>(() => inferMode(from, to));
  const [cursor, setCursor] = useState(() =>
    from ? readDay(from) : new Date(),
  );
  const [choosingEnd, setChoosingEnd] = useState(false);
  const year = cursor.getFullYear(),
    month = cursor.getMonth();
  const format = (value: string, options: Intl.DateTimeFormatOptions) =>
    readDay(value).toLocaleDateString(locale, options);
  const summaryMode = inferMode(from, to);
  const summary = !from
    ? t('events.any')
    : summaryMode === 'year'
      ? format(from, { year: 'numeric' })
      : summaryMode === 'month'
        ? format(from, { month: 'long', year: 'numeric' })
        : `${format(from, { day: 'numeric', month: 'short', year: 'numeric' })}${to && from !== to ? ` – ${format(to, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`;
  const selectDay = (value: string) => {
    if (!choosingEnd || !from) {
      onChange(value, value);
      setChoosingEnd(true);
    } else {
      onChange(value < from ? value : from, value < from ? from : value);
      setChoosingEnd(false);
      setOpen(false);
    }
  };
  const choosePeriod = (selectedYear: number, selectedMonth?: number) => {
    onChange(
      dayKey(new Date(selectedYear, selectedMonth ?? 0, 1)),
      dayKey(
        new Date(
          selectedYear,
          selectedMonth === undefined ? 12 : selectedMonth + 1,
          0,
        ),
      ),
    );
    setOpen(false);
  };
  const step = (direction: number) =>
    setCursor(
      mode === 'range'
        ? new Date(year, month + direction, 1)
        : new Date(year + direction * (mode === 'year' ? 12 : 1), month, 1),
    );
  const yearStart = Math.floor(year / 12) * 12;
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {fieldLabel}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${fieldLabel}: ${summary}`}
        accessibilityState={{ expanded: open }}
        aria-controls={panelId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPress={() => {
          if (!open) {
            setMode(inferMode(from, to));
            setCursor(from ? readDay(from) : new Date());
            setChoosingEnd(false);
          }
          setOpen(!open);
        }}
        style={({ pressed }) => [
          styles.input,
          {
            borderColor: focused ? colors.focusRing : 'transparent',
            backgroundColor: pressed ? colors.surfaceAlt : colors.listSurface,
          },
        ]}
      >
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {summary}
        </Text>
        <SettingsIcon name="calendar" color={colors.textMuted} size={18} />
      </Pressable>
      {open ? (
        <View
          nativeID={panelId}
          style={[
            styles.panel,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('events.dates.selectionMode')}
            style={styles.modes}
          >
            {modes.map((option) => (
              <CalendarChoice
                key={option}
                radio
                label={t(`events.dates.${option}`)}
                selected={mode === option}
                onPress={() => {
                  setMode(option);
                  setChoosingEnd(false);
                }}
              />
            ))}
          </View>
          <View style={styles.navigation}>
            <FilterIconButton
              quiet
              icon="chevron"
              previous
              label={t(
                `events.dates.${mode === 'range' ? 'previousMonth' : mode === 'year' ? 'previousYears' : 'previousYear'}`,
              )}
              onPress={() => step(-1)}
            />
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.heading, { color: colors.textPrimary }]}
            >
              {mode === 'range'
                ? cursor.toLocaleDateString(locale, {
                    month: 'long',
                    year: 'numeric',
                  })
                : mode === 'year'
                  ? `${yearStart}–${yearStart + 11}`
                  : year}
            </Text>
            <FilterIconButton
              quiet
              icon="chevron"
              label={t(
                `events.dates.${mode === 'range' ? 'nextMonth' : mode === 'year' ? 'nextYears' : 'nextYear'}`,
              )}
              onPress={() => step(1)}
            />
          </View>
          {mode === 'range' ? (
            <>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.caption, { color: colors.textSecondary }]}
              >
                {t(
                  choosingEnd
                    ? 'events.dates.chooseEnd'
                    : 'events.dates.chooseStart',
                )}
              </Text>
              <View style={styles.week}>
                {Array.from({ length: 7 }, (_, index) => (
                  <Text
                    key={index}
                    style={[styles.weekday, { color: colors.textMuted }]}
                  >
                    {new Date(2024, 0, index + 1).toLocaleDateString(locale, {
                      weekday: 'narrow',
                    })}
                  </Text>
                ))}
              </View>
              {Array.from(
                { length: Math.ceil((offset + days) / 7) },
                (_, week) => (
                  <View key={week} style={styles.week}>
                    {Array.from({ length: 7 }, (_, weekday) => {
                      const day = week * 7 + weekday - offset + 1;
                      if (day < 1 || day > days)
                        return <View key={weekday} style={styles.daySlot} />;
                      const value = dayKey(new Date(year, month, day));
                      return (
                        <View key={weekday} style={styles.daySlot}>
                          <CalendarChoice
                            label={String(day)}
                            accessibilityLabel={format(value, {
                              dateStyle: 'full',
                            })}
                            selected={value === from || value === to}
                            inRange={
                              !!from && !!to && value > from && value < to
                            }
                            onPress={() => selectDay(value)}
                          />
                        </View>
                      );
                    })}
                  </View>
                ),
              )}
            </>
          ) : (
            <View style={styles.periods}>
              {Array.from({ length: 12 }, (_, index) => {
                const choiceYear = mode === 'year' ? yearStart + index : year;
                const choiceMonth = mode === 'month' ? index : undefined;
                const label =
                  mode === 'year'
                    ? String(choiceYear)
                    : new Date(year, index, 1).toLocaleDateString(locale, {
                        month: 'short',
                      });
                return (
                  <View key={index} style={styles.periodSlot}>
                    <CalendarChoice
                      label={label}
                      accessibilityLabel={
                        mode === 'month'
                          ? new Date(year, index, 1).toLocaleDateString(
                              locale,
                              { month: 'long', year: 'numeric' },
                            )
                          : label
                      }
                      selected={
                        !!from &&
                        inferMode(from, to) === mode &&
                        readDay(from).getFullYear() === choiceYear &&
                        (choiceMonth === undefined ||
                          readDay(from).getMonth() === choiceMonth)
                      }
                      onPress={() => choosePeriod(choiceYear, choiceMonth)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function CalendarChoice({
  label,
  accessibilityLabel,
  selected,
  inRange = false,
  radio = false,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  selected: boolean;
  inRange?: boolean;
  radio?: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemePreferences();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole={radio ? 'radio' : 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        radio ? { checked: selected } : { selected: selected || inRange }
      }
      aria-checked={radio ? selected : undefined}
      aria-pressed={radio ? undefined : selected || inRange}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor: focused
            ? colors.focusRing
            : selected
              ? colors.primary
              : 'transparent',
          backgroundColor: selected
            ? colors.surfaceAlt
            : inRange || pressed
              ? colors.listSurface
              : colors.surface,
        },
      ]}
    >
      <Text
        style={[
          styles.choiceLabel,
          {
            color: selected ? colors.primary : colors.textPrimary,
            fontWeight: selected ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.space8 },
  label: { ...typography.caption },
  value: { ...typography.small, flex: 1 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.space12,
    paddingVertical: spacing.space8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing.space8,
    gap: spacing.space8,
  },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space4 },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space4,
  },
  heading: { ...typography.label, flex: 1, textAlign: 'center' },
  caption: { ...typography.caption },
  week: { flexDirection: 'row' },
  weekday: { ...typography.caption, flex: 1, textAlign: 'center' },
  daySlot: { flex: 1, minWidth: 0 },
  periods: { flexDirection: 'row', flexWrap: 'wrap' },
  periodSlot: { width: '33.333333%' },
  choice: {
    minHeight: 48,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.space4,
    paddingVertical: spacing.space4,
    flexGrow: 1,
  },
  choiceLabel: { ...typography.small, textAlign: 'center' },
});
