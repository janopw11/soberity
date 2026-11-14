import { useEffect, useRef, useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState, Screen, TextField } from '../ui';
import EditorialSelect from '../editorial/EditorialSelect';
import {
  eventEditorRequest,
  eventEditorImage,
  type EditorEvent,
  type EventLibrary,
} from '../events/eventEditorApi';
import {
  circleCategories,
  circleRequest,
  type Circle,
  type CirclePage,
} from './circlesApi';
import { circleAdminErrorKey, circleFormErrors } from './circleAdminValidation';

const blank = () => ({
  name: '',
  slug: '',
  description: '',
  category: 'COFFEE',
  guidelines: '',
  active: false,
  coverId: null as string | null,
  eventIds: [] as string[],
});
export default function CircleAdminScreen() {
  const { user } = useAuthStatus();
  return <Workspace key={user?.uid ?? 'guest'} />;
}
function Workspace() {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { getIdToken } = useAuthStatus();
  const [library, setLibrary] = useState<CirclePage | null>(null),
    [events, setEvents] = useState<EventLibrary | null>(null);
  const [page, setPage] = useState(0),
    [eventPage, setEventPage] = useState(0),
    [attempt, retry] = useState(0);
  const [current, setCurrent] = useState<Circle | null>(null),
    [form, setForm] = useState(blank),
    [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false),
    [alt, setAlt] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fieldErrors = circleFormErrors(form);
  useEffect(() => {
    let active = true;
    let url = '';
    setCoverPreview('');
    if (form.coverId)
      void (async () => {
        try {
          const key = await getIdToken();
          if (!key) return;
          url = await eventEditorImage(key, form.coverId!);
          if (active) setCoverPreview(url);
          else URL.revokeObjectURL(url);
        } catch {
          if (active) setError(t('circles.error'));
        }
      })();
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [form.coverId, getIdToken, t]);
  const token = async () => {
    const value = await getIdToken();
    if (!value || !alive.current) throw new Error('No session');
    return value;
  };
  useEffect(() => {
    let active = true;
    setLibrary(null);
    setError('');
    void (async () => {
      try {
        const data = await circleRequest<CirclePage>(
          `/admin/circles?page=${page}`,
          await token(),
        );
        if (active) setLibrary(data);
      } catch (e) {
        if (active) setError(t(circleAdminErrorKey(e)));
      }
    })();
    return () => {
      active = false;
    };
    // getIdToken is stable; the workspace remounts for account changes.
  }, [page, attempt, getIdToken, t]);
  useEffect(() => {
    if (!library || !editing) return;
    let active = true;
    setEvents(null);
    void (async () => {
      try {
        const data = await eventEditorRequest<EventLibrary>(
          await token(),
          `?page=${eventPage}&size=20`,
        );
        if (active) setEvents(data);
      } catch {
        if (active) setError(t('circles.error'));
      }
    })();
    return () => {
      active = false;
    };
  }, [eventPage, Boolean(library), editing, getIdToken, t]);
  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess(false);
    try {
      await task();
    } catch (e) {
      setError(t(circleAdminErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };
  const edit = (circle: Circle) =>
    void run(async () => {
      const data = await circleRequest<Circle>(
        `/admin/circles/${circle.id}`,
        await token(),
      );
      setCurrent(data);
      setSubmitted(false);
      setForm({
        name: data.name,
        slug: data.slug,
        description: data.description,
        category: data.category,
        guidelines: data.guidelines,
        active: data.active,
        coverId: data.cover_id,
        eventIds: data.event_ids ?? [],
      });
      setAlt(data.cover_alt ?? '');
      setEditing(true);
      setEventPage(0);
    });
  const save = () =>
    void run(async () => {
      setSubmitted(true);
      if (Object.values(fieldErrors).some(Boolean)) {
        setError(t('circles.invalidFields'));
        return;
      }
      const data = await circleRequest<Circle>(
        `/admin/circles${current ? `/${current.id}` : ''}`,
        await token(),
        current ? 'PUT' : 'POST',
        { ...form, expectedVersion: current?.version ?? null },
      );
      setCurrent(data);
      setSuccess(true);
      setEditing(false);
      retry((x) => x + 1);
    });
  return (
    <Screen maxWidth={1000}>
      <Link href="/editorial-events" style={{ color: colors.primary }}>
        {t('circles.backAdmin')}
      </Link>
      <Text
        accessibilityRole="header"
        style={{ ...typography.h1, color: colors.textPrimary }}
      >
        {t('circles.admin')}
      </Text>
      {error ? (
        <>
          <Alert variant="danger" message={error} />
          <Button
            label={t('circles.retry')}
            onPress={() => retry((x) => x + 1)}
          />
        </>
      ) : null}
      {success ? (
        <Alert variant="success" message={t('circles.saved')} />
      ) : null}
      {!library ? (
        !error ? (
          <LoadingState label={t('circles.loading')} />
        ) : null
      ) : !editing ? (
        <>
          <Button
            label={t('circles.create')}
            onPress={() => {
              setCurrent(null);
              setForm(blank());
              setSubmitted(false);
              setAlt('');
              setEditing(true);
              setSuccess(false);
              setEventPage(0);
            }}
          />
          {!library.items.length ? (
            <Text style={{ color: colors.textSecondary }}>
              {t('circles.empty')}
            </Text>
          ) : (
            library.items.map((circle) => (
              <Button
                key={circle.id}
                variant="secondary"
                label={`${circle.name} · ${t(circle.active ? 'circles.active' : 'circles.inactive')}`}
                disabled={busy}
                onPress={() => edit(circle)}
              />
            ))
          )}
          <View style={styles.row}>
            <Button
              label={t('circles.previous')}
              disabled={!page || busy}
              onPress={() => setPage((x) => x - 1)}
            />
            <Button
              label={t('circles.next')}
              disabled={(page + 1) * library.size >= library.total || busy}
              onPress={() => setPage((x) => x + 1)}
            />
          </View>
        </>
      ) : (
        <>
          <TextField
            label={t('circles.name')}
            errorText={
              submitted && fieldErrors.name
                ? t('circles.requiredField')
                : undefined
            }
            value={form.name}
            editable={!busy}
            maxLength={120}
            onChangeText={(name) => setForm({ ...form, name })}
          />
          <TextField
            label={t('circles.slug')}
            helperText={t('circles.slugHelp')}
            errorText={
              submitted && fieldErrors.slug
                ? t('circles.invalidSlug')
                : undefined
            }
            value={form.slug}
            editable={!busy}
            maxLength={100}
            autoCapitalize="none"
            onChangeText={(slug) => setForm({ ...form, slug })}
          />
          <TextField
            label={t('circles.description')}
            errorText={
              submitted && fieldErrors.description
                ? t('circles.requiredField')
                : undefined
            }
            value={form.description}
            editable={!busy}
            multiline
            maxLength={4000}
            onChangeText={(description) => setForm({ ...form, description })}
          />
          <EditorialSelect
            label={t('circles.category')}
            value={form.category}
            disabled={busy}
            options={circleCategories.map((value) => ({
              value,
              label: t(`circles.categories.${value}`),
            }))}
            onChange={(category) => setForm({ ...form, category })}
          />
          <TextField
            label={t('circles.guidelines')}
            errorText={
              submitted && fieldErrors.guidelines
                ? t('circles.requiredField')
                : undefined
            }
            value={form.guidelines}
            editable={!busy}
            multiline
            maxLength={6000}
            onChangeText={(guidelines) => setForm({ ...form, guidelines })}
          />
          <View style={styles.row}>
            <Switch
              accessibilityLabel={t('circles.active')}
              value={form.active}
              disabled={busy}
              onValueChange={(active) => setForm({ ...form, active })}
            />
            <Text style={{ color: colors.textPrimary }}>
              {t('circles.active')}
            </Text>
          </View>
          <TextField
            label={t('circles.coverAlt')}
            value={alt}
            editable={!busy}
            maxLength={500}
            onChangeText={setAlt}
          />
          <label style={{ color: colors.primary }}>
            {t('circles.upload')}
            <input
              type="file"
              accept="image/jpeg,image/png"
              disabled={busy || !alt.trim()}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                void run(async () => {
                  if (file.size > 5 * 1024 * 1024)
                    throw new Error('Image too large');
                  const body = new FormData();
                  body.append('file', file);
                  body.append('altText', alt);
                  const uploaded = await eventEditorRequest<{ id: string }>(
                    await token(),
                    '/media',
                    'POST',
                    body,
                  );
                  setForm((value) => ({ ...value, coverId: uploaded.id }));
                });
              }}
            />
          </label>
          <Text style={{ color: colors.textSecondary }}>
            {t(form.coverId ? 'circles.coverSelected' : 'circles.noCover')}
          </Text>
          {coverPreview ? (
            <img
              src={coverPreview}
              alt={alt || form.name}
              style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }}
            />
          ) : null}
          {form.coverId ? (
            <Button
              variant="secondary"
              label={t('circles.removeCover')}
              disabled={busy}
              onPress={() => setForm({ ...form, coverId: null })}
            />
          ) : null}
          <Text
            accessibilityRole="header"
            style={{ ...typography.h2, color: colors.textPrimary }}
          >
            {t('circles.associate')}
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {t('circles.selectedEvents', { count: form.eventIds.length })}
          </Text>
          {form.eventIds.length ? (
            <Button
              label={t('circles.clearEvents')}
              variant="secondary"
              disabled={busy}
              onPress={() => setForm({ ...form, eventIds: [] })}
            />
          ) : null}
          {!events ? (
            <LoadingState label={t('circles.loading')} />
          ) : (
            <>
              {events.items.map((event) => (
                <View key={event.id} style={styles.row}>
                  <label style={{ color: colors.textPrimary, flex: 1 }}>
                    <input
                      type="checkbox"
                      disabled={busy || event.status === 'DELETED'}
                      checked={form.eventIds.includes(event.id)}
                      onChange={() =>
                        setForm({
                          ...form,
                          eventIds: form.eventIds.includes(event.id)
                            ? form.eventIds.filter((id) => id !== event.id)
                            : [...form.eventIds, event.id],
                        })
                      }
                    />{' '}
                    {event.title} ({event.status})
                  </label>
                  <Button
                    label={t('circles.useCover', { name: event.title })}
                    variant="tertiary"
                    disabled={busy}
                    onPress={() =>
                      void run(async () => {
                        const detail = await eventEditorRequest<EditorEvent>(
                          await token(),
                          `/${event.id}`,
                        );
                        setForm((value) => ({
                          ...value,
                          coverId: detail.content.cover_id,
                        }));
                      })
                    }
                  />
                </View>
              ))}
              <View style={styles.row}>
                <Button
                  label={t('circles.previousEvents')}
                  disabled={!eventPage || busy}
                  onPress={() => setEventPage((x) => x - 1)}
                />
                <Button
                  label={t('circles.nextEvents')}
                  disabled={
                    (eventPage + 1) * events.size >= events.total || busy
                  }
                  onPress={() => setEventPage((x) => x + 1)}
                />
              </View>
            </>
          )}
          <Button
            label={t('circles.save')}
            loading={busy}
            disabled={busy}
            onPress={save}
          />
          <Button
            label={t('circles.cancelEdit')}
            variant="secondary"
            disabled={busy}
            onPress={() => {
              if (window.confirm(t('circles.discard'))) setEditing(false);
            }}
          />
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.space12,
    alignItems: 'center',
  },
});
