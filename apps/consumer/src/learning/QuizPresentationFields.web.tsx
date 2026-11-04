import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { typography, spacing } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { Alert, Button, TextField } from '../ui';
import EditorialSelect from '../editorial/EditorialSelect';
import { privateImage, uploadBlogImage } from '../editorial/blogApi';
import { QUIZ_CATEGORIES, type QuizCategory } from './quizCategories';

export type QuizPresentation = {
  categoryCode: QuizCategory;
  coverId: string | null;
};
export default function QuizPresentationFields({
  value,
  onChange,
  disabled,
  onUploadingChange,
}: {
  value: QuizPresentation;
  onChange: (value: QuizPresentation) => void;
  disabled: boolean;
  onUploadingChange: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { getIdToken } = useAuthStatus();
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    let url: string | null = null;
    setPreview(null);
    if (value.coverId)
      void (async () => {
        const token = await getIdToken();
        if (!token) throw new Error('Session unavailable');
        url = await privateImage(token, value.coverId!);
        if (active) setPreview(url);
        else URL.revokeObjectURL(url);
      })().catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [value.coverId, getIdToken]);
  async function upload() {
    if (!file || !alt.trim() || disabled) return;
    onUploadingChange(true);
    setError(false);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Session unavailable');
      const uploaded = await uploadBlogImage(token, file, alt.trim(), 'COVER');
      onChange({ ...value, coverId: uploaded.id });
      setFile(null);
    } catch {
      setError(true);
    } finally {
      onUploadingChange(false);
    }
  }
  return (
    <View style={{ gap: spacing.space12 }}>
      <EditorialSelect
        label={t('learning.quizCategory')}
        value={value.categoryCode}
        options={QUIZ_CATEGORIES.map((category) => ({
          value: category,
          label: t(`learning.categories.${category}`),
        }))}
        disabled={disabled}
        onChange={(categoryCode) =>
          onChange({ ...value, categoryCode: categoryCode as QuizCategory })
        }
      />
      <label style={{ color: colors.primary, fontFamily: 'system-ui, sans-serif', fontSize: typography.label.fontSize }}>
        {t('learning.backgroundImage')}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(false);
          }}
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </label>
      <TextField
        label={t('learning.backgroundDescription')}
        accentLabel
        value={alt}
        onChangeText={setAlt}
        maxLength={500}
        editable={!disabled}
      />
      <Button
        label={t('learning.uploadBackground')}
        disabled={disabled || !file || !alt.trim()}
        variant="secondary"
        onPress={() => {
          void upload();
        }}
      />
      {preview ? (
        <img
          src={preview}
          alt={alt || t('learning.backgroundImage')}
          style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
        />
      ) : null}
      {value.coverId ? (
        <Button
          label={t('learning.removeBackground')}
          variant="tertiary"
          disabled={disabled}
          onPress={() => {
            setPreview(null);
            onChange({ ...value, coverId: null });
          }}
        />
      ) : null}
      {error ? (
        <Alert variant="danger" message={t('learning.backgroundUploadError')} />
      ) : null}
    </View>
  );
}
