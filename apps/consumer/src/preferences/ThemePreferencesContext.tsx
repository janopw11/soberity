import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useTranslation } from 'react-i18next';

import { themes, type ColorScheme, type Colors } from '@soberity/design-tokens';

import {
  resolveDeviceLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../i18n';

const THEME_STORAGE_KEY = '@soberity/preferences/theme';
const LANGUAGE_STORAGE_KEY = '@soberity/preferences/language';

type PreferenceError = 'load' | 'save' | null;

type ThemePreferences = {
  theme: ColorScheme;
  colors: Colors;
  language: SupportedLanguage;
  ready: boolean;
  error: PreferenceError;
  setTheme: (theme: ColorScheme) => Promise<void>;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
};

const ThemePreferencesContext = createContext<ThemePreferences | null>(null);

function isColorScheme(value: string | null): value is ColorScheme {
  return value === 'dark' || value === 'light';
}

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value ?? '');
}

export function ThemePreferencesProvider({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();
  const [theme, setThemeState] = useState<ColorScheme>('dark');
  const [language, setLanguageState] = useState<SupportedLanguage>(
    resolveDeviceLanguage,
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<PreferenceError>(null);

  useEffect(() => {
    let active = true;

    async function loadPreferences() {
      try {
        const [storedTheme, storedLanguage] = await AsyncStorage.multiGet([
          THEME_STORAGE_KEY,
          LANGUAGE_STORAGE_KEY,
        ]);
        if (!storedTheme || !storedLanguage) {
          throw new Error('Stored preferences could not be read.');
        }
        const themeValue = storedTheme[1];
        const languageValue = storedLanguage[1];

        if (themeValue !== null && !isColorScheme(themeValue)) {
          throw new Error('Stored theme preference is invalid.');
        }
        if (languageValue !== null && !isSupportedLanguage(languageValue)) {
          throw new Error('Stored language preference is invalid.');
        }

        if (themeValue !== null) {
          setThemeState(themeValue);
        }
        if (languageValue !== null) {
          await i18n.changeLanguage(languageValue);
          if (active) setLanguageState(languageValue);
        }
      } catch {
        if (active) setError('load');
      } finally {
        if (active) setReady(true);
      }
    }

    void loadPreferences();
    return () => {
      active = false;
    };
  }, [i18n]);

  const setTheme = useCallback(async (nextTheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
      setError(null);
    } catch {
      setError('save');
    }
  }, []);

  const setLanguage = useCallback(
    async (nextLanguage: SupportedLanguage) => {
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        await i18n.changeLanguage(nextLanguage);
        setLanguageState(nextLanguage);
        setError(null);
      } catch {
        setError('save');
      }
    },
    [i18n],
  );

  const value = useMemo(
    () => ({
      theme,
      colors: themes[theme],
      language,
      ready,
      error,
      setTheme,
      setLanguage,
    }),
    [theme, language, ready, error, setTheme, setLanguage],
  );

  return (
    <ThemePreferencesContext.Provider value={value}>
      {children}
    </ThemePreferencesContext.Provider>
  );
}

export function useThemePreferences(): ThemePreferences {
  const context = useContext(ThemePreferencesContext);
  if (!context) {
    throw new Error(
      'useThemePreferences must be used within a ThemePreferencesProvider',
    );
  }
  return context;
}
