import { Platform } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type SettingsIconName =
  | 'search'
  | 'location'
  | 'refresh'
  | 'filter'
  | 'eraser'
  | 'star'
  | 'arrowUpRight'
  | 'calendar'
  | 'book'
  | 'flask'
  | 'brain'
  | 'people'
  | 'question'
  | 'basketball'
  | 'person'
  | 'lock'
  | 'sliders'
  | 'logout'
  | 'trash'
  | 'chevron'
  | 'check'
  | 'pencil'
  | 'mail'
  | 'eye'
  | 'eyeOff'
  | 'sun'
  | 'moon'
  | 'globe'
  | 'chevronDown'
  | 'close'
  | 'alert';

const ICON_PATHS: Record<SettingsIconName, string[]> = {
  search: ['M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 1 0 0-15z', 'M16 16l5 5'],
  location: [
    'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0z',
    'M12 7a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
  ],
  refresh: [
    'M20 5v6h-6',
    'M4 19v-6h6',
    'M5.5 8a7 7 0 0 1 11.6-3L20 11',
    'M4 13l2.9 6A7 7 0 0 0 18.5 16',
  ],
  filter: ['M3 4h18l-7 8v6l-4 2v-8L3 4z'],
  eraser: ['M14 3l7 7-10 10H7l-5-5L14 3z', 'M7 10l7 7', 'M11 20h10'],
  star: [
    'M12 3l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3z',
  ],
  arrowUpRight: ['M7 17L17 7', 'M7 7h10v10'],
  calendar: [
    'M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1z',
    'M8 3v4 M16 3v4 M4 10h16',
    'M8 14h2 M14 14h2 M8 17h2',
  ],
  book: [
    'M12 6v15',
    'M12 6C9 4 6 4 3 5v14c3-1 6-1 9 2 3-3 6-3 9-2V5c-3-1-6-1-9 1z',
  ],
  flask: [
    'M9 3h6 M10 3v7L5 19a1.3 1.3 0 0 0 1.2 2h11.6a1.3 1.3 0 0 0 1.2-2l-5-9V3',
    'M8 15h8',
  ],
  brain: [
    'M12 5c-2-4-7-2-6 2-4 0-5 6-2 8-1 4 4 7 8 4V5z',
    'M12 5c2-4 7-2 6 2 4 0 5 6 2 8 1 4-4 7-8 4',
    'M6 7l2 2 M4 15l4-1 M8 18v-4 M18 7l-2 2 M20 15l-4-1 M16 18v-4',
  ],
  people: [
    'M9 4a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
    'M2 20v-2a7 6 0 0 1 14 0v2',
    'M16 4a3 3 0 0 1 0 6 M18 13c3 .5 4 2.5 4 5v2',
  ],
  question: [
    'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z',
    'M9 9a3 3 0 1 1 4 2.8c-1 .4-1 1.2-1 2.2',
    'M12 17h0',
  ],
  basketball: [
    'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z',
    'M3 12h18 M12 3v18 M5.6 5.6c7 2 6 10 12.8 12.8 M18.4 5.6c-7 2-6 10-12.8 12.8',
  ],
  person: ['M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5'],
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  sliders: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9'],
  logout: [
    'M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3',
    'M10 8l-4 4 4 4',
    'M6 12h9',
  ],
  trash: ['M4 7h16', 'M9.5 7V5h5v2', 'M6.5 7l1 12.5h9l1-12.5'],
  chevron: ['M9.5 6l6 6-6 6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  pencil: ['M4 20h4L19 9l-4-4L4 16v4', 'M13.5 6.5l4 4'],
  mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
  eye: [
    'M3 12c2-3.5 5-5.5 9-5.5s7 2 9 5.5c-2 3.5-5 5.5-9 5.5S5 15.5 3 12z',
    'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z',
  ],
  eyeOff: [
    'M3 12c2-3.5 5-5.5 9-5.5s7 2 9 5.5c-2 3.5-5 5.5-9 5.5S5 15.5 3 12z',
    'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z',
    'M4 4l16 16',
  ],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8z',
    'M12 2.5V5',
    'M12 19v2.5',
    'M2.5 12H5',
    'M19 12h2.5',
    'M5.3 5.3l1.8 1.8',
    'M16.9 16.9l1.8 1.8',
    'M5.3 18.7l1.8-1.8',
    'M16.9 7.1l1.8-1.8',
  ],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'],
  globe: [
    'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z',
    'M3 12h18',
    'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  ],
  chevronDown: ['M6 9.5l6 6 6-6'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  alert: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z', 'M12 7.5v6', 'M12 17h0'],
};

/** Line icons on a 24px grid, stroked with one width so they match on every screen. */
export function SettingsIcon({
  name,
  color,
  size = 22,
}: {
  name: SettingsIconName;
  color: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...(Platform.OS === 'web'
        ? { 'aria-hidden': true }
        : { accessible: false })}
    >
      {ICON_PATHS[name].map((d) => (
        <Path
          key={d}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {name === 'person' ? (
        <Circle
          cx={12}
          cy={8}
          r={3.75}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
        />
      ) : null}
      {name === 'sliders' ? (
        <>
          <Circle
            cx={14.5}
            cy={7}
            r={2.25}
            fill="none"
            stroke={color}
            strokeWidth={1.6}
          />
          <Circle
            cx={7.5}
            cy={17}
            r={2.25}
            fill="none"
            stroke={color}
            strokeWidth={1.6}
          />
        </>
      ) : null}
    </Svg>
  );
}
