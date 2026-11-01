import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { EmptyState, Button, Screen } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

/**
 * Shown when Firebase has a session but the backend could not confirm it
 * (network error or server failure). The app does not treat the user as signed in.
 */
export default function OfflineScreen() {
  const { t } = useTranslation();
  const { retry, signOut } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const [busy, setBusy] = useState<'retry' | 'signOut' | null>(null);

  const run = async (action: 'retry' | 'signOut', fn: () => Promise<void>) => {
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <EmptyState
        eyebrow={t('offline.badge')}
        title={t('offline.title')}
        description={t('offline.description')}
      >
        <Text style={styles.body}>{t('offline.hint')}</Text>
        <Button
          label={t('offline.retryButton')}
          onPress={() => void run('retry', retry)}
          loading={busy === 'retry'}
          disabled={busy !== null}
          testID="offline-retry"
        />
        <Button
          label={t('offline.signOutButton')}
          variant="tertiary"
          onPress={() => void run('signOut', signOut)}
          loading={busy === 'signOut'}
          disabled={busy !== null}
          testID="offline-sign-out"
        />
      </EmptyState>
    </Screen>
  );
}

function createStyles(
  colors: ReturnType<typeof useThemePreferences>['colors'],
) {
  return StyleSheet.create({
    body: {
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
  });
}
