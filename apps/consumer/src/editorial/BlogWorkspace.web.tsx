import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import type { JSONContent } from '@tiptap/core';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { EditorialError, type Membership } from './editorialApi';
import {
  blogRequest,
  privateImage,
  uploadBlogImage,
  type BlogCategory,
  type BlogEvidence,
  type BlogImage,
  type BlogKind,
  type BlogPage,
  type BlogPost,
} from './blogApi';

const emptyDocument: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};
export default function BlogWorkspace() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const { getIdToken } = useAuthStatus();
  const [member, setMember] = useState<Membership | null>(null);
  const [catalog, setCatalog] = useState<BlogPage | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [kindFilter, setKindFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<BlogKind>('ARTICLE');
  const [title, setTitle] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [category, setCategory] = useState('');
  const [evidence, setEvidence] = useState<BlogEvidence[]>([]);
  const [cover, setCover] = useState<string | null>(null);
  const [coverAlt, setCoverAlt] = useState('');
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewsRef = useRef<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [imagePurpose, setImagePurpose] = useState<'COVER' | 'INLINE' | null>(
    null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [confirm, setConfirm] = useState<'PUBLISH' | 'ARCHIVE' | null>(null);
  const [history, setHistory] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Image.extend({
        parseHTML() {
          return [
            {
              tag: 'img[src]',
              getAttrs: (element) => {
                const src = (element as HTMLElement).getAttribute('src');
                return src?.startsWith('blob:') ? null : false;
              },
            },
          ];
        },
      }).configure({ allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: emptyDocument,
    editorProps: {
      attributes: {
        class: 'ew-prose',
        role: 'textbox',
        'aria-label': t('editorialBlog.content'),
        'aria-multiline': 'true',
      },
    },
    onUpdate: () => setDirty(true),
  });
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      empty: e?.isEmpty ?? true,
      bold: e?.isActive('bold'),
      italic: e?.isActive('italic'),
      underline: e?.isActive('underline'),
      bullet: e?.isActive('bulletList'),
      heading: e?.isActive('heading', { level: 2 }),
    }),
  });
  const author = member?.roles.includes('AUTHOR') ?? false;
  const reviewer = member?.roles.includes('REVIEWER') ?? false;
  const own = !post || post.author_uid === member?.uid;
  const canEdit = author && own;
  const token = useCallback(async () => {
    const value = await getIdToken();
    if (!value) throw new EditorialError(401);
    return value;
  }, [getIdToken]);
  const call = useCallback(
    async <T,>(path: string, method = 'GET', body?: unknown) =>
      blogRequest<T>(await token(), path, method, body),
    [token],
  );
  const fail = (e: unknown) => {
    setError(
      t(
        e instanceof EditorialError && [401, 403].includes(e.status)
          ? 'editorial.denied'
          : e instanceof EditorialError && e.status === 409
            ? 'editorial.conflict'
            : e instanceof EditorialError && [400, 413].includes(e.status)
              ? 'editorialBlog.invalid'
              : 'editorial.error',
      ),
    );
    if (e instanceof EditorialError && [401, 403].includes(e.status)) {
      setMember(null);
      setPost(null);
      setEditing(false);
      setCatalog(null);
    }
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };
  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (kindFilter) params.set('kind', kindFilter);
    if (statusFilter) params.set('status', statusFilter);
    setCatalog(await call<BlogPage>(`/posts?${params}`));
  }, [call, kindFilter, statusFilter, page]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const who = await call<Membership>('/me');
        if (!current) return;
        setMember(who);
        if (who.roles.length) {
          const [list, cats] = await Promise.all([
            call<BlogPage>(
              `/posts?${new URLSearchParams({ page: String(page), ...(kindFilter ? { kind: kindFilter } : {}), ...(statusFilter ? { status: statusFilter } : {}) })}`,
            ),
            call<BlogCategory[]>('/categories'),
          ]);
          if (current) {
            setCatalog(list);
            setCategories(cats);
          }
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
  }, [call, kindFilter, statusFilter, page, t]);
  useEffect(() => {
    editor?.setEditable(canEdit && !busy, false);
  }, [editor, canEdit, busy]);
  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: {
          class: 'ew-prose',
          role: 'textbox',
          'aria-label': t('editorialBlog.content'),
          'aria-multiline': 'true',
        },
      },
    });
  }, [editor, t]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  useEffect(
    () => () => {
      Object.values(previewsRef.current).forEach(URL.revokeObjectURL);
    },
    [],
  );
  const preview = async (id: string) => {
    if (!previewsRef.current[id]) {
      const url = await privateImage(await token(), id);
      previewsRef.current[id] = url;
      setPreviews({ ...previewsRef.current });
    }
    return previewsRef.current[id]!;
  };
  const displayDocument = async (
    document: JSONContent,
  ): Promise<JSONContent> => {
    const value = structuredClone(document);
    const walk = async (node: JSONContent): Promise<void> => {
      if (node.type === 'image' && typeof node.attrs?.src === 'string') {
        const id = (node.attrs.src as string).split('/').pop()!;
        node.attrs.src = await preview(id);
        node.attrs.assetId = id;
      }
      if (node.content) await Promise.all(node.content.map(walk));
    };
    await walk(value);
    return value;
  };
  // Tiptap only sees object URLs for private previews; persisted JSON always uses stable asset IDs.
  const persistedDocument = (): JSONContent => {
    const value = editor?.getJSON() ?? emptyDocument;
    const walk = (node: JSONContent) => {
      if (node.type === 'image') {
        const src = String(node.attrs?.src ?? '');
        const id = Object.entries(previewsRef.current).find(
          ([, url]) => url === src,
        )?.[0];
        if (id)
          node.attrs = {
            src: `/api/v1/science/media/${id}`,
            alt: node.attrs?.alt ?? '',
          };
      }
      node.content?.forEach(walk);
    };
    walk(value);
    return value;
  };
  const apply = async (value: BlogPost) => {
    const document = await displayDocument(value.document);
    if (value.cover_id) await preview(value.cover_id);
    setPost(value);
    setKind(value.kind);
    setTitle(value.title);
    setPreviewContent(value.preview_content ?? '');
    setCategory(value.category_code);
    setEvidence(value.evidence);
    setCover(value.cover_id);
    setCoverAlt(value.cover_alt ?? '');
    editor?.commands.setContent(document, { emitUpdate: false });
    setEditing(true);
    setDirty(false);
    setReviewNote('');
    setHistory(false);
  };
  const discardOkay = () =>
    !dirty || window.confirm(t('editorialBlog.discard'));
  const create = () => {
    if (!discardOkay()) return;
    setPost(null);
    setKind(kindFilter === 'EDITORIAL' ? 'EDITORIAL' : 'ARTICLE');
    setTitle('');
    setPreviewContent('');
    setCategory(categories[0]?.code ?? '');
    setEvidence([]);
    setCover(null);
    setCoverAlt('');
    editor?.commands.setContent(emptyDocument, { emitUpdate: false });
    setDirty(false);
    setEditing(true);
    setError('');
    setSuccess('');
  };
  const open = (id: string) =>
    void run(async () => {
      if (discardOkay()) await apply(await call<BlogPost>(`/posts/${id}`));
    });
  const save = async (action: 'DRAFT' | 'PUBLISH' | 'REVIEW') => {
    const value = await call<BlogPost>(
      post ? `/posts/${post.id}` : '/posts',
      post ? 'PUT' : 'POST',
      {
        expectedVersion: post?.version ?? null,
        kind,
        title,
        previewContent,
        document: persistedDocument(),
        evidence,
        categoryCode: category,
        coverId: cover,
        action,
      },
    );
    await apply(value);
    setConfirm(null);
    setSuccess(
      t(
        action === 'PUBLISH'
          ? 'editorialBlog.published'
          : action === 'REVIEW'
            ? 'editorialBlog.sent'
            : 'editorialBlog.saved',
      ),
    );
    await load();
  };
  const upload = async () => {
    if (!imageFile || !imagePurpose) return;
    const image: BlogImage = await uploadBlogImage(
      await token(),
      imageFile,
      imageAlt,
      imagePurpose,
    );
    const url = await preview(image.id);
    if (imagePurpose === 'COVER') {
      setCover(image.id);
      setCoverAlt(image.alt);
    } else editor?.chain().focus().setImage({ src: url, alt: image.alt }).run();
    setDirty(true);
    setImagePurpose(null);
    setImageFile(null);
    setImageAlt('');
  };
  const date = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  const fieldChange = (fn: () => void) => {
    fn();
    setDirty(true);
  };
  const toolbar = (
    label: string,
    content: ReactNode,
    fn: () => void,
    isActive = false,
  ) => (
    <button
      type="button"
      aria-label={t(`editorialBlog.${label}`)}
      title={t(`editorialBlog.${label}`)}
      aria-pressed={isActive}
      disabled={!canEdit || busy}
      onMouseDown={(e) => e.preventDefault()}
      onClick={fn}
    >
      {content}
    </button>
  );
  const variables = Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [`--ew-${key}`, value]),
  ) as CSSProperties;
  const message = error || success;
  return (
    <main className="ew" style={variables}>
      <style>{workspaceCss}</style>
      <header className="ew-header">
        <div>
          <span className="ew-eyebrow">Soberity</span>
          <h1>
            {t(
              editing
                ? post
                  ? 'editorialBlog.editArticle'
                  : 'editorialBlog.newArticle'
                : 'editorialBlog.library',
            )}
          </h1>
        </div>
        {member?.roles.length && !editing ? (
          <button className="ew-button" disabled={busy || loading} onClick={() => router.push('/editorial-quizzes')}>
            {t('learning.editor.title')}
          </button>
        ) : null}
        {author && !editing ? (
          <button
            className="ew-button ew-primary"
            onClick={create}
            disabled={busy || loading}
          >
            <span aria-hidden="true">＋</span>
            {t('editorial.newDraft')}
          </button>
        ) : null}
      </header>
      {loading ? (
        <p role="status" className="ew-notice">
          {t('editorial.loading')}
        </p>
      ) : null}
      {message ? (
        <div
          role={error ? 'alert' : 'status'}
          className={`ew-notice ${error ? 'ew-error' : 'ew-success'}`}
        >
          {message}
          {error && !editing ? (
            <button
              className="ew-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const who = await call<Membership>('/me');
                  setMember(who);
                  setCategories(await call<BlogCategory[]>('/categories'));
                  await load();
                })
              }
            >
              {t('editorialBlog.retry')}
            </button>
          ) : null}
        </div>
      ) : null}
      {!loading && member && !member.roles.length ? (
        <p className="ew-notice">{t('editorial.denied')}</p>
      ) : null}
      {member?.roles.length ? (
        <>
          {!editing ? (
            <>
              <div className="ew-filters">
                <label>
                  {t('editorial.fields.type')}
                  <div className="ew-select">
                    <select
                      value={kindFilter}
                      disabled={busy}
                      onChange={(e) => {
                        setKindFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="">{t('editorialBlog.allTypes')}</option>
                      <option value="ARTICLE">
                        {t('editorial.values.ARTICLE')}
                      </option>
                      <option value="EDITORIAL">
                        {t('editorialBlog.editorials')}
                      </option>
                    </select>
                    <span aria-hidden="true">⌄</span>
                  </div>
                </label>
                <label>
                  {t('editorial.fields.status')}
                  <div className="ew-select">
                    <select
                      value={statusFilter}
                      disabled={busy}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="">{t('editorialBlog.allStatuses')}</option>
                      {['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'].map(
                        (s) => (
                          <option key={s} value={s}>
                            {t(`editorial.values.${s}`)}
                          </option>
                        ),
                      )}
                    </select>
                    <span aria-hidden="true">⌄</span>
                  </div>
                </label>
              </div>
              {!loading && catalog?.items.length === 0 ? (
                <div className="ew-empty">
                  <span aria-hidden="true">✎</span>
                  <h2>{t('editorialBlog.emptyTitle')}</h2>
                  <p>{t('editorial.empty')}</p>
                </div>
              ) : null}
              <div className="ew-library">
                {catalog?.items.map((item) => (
                  <button
                    className="ew-article-row"
                    key={item.id}
                    onClick={() => open(item.id)}
                    disabled={busy}
                  >
                    <div>
                      <span className="ew-eyebrow">
                        {t(
                          item.kind === 'ARTICLE'
                            ? 'editorialBlog.article'
                            : 'editorialBlog.editorial',
                        )}
                      </span>
                      <h2>{item.title}</h2>
                      <span className="ew-meta">
                        {date(item.updated_at)} · v{item.version}
                      </span>
                    </div>
                    <span
                      className={`ew-badge ew-${item.status.toLowerCase()}`}
                    >
                      {t(`editorial.values.${item.status}`)}
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
              {catalog && catalog.total > catalog.size ? (
                <nav
                  className="ew-pagination"
                  aria-label={t('editorialBlog.pagination')}
                >
                  <button
                    className="ew-button"
                    disabled={busy || page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    {t('editorial.previous')}
                  </button>
                  <span>
                    {t('editorial.page', {
                      page: page + 1,
                      total: catalog.total,
                    })}
                  </span>
                  <button
                    className="ew-button"
                    disabled={
                      busy || (page + 1) * catalog.size >= catalog.total
                    }
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('editorial.next')}
                  </button>
                </nav>
              ) : null}
            </>
          ) : (
            <>
              <div className="ew-editor-header">
                <button
                  className="ew-text-button"
                  onClick={() => {
                    if (discardOkay()) {
                      setEditing(false);
                      setDirty(false);
                      setPost(null);
                    }
                  }}
                >
                  ← {t('editorialBlog.back')}
                </button>
                <div className="ew-actions">
                  {post ? (
                    <span className="ew-badge">
                      {t(`editorial.values.${post.status}`)}
                    </span>
                  ) : null}
                  {canEdit ? (
                    <>
                      <button
                        className="ew-button"
                        disabled={
                          busy || !title.trim() || (active?.empty ?? true)
                        }
                        onClick={() => void run(() => save('DRAFT'))}
                      >
                        {t('editorial.saveDraft')}
                      </button>
                      <button
                        className="ew-button"
                        disabled={
                          busy ||
                          !title.trim() ||
                          !evidence.length ||
                          (active?.empty ?? true)
                        }
                        onClick={() => void run(() => save('REVIEW'))}
                      >
                        {t('editorialBlog.sendReview')}
                      </button>
                      <button
                        className="ew-button ew-primary"
                        disabled={
                          busy ||
                          !title.trim() ||
                          !evidence.length ||
                          (active?.empty ?? true)
                        }
                        onClick={() => setConfirm('PUBLISH')}
                      >
                        {t('editorialBlog.publish')}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="ew-compose-grid">
                <article className="ew-paper">
                  <label className="ew-title-label" htmlFor="ew-title">
                    {t('editorial.fields.title')}
                  </label>
                  <input
                    id="ew-title"
                    className="ew-title-input"
                    placeholder={t('editorialBlog.titlePlaceholder')}
                    value={title}
                    maxLength={500}
                    readOnly={!canEdit || busy}
                    onChange={(e) =>
                      fieldChange(() => setTitle(e.target.value))
                    }
                  />
                  <div className="ew-preview-field">
                    <label htmlFor="ew-preview-content">{t('editorialBlog.previewContent')}</label>
                    <textarea
                      id="ew-preview-content"
                      value={previewContent}
                      maxLength={280}
                      rows={2}
                      disabled={!canEdit || busy || loading}
                      aria-describedby="ew-preview-help"
                      onChange={event => fieldChange(() => setPreviewContent(event.target.value))}
                    />
                    <small id="ew-preview-help">{t('editorialBlog.previewHelp')} {previewContent.length}/280</small>
                  </div>
                  <div
                    className="ew-toolbar"
                    role="toolbar"
                    aria-label={t('editorialBlog.formatting')}
                  >
                    {toolbar(
                      'bold',
                      <b>B</b>,
                      () => {
                        editor?.chain().focus().toggleBold().run();
                      },
                      !!active?.bold,
                    )}
                    {toolbar(
                      'italic',
                      <i>I</i>,
                      () => {
                        editor?.chain().focus().toggleItalic().run();
                      },
                      !!active?.italic,
                    )}
                    {toolbar(
                      'underline',
                      <u>U</u>,
                      () => {
                        editor?.chain().focus().toggleUnderline().run();
                      },
                      !!active?.underline,
                    )}
                    <span className="ew-toolbar-divider" />
                    {toolbar(
                      'heading',
                      'H₂',
                      () => {
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 2 })
                          .run();
                      },
                      !!active?.heading,
                    )}
                    {toolbar(
                      'bullets',
                      '• ≡',
                      () => {
                        editor?.chain().focus().toggleBulletList().run();
                      },
                      !!active?.bullet,
                    )}
                    {toolbar('numbered', '1. ≡', () => {
                      editor?.chain().focus().toggleOrderedList().run();
                    })}
                    {toolbar('quote', '❝', () => {
                      editor?.chain().focus().toggleBlockquote().run();
                    })}
                    <span className="ew-toolbar-divider" />
                    {toolbar('alignLeft', '≡←', () => {
                      editor?.chain().focus().setTextAlign('left').run();
                    })}
                    {toolbar('alignCenter', '≡', () => {
                      editor?.chain().focus().setTextAlign('center').run();
                    })}
                    {toolbar('alignRight', '→≡', () => {
                      editor?.chain().focus().setTextAlign('right').run();
                    })}
                    {toolbar('justify', '☰', () => {
                      editor?.chain().focus().setTextAlign('justify').run();
                    })}
                    <span className="ew-toolbar-divider" />
                    {toolbar('inlineImage', '▧', () => {
                      setImagePurpose('INLINE');
                      setImageFile(null);
                      setImageAlt('');
                    })}
                    {toolbar('undo', '↶', () => {
                      editor?.chain().focus().undo().run();
                    })}
                    {toolbar('redo', '↷', () => {
                      editor?.chain().focus().redo().run();
                    })}
                  </div>
                  <EditorContent editor={editor} />
                  <footer className="ew-evidence">
                    <div className="ew-section-heading">
                      <div>
                        <span className="ew-eyebrow">
                          {t('editorialBlog.evidenceEyebrow')}
                        </span>
                        <h2>{t('editorialBlog.evidence')}</h2>
                      </div>
                      {canEdit ? (
                        <button
                          className="ew-text-button"
                          disabled={busy}
                          onClick={() =>
                            fieldChange(() =>
                              setEvidence((v) => [
                                ...v,
                                { title: '', url: '' },
                              ]),
                            )
                          }
                        >
                          <span aria-hidden="true">＋</span>{' '}
                          {t('editorialBlog.addEvidence')}
                        </button>
                      ) : null}
                    </div>
                    {!evidence.length ? (
                      <p className="ew-meta">
                        {t('editorialBlog.evidenceHint')}
                      </p>
                    ) : null}
                    {evidence.map((source, index) => (
                      <div className="ew-source" key={index}>
                        <span className="ew-source-number">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <label>
                            {t('editorialBlog.sourceTitle')}
                            <input
                              value={source.title}
                              maxLength={1000}
                              readOnly={!canEdit || busy}
                              onChange={(e) =>
                                fieldChange(() =>
                                  setEvidence((v) =>
                                    v.map((s, i) =>
                                      i === index
                                        ? { ...s, title: e.target.value }
                                        : s,
                                    ),
                                  ),
                                )
                              }
                            />
                          </label>
                          <label>
                            {t('editorialBlog.sourceUrl')}
                            <input
                              type="url"
                              placeholder="https://"
                              value={source.url}
                              readOnly={!canEdit || busy}
                              onChange={(e) =>
                                fieldChange(() =>
                                  setEvidence((v) =>
                                    v.map((s, i) =>
                                      i === index
                                        ? { ...s, url: e.target.value }
                                        : s,
                                    ),
                                  ),
                                )
                              }
                            />
                          </label>
                        </div>
                        {canEdit ? (
                          <button
                            className="ew-icon-button"
                            aria-label={t('editorialBlog.removeSource', {
                              index: index + 1,
                            })}
                            disabled={busy}
                            onClick={() =>
                              fieldChange(() =>
                                setEvidence((v) =>
                                  v.filter((_, i) => i !== index),
                                ),
                              )
                            }
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </footer>
                </article>
                <aside className="ew-sidebar">
                  {post?.review_notes ? (
                    <section className="ew-side-card">
                      <h2>{t('editorial.review')}</h2>
                      <p className="ew-meta">{post.review_notes}</p>
                    </section>
                  ) : null}
                  <section className="ew-side-card">
                    <h2>{t('editorialBlog.details')}</h2>
                    <label>
                      {t('editorial.fields.category')}
                      <div className="ew-select">
                        <select
                          value={category}
                          disabled={!canEdit || busy}
                          onChange={(e) =>
                            fieldChange(() => setCategory(e.target.value))
                          }
                        >
                          <option value="" disabled>
                            {t('editorialBlog.chooseCategory')}
                          </option>
                          {categories.map((c) => (
                            <option key={c.code} value={c.code}>
                              {i18n.language.startsWith('pl')
                                ? c.label_pl
                                : c.label_en}
                            </option>
                          ))}
                        </select>
                        <span aria-hidden="true">⌄</span>
                      </div>
                    </label>
                    {canEdit ? (
                      <button
                        className="ew-text-button"
                        disabled={busy}
                        onClick={() => setCategoryOpen((v) => !v)}
                      >
                        <span aria-hidden="true">＋</span>{' '}
                        {t('editorialBlog.newCategory')}
                      </button>
                    ) : null}
                    {categoryOpen ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void run(async () => {
                            const value = await call<BlogCategory>(
                              '/categories',
                              'POST',
                              { name: newCategory },
                            );
                            setCategories((v) => [...v, value]);
                            setCategory(value.code);
                            setDirty(true);
                            setCategoryOpen(false);
                            setNewCategory('');
                          });
                        }}
                      >
                        <label>
                          {t('editorialBlog.categoryName')}
                          <input
                            value={newCategory}
                            maxLength={100}
                            onChange={(e) => setNewCategory(e.target.value)}
                          />
                        </label>
                        <button
                          className="ew-button"
                          disabled={busy || !newCategory.trim()}
                        >
                          {t('editorialBlog.addCategory')}
                        </button>
                      </form>
                    ) : null}
                  </section>
                  <section className="ew-side-card">
                    <h2>{t('editorialBlog.cover')}</h2>
                    {cover && previews[cover] ? (
                      <img
                        className="ew-cover"
                        src={previews[cover]}
                        alt={coverAlt || t('editorialBlog.coverPreview')}
                      />
                    ) : (
                      <div
                        className="ew-cover ew-cover-empty"
                        aria-hidden="true"
                      >
                        ▧
                      </div>
                    )}
                    <p className="ew-meta">1600 × 900 px · 16:9 · PNG / JPEG</p>
                    {canEdit ? (
                      <div className="ew-actions">
                        <button
                          className="ew-button"
                          disabled={busy}
                          onClick={() => {
                            setImagePurpose('COVER');
                            setImageFile(null);
                            setImageAlt('');
                          }}
                        >
                          {t(
                            cover
                              ? 'editorialBlog.replaceImage'
                              : 'editorialBlog.addImage',
                          )}
                        </button>
                        {cover ? (
                          <button
                            className="ew-text-button"
                            disabled={busy}
                            onClick={() => fieldChange(() => setCover(null))}
                          >
                            {t('editorialBlog.removeImage')}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                  {post ? (
                    <section className="ew-side-card">
                      <h2>{t('editorialBlog.dates')}</h2>
                      <dl>
                        <dt>{t('editorialBlog.created')}</dt>
                        <dd>{date(post.created_at)}</dd>
                        <dt>{t('editorialBlog.modified')}</dt>
                        <dd>{date(post.updated_at)}</dd>
                      </dl>
                      <span className="ew-meta">
                        {t('editorialBlog.version', { version: post.version })}
                      </span>
                      {post.status === 'PUBLISHED' ? (
                        <p className="ew-meta">
                          {t(
                            post.publication_route === 'REVIEWED'
                              ? 'editorialBlog.reviewed'
                              : 'editorialBlog.authorPublished',
                          )}
                        </p>
                      ) : null}
                      <button
                        className="ew-text-button"
                        onClick={() => setHistory((v) => !v)}
                      >
                        {t('editorial.versions')}
                      </button>
                      {history ? (
                        <ol className="ew-history">
                          {post.history?.map((v) => (
                            <li key={v.version}>
                              v{v.version} · {t(`editorial.values.${v.status}`)}
                              <small>{date(v.created_at)}</small>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                      {(canEdit || reviewer) && post.status !== 'ARCHIVED' ? (
                        <button
                          className="ew-text-button ew-danger"
                          disabled={busy}
                          onClick={() => setConfirm('ARCHIVE')}
                        >
                          {t('editorial.archive')}
                        </button>
                      ) : null}
                    </section>
                  ) : null}
                  {reviewer && !own && post?.status === 'IN_REVIEW' ? (
                    <section className="ew-side-card">
                      <h2>{t('editorial.review')}</h2>
                      <label>
                        {t('editorial.fields.notes')}
                        <textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          maxLength={20000}
                        />
                      </label>
                      <button
                        className="ew-button ew-primary"
                        disabled={busy || !reviewNote.trim()}
                        onClick={() =>
                          void run(async () => {
                            await apply(
                              await call<BlogPost>(
                                `/posts/${post.id}/decision`,
                                'POST',
                                {
                                  version: post.version,
                                  decision: 'PUBLISH',
                                  notes: reviewNote,
                                },
                              ),
                            );
                            setSuccess(t('editorialBlog.published'));
                            await load();
                          })
                        }
                      >
                        {t('editorialBlog.approvePublish')}
                      </button>
                      <button
                        className="ew-button"
                        disabled={busy || !reviewNote.trim()}
                        onClick={() =>
                          void run(async () => {
                            await apply(
                              await call<BlogPost>(
                                `/posts/${post.id}/decision`,
                                'POST',
                                {
                                  version: post.version,
                                  decision: 'CHANGES_REQUESTED',
                                  notes: reviewNote,
                                },
                              ),
                            );
                            await load();
                          })
                        }
                      >
                        {t('editorial.decisions.CHANGES_REQUESTED')}
                      </button>
                    </section>
                  ) : null}
                </aside>
              </div>
            </>
          )}
        </>
      ) : null}
      {imagePurpose ? (
        <BlogDialog
          titleId="ew-image-heading"
          busy={busy}
          onClose={() => setImagePurpose(null)}
        >
          <button
            autoFocus
            className="ew-modal-close"
            aria-label={t('editorial.close')}
            onClick={() => {
              if (!busy) setImagePurpose(null);
            }}
          >
            ×
          </button>
          <h2 id="ew-image-heading">
            {t(
              imagePurpose === 'COVER'
                ? 'editorialBlog.cover'
                : 'editorialBlog.inlineImage',
            )}
          </h2>
          {error ? (
            <p role="alert" className="ew-error">
              {error}
            </p>
          ) : null}
          <label>
            {t('editorialBlog.imageFile')}
            <input
              type="file"
              accept="image/jpeg,image/png"
              disabled={busy}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            {t('editorialBlog.imageAlt')}
            <input
              value={imageAlt}
              maxLength={500}
              disabled={busy}
              onChange={(e) => setImageAlt(e.target.value)}
            />
          </label>
          <p className="ew-meta">{t('editorialBlog.imageHint')}</p>
          <button
            className="ew-button ew-primary"
            disabled={busy || !imageFile || !imageAlt.trim()}
            onClick={() => void run(upload)}
          >
            {t(busy ? 'editorialBlog.uploading' : 'editorialBlog.insertImage')}
          </button>
        </BlogDialog>
      ) : null}
      {confirm ? (
        <BlogDialog
          titleId="ew-confirm-heading"
          busy={busy}
          onClose={() => setConfirm(null)}
        >
          <h2 id="ew-confirm-heading">
            {t(
              confirm === 'PUBLISH'
                ? 'editorialBlog.publish'
                : 'editorial.archive',
            )}
          </h2>
          <p>
            {t(
              confirm === 'PUBLISH'
                ? 'editorialBlog.confirmPublish'
                : 'editorialBlog.confirmArchive',
            )}
          </p>
          {error ? <p role="alert">{error}</p> : null}
          <div className="ew-actions">
            <button
              autoFocus
              className="ew-button"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              {t('editorialBlog.cancel')}
            </button>
            <button
              className="ew-button ew-primary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  if (confirm === 'PUBLISH') await save('PUBLISH');
                  else if (post) {
                    await call(`/posts/${post.id}/archive`, 'POST', {
                      version: post.version,
                    });
                    setConfirm(null);
                    setEditing(false);
                    setDirty(false);
                    await load();
                  }
                })
              }
            >
              {t('editorial.confirm')}
            </button>
          </div>
        </BlogDialog>
      ) : null}
    </main>
  );
}

function BlogDialog({
  children,
  titleId,
  busy,
  onClose,
}: {
  children: ReactNode;
  titleId: string;
  busy: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="ew-modal"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

const workspaceCss = `
.ew{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ew-textPrimary);background:var(--ew-background);min-height:100%;height:100%;overflow-y:auto;padding:${spacing.space24}px ${spacing.space32}px ${spacing.space64}px;box-sizing:border-box;max-width:1440px;width:100%;margin:0 auto}
.ew *{box-sizing:border-box}.ew button,.ew input,.ew select,.ew textarea{font:inherit}.ew button{cursor:pointer}.ew button:disabled{cursor:default;opacity:.5}.ew :focus-visible{outline:2px solid var(--ew-focusRing);outline-offset:3px}.ew h1,.ew h2,.ew p{margin:0}.ew h1{font-size:${typography.h2.fontSize}px;line-height:${typography.h2.lineHeight}px;letter-spacing:-.5px}.ew h2{font-size:${typography.bodyStrong.fontSize}px;line-height:${typography.bodyStrong.lineHeight}px;font-weight:600}.ew-header{display:flex;align-items:center;justify-content:space-between;gap:${spacing.space24}px;padding-bottom:${spacing.space32}px}.ew-eyebrow{display:block;font-size:${typography.caption.fontSize}px;line-height:${typography.caption.lineHeight}px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ew-textMuted);margin-bottom:${spacing.space8}px}.ew-header .ew-eyebrow{color:var(--ew-primary)}
.ew-button{min-height:44px;border:1px solid var(--ew-border);border-radius:${radii.md}px;padding:${spacing.space12}px ${spacing.space16}px;display:inline-flex;gap:${spacing.space8}px;align-items:center;justify-content:center;background:var(--ew-surface);color:var(--ew-textPrimary);font-size:${typography.label.fontSize}px;font-weight:600;transition:background .15s,border-color .15s;white-space:normal}.ew-button:hover:not(:disabled){background:var(--ew-surfaceAlt);border-color:var(--ew-primary)}.ew-primary{background:var(--ew-primary);border-color:var(--ew-primary);color:var(--ew-onPrimary)}.ew-primary:hover:not(:disabled){background:var(--ew-primaryPressed);border-color:var(--ew-primaryPressed)}.ew-text-button{border:0;background:transparent;padding:${spacing.space8}px 0;min-height:44px;color:var(--ew-primary);font-size:${typography.label.fontSize}px;text-align:left}.ew-danger{color:var(--ew-danger)}.ew-notice{padding:${spacing.space16}px;border:1px solid var(--ew-border);background:var(--ew-surface);border-radius:${radii.md}px;margin-bottom:${spacing.space24}px;font-size:${typography.small.fontSize}px;line-height:${typography.small.lineHeight}px;display:flex;gap:${spacing.space16}px;align-items:center;justify-content:space-between}.ew-error{color:var(--ew-danger)}.ew-success{color:var(--ew-success)}
.ew label{display:grid;gap:${spacing.space8}px;font-size:${typography.label.fontSize}px;font-weight:600;color:var(--ew-primary);min-width:0}.ew input,.ew textarea{width:100%;border:1px solid var(--ew-border);background:var(--ew-background);border-radius:${radii.sm}px;min-height:44px;padding:${spacing.space12}px;color:var(--ew-textPrimary);font-weight:400;min-width:0}.ew input::placeholder{color:var(--ew-textMuted)}.ew textarea{min-height:120px;resize:vertical}.ew input[type=file]{padding:${spacing.space8}px}.ew-filters{display:flex;gap:${spacing.space16}px;padding:${spacing.space24}px 0;border-top:1px solid var(--ew-border)}.ew-filters>label{width:220px}.ew-select{position:relative}.ew-select select{appearance:none;width:100%;min-height:48px;background:var(--ew-surface);border:1px solid var(--ew-border);border-radius:${radii.md}px;padding:${spacing.space12}px ${spacing.space40}px ${spacing.space12}px ${spacing.space16}px;color:var(--ew-textPrimary);font-size:${typography.small.fontSize}px;font-weight:500;cursor:pointer}.ew-select select:hover{border-color:var(--ew-primary)}.ew-select span{position:absolute;right:${spacing.space16}px;top:50%;transform:translateY(-60%);pointer-events:none;color:var(--ew-primary);font-size:20px}
.ew-library{display:grid;gap:${spacing.space12}px}.ew-article-row{display:flex;align-items:center;gap:${spacing.space24}px;width:100%;border:1px solid var(--ew-border);border-radius:${radii.lg}px;padding:${spacing.space24}px;text-align:left;background:var(--ew-surface);color:var(--ew-textPrimary)}.ew-article-row:hover{border-color:var(--ew-primary)}.ew-article-row>div{flex:1;min-width:0}.ew-article-row h2{overflow-wrap:anywhere;margin-bottom:${spacing.space8}px}.ew-meta{color:var(--ew-textMuted);font-size:${typography.small.fontSize}px;line-height:${typography.small.lineHeight}px}.ew-badge{font-size:${typography.caption.fontSize}px;line-height:${typography.caption.lineHeight}px;font-weight:600;padding:${spacing.space8}px ${spacing.space12}px;border:1px solid var(--ew-border);border-radius:${radii.pill}px;color:var(--ew-textSecondary);background:var(--ew-surfaceAlt);white-space:nowrap}.ew-published{color:var(--ew-success)}.ew-in_review{color:var(--ew-warning)}.ew-empty{padding:${spacing.space64}px ${spacing.space24}px;text-align:center;border:1px dashed var(--ew-border);border-radius:${radii.lg}px;background:var(--ew-surface)}.ew-empty>span{display:block;font-size:36px;color:var(--ew-primary);margin-bottom:${spacing.space16}px}.ew-empty p{margin-top:${spacing.space8}px;color:var(--ew-textMuted);font-size:${typography.small.fontSize}px}.ew-pagination{display:flex;align-items:center;justify-content:center;gap:${spacing.space16}px;margin-top:${spacing.space24}px;font-size:${typography.small.fontSize}px}
.ew-editor-header{display:flex;justify-content:space-between;align-items:center;gap:${spacing.space16}px;margin-bottom:${spacing.space24}px;flex-wrap:wrap}.ew-actions{display:flex;gap:${spacing.space8}px;align-items:center;flex-wrap:wrap}.ew-compose-grid{display:grid;grid-template-columns:minmax(0,1fr) 288px;gap:${spacing.space24}px;align-items:start}.ew-paper{background:var(--ew-surface);border:1px solid var(--ew-border);border-radius:${radii.lg}px;min-width:0;overflow:hidden}.ew-title-label{padding:${spacing.space32}px ${spacing.space32}px 0}.ew .ew-title-input{border:0;border-radius:0;background:transparent;font-size:${typography.h1.fontSize}px;font-weight:700;line-height:${typography.h1.lineHeight}px;padding:${spacing.space12}px ${spacing.space32}px ${spacing.space24}px;letter-spacing:-.7px}.ew .ew-title-input:focus-visible{outline-offset:-4px}.ew-preview-field{display:grid;gap:${spacing.space8}px;padding:0 ${spacing.space16}px ${spacing.space16}px}.ew-preview-field label{color:var(--ew-primary);font-size:${typography.label.fontSize}px;font-weight:600}.ew-preview-field textarea{resize:vertical;min-height:72px;padding:${spacing.space12}px;background:var(--ew-surface);color:var(--ew-textPrimary);border:1px solid var(--ew-border);border-radius:${radii.sm}px;font:inherit;line-height:1.5}.ew-preview-field small{color:var(--ew-textMuted);font-size:${typography.caption.fontSize}px}.ew-toolbar{display:flex;flex-wrap:wrap;gap:${spacing.space4}px;padding:${spacing.space8}px ${spacing.space16}px;border-top:1px solid var(--ew-border);border-bottom:1px solid var(--ew-border);background:var(--ew-surfaceAlt)}.ew-toolbar button{display:grid;place-items:center;min-width:44px;min-height:44px;background:transparent;border:0;border-radius:${radii.sm}px;color:var(--ew-textSecondary);font-size:16px}.ew-toolbar button:hover:not(:disabled),.ew-toolbar button[aria-pressed=true]{background:var(--ew-primary);color:var(--ew-onPrimary)}.ew-toolbar-divider{width:1px;background:var(--ew-border);margin:${spacing.space8}px ${spacing.space4}px}.ew-prose{min-height:360px;padding:${spacing.space32}px;font-size:${typography.body.fontSize}px;line-height:1.7;overflow-wrap:anywhere;outline:none}.ew-prose:focus-visible{outline:2px solid var(--ew-focusRing);outline-offset:-4px}.ew-prose p{margin:0 0 ${spacing.space16}px}.ew-prose h1,.ew-prose h2,.ew-prose h3{margin:${spacing.space24}px 0 ${spacing.space16}px;line-height:1.3}.ew-prose h2{font-size:${typography.h2.fontSize}px}.ew-prose h3{font-size:${typography.h3.fontSize}px}.ew-prose ul,.ew-prose ol{padding-left:${spacing.space24}px}.ew-prose li p{margin:0}.ew-prose blockquote{margin:${spacing.space24}px 0;padding-left:${spacing.space16}px;border-left:3px solid var(--ew-primary);color:var(--ew-textSecondary)}.ew-prose img{display:block;max-width:100%;height:auto;border-radius:${radii.md}px;margin:${spacing.space24}px 0}.ew-prose a{color:var(--ew-primary);text-decoration:underline}.ew-prose hr{border:0;border-top:1px solid var(--ew-border)}
.ew-evidence{border-top:1px solid var(--ew-border);padding:${spacing.space32}px}.ew-section-heading{display:flex;justify-content:space-between;gap:${spacing.space16}px;align-items:center;margin-bottom:${spacing.space24}px}.ew-source{display:flex;gap:${spacing.space12}px;align-items:start;margin-top:${spacing.space16}px}.ew-source>div{display:grid;gap:${spacing.space12}px;flex:1;min-width:0}.ew-source-number{padding-top:${spacing.space32}px;color:var(--ew-primary);font-size:${typography.small.fontSize}px;font-weight:600}.ew-icon-button{border:0;background:transparent;color:var(--ew-textMuted);font-size:24px;min-width:44px;min-height:44px;margin-top:${spacing.space24}px}.ew-sidebar{display:grid;gap:${spacing.space16}px}.ew-side-card{background:var(--ew-surface);border:1px solid var(--ew-border);border-radius:${radii.lg}px;padding:${spacing.space24}px;display:grid;gap:${spacing.space16}px}.ew-side-card>h2{color:var(--ew-textPrimary)}.ew-side-card form{display:grid;gap:${spacing.space12}px}.ew-cover{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:${radii.md}px;background:var(--ew-surfaceAlt)}.ew-cover-empty{display:grid;place-items:center;color:var(--ew-textMuted);font-size:36px;border:1px dashed var(--ew-border)}.ew-side-card dl{margin:0;display:grid;gap:${spacing.space8}px}.ew-side-card dt{font-size:${typography.caption.fontSize}px;color:var(--ew-textMuted)}.ew-side-card dd{margin:0 0 ${spacing.space8}px;font-size:${typography.small.fontSize}px}.ew-history{margin:0;padding-left:${spacing.space16}px;font-size:${typography.small.fontSize}px}.ew-history small{display:block;color:var(--ew-textMuted);margin:${spacing.space4}px 0 ${spacing.space12}px}.ew-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:${spacing.space16}px;z-index:1000}.ew-modal::backdrop{background:rgba(0,0,0,.5)}.ew-modal{color:var(--ew-textPrimary);font-family:system-ui,sans-serif;margin:auto;background:var(--ew-surface);border:1px solid var(--ew-border);border-radius:${radii.lg}px;padding:${spacing.space32}px;max-width:520px;width:100%;display:grid;gap:${spacing.space24}px;position:relative;max-height:90vh;overflow:auto}.ew-modal p{line-height:${typography.body.lineHeight}px;font-size:${typography.body.fontSize}px}.ew-modal-close{position:absolute;right:${spacing.space12}px;top:${spacing.space8}px;min-width:44px;min-height:44px;border:0;background:transparent;color:var(--ew-textSecondary);font-size:28px}
@media(max-width:900px){.ew-compose-grid{grid-template-columns:minmax(0,1fr)}.ew-sidebar{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.ew{padding:${spacing.space16}px ${spacing.space16}px ${spacing.space40}px}.ew-header{gap:${spacing.space12}px;align-items:start}.ew h1{font-size:${typography.h3.fontSize}px;line-height:${typography.h3.lineHeight}px}.ew-header .ew-button{padding:${spacing.space12}px}.ew-filters{gap:${spacing.space12}px}.ew-filters>label{width:50%}.ew-article-row{padding:${spacing.space16}px;gap:${spacing.space12}px;flex-wrap:wrap}.ew-article-row>div{flex-basis:65%}.ew-sidebar{grid-template-columns:minmax(0,1fr)}.ew-title-label{padding:${spacing.space24}px ${spacing.space16}px 0}.ew .ew-title-input{font-size:${typography.h2.fontSize}px;line-height:${typography.h2.lineHeight}px;padding:${spacing.space12}px ${spacing.space16}px ${spacing.space24}px}.ew-prose{padding:${spacing.space24}px ${spacing.space16}px;min-height:300px}.ew-evidence{padding:${spacing.space24}px ${spacing.space16}px}.ew-section-heading{align-items:start;flex-direction:column;gap:${spacing.space8}px}.ew-editor-header>.ew-actions{width:100%;justify-content:flex-end}.ew-side-card{padding:${spacing.space16}px}.ew-toolbar{padding:${spacing.space8}px}.ew-toolbar button{min-width:44px}.ew-notice{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){.ew *{transition:none!important}}
`;
