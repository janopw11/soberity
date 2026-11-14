import { ArticleDiscussionLink } from '../discussions/DiscussionList';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Button, LoadingState, Screen } from '../ui';
import EvidenceCard, { useReadingDate } from './EvidenceCard';
import {
  ArticleSources,
  ReadingCard,
  ReadingImage,
  ReadingText,
  RichDocument,
} from './readingUi';
import {
  mediaUri,
  ScienceError,
  scienceGet,
  type Article,
  type Post,
} from './scienceApi';

type Kind = 'post' | 'article' | 'evidence';
export default function ArticleScreen({ kind }: { kind: Kind }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const date = useReadingDate();
  const [data, setData] = useState<Post | Article | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [attempt, retry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      retry((value) => value + 1);
    }, []),
  );
  const validId =
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  useEffect(() => {
    if (!validId || kind === 'evidence') return;
    const controller = new AbortController();
    setData(null);
    setError(null);
    const timeout = setTimeout(() => {
      setError(0);
      controller.abort();
    }, 20000);
    void scienceGet<Post | Article>(
      `/api/v1/science/${kind === 'post' ? 'posts' : 'articles'}/${encodeURIComponent(id)}`,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof ScienceError ? reason.status : 0);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [id, kind, validId, attempt]);
  const post = data && 'document' in data ? data : null;
  const article = data && 'body' in data ? data : null;
  return (
    <Screen maxWidth={760}>
      {!validId || error !== null ? (
        <ReadingCard>
          <Alert
            variant="danger"
            message={t(
              !validId || error === 404
                ? 'discover.notFound'
                : 'discover.error',
            )}
          />
          {validId && error !== 404 ? (
            <Button
              variant="secondary"
              label={t('discover.retry')}
              onPress={() => retry((value) => value + 1)}
            />
          ) : null}
        </ReadingCard>
      ) : kind === 'evidence' ? (
        <EvidenceCard claimId={id} />
      ) : !data ? (
        <LoadingState label={t('discover.loading')} />
      ) : (
        <>
          {!post || post.publication_route === 'REVIEWED' ? (
            <ReadingText muted>{t('discover.reviewedArticle')}</ReadingText>
          ) : null}
          <ReadingText heading>{data.title}</ReadingText>
          <ReadingText muted>
            {t('discover.published')}: {date(data.published_at)}
          </ReadingText>
          {post ? (
            <>
              {post.cover_id ? (
                <ReadingImage
                  uri={mediaUri(post.cover_id)}
                  alt={post.cover_alt || post.title}
                  cover
                />
              ) : null}
              <RichDocument node={post.document} />
              <ArticleSources sources={post.evidence} />
            </>
          ) : article ? (
            <>
              {article.locale !==
              (i18n.resolvedLanguage === 'pl' ? 'pl' : 'en') ? (
                <ReadingText muted>
                  {t('discover.languageFallback', { language: article.locale })}
                </ReadingText>
              ) : null}
              <ReadingText>{article.summary}</ReadingText>
              <ReadingText>{article.body}</ReadingText>
              <ReadingText muted>
                {t('discover.reviewed')}: {date(article.reviewed_at)} ·{' '}
                {t('discover.nextReview')}: {date(article.next_review_at)}
              </ReadingText>
              <EvidenceCard claimId={article.claim_id} />
            </>
          ) : null}
          <ArticleDiscussionLink
            articleType={post ? 'POST' : 'ARTICLE'}
            articleId={id}
          />
        </>
      )}
    </Screen>
  );
}
