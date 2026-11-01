import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { typography } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import { Button, EmptyState, Screen } from './ui';
import { useThemePreferences } from './preferences/ThemePreferencesContext';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStatus();
  const { colors } = useThemePreferences();
  const styles = createStyles(colors);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen>
      <EmptyState
        eyebrow={t('account.badge')}
        title={t('account.title')}
        description={t('account.description')}
      >
        {user?.email ? (
          <Text style={styles.body}>
            {t('account.signedInAs', { email: user.email })}
          </Text>
        ) : null}
        <Button
          label={t('account.signOutButton')}
          variant="secondary"
          onPress={() => void handleSignOut()}
          loading={signingOut}
          disabled={signingOut}
          testID="account-sign-out"
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
