import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import { Button, Dialog, SettingsGroup, SettingsRow } from '../ui';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';

export function EventSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { colors } = useThemePreferences();
  const { t } = useTranslation();
  return <View style={styles.field}>
    <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
    <Button variant="secondary" label={options.find(option => option.value === value)?.label ?? label} accessibilityHint={label} onPress={() => setOpen(true)} />
    <Dialog visible={open} title={label} closeLabel={t('events.close')} onClose={() => setOpen(false)}>
      <View accessibilityRole="radiogroup" accessibilityLabel={label}>
        <SettingsGroup>{options.map(option => <SettingsRow key={option.value} label={option.label} multilineLabel selected={option.value === value} onPress={() => { onChange(option.value); setOpen(false); }} />)}</SettingsGroup>
      </View>
    </Dialog>
  </View>;
}
const styles = StyleSheet.create({ field: { gap: spacing.space4 }, label: { ...typography.caption } });
