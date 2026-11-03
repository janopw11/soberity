import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@soberity/design-tokens';

import { useAuthStatus } from './auth/AuthStatusContext';
import EditorialEntry from './editorial/EditorialEntry';
import DeleteAccountSection from './account/DeleteAccountSection';
import { useThemePreferences } from './preferences/ThemePreferencesContext';
import { Screen, SettingsGroup, SettingsRow } from './ui';

/** Account hub: grouped settings rows, with sign out and delete kept apart at the bottom. */
export default function AccountScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthStatus();
  const { colors } = useThemePreferences();
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
      <View style={styles.stack}>
        <SettingsGroup>
          <SettingsRow
            icon="person"
            label={t('account.sections.personalData')}
            showChevron
            onPress={() => router.push('/account-personal-data')}
            testID="account-row-personal-data"
          />
          <SettingsRow
            icon="lock"
            label={t('account.sections.password')}
            showChevron
            onPress={() => router.push('/account-password')}
            testID="account-row-password"
          />
          <SettingsRow
            icon="sliders"
            label={t('account.sections.preferences')}
            showChevron
            onPress={() => router.push('/account-preferences')}
            testID="account-row-preferences"
          />
        </SettingsGroup>

        <EditorialEntry />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SettingsGroup>
          <SettingsRow
            icon="logout"
            label={t('account.signOutButton')}
            onPress={() => void handleSignOut()}
            disabled={signingOut}
            testID="account-sign-out"
          />
          <DeleteAccountSection />
        </SettingsGroup>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.space24 },
  divider: { height: StyleSheet.hairlineWidth },
});
