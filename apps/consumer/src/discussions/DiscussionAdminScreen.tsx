import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { Alert, Button, LoadingState, Screen, TextField } from '../ui';
import { ReadingCard, ReadingText } from '../science/readingUi';
import type { Page } from '../science/scienceApi';
import EditorialSelect from '../editorial/EditorialSelect';
import { useDiscussionData } from './useDiscussionData';
import { type Discussion, type DiscussionPage } from './discussionsApi';
import { CommentThread, useDiscussionMutation } from './DiscussionDetailScreen';
import { Pagination } from './DiscussionList';

type ArticleChoice = {
  type: 'ARTICLE' | 'POST' | 'CLAIM';
  content: { id: string; title: string };
};
export default function DiscussionAdminScreen() {
  const { user } = useAuthStatus();
  return <Workspace key={user?.uid ?? 'guest'} />;
}
function Workspace() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0),
    [articlePage, setArticlePage] = useState(0),
    [search, setSearch] = useState(''),
    [q, setQ] = useState('');
  const list = useDiscussionData<DiscussionPage>(
    `/editorial/discussions?page=${page}&size=10`,
  );
  const [editing, setEditing] = useState<Discussion | null>(null),
    [choice, setChoice] = useState<ArticleChoice | null>(null),
    [title, setTitle] = useState(''),
    [status, setStatus] = useState('OPEN'),
    [revision, setRevision] = useState(0),
    [saved, setSaved] = useState(false);
  const articles = useDiscussionData<Page<ArticleChoice>>(
    `/science/feed?locale=${i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'}&page=${articlePage}&size=20&q=${encodeURIComponent(q)}`,
  );
  const refresh = () => {
    setRevision((x) => x + 1);
    list.reload();
  };
  const mutation = useDiscussionMutation(
    () => {
      setEditing(null);
      setChoice(null);
      setTitle('');
      setStatus('OPEN');
      setSaved(true);
      refresh();
    },
    () => {
      setSaved(false);
      setEditing(null);
      setChoice(null);
      setTitle('');
      refresh();
    },
  );
  const select = (item: Discussion) => {
    setEditing(item);
    setChoice({
      type: item.article_type,
      content: { id: item.article_id, title: item.article_title },
    });
    setTitle(item.title);
    setStatus(item.status);
    setSaved(false);
    setRevision((x) => x + 1);
  };
  return (
    <Screen maxWidth={800}>
      <ReadingText heading>{t('discussions.admin')}</ReadingText>
      {list.error ? (
        <>
          <Alert variant="danger" message={t('discussions.adminError')} />
          <Button label={t('discussions.retry')} onPress={list.reload} />
        </>
      ) : !list.data ? (
        <LoadingState label={t('discussions.loading')} />
      ) : (
        <>
          {saved ? (
            <Alert variant="success" message={t('discussions.saved')} />
          ) : null}
          <ReadingCard>
            <ReadingText heading>
              {t(editing ? 'discussions.editTopic' : 'discussions.createTopic')}
            </ReadingText>
            <TextField
              label={t('discussions.topicTitle')}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              editable={!mutation.busy}
            />
            <EditorialSelect
              label={t('discussions.topicStatus')}
              value={status}
              options={['OPEN', 'CLOSED', 'HIDDEN'].map((value) => ({
                value,
                label: t(`discussions.${value}`),
              }))}
              onChange={setStatus}
              disabled={mutation.busy}
            />
            {choice ? (
              <ReadingText>
                {t('discussions.linkedArticle')}: {choice.content.title}
              </ReadingText>
            ) : null}
            {!editing ? (
              <>
                <TextField
                  label={t('discussions.searchArticle')}
                  value={search}
                  onChangeText={setSearch}
                  maxLength={200}
                  onSubmitEditing={() => {
                    setQ(search.trim());
                    setArticlePage(0);
                  }}
                />
                <Button
                  variant="secondary"
                  label={t('discussions.searchArticle')}
                  onPress={() => {
                    setQ(search.trim());
                    setArticlePage(0);
                  }}
                />
                {articles.error ? (
                  <>
                    <Alert variant="danger" message={t('discussions.error')} />
                    <Button
                      label={t('discussions.retry')}
                      onPress={articles.reload}
                    />
                  </>
                ) : !articles.data ? (
                  <LoadingState label={t('discussions.loading')} />
                ) : (
                  <>
                    {articles.data.items
                      .filter((item) => item.type !== 'CLAIM')
                      .map((item) => (
                        <Button
                          key={`${item.type}:${item.content.id}`}
                          variant={
                            choice?.content.id === item.content.id
                              ? 'primary'
                              : 'secondary'
                          }
                          label={item.content.title}
                          disabled={mutation.busy}
                          onPress={() => setChoice(item)}
                        />
                      ))}
                    {!articles.data.items.some(
                      (item) => item.type !== 'CLAIM',
                    ) ? (
                      <ReadingText muted>
                        {t('discussions.noArticles')}
                      </ReadingText>
                    ) : null}
                    <Pagination
                      page={articlePage}
                      total={articles.data.total}
                      size={20}
                      onChange={setArticlePage}
                    />
                  </>
                )}
              </>
            ) : null}
            {mutation.failed ? (
              <>
                <Alert
                  variant="danger"
                  message={t('discussions.adminWriteError')}
                />
                <Button
                  label={t('discussions.refresh')}
                  onPress={mutation.reconcile}
                />
              </>
            ) : null}
            <Button
              label={t('discussions.save')}
              loading={mutation.busy}
              disabled={!title.trim() || !choice || mutation.failed}
              onPress={() => {
                if (choice)
                  void mutation.run(
                    `/editorial/discussions${editing ? `/${editing.id}` : ''}`,
                    editing ? 'PUT' : 'POST',
                    {
                      title,
                      status,
                      articleType: choice.type,
                      articleId: choice.content.id,
                      expectedVersion: editing?.version,
                    },
                  );
              }}
            />
            {editing ? (
              <Button
                variant="tertiary"
                label={t('discussions.cancel')}
                disabled={mutation.busy}
                onPress={() => {
                  setEditing(null);
                  setChoice(null);
                  setTitle('');
                  setStatus('OPEN');
                }}
              />
            ) : null}
          </ReadingCard>
          {editing ? (
            <View style={{ gap: spacing.space12 }}>
              <ReadingText heading>{t('discussions.moderation')}</ReadingText>
              <CommentThread
                key={`${editing.id}:${revision}`}
                discussionId={editing.id}
                canReply={false}
                moderation
                onChange={refresh}
              />
            </View>
          ) : null}
          <ReadingText heading>{t('discussions.manageTopics')}</ReadingText>
          {list.data.items.map((item) => (
            <ReadingCard key={item.id}>
              <ReadingText>
                {item.title} · {t(`discussions.${item.status}`)}
              </ReadingText>
              <Button
                variant="secondary"
                label={t('discussions.manage', { title: item.title })}
                disabled={mutation.busy || mutation.failed}
                onPress={() => select(item)}
              />
            </ReadingCard>
          ))}
          {!list.data.items.length ? (
            <ReadingText muted>{t('discussions.empty')}</ReadingText>
          ) : null}
          <Pagination
            page={page}
            total={list.data.total}
            size={10}
            onChange={setPage}
          />
        </>
      )}
    </Screen>
  );
}
