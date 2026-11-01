import type { PropsWithChildren, ReactElement } from 'react';
import { render as renderNative } from '@testing-library/react-native';

import './i18n';
import { ThemePreferencesProvider } from './preferences/ThemePreferencesContext';

function TestProviders({ children }: PropsWithChildren) {
  return <ThemePreferencesProvider>{children}</ThemePreferencesProvider>;
}

export function render(ui: ReactElement) {
  return renderNative(ui, { wrapper: TestProviders });
}
