import { SettingsGroup, SettingsRow } from '../ui';
export type SelectProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
};
export default function EditorialSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: SelectProps) {
  return (
    <SettingsGroup>
      {options.map((o) => (
        <SettingsRow
          key={o.value}
          label={`${label}: ${o.label}`}
          selected={value === o.value}
          disabled={disabled ?? false}
          onPress={() => onChange(o.value)}
        />
      ))}
    </SettingsGroup>
  );
}
