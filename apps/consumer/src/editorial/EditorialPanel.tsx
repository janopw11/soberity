import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import {
  Alert,
  Button,
  Dialog,
  Screen,
  SettingsGroup,
  SettingsRow,
  TextField,
} from '../ui';
import {
  editorialRequest,
  EditorialError,
  type Detail,
  type EditorialPage,
  type Evidence,
  type MaterialType,
  type Membership,
} from './editorialApi';
import Select from './EditorialSelect';
import {
  accesses,
  articlePayload,
  categories,
  claimFields,
  claimPayload,
  initialForm,
  levels,
  providers,
  sourceFields,
  sourcePayload,
  studies,
  type FormValues,
} from './editorialForms';

export default function EditorialPanel() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const { getIdToken } = useAuthStatus();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [type, setType] = useState<MaterialType>('CLAIM');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [catalog, setCatalog] = useState<EditorialPage | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState<FormValues | null>(null);
  const [revising, setRevising] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState<FormValues>(initialForm);
  const [sourceId, setSourceId] = useState('');
  const [relation, setRelation] = useState('SUPPORTS');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [causal, setCausal] = useState(false);
  const [assessment, setAssessment] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirm, setConfirm] = useState<'publish' | 'archive' | null>(null);
  const [showSource, setShowSource] = useState(false);

  const call = useCallback(
    async <T,>(path: string, method = 'GET', body?: unknown) => {
      const token = await getIdToken();
      if (!token) throw new EditorialError(401);
      return editorialRequest<T>(token, path, method, body);
    },
    [getIdToken],
  );
  const failure = (e: unknown) => {
    setError(
      t(
        e instanceof EditorialError && [401, 403].includes(e.status)
          ? 'editorial.denied'
          : e instanceof EditorialError && e.status === 409
            ? 'editorial.conflict'
            : e instanceof EditorialError && e.status === 400
              ? 'editorial.invalid'
              : 'editorial.error',
      ),
    );
    if (e instanceof EditorialError && [401, 403].includes(e.status)) {
      setMembership(null);
      setDetail(null);
      setCatalog(null);
      setForm(null);
    }
  };
  const refresh = useCallback(async () => {
    const member = await call<Membership>('/me');
    setMembership(member);
    if (member.roles.length)
      setCatalog(
        await call<EditorialPage>(
          `/materials?type=${type}&page=${page}${status ? `&status=${status}` : ''}`,
        ),
      );
  }, [call, type, page, status]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setCatalog(null);
    setDetail(null);
    setForm(null);
    setError('');
    void (async () => {
      try {
        const member = await call<Membership>('/me');
        if (!current) return;
        setMembership(member);
        if (member.roles.length) {
          const list = await call<EditorialPage>(
            `/materials?type=${type}&page=${page}${status ? `&status=${status}` : ''}`,
          );
          if (current) setCatalog(list);
        }
      } catch (e) {
        if (current)
          setError(
            t(
              e instanceof EditorialError && [401, 403].includes(e.status)
                ? 'editorial.denied'
                : 'editorial.error',
            ),
          );
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [call, type, page, status, t]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setSuccess(false);
    try {
      await action();
      setSuccess(true);
    } catch (e) {
      failure(e);
    } finally {
      setBusy(false);
    }
  };
  const open = async (id: string) => {
    const value = await call<Detail>(`/materials/${type}/${id}`);
    setDetail(value);
    setForm(null);
    setNotes('');
    setReason('');
    setAssessment('');
    setChecked(false);
    setCausal(false);
    setConfirm(null);
    setShowSource(false);
  };
  const mutate = async (action: string, body: unknown) => {
    if (!detail) return;
    await call(`/materials/${type}/${detail.id}/${action}`, 'POST', body);
    await refresh();
    await open(detail.id);
  };
  const change = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const heading = (text: string) => (
    <Text
      accessibilityRole="header"
      style={[styles.heading, { color: colors.primary }]}
    >
      {text}
    </Text>
  );
  const label = (text: string) => (
    <Text style={[styles.text, { color: colors.textPrimary }]} selectable>
      {text}
    </Text>
  );
  const field = (
    key: string,
    values: FormValues,
    onChange: (key: string, value: string) => void,
    optional = false,
  ) => (
    <TextField
      key={key}
      accentLabel
      label={t(`editorial.fields.${key}`)}
      value={values[key] ?? ''}
      onChangeText={(v) => onChange(key, v)}
      multiline={['body', ...claimFields, 'notes', 'changeSummary'].includes(
        key,
      )}
      editable={!busy}
      autoCapitalize="none"
      maxLength={key === 'body' ? 100000 : 20000}
      testID={`editorial-field-${key}`}
      helperText={
        optional
          ? t('editorial.optional')
          : key === 'nextReviewAt'
            ? t('editorial.dateHint')
            : ''
      }
    />
  );
  const select = (
    key: string,
    values: string[],
    value: string,
    onChange: (value: string) => void,
  ) => (
    <Select
      key={key}
      label={t(`editorial.fields.${key}`)}
      value={value}
      disabled={busy}
      options={values.map((v) => ({
        value: v,
        label: t(`editorial.values.${v}`),
      }))}
      onChange={onChange}
    />
  );
  const own = membership?.uid === detail?.author_uid;
  const author = membership?.roles.includes('AUTHOR') ?? false;
  const reviewer = membership?.roles.includes('REVIEWER') ?? false;
  const box = {
    ...styles.box,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };

  return (
    <Screen maxWidth={960}>
      {heading(t('editorial.title'))}
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {t('editorial.intro')}
      </Text>
      {loading ? <Alert message={t('editorial.loading')} /> : null}
      {error ? <Alert variant="danger" message={error} /> : null}
      {success ? (
        <Alert variant="success" message={t('editorial.saved')} />
      ) : null}
      {!loading && membership && !membership.roles.length ? (
        <Alert variant="warning" message={t('editorial.denied')} />
      ) : null}
      <Button
        variant="tertiary"
        label={t('editorial.refresh')}
        loading={busy}
        onPress={() => void run(refresh)}
      />
      {membership?.roles.length ? (
        <>
          <View style={styles.filters}>
            {select('type', ['CLAIM', 'ARTICLE'], type, (v) => {
              setType(v as MaterialType);
              setPage(0);
            })}
            {select(
              'status',
              ['', 'DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
              status,
              (v) => {
                setStatus(v);
                setPage(0);
              },
            )}
          </View>
          {author ? (
            <Button
              variant="tertiary"
              label={t('editorial.newDraft')}
              disabled={busy}
              onPress={() => {
                setForm(initialForm());
                setRevising(null);
                setDetail(null);
                setSuccess(false);
              }}
            />
          ) : null}
          {!loading && catalog?.items.length === 0 ? (
            <Alert message={t('editorial.empty')} />
          ) : null}
          <SettingsGroup>
            {catalog?.items.map((item) => (
              <SettingsRow
                key={item.id}
                label={item.title}
                value={`v${item.version} · ${t(`editorial.values.${item.status}`)}`}
                showChevron
                disabled={busy}
                onPress={() => void run(() => open(item.id))}
                testID={`editorial-material-${item.id}`}
              />
            ))}
          </SettingsGroup>
          {catalog ? (
            <View style={styles.filters}>
              <Button
                variant="tertiary"
                label={t('editorial.previous')}
                disabled={busy || page === 0}
                onPress={() => setPage((p) => p - 1)}
              />
              {label(
                t('editorial.page', { page: page + 1, total: catalog.total }),
              )}
              <Button
                variant="tertiary"
                label={t('editorial.next')}
                disabled={busy || (page + 1) * catalog.size >= catalog.total}
                onPress={() => setPage((p) => p + 1)}
              />
            </View>
          ) : null}
          {form ? (
            <View style={box} testID="editorial-draft-form">
              {heading(
                t(revising ? 'editorial.revision' : 'editorial.newDraft'),
              )}
              <Alert message={t('editorial.immutable')} />
              {type === 'CLAIM' ? (
                <>
                  {select('locale', ['en', 'pl'], form.locale ?? 'en', (v) =>
                    change('locale', v),
                  )}
                  {claimFields.map((k) =>
                    field(k, form, change, k === 'causalJustification'),
                  )}
                  {select(
                    'evidenceLevel',
                    levels,
                    form.evidenceLevel ?? 'LOW',
                    (v) => change('evidenceLevel', v),
                  )}
                  {select(
                    'inferenceType',
                    ['ASSOCIATION', 'CAUSAL', 'DESCRIPTIVE', 'INSUFFICIENT'],
                    form.inferenceType ?? 'ASSOCIATION',
                    (v) => change('inferenceType', v),
                  )}
                </>
              ) : (
                <>
                  {['revisionId', 'title', 'summary', 'body'].map((k) =>
                    field(k, form, change),
                  )}
                </>
              )}
              {select('category', categories, form.category ?? 'sleep', (v) =>
                change('category', v),
              )}
              {field('nextReviewAt', form, change)}
              {field('changeSummary', form, change)}
              <Button
                variant="tertiary"
                label={t('editorial.saveDraft')}
                loading={busy}
                onPress={() =>
                  void run(async () => {
                    const root = type === 'CLAIM' ? '/claims' : '/articles';
                    const result = await call<{ id: string }>(
                      root + (revising ? `/${revising}/revisions` : ''),
                      'POST',
                      type === 'CLAIM'
                        ? claimPayload(form)
                        : articlePayload(form),
                    );
                    await refresh();
                    await open(result.id);
                  })
                }
              />
            </View>
          ) : null}
          {detail && !form ? (
            <View style={box} testID="editorial-detail">
              {heading(detail.claim_text ?? detail.title)}
              {label(
                `${t(`editorial.values.${detail.status}`)} · v${detail.version}`,
              )}
              {type === 'ARTICLE' ? (
                <>
                  {label(detail.summary)}
                  {label(detail.body ?? '')}
                </>
              ) : null}
              {heading(t('editorial.evidence'))}
              {Object.entries(detail.evidence)
                .filter(([k]) =>
                  [
                    'claim_text',
                    'summary',
                    'evidence_level',
                    'evidence_rationale',
                    'limitations',
                    'uncertainty',
                    'population',
                    'exposure',
                    'outcome',
                    'inference_type',
                    'causal_justification',
                    'next_review_at',
                    'locale',
                  ].includes(k),
                )
                .map(([k, v]) => (
                  <View key={k}>
                    <Text
                      style={[styles.caption, { color: colors.textSecondary }]}
                    >
                      {t(`editorial.evidenceFields.${k}`)}
                    </Text>
                    {label(
                      t(`editorial.values.${String(v ?? '—')}`, {
                        defaultValue: String(v ?? '—'),
                      }),
                    )}
                  </View>
                ))}
              {heading(t('editorial.citations'))}
              {detail.citations.length === 0 ? (
                <Alert variant="warning" message={t('editorial.noSources')} />
              ) : null}
              {detail.citations.map((s) => (
                <View key={s.id} style={box}>
                  {label(`${s.title} · ${s.authors} · ${s.publication_year}`)}
                  {label(
                    [
                      s.organization,
                      s.journal,
                      s.publication_date,
                      s.doi,
                      s.pmid,
                    ]
                      .filter(Boolean)
                      .join(' · '),
                  )}
                  {label(
                    [
                      s.study_type,
                      s.provider,
                      s.access_type,
                      s.license,
                      s.license_url,
                    ]
                      .filter(Boolean)
                      .map((v) =>
                        t(`editorial.values.${v}`, { defaultValue: v }),
                      )
                      .join(' · '),
                  )}
                  {label(`${t(`editorial.values.${s.relation}`)}: ${s.notes}`)}
                  <Button
                    variant="tertiary"
                    label={`${t('editorial.openSource')}: ${s.url}`}
                    onPress={() =>
                      void run(async () => {
                        await Linking.openURL(s.url);
                      })
                    }
                  />
                  {author &&
                  own &&
                  type === 'CLAIM' &&
                  detail.status === 'DRAFT' ? (
                    <Button
                      variant="tertiary"
                      disabled={busy || !reason.trim()}
                      label={t('editorial.removeCitation')}
                      onPress={() =>
                        void run(async () => {
                          await call(
                            `/claims/${detail.id}/citations/${s.citation_id}`,
                            'DELETE',
                            { reason },
                          );
                          await open(detail.id);
                        })
                      }
                    />
                  ) : null}
                </View>
              ))}
              {author &&
              own &&
              type === 'CLAIM' &&
              detail.status === 'DRAFT' ? (
                <View style={styles.stack}>
                  {field('sourceId', { sourceId }, (_, v) => setSourceId(v))}
                  {select(
                    'relation',
                    ['SUPPORTS', 'CHALLENGES', 'CONTEXT'],
                    relation,
                    setRelation,
                  )}
                  {field('notes', { notes }, (_, v) => setNotes(v))}
                  <Button
                    variant="tertiary"
                    label={t('editorial.attachSource')}
                    disabled={busy || !sourceId.trim() || !notes.trim()}
                    onPress={() =>
                      void run(async () => {
                        await call(`/claims/${detail.id}/citations`, 'POST', {
                          sourceId,
                          relation,
                          notes,
                        });
                        await open(detail.id);
                        setSourceId('');
                      })
                    }
                  />
                  <Button
                    variant="tertiary"
                    label={t('editorial.newSource')}
                    disabled={busy}
                    onPress={() => setShowSource((v) => !v)}
                  />
                  {showSource ? (
                    <View style={box}>
                      {sourceFields.map((k) =>
                        field(
                          k,
                          sourceForm,
                          (key, value) =>
                            setSourceForm((f) => ({ ...f, [key]: value })),
                          ![
                            'title',
                            'authors',
                            'publicationYear',
                            'url',
                            'license',
                          ].includes(k),
                        ),
                      )}
                      {select(
                        'studyType',
                        studies,
                        sourceForm.studyType ?? 'REPORT',
                        (v) => setSourceForm((f) => ({ ...f, studyType: v })),
                      )}
                      {select(
                        'provider',
                        providers,
                        sourceForm.provider ?? 'OTHER',
                        (v) => setSourceForm((f) => ({ ...f, provider: v })),
                      )}
                      {select(
                        'accessType',
                        accesses,
                        sourceForm.accessType ?? 'UNKNOWN',
                        (v) => setSourceForm((f) => ({ ...f, accessType: v })),
                      )}
                      <Button
                        variant="tertiary"
                        label={t('editorial.saveSource')}
                        loading={busy}
                        onPress={() =>
                          void run(async () => {
                            const source = await call<{ id: string }>(
                              '/sources',
                              'POST',
                              sourcePayload(sourceForm),
                            );
                            setSourceId(source.id);
                            setShowSource(false);
                            setSourceForm(initialForm());
                          })
                        }
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
              {heading(t('editorial.review'))}
              {type === 'ARTICLE' ? (
                <>
                  {label(detail.review_notes ?? t('editorial.notReviewed'))}
                  {heading(t('editorial.evidenceReview'))}
                </>
              ) : null}
              {detail.review.map((r) => (
                <View key={r.reviewer_uid}>
                  {label(`${t(`editorial.values.${r.decision}`)}: ${r.notes}`)}
                  {r.causal_assessment ? label(r.causal_assessment) : null}
                </View>
              ))}
              {author && own ? (
                <Button
                  variant="tertiary"
                  label={t('editorial.revision')}
                  disabled={busy}
                  onPress={() => {
                    const e = detail.evidence;
                    setForm({
                      ...initialForm(),
                      ...Object.fromEntries(
                        claimFields.map((k) => [
                          k,
                          String(
                            e[
                              ((
                                {
                                  claimText: 'claim_text',
                                  evidenceRationale: 'evidence_rationale',
                                  causalJustification: 'causal_justification',
                                } as Record<string, string>
                              )[k] ?? k) as keyof Evidence
                            ] ?? '',
                          ),
                        ]),
                      ),
                      locale: e.locale,
                      category: detail.category_code ?? 'sleep',
                      title: detail.title ?? '',
                      summary: detail.summary,
                      body: detail.body ?? '',
                      revisionId:
                        type === 'CLAIM'
                          ? detail.id
                          : (detail.revision_id ?? ''),
                      evidenceLevel: e.evidence_level,
                      inferenceType: e.inference_type,
                    });
                    setRevising(detail.id);
                  }}
                />
              ) : null}
              {field('reason', { reason }, (_, v) => setReason(v))}
              {author && own && detail.status === 'DRAFT' ? (
                <Button
                  variant="tertiary"
                  label={t('editorial.submit')}
                  disabled={busy || !reason.trim() || !detail.citations.length}
                  onPress={() => void run(() => mutate('submit', { reason }))}
                />
              ) : null}
              {reviewer && !own && detail.status === 'IN_REVIEW' ? (
                <>
                  {field('notes', { notes }, (_, v) => setNotes(v))}
                  {type === 'CLAIM' &&
                  detail.evidence.inference_type === 'CAUSAL' ? (
                    <>
                      <SettingsRow
                        label={t('editorial.causalityApproved')}
                        multilineLabel
                        checkbox
                        checked={causal}
                        onPress={() => setCausal((v) => !v)}
                      />
                      {field(
                        'causalAssessment',
                        { causalAssessment: assessment },
                        (_, v) => setAssessment(v),
                      )}
                    </>
                  ) : null}
                  <SettingsRow
                    label={t('editorial.reviewChecked')}
                    multilineLabel
                    checkbox
                    checked={checked}
                    onPress={() => setChecked((v) => !v)}
                  />
                  {['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].map(
                    (decision) => (
                      <Button
                        key={decision}
                        variant="tertiary"
                        label={t(`editorial.decisions.${decision}`)}
                        disabled={
                          busy ||
                          !checked ||
                          !notes.trim() ||
                          (decision === 'APPROVED' &&
                            type === 'CLAIM' &&
                            detail.evidence.inference_type === 'CAUSAL' &&
                            (!causal || !assessment.trim()))
                        }
                        onPress={() =>
                          void run(() =>
                            mutate('review', {
                              decision,
                              notes,
                              causalityApproved: causal,
                              causalAssessment: assessment || null,
                            }),
                          )
                        }
                      />
                    ),
                  )}
                </>
              ) : null}
              {reviewer && !own && detail.status === 'APPROVED' ? (
                <Button
                  variant="tertiary"
                  label={t('editorial.publish')}
                  disabled={busy || !reason.trim()}
                  onPress={() => setConfirm('publish')}
                />
              ) : null}
              {reviewer && detail.status !== 'ARCHIVED' ? (
                <SettingsRow
                  destructive
                  label={t('editorial.archive')}
                  disabled={busy || !reason.trim()}
                  onPress={() => setConfirm('archive')}
                />
              ) : null}
              {heading(t('editorial.versions'))}
              <SettingsGroup>
                {detail.versions.map((v) => (
                  <SettingsRow
                    key={v.id}
                    label={`v${v.version} · ${t(`editorial.values.${v.status}`)}`}
                    disabled={busy}
                    onPress={() => void run(() => open(v.id))}
                  />
                ))}
              </SettingsGroup>
              {heading(t('editorial.audit'))}
              {detail.audit.map((event, i) => (
                <View key={i}>
                  {label(
                    `${event.created_at} · ${t(`editorial.actions.${event.action}`, { defaultValue: event.action })}`,
                  )}
                  {label(event.reason)}
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
      <Dialog
        visible={confirm !== null}
        title={t(
          confirm === 'publish' ? 'editorial.publish' : 'editorial.archive',
        )}
        closeLabel={t('editorial.close')}
        onClose={() => {
          if (!busy) setConfirm(null);
        }}
      >
        {error ? <Alert variant="danger" message={error} /> : null}
        <Alert
          variant={confirm === 'archive' ? 'warning' : 'info'}
          message={t(
            confirm === 'publish'
              ? 'editorial.confirmPublish'
              : 'editorial.confirmArchive',
          )}
        />
        {label(reason)}
        <Button
          variant="tertiary"
          label={t('editorial.confirm')}
          loading={busy}
          onPress={() =>
            void run(async () => {
              if (confirm) await mutate(confirm, { reason });
            })
          }
        />
      </Dialog>
    </Screen>
  );
}
const styles = StyleSheet.create({
  stack: { gap: spacing.space16 },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.space16,
    alignItems: 'center',
  },
  box: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.space16,
    gap: spacing.space16,
  },
  heading: { ...typography.h3 },
  text: { ...typography.body },
  caption: { ...typography.small },
});
