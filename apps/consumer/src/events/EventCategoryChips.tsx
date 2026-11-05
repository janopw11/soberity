import { useTranslation } from 'react-i18next';
import { CategoryChips } from '../ui/CategoryChips';

// Group the existing taxonomy without changing stored event categories.
const groups = [
  { key: 'party', categories: 'SOBER_PARTY,SOBER_RAVE,DANCE,LIVE_MUSIC' },
  { key: 'sport', categories: 'SPORT,OUTDOORS' },
  { key: 'social', categories: 'COFFEE_MEETUP' },
  { key: 'other', categories: 'WORKSHOP,CULTURE,OTHER' },
] as const;
const categorySet = (value: string) =>
  [...new Set(value.split(',').filter(Boolean))].sort().join(',');

export function EventCategoryChips({ value, onChange }: {
  value: string;
  onChange: (category: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <CategoryChips
      value={categorySet(value)}
      options={groups.map(group => ({
        value: categorySet(group.categories),
        label: t(`events.quickCategories.${group.key}`),
      }))}
      onChange={onChange}
    />
  );
}
