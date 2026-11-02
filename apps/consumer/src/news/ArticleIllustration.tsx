import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import type { PreviewArticleId } from './previewArticles';

/** Decorative, code-native editorial illustrations; no remote image requests. */
export function ArticleIllustration({
  topic,
  size,
}: {
  topic: PreviewArticleId;
  size: number;
}) {
  const { colors } = useThemePreferences();
  return (
    <Svg width={size} height={size} viewBox="0 0 112 112">
      <Rect width="112" height="112" rx="12" fill={colors.surfaceAlt} />
      {topic === 'sleep' ? (
        <>
          <Circle cx="56" cy="47" r="25" fill={colors.primary} />
          <Circle cx="67" cy="37" r="23" fill={colors.surfaceAlt} />
          <Circle cx="30" cy="28" r="2" fill={colors.primary} />
          <Circle cx="83" cy="61" r="2" fill={colors.primary} />
          <Path
            d="M18 85 Q30 73 42 85 T66 85 T90 85"
            fill="none"
            stroke={colors.primary}
            strokeWidth="2"
          />
        </>
      ) : topic === 'evidence' ? (
        <>
          <Rect
            x="28"
            y="21"
            width="55"
            height="70"
            rx="5"
            fill={colors.surface}
            stroke={colors.primary}
            strokeWidth="2"
          />
          <Path
            d="M39 38 H69 M39 48 H61 M39 58 H68"
            stroke={colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="69" cy="75" r="14" fill={colors.primary} />
          <Path
            d="M62 75 L67 80 L76 69"
            fill="none"
            stroke={colors.onPrimary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : topic === 'habits' ? (
        <>
          <Circle
            cx="56"
            cy="56"
            r="32"
            fill="none"
            stroke={colors.border}
            strokeWidth="8"
          />
          <Path
            d="M56 24 A32 32 0 0 1 88 56"
            fill="none"
            stroke={colors.primary}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <Circle cx="56" cy="56" r="10" fill={colors.primary} />
          <Path
            d="M56 56 L72 40"
            stroke={colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Rect
            x="22"
            y="28"
            width="68"
            height="57"
            rx="5"
            fill={colors.surface}
            stroke={colors.primary}
            strokeWidth="2"
          />
          <Rect
            x="32"
            y="39"
            width="25"
            height="8"
            rx="2"
            fill={colors.primary}
          />
          <Path
            d="M33 58 H77 M33 67 H68 M33 76 H58"
            stroke={colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Line
            x1="66"
            y1="42"
            x2="78"
            y2="42"
            stroke={colors.primary}
            strokeWidth="2"
          />
        </>
      )}
    </Svg>
  );
}
