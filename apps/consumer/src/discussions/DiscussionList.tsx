import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { spacing } from '@soberity/design-tokens';
import { Alert, Button, LoadingState, Screen, TextField } from '../ui';
import { PublicationCard, ReadingText } from '../science/readingUi';
import type { Category } from '../science/scienceApi';
import EditorialSelect from '../editorial/EditorialSelect';
import { useDiscussionData } from './useDiscussionData';
import type { Discussion, DiscussionPage } from './discussionsApi';

export function useDiscussionDate() {
  const { i18n } = useTranslation();
  return (value: string) =>
    new Intl.DateTimeFormat(
      i18n.resolvedLanguage === 'pl' ? 'pl-PL' : 'en-GB',
      { dateStyle: 'medium', timeStyle: 'short' },
    ).format(new Date(value));
}
export function DiscussionCard({ item }: { item: Discussion }) {
  const { t } = useTranslation();
  const date = useDiscussionDate();
  return (
    <PublicationCard
      title={item.title}
      href={`/discussions/${item.id}`}
      variant="list"
    >
      <ReadingText muted>{item.article_title}</ReadingText>
      <ReadingText muted>
        {t('discussions.count', { count: item.comment_count })} ·{' '}
        {t('discussions.activity', { date: date(item.latest_activity) })}
      </ReadingText>
      {item.status === 'CLOSED' ? (
        <ReadingText muted>{t('discussions.closed')}</ReadingText>
      ) : null}
    </PublicationCard>
  );
}
export function Pagination({
  page,
  total,
  size,
  onChange,
}: {
  page: number;
  total: number;
  size: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (total <= size) return null;
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space12 }}
    >
      <Button
        variant="secondary"
        label={t('discussions.previous')}
        disabled={page === 0}
        onPress={() => onChange(page - 1)}
      />
      <ReadingText>
        {page + 1} / {Math.ceil(total / size)}
      </ReadingText>
      <Button
        variant="secondary"
        label={t('discussions.next')}
        disabled={(page + 1) * size >= total}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}
export function DiscussionList({ preview = false }: { preview?: boolean }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [draft, setDraft] = useState(''),
    [q, setQ] = useState(''),
    [category, setCategory] = useState(''),
    [sort, setSort] = useState('RECENT'),
    [page, setPage] = useState(0);
  const params = new URLSearchParams({
    q,
    category,
    sort,
    page: String(page),
    size: preview ? '3' : '12',
  });
  const result = useDiscussionData<DiscussionPage>(`/discussions?${params}`);
  const categories = useDiscussionData<Category[]>(
    `/science/categories?locale=${i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'}`,
  );
  return (
    <View style={{ gap: spacing.space16 }}>
      {!preview ? (
        <>
          <ReadingText muted>{t('discussions.intro')}</ReadingText>
          <TextField
            label={t('discussions.search')}
            value={draft}
            onChangeText={setDraft}
            maxLength={200}
            onSubmitEditing={() => {
              setQ(draft.trim());
              setPage(0);
            }}
          />
          <Button
            label={t('discussions.search')}
            onPress={() => {
              setQ(draft.trim());
              setPage(0);
            }}
          />
          <EditorialSelect
            label={t('discussions.category')}
            value={category}
            options={[
              { value: '', label: t('discussions.allCategories') },
              ...(categories.data ?? []).map((c) => ({
                value: c.code,
                label: c.label,
              })),
            ]}
            onChange={(value) => {
              setCategory(value);
              setPage(0);
            }}
          />
          {categories.error ? (
            <Button
              variant="tertiary"
              label={t('discussions.retryCategories')}
              onPress={categories.reload}
            />
          ) : null}
          <EditorialSelect
            label={t('discussions.sort')}
            value={sort}
            options={['RECENT', 'POPULAR'].map((value) => ({
              value,
              label: t(`discussions.${value}`),
            }))}
            onChange={(value) => {
              setSort(value);
              setPage(0);
            }}
          />
          <ReadingText muted>{t('discussions.popularityNote')}</ReadingText>
        </>
      ) : null}
      {result.error ? (
        <>
          <Alert variant="danger" message={t('discussions.error')} />
          <Button label={t('discussions.retry')} onPress={result.reload} />
        </>
      ) : !result.data ? (
        <LoadingState label={t('discussions.loading')} />
      ) : (
        <>
          {result.data.items.length ? (
            result.data.items.map((item) => (
              <DiscussionCard key={item.id} item={item} />
            ))
          ) : (
            <ReadingText muted>{t('discussions.empty')}</ReadingText>
          )}
          {!preview ? (
            <Pagination
              page={page}
              total={result.data.total}
              size={12}
              onChange={setPage}
            />
          ) : null}
        </>
      )}
      {preview ? (
        <Button
          variant="tertiary"
          label={t('discussions.explore')}
          onPress={() => router.push('/discussions')}
        />
      ) : null}
    </View>
  );
}
export default function DiscussionsScreen() {
  return (
    <Screen>
      <DiscussionList />
    </Screen>
  );
}

export function ArticleDiscussionLink({
  articleType,
  articleId,
}: {
  articleType: 'ARTICLE' | 'POST';
  articleId: string;
}) {
  const result = useDiscussionData<DiscussionPage>(
    `/discussions?articleType=${articleType}&articleId=${encodeURIComponent(articleId)}&size=1`,
  );
  const { t } = useTranslation();
  const router = useRouter();
  const item = result.data?.items[0];
  if (result.error)
    return (
      <Button
        variant="tertiary"
        label={t('discussions.retryLink')}
        onPress={result.reload}
      />
    );
  if (!item) return null;
  return (
    <Button
      variant="secondary"
      label={t('discussions.articleAction', { count: item.comment_count })}
      onPress={() => router.push(`/discussions/${item.id}`)}
    />
  );
}
