import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { spacing } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { Alert, Button, LoadingState, Screen, TextField } from '../ui';
import { ReadingCard, ReadingText } from '../science/readingUi';
import EditorialSelect from '../editorial/EditorialSelect';
import { useDiscussionData } from './useDiscussionData';
import {
  articleHref,
  discussionRequest,
  type Discussion,
  type Comment,
  type CommentPage,
} from './discussionsApi';
import { Pagination, useDiscussionDate } from './DiscussionList';

// Disable mutations after an uncertain outcome until fresh server state is requested.
export function useDiscussionMutation(
  onSuccess: () => void,
  onReconcile: () => void = onSuccess,
) {
  const { getIdToken, user } = useAuthStatus();
  const [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const lock = useRef(false),
    revision = useRef(0);
  useEffect(() => {
    revision.current++;
    lock.current = false;
    setBusy(false);
    setFailed(false);
    return () => {
      revision.current++;
    };
  }, [user?.uid]);
  const run = async (path: string, method: string, body?: unknown) => {
    if (lock.current || failed) return;
    lock.current = true;
    setBusy(true);
    const stamp = revision.current;
    try {
      const token = await getIdToken();
      if (!token) throw Error('Session required');
      if (stamp !== revision.current) return;
      await discussionRequest(path, token, method, body);
      if (stamp === revision.current) onSuccess();
    } catch {
      if (stamp === revision.current) setFailed(true);
    } finally {
      if (stamp === revision.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  };
  return {
    busy,
    failed,
    run,
    reconcile: () => {
      setFailed(false);
      onReconcile();
    },
  };
}
export function CommentForm({
  discussionId,
  parentId,
  onDone,
}: {
  discussionId: string;
  parentId?: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [content, setContent] = useState(''),
    [kind, setKind] = useState('OPINION');
  const mutation = useDiscussionMutation(() => {
    setContent('');
    onDone();
  });
  return (
    <ReadingCard>
      <ReadingText muted>{t('discussions.publicNotice')}</ReadingText>
      <EditorialSelect
        label={t('discussions.kind')}
        value={kind}
        options={['OPINION', 'EXPERIENCE'].map((value) => ({
          value,
          label: t(`discussions.${value}`),
        }))}
        onChange={setKind}
        disabled={mutation.busy}
      />
      <TextField
        label={t(parentId ? 'discussions.replyInput' : 'discussions.addInput')}
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={4000}
        editable={!mutation.busy}
        helperText={`${content.length}/4000`}
      />
      {mutation.failed ? (
        <>
          <Alert variant="danger" message={t('discussions.writeError')} />
          <Button
            label={t('discussions.refresh')}
            onPress={mutation.reconcile}
          />
        </>
      ) : null}
      <Button
        label={t('discussions.submit')}
        loading={mutation.busy}
        disabled={!content.trim() || mutation.failed}
        onPress={() =>
          void mutation.run(
            `/me/discussions/${discussionId}/comments`,
            'POST',
            { content, kind, parentId: parentId ?? null },
          )
        }
      />
    </ReadingCard>
  );
}
function CommentItem({
  item,
  discussionId,
  canReply,
  moderation,
  onChange,
}: {
  item: Comment;
  discussionId: string;
  canReply: boolean;
  moderation: boolean;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const date = useDiscussionDate();
  const [reply, setReply] = useState(false),
    [expanded, setExpanded] = useState(false),
    [confirm, setConfirm] = useState<'delete' | 'remove' | null>(null);
  const mutation = useDiscussionMutation(() => {
    setConfirm(null);
    onChange();
  });
  return (
    <ReadingCard>
      <ReadingText muted>
        {item.status === 'VISIBLE'
          ? item.author_name || t('discussions.member')
          : t(`discussions.${item.status}`)}{' '}
        · {date(item.created_at)}
      </ReadingText>
      <ReadingText muted>{t(`discussions.${item.kind}`)}</ReadingText>
      {/* Plain React Native Text: markup, scripts and arbitrary URLs are never executed. */}
      {item.content ? <ReadingText>{item.content}</ReadingText> : null}
      {item.own && item.status !== 'DELETED' && item.status !== 'REMOVED' ? (
        <Button
          variant="tertiary"
          label={t('discussions.delete')}
          disabled={mutation.busy || mutation.failed}
          onPress={() => setConfirm('delete')}
        />
      ) : null}
      {moderation && ['VISIBLE', 'HIDDEN'].includes(item.status) ? (
        <View style={{ gap: spacing.space8 }}>
          <Button
            variant="secondary"
            label={t(
              item.status === 'VISIBLE'
                ? 'discussions.hide'
                : 'discussions.restore',
            )}
            disabled={mutation.busy || mutation.failed}
            onPress={() =>
              void mutation.run(
                `/editorial/discussion-comments/${item.id}`,
                'PUT',
                { status: item.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE' },
              )
            }
          />
          <Button
            variant="destructive"
            label={t('discussions.remove')}
            disabled={mutation.busy || mutation.failed}
            onPress={() => setConfirm('remove')}
          />
        </View>
      ) : null}
      {confirm ? (
        <>
          <ReadingText>{t('discussions.confirmDelete')}</ReadingText>
          <Button
            variant="destructive"
            label={t('discussions.confirm')}
            loading={mutation.busy}
            disabled={mutation.failed}
            onPress={() =>
              void mutation.run(
                confirm === 'delete'
                  ? `/me/discussion-comments/${item.id}`
                  : `/editorial/discussion-comments/${item.id}`,
                confirm === 'delete' ? 'DELETE' : 'PUT',
                confirm === 'remove' ? { status: 'REMOVED' } : undefined,
              )
            }
          />
          <Button
            variant="tertiary"
            label={t('discussions.cancel')}
            onPress={() => setConfirm(null)}
          />
        </>
      ) : null}
      {mutation.failed ? (
        <>
          <Alert variant="danger" message={t('discussions.writeError')} />
          <Button
            label={t('discussions.refresh')}
            onPress={mutation.reconcile}
          />
        </>
      ) : null}
      {!item.parent_id && canReply && item.status === 'VISIBLE' ? (
        <Button
          variant="tertiary"
          label={t(reply ? 'discussions.cancelReply' : 'discussions.reply')}
          onPress={() => setReply(!reply)}
        />
      ) : null}
      {reply ? (
        <CommentForm
          discussionId={discussionId}
          parentId={item.id}
          onDone={() => {
            setReply(false);
            onChange();
          }}
        />
      ) : null}
      {!item.parent_id && item.reply_count > 0 ? (
        <>
          <Button
            variant="tertiary"
            label={t(
              expanded ? 'discussions.hideReplies' : 'discussions.showReplies',
              { count: item.reply_count },
            )}
            onPress={() => setExpanded(!expanded)}
          />
          {expanded ? (
            <CommentThread
              discussionId={discussionId}
              parentId={item.id}
              canReply={false}
              moderation={moderation}
              onChange={onChange}
            />
          ) : null}
        </>
      ) : null}
    </ReadingCard>
  );
}
export function CommentThread({
  discussionId,
  parentId,
  canReply,
  moderation = false,
  onChange,
}: {
  discussionId: string;
  parentId?: string;
  canReply: boolean;
  moderation?: boolean;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const result = useDiscussionData<CommentPage>(
    `${moderation ? '/editorial' : ''}/discussions/${discussionId}/comments?page=${page}&size=10${parentId ? `&parentId=${parentId}` : ''}`,
  );
  return (
    <View style={{ gap: spacing.space12 }}>
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
              <CommentItem
                key={item.id}
                item={item}
                discussionId={discussionId}
                canReply={canReply}
                moderation={moderation}
                onChange={onChange}
              />
            ))
          ) : (
            <ReadingText muted>{t('discussions.noComments')}</ReadingText>
          )}
          <Pagination
            page={page}
            total={result.data.total}
            size={10}
            onChange={setPage}
          />
        </>
      )}
    </View>
  );
}
export default function DiscussionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStatus();
  return <Detail key={`${id}:${user?.uid ?? 'guest'}`} id={id} />;
}
function Detail({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { status } = useAuthStatus();
  const result = useDiscussionData<Discussion>(
    `/discussions/${encodeURIComponent(id)}`,
  );
  const [revision, setRevision] = useState(0);
  const refresh = () => {
    setRevision((x) => x + 1);
    result.reload();
  };
  const item = result.data;
  return (
    <Screen maxWidth={800}>
      {result.error ? (
        <>
          <Alert variant="danger" message={t('discussions.unavailable')} />
          <Button label={t('discussions.retry')} onPress={result.reload} />
        </>
      ) : !item ? (
        <LoadingState label={t('discussions.loading')} />
      ) : (
        <>
          <ReadingText heading>{item.title}</ReadingText>
          <ReadingText muted>{t('discussions.linkedArticle')}</ReadingText>
          <Button
            variant="secondary"
            label={item.article_title}
            onPress={() => router.push(articleHref(item))}
          />
          <Alert variant="info" message={t('discussions.integrity')} />
          <ReadingText>
            {t('discussions.count', { count: item.comment_count })}
          </ReadingText>
          {item.can_moderate ? (
            <Button
              variant="tertiary"
              label={t('discussions.admin')}
              onPress={() => router.push('/editorial-discussions')}
            />
          ) : null}
          {item.status === 'CLOSED' ? (
            <ReadingText>{t('discussions.closed')}</ReadingText>
          ) : status === 'authenticated' ? (
            <CommentForm discussionId={id} onDone={refresh} />
          ) : (
            <Button
              label={t('discussions.signIn')}
              onPress={() => router.push('/sign-in')}
            />
          )}
          <CommentThread
            key={revision}
            discussionId={id}
            canReply={status === 'authenticated' && item.status === 'OPEN'}
            onChange={refresh}
          />
        </>
      )}
    </Screen>
  );
}
