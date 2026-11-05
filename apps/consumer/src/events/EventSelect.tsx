import { useId, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { SettingsIcon } from '../ui';
import { EventDropdownOption } from './EventDropdownOption';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { useDialogDropdown } from '../ui/DialogDropdown';

export function EventSelect({
  label,
  value,
  options,
  onChange,
  multiple = false,
  subtle = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  multiple?: boolean;
  subtle?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [scroll, setScroll] = useState({ offset: 0, viewport: 0, content: 0 });
  const dropdown = useDialogDropdown(open, () => setOpen(false));
  const listId = useId();
  const { colors } = useThemePreferences();
  const overflow = scroll.viewport > 0 && scroll.content > scroll.viewport + 1;
  const trackHeight = Math.max(0, scroll.viewport - spacing.space8);
  const thumbHeight =
    scroll.content > 0
      ? Math.min(
          trackHeight,
          Math.max(
            spacing.space24,
            (trackHeight * scroll.viewport) / scroll.content,
          ),
        )
      : 0;
  const scrollProgress = overflow
    ? Math.max(
        0,
        Math.min(1, scroll.offset / (scroll.content - scroll.viewport)),
      )
    : 0;
  const selected = value.split(',').filter(Boolean);
  const summary =
    multiple && selected.length
      ? options
          .filter((option) => selected.includes(option.value))
          .map((option) => option.label)
          .join(', ')
      : (options.find((option) => option.value === value)?.label ?? label);
  return (
    <View
      ref={dropdown.anchor}
      style={[styles.field, { zIndex: open ? 40 : 0 }]}
      {...(Platform.OS === 'web'
        ? {
            onKeyDown: (event: {
              key?: string;
              nativeEvent?: { key?: string };
              stopPropagation: () => void;
            }) => {
              if (open && (event.key ?? event.nativeEvent?.key) === 'Escape') {
                event.stopPropagation();
                setOpen(false);
              }
            },
          }
        : {})}
    >
      <Text
        style={[
          styles.label,
          { color: subtle ? colors.textSecondary : colors.primary },
        ]}
      >
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${summary}`}
        accessibilityState={{ expanded: open }}
        aria-controls={listId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPress={() => {
          if (!open) setScroll({ offset: 0, viewport: 0, content: 0 });
          setOpen((previous) => !previous);
        }}
        style={({ pressed }) => [
          styles.control,
          {
            borderColor: focused
              ? colors.focusRing
              : subtle
                ? 'transparent'
                : colors.border,
            backgroundColor: pressed
              ? colors.surfaceAlt
              : subtle
                ? colors.listSurface
                : colors.surface,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.summary, { color: colors.textPrimary }]}
        >
          {summary}
        </Text>
        <View style={open ? styles.expandedChevron : undefined}>
          <SettingsIcon name="chevronDown" color={colors.textMuted} size={16} />
        </View>
      </Pressable>
      {open ? (
        <View
          ref={dropdown.menuRef}
          nativeID={listId}
          style={[
            styles.list,
            dropdown.menuStyle,
            {
              height: Math.min(options.length * 48, dropdown.menuHeight),
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            style={styles.scrollViewport}
            contentContainerStyle={overflow ? styles.scrollContent : undefined}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onLayout={(event) => {
              const viewport = event.nativeEvent.layout.height;
              setScroll((previous) => ({ ...previous, viewport }));
            }}
            onContentSizeChange={(_width, content) =>
              setScroll((previous) => ({ ...previous, content }))
            }
            onScroll={(event) => {
              const offset = event.nativeEvent.contentOffset.y;
              setScroll((previous) => ({ ...previous, offset }));
            }}
            scrollEventThrottle={16}
          >
            <View
              accessibilityRole={multiple ? 'none' : 'radiogroup'}
              accessibilityLabel={label}
            >
              {options.map((option) => (
                <EventDropdownOption
                  key={option.value}
                  label={option.label}
                  kind={multiple ? 'checkbox' : 'radio'}
                  checked={
                    multiple
                      ? option.value
                        ? selected.includes(option.value)
                        : !selected.length
                      : option.value === value
                  }
                  onPress={() => {
                    if (multiple) {
                      onChange(
                        !option.value
                          ? ''
                          : selected.includes(option.value)
                            ? selected
                                .filter((code) => code !== option.value)
                                .join(',')
                            : [...selected, option.value].join(','),
                      );
                    } else {
                      onChange(option.value);
                      setOpen(false);
                    }
                  }}
                />
              ))}
            </View>
          </ScrollView>
          {overflow ? (
            <View
              pointerEvents="none"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.scrollTrack,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <View
                style={[
                  styles.scrollThumb,
                  {
                    backgroundColor: colors.primary,
                    height: thumbHeight,
                    top: scrollProgress * (trackHeight - thumbHeight),
                  },
                ]}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.space4, position: 'relative' },
  label: { ...typography.caption },
  control: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.space12,
    paddingVertical: spacing.space8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space8,
  },
  summary: { ...typography.small, flex: 1 },
  expandedChevron: { transform: [{ rotate: '180deg' }] },
  scrollViewport: { flex: 1 },
  scrollContent: { paddingRight: spacing.space12 },
  scrollTrack: {
    position: 'absolute',
    top: spacing.space4,
    bottom: spacing.space4,
    right: spacing.space4,
    width: spacing.space4,
    borderRadius: radii.pill,
  },
  scrollThumb: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radii.pill,
  },
  list: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    elevation: 2,
  },
});
