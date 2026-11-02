import { useEffect, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuthStatus } from './auth/AuthStatusContext';
import { mapAuthError } from './auth/errors';
import { Alert, Button, EmptyState, Screen } from './ui';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { applyEmailVerificationAction, refreshVerificationStatus, signOut } =
    useAuthStatus();
  const { oobCode } = useLocalSearchParams<{ oobCode?: string | string[] }>();
  const [state, setState] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorKey, setErrorKey] = useState('generic');

  useEffect(() => {
    const code = Array.isArray(oobCode) ? oobCode[0] : oobCode;
    if (!code) {
      setState('error');
      return;
    }

    let active = true;
    void (async () => {
      try {
        await applyEmailVerificationAction(code);
        await refreshVerificationStatus();
        if (active) setState('success');
      } catch (error) {
        if (!active) return;
        setErrorKey(mapAuthError(error));
        setState('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [applyEmailVerificationAction, oobCode, refreshVerificationStatus]);

  if (state === 'loading') {
    return (
      <Screen>
        <EmptyState
          eyebrow={t('verificationAction.badge')}
          title={t('verificationAction.loadingTitle')}
          description={t('verificationAction.loadingDescription')}
        />
      </Screen>
    );
  }

  if (state === 'success') {
    return (
      <Screen>
        <EmptyState
          eyebrow={t('verificationAction.badge')}
          title={t('verificationAction.successTitle')}
          description={t('verificationAction.successDescription')}
        >
          <Alert
            variant="success"
            message={t('verificationAction.successMessage')}
          />
          <Button
            label={t('verificationAction.signInButton')}
            onPress={() => router.replace('/sign-in')}
          />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen>
      <EmptyState
        eyebrow={t('verificationAction.badge')}
        title={t('verificationAction.errorTitle')}
        description={t('verificationAction.errorDescription')}
      >
        <Alert variant="danger" message={t(`auth.errors.${errorKey}`)} />
        <Button
          label={t('verificationAction.pendingButton')}
          variant="secondary"
          onPress={() => router.replace('/verification-pending')}
        />
        <Link href="/sign-in">{t('verificationAction.signInLink')}</Link>
        <Button
          label={t('verificationAction.signOutButton')}
          variant="tertiary"
          onPress={() => void signOut()}
        />
      </EmptyState>
    </Screen>
  );
}
