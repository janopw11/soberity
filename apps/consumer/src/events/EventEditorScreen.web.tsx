import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { CATEGORY_CODES } from './eventsApi';
import { LocationSelect } from './LocationSelect';
import AddressAutocomplete from './AddressAutocomplete.web';
import { placeAddressPoint, type AddressSelection } from './addressSelection';
import type { LocationRecord } from './discoveryApi';

const LocationPreviewMap = lazy(() => import('./LocationPreviewMap.web'));
import {
  EventEditorError,
  eventEditorImage,
  eventEditorRequest,
  type EditorEvent,
  type EventLibrary,
} from './eventEditorApi';

const blank = () => ({
  title: '',
  organizerUrl: '',
  start: '',
  end: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  category: 'SOBER_PARTY',
  name: '',
  address: '',
  rules: '',
  drinks: '',
  source: '',
  sourceUrl: '',
  rights: false,
  strictConfirmed: false,
  beverageConfirmed: false,
  alt: '',
});
const localTime = (value: unknown) => {
  if (!value) return '';
  const d = new Date(String(value));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const emptyDocument = () => ({ type: 'doc', content: [{ type: 'paragraph' }] });
/** Rebuilds the stored selection so an unchanged address keeps its precise point on save. */
function selectionFromContent(
  content: Record<string, unknown>,
): AddressSelection | null {
  const precision = content.location_precision;
  if (precision !== 'ADDRESS' && precision !== 'VENUE' && precision !== 'CITY')
    return null;
  const exact = precision !== 'CITY';
  const latitude = Number(content.latitude);
  const longitude = Number(content.longitude);
  const hasPoint =
    content.latitude !== null &&
    content.longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  return {
    formattedAddress: String(
      content.formatted_address ?? content.address ?? '',
    ),
    street: (content.street as string | null) ?? null,
    buildingNumber: (content.building_number as string | null) ?? null,
    postalCode: (content.postal_code as string | null) ?? null,
    city: null,
    countryCode: null,
    providerPlaceId: (content.provider_place_id as string | null) ?? null,
    latitude: exact ? latitude : null,
    longitude: exact ? longitude : null,
    center: hasPoint ? { latitude, longitude } : null,
    locationPrecision: precision,
  };
}
export default function EventEditorScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useThemePreferences();
  const { getIdToken, user } = useAuthStatus();
  const [catalog, setCatalog] = useState<EventLibrary | null>(null),
    [page, setPage] = useState(0);
  const [filterCountry, setFilterCountry] = useState<LocationRecord | null>(
      null,
    ),
    [filterCity, setFilterCity] = useState<LocationRecord | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false),
    [attempt, retry] = useState(0);
  const [current, setCurrent] = useState<EditorEvent | null>(null),
    [editing, setEditing] = useState(false),
    [form, setForm] = useState(blank);
  const [cover, setCover] = useState<string | null>(null),
    [preview, setPreview] = useState('');
  const [geo, setGeo] = useState<AddressSelection | null>(null),
    [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [dirty, setDirty] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3] },
        link: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: emptyDocument(),
    editorProps: {
      attributes: {
        class: 'ev-prose',
        role: 'textbox',
        'aria-label': t('eventEditor.description'),
        'aria-multiline': 'true',
      },
    },
    onUpdate: () => {
      if (editing) setDirty(true);
    },
  });
  const token = async () => {
    const value = await getIdToken();
    if (!value) throw new EventEditorError(401);
    return value;
  };
  const failure = (reason: unknown) => {
    if (
      reason instanceof EventEditorError &&
      (reason.status === 403 || reason.status === 401)
    ) {
      setAllowed(false);
      setEditing(false);
      setCatalog(null);
    }
    setError(
      t(
        reason instanceof EventEditorError && reason.status === 409
          ? 'eventEditor.conflict'
          : reason instanceof EventEditorError && reason.status === 403
            ? 'eventEditor.forbidden'
            : 'eventEditor.error',
      ),
    );
  };
  const act = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await work();
    } catch (reason) {
      failure(reason);
    } finally {
      setBusy(false);
    }
  };
  const load = useCallback(async () => {
    const key = await getIdToken();
    if (!key) throw new EventEditorError(401);
    const params = new URLSearchParams({ page: String(page), size: '20' });
    if (filterCountry) params.set('countryId', filterCountry.id);
    if (filterCity) params.set('cityId', filterCity.id);
    return eventEditorRequest<EventLibrary>(key, `?${params}`);
  }, [getIdToken, page, filterCountry, filterCity]);
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0 });
  }, [editing]);
  useEffect(() => {
    setAllowed(false);
    setEditing(false);
    setDirty(false);
    setCover(null);
  }, [user?.uid]);
  useEffect(() => {
    let active = true;
    setCatalog(null);
    setError('');
    void load()
      .then((result) => {
        if (active) {
          setCatalog(result);
          setAllowed(true);
        }
      })
      .catch((reason) => {
        if (active) {
          if (
            reason instanceof EventEditorError &&
            (reason.status === 401 || reason.status === 403)
          )
            setAllowed(false);
          setError(
            t(
              reason instanceof EventEditorError && reason.status === 403
                ? 'eventEditor.forbidden'
                : 'eventEditor.error',
            ),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [load, attempt, user?.uid, t]);
  useEffect(() => {
    let active = true,
      url = '';
    setPreview('');
    if (allowed && cover)
      void (async () => {
        url = await eventEditorImage(await token(), cover);
        if (active) setPreview(url);
        else URL.revokeObjectURL(url);
      })().catch((reason) => {
        if (active) failure(reason);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [allowed, cover, getIdToken]);
  useEffect(() => {
    editor?.setEditable(allowed && editing && !busy, false);
  }, [editor, allowed, editing, busy]);
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  const update = <K extends keyof ReturnType<typeof blank>>(
    key: K,
    value: ReturnType<typeof blank>[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  };
  const refresh = async () => {
    const result = await load();
    if (result.items.length === 0 && page > 0) setPage(page - 1);
    else setCatalog(result);
  };
  const open = (id?: string) => {
    void act(async () => {
      if (dirty && !window.confirm(t('eventEditor.discard'))) return;
      if (!id) {
        setCurrent(null);
        setForm(blank());
        setCover(null);
        setGeo(null);
        setFormKey((key) => key + 1);
        editor?.commands.setContent(emptyDocument());
      } else {
        const detail = await eventEditorRequest<EditorEvent>(
            await token(),
            `/${id}`,
          ),
          c = detail.content;
        setCurrent(detail);
        setGeo(selectionFromContent(c));
        setFormKey((key) => key + 1);
        setCover(c.cover_id);
        setForm({
          ...blank(),
          title: c.title,
          organizerUrl: String(c.organizer_url ?? ''),
          start: localTime(c.starts_at),
          end: localTime(c.ends_at),
          timezone: String(c.timezone),
          category: String(c.category_code),
          name: String(c.venue_name ?? ''),
          address: String(c.address ?? ''),
          rules: String(c.alcohol_rules),
          drinks: String(c.beverage_notes),
          source: String(c.source_reference),
          sourceUrl: String(c.source_url),
          rights: c.content_rights_attested === true,
          strictConfirmed:
            c.alcohol_sold === false &&
            c.alcohol_served === false &&
            c.alcohol_permitted === false,
          beverageConfirmed: c.beverage_rules_confirmed === true,
        });
        editor?.commands.setContent(
          c.description_document ?? {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: String(c.description) }],
              },
            ],
          },
        );
      }
      setEditing(true);
      setDirty(false);
    });
  };
  const save = async () => {
    if (
      !editor ||
      editor.isEmpty ||
      !form.title.trim() ||
      !form.organizerUrl.trim() ||
      !form.start ||
      !form.rules.trim() ||
      !form.drinks.trim() ||
      !form.source.trim() ||
      !form.sourceUrl.trim() ||
      !cover ||
      !form.rights ||
      !form.strictConfirmed ||
      !form.beverageConfirmed
    ) {
      setError(t('eventEditor.required'));
      return null;
    }
    if (!geo || geo.latitude === null || geo.longitude === null) {
      setError(t('eventEditor.location.confirmRequired'));
      return null;
    }
    const start = new Date(
      current && form.start === localTime(current.content.starts_at)
        ? String(current.content.starts_at)
        : form.start,
    );
    const end = form.end
      ? new Date(
          current && form.end === localTime(current.content.ends_at)
            ? String(current.content.ends_at)
            : form.end,
        )
      : null;
    if (
      !Number.isFinite(start.getTime()) ||
      localTime(start.toISOString()) !== form.start ||
      (end &&
        (!Number.isFinite(end.getTime()) ||
          localTime(end.toISOString()) !== form.end ||
          end <= start))
    ) {
      setError(t('eventEditor.dateError'));
      return null;
    }
    const saved = await eventEditorRequest<EditorEvent>(
      await token(),
      current ? `/${current.id}` : '',
      current ? 'PUT' : 'POST',
      {
        expectedVersion: current?.version ?? null,
        venueName: form.name,
        address: form.address,
        street: geo?.street ?? null,
        buildingNumber: geo?.buildingNumber ?? null,
        postalCode: geo?.postalCode ?? null,
        formattedAddress: geo?.formattedAddress || null,
        providerPlaceId: geo?.providerPlaceId ?? null,
        locationPrecision: geo?.locationPrecision ?? null,
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
        title: form.title,
        description: editor.getText(),
        descriptionDocument: editor.getJSON(),
        organizerUrl: form.organizerUrl,
        locale:
          current?.content.locale ??
          (i18n.resolvedLanguage === 'pl' ? 'pl' : 'en'),
        track: ['SOBER_PARTY', 'SOBER_RAVE', 'DANCE', 'LIVE_MUSIC'].includes(
          form.category,
        )
          ? 'SOBER_NIGHTLIFE'
          : 'SOBER_LIFESTYLE',
        category: form.category,
        alcoholRules: form.rules,
        controls: {
          alcoholSold: false,
          alcoholServed: false,
          alcoholPermitted: false,
        },
        beverageNotes: form.drinks,
        beverageRulesConfirmed: form.beverageConfirmed,
        startsAt: start.toISOString(),
        endsAt: end?.toISOString() ?? null,
        timezone: form.timezone,
        sourceUrl: form.sourceUrl,
        sourceReference: form.source,
        contentRightsAttested: form.rights,
        coverId: cover,
      },
    );
    setCurrent(saved);
    setDirty(false);
    setSuccess(t('eventEditor.saved'));
    await refresh();
    return saved;
  };
  /** Saves the edited event and publishes it in one action; publication is still validated by the database. */
  const saveAndPublish = async () => {
    const saved = await save();
    if (!saved) return;
    await eventEditorRequest(await token(), `/${saved.id}/publish`, 'POST', {
      expectedVersion: saved.version,
    });
    setCurrent(
      await eventEditorRequest<EditorEvent>(await token(), `/${saved.id}`),
    );
    setDirty(false);
    setSuccess(t('eventEditor.publishedDirectly'));
    await refresh();
  };
  const remove = (item: { id: string; version: number }) => {
    void act(async () => {
      if (!window.confirm(t('eventEditor.deleteConfirm'))) return;
      await eventEditorRequest(
        await token(),
        `/${item.id}?expectedVersion=${item.version}`,
        'DELETE',
      );
      setCurrent(null);
      setEditing(false);
      setDirty(false);
      setCover(null);
      setSuccess(t('eventEditor.deleted'));
      await refresh();
    });
  };
  const input = (
    key: Exclude<
      keyof ReturnType<typeof blank>,
      'rights' | 'strictConfirmed' | 'beverageConfirmed'
    >,
    type = 'text',
    required = false,
  ) => (
    <label>
      {t(`eventEditor.fields.${key}`)}
      {required ? ' *' : ''}
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        maxLength={key === 'title' ? 300 : 2048}
      />
    </label>
  );
  const check = (key: 'rights' | 'strictConfirmed' | 'beverageConfirmed') => (
    <label className="ev-check">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(e) => update(key, e.target.checked)}
      />
      {t(`eventEditor.fields.${key}`)} *
    </label>
  );
  const style = Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [`--ev-${key}`, value]),
  ) as CSSProperties;
  return (
    <div
      className="ev-viewport"
      ref={viewport}
      role="region"
      aria-label={t('eventEditor.title')}
      tabIndex={0}
      style={style}
    >
      <div className="ev-panel">
        <style>{css}</style>
        <header>
          <h1>{t('eventEditor.title')}</h1>
          {allowed ? (
            <Link href="/editorial-circles">{t('circles.admin')}</Link>
          ) : null}
          <Link href="/events">{t('events.detail.browse')}</Link>
        </header>
        {error ? (
          <>
            <p role="alert" className="ev-error">
              {error}
            </p>
            {!editing ? (
              <button onClick={() => retry((value) => value + 1)}>
                {t('events.retry')}
              </button>
            ) : null}
          </>
        ) : null}
        {success ? (
          <p role="status" className="ev-success">
            {success}
          </p>
        ) : null}
        {!allowed ? (
          !error ? (
            <p role="status">{t('events.loading')}</p>
          ) : null
        ) : !editing ? (
          <section>
            <header>
              <h2>{t('eventEditor.myEvents')}</h2>
              <button disabled={busy} onClick={() => open()}>
                {t('eventEditor.newEvent')}
              </button>
            </header>
            <fieldset className="ev-library-filters" disabled={busy}>
              <legend>{t('eventEditor.filterLocation')}</legend>
              <div className="ev-grid">
                <LocationSelect
                  kind="countries"
                  value={filterCountry}
                  onChange={(value) => {
                    setFilterCountry(value);
                    setFilterCity(null);
                    setPage(0);
                  }}
                />
                <LocationSelect
                  kind="cities"
                  countryId={filterCountry?.id}
                  value={filterCity}
                  onChange={(value) => {
                    setFilterCity(value);
                    setPage(0);
                  }}
                />
              </div>
              {filterCountry || filterCity ? (
                <button
                  onClick={() => {
                    setFilterCountry(null);
                    setFilterCity(null);
                    setPage(0);
                  }}
                >
                  {t('eventEditor.clearLocation')}
                </button>
              ) : null}
            </fieldset>
            {!catalog ? (
              !error ? (
                <p role="status">{t('events.loading')}</p>
              ) : null
            ) : catalog.items.length === 0 ? (
              <p>
                {t(
                  filterCountry || filterCity
                    ? 'eventEditor.emptyLocation'
                    : 'eventEditor.empty',
                )}
              </p>
            ) : (
              catalog.items.map((item) => (
                <div className="ev-library-row" key={item.id}>
                  <button
                    className="ev-event"
                    disabled={busy}
                    onClick={() => open(item.id)}
                  >
                    <span className="ev-event-summary">
                      <strong>{item.title}</strong>
                      <span className="ev-event-location">
                        {[
                          i18n.resolvedLanguage === 'pl'
                            ? (item.city_pl ?? item.city_en)
                            : item.city_en,
                          i18n.resolvedLanguage === 'pl'
                            ? (item.country_pl ?? item.country_en)
                            : item.country_en,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </span>
                    <span>{t(`eventEditor.states.${item.status}`)}</span>
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => remove(item)}
                    aria-label={t('eventEditor.deleteNamed', {
                      title: item.title,
                    })}
                  >
                    {t('eventEditor.delete')}
                  </button>
                </div>
              ))
            )}
            {catalog && catalog.total > 20 ? (
              <nav>
                <button
                  disabled={page === 0 || busy}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('discover.previous')}
                </button>
                <span>{page + 1}</span>
                <button
                  disabled={busy || (page + 1) * 20 >= catalog.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('discover.next')}
                </button>
              </nav>
            ) : null}
          </section>
        ) : (
          <>
            <header>
              <button
                disabled={busy}
                onClick={() => {
                  if (!dirty || window.confirm(t('eventEditor.discard'))) {
                    setEditing(false);
                    setDirty(false);
                  }
                }}
              >
                {t('eventEditor.library')}
              </button>
              <span>
                {t(`eventEditor.states.${current?.status ?? 'DRAFT'}`)}
              </span>
            </header>
            <fieldset disabled={busy}>
              <section>
                {input('title', 'text', true)}
                <label>{t('eventEditor.description')} *</label>
                <div className="ev-editor">
                  <div className="ev-toolbar">
                    {(
                      [
                        'bold',
                        'italic',
                        'underline',
                        'bulletList',
                        'orderedList',
                        'heading',
                        'left',
                        'center',
                        'right',
                        'justify',
                      ] as const
                    ).map((command) => (
                      <button
                        key={command}
                        type="button"
                        title={t(`eventEditor.tools.${command}`)}
                        aria-label={t(`eventEditor.tools.${command}`)}
                        onClick={() => {
                          const chain = editor?.chain().focus();
                          if (!chain) return;
                          if (command === 'bold') chain.toggleBold().run();
                          else if (command === 'italic')
                            chain.toggleItalic().run();
                          else if (command === 'underline')
                            chain.toggleUnderline().run();
                          else if (command === 'bulletList')
                            chain.toggleBulletList().run();
                          else if (command === 'orderedList')
                            chain.toggleOrderedList().run();
                          else if (command === 'heading')
                            chain.toggleHeading({ level: 2 }).run();
                          else chain.setTextAlign(command).run();
                        }}
                      >
                        {t(`eventEditor.tools.${command}`)}
                      </button>
                    ))}
                  </div>
                  <EditorContent editor={editor} />
                </div>
                {input('organizerUrl', 'url', true)}
                {input('alt')}
                <label>
                  {t('eventEditor.photo')} *
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      if (
                        !['image/jpeg', 'image/png'].includes(file.type) ||
                        file.size > 5 * 1024 * 1024
                      ) {
                        setError(t('eventEditor.imageError'));
                        return;
                      }
                      void act(async () => {
                        if (!form.alt.trim()) {
                          setError(t('eventEditor.altRequired'));
                          return;
                        }
                        const data = new FormData();
                        data.append('file', file);
                        data.append('altText', form.alt);
                        const image = await eventEditorRequest<{ id: string }>(
                          await token(),
                          '/media',
                          'POST',
                          data,
                        );
                        setCover(image.id);
                        setDirty(true);
                      });
                    }}
                  />
                </label>
                {preview ? (
                  <>
                    <img
                      className="ev-preview"
                      src={preview}
                      alt={form.alt || t('eventEditor.photo')}
                    />
                    <button
                      onClick={() => {
                        setCover(null);
                        setDirty(true);
                      }}
                    >
                      {t('eventEditor.removePhoto')}
                    </button>
                  </>
                ) : null}
              </section>
              <section>
                <h2>{t('eventEditor.listingData')}</h2>
                <p>{t('eventEditor.dateHint')}</p>
                <div className="ev-grid">
                  {input('start', 'datetime-local', true)}
                  {input('end', 'datetime-local')}
                  {input('timezone', 'text', true)}
                  <label>
                    {t('eventEditor.fields.category')}
                    <select
                      value={form.category}
                      onChange={(e) => update('category', e.target.value)}
                    >
                      {CATEGORY_CODES.map((value) => (
                        <option key={value} value={value}>
                          {t(`events.categories.${value}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {input('name')}
                  <label>
                    {t('eventEditor.fields.address')}
                    <AddressAutocomplete
                      key={formKey}
                      initialValue={form.address}
                      disabled={busy}
                      onInput={(text) => {
                        setGeo((previous) =>
                          previous?.formattedAddress === text ? previous : null,
                        );
                        update('address', text);
                      }}
                      onSelect={(selection) => {
                        setGeo(selection);
                        update('address', selection.formattedAddress);
                      }}
                    />
                  </label>
                  {geo?.locationPrecision === 'CITY' ? (
                    <p className="ev-hint" role="status">
                      {t('eventEditor.location.cityOnly')}
                    </p>
                  ) : !geo && form.address.trim() ? (
                    <p className="ev-hint" role="status">
                      {t('eventEditor.location.notSelected')}
                    </p>
                  ) : null}
                  {geo?.center && process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Suspense fallback={null}>
                        <LocationPreviewMap
                          apiKey={process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}
                          latitude={geo.center.latitude}
                          longitude={geo.center.longitude}
                          zoom={geo.latitude === null ? 12 : 16}
                          onPlace={(latitude, longitude) => {
                            setGeo((previous) =>
                              previous
                                ? placeAddressPoint(
                                    previous,
                                    latitude,
                                    longitude,
                                  )
                                : previous,
                            );
                            setDirty(true);
                          }}
                        />
                      </Suspense>
                    </div>
                  ) : null}
                </div>
              </section>
              <section>
                <h2>{t('eventEditor.rulesTitle')}</h2>
                {check('strictConfirmed')}
                {(['rules', 'drinks', 'source'] as const).map((key) => (
                  <label key={key}>
                    {t(`eventEditor.fields.${key}`)} *
                    <textarea
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      maxLength={5000}
                    />
                  </label>
                ))}
                {input('sourceUrl', 'url', true)}
                {check('beverageConfirmed')}
                {check('rights')}
              </section>
            </fieldset>
            <div className="ev-actions">
              <button
                disabled={busy}
                onClick={() => {
                  void act(async () => {
                    await save();
                  });
                }}
              >
                {t('eventEditor.save')}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  void act(saveAndPublish);
                }}
              >
                {t('eventEditor.saveAndPublish')}
              </button>
              {current?.status === 'DRAFT' ? (
                <button
                  disabled={busy || dirty}
                  onClick={() => {
                    void act(async () => {
                      await eventEditorRequest(
                        await token(),
                        `/${current.id}/publish`,
                        'POST',
                        { expectedVersion: current.version },
                      );
                      setCurrent(
                        await eventEditorRequest(
                          await token(),
                          `/${current.id}`,
                        ),
                      );
                      setSuccess(t('eventEditor.published'));
                      await refresh();
                    });
                  }}
                >
                  {t('eventEditor.publish')}
                </button>
              ) : null}
              {current ? (
                <button disabled={busy} onClick={() => remove(current)}>
                  {t('eventEditor.delete')}
                </button>
              ) : null}
            </div>
            <p>{t('eventEditor.publicationHint')}</p>
          </>
        )}
      </div>
    </div>
  );
}
const css = `.ev-viewport{flex:1;min-height:0;height:100%;width:100%;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch}.ev-viewport:focus-visible{outline:2px solid var(--ev-focusRing);outline-offset:-2px}.ev-panel{max-width:1120px;width:100%;margin:0 auto;padding:${spacing.space24}px ${spacing.space16}px;color:var(--ev-textPrimary);font-family:system-ui,sans-serif;box-sizing:border-box}.ev-panel *{box-sizing:border-box}.ev-panel header,.ev-actions,.ev-panel nav{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.ev-panel h1{font-size:${typography.h2.fontSize}px;color:var(--ev-primary)}.ev-panel h2{font-size:${typography.h3.fontSize}px}.ev-panel section{padding:16px;border:1px solid var(--ev-border);border-radius:${radii.lg}px;background:var(--ev-surface);margin:16px 0}.ev-panel fieldset{border:0;padding:0;min-width:0}.ev-panel label{display:flex;flex-direction:column;gap:8px;margin:12px 0;color:var(--ev-primary);font-size:14px}.ev-panel input,.ev-panel textarea,.ev-panel select{min-height:48px;width:100%;padding:12px;border:1px solid var(--ev-border);border-radius:8px;background:var(--ev-surface);color:var(--ev-textPrimary);font:inherit;min-width:0}.ev-panel textarea{min-height:100px;resize:vertical}.ev-panel button,.ev-panel summary,.ev-panel a{min-height:48px;padding:12px;color:var(--ev-primary);font:inherit;cursor:pointer;border:1px solid var(--ev-border);border-radius:8px;background:var(--ev-surface);overflow-wrap:anywhere}.ev-panel button:hover:not(:disabled){background:var(--ev-surfaceAlt)}.ev-panel :focus-visible{outline:2px solid var(--ev-focusRing);outline-offset:2px}.ev-panel button:disabled{opacity:.5;cursor:default}.ev-panel .ev-check{flex-direction:row;align-items:center;color:var(--ev-textPrimary)}.ev-check input{width:24px;min-height:24px;flex-shrink:0}.ev-panel .ev-error{color:var(--ev-danger)}.ev-panel .ev-success{color:var(--ev-success)}.ev-event{display:flex;width:100%;justify-content:space-between;gap:16px;margin:8px 0;text-align:left}.ev-library-filters{margin-top:16px!important}.ev-library-filters legend{color:var(--ev-primary);font-size:14px}.ev-event-summary{display:flex;flex-direction:column;gap:4px;min-width:0}.ev-event-summary strong{overflow-wrap:anywhere}.ev-event-location{color:var(--ev-textSecondary);font-size:14px}.ev-library-row{display:flex;align-items:center;gap:8px}.ev-library-row .ev-event{flex:1;min-width:0}.ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:0 16px}.ev-editor{border:1px solid var(--ev-border);border-radius:12px;overflow:hidden}.ev-toolbar{display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:var(--ev-surfaceAlt)}.ev-toolbar button{font-size:14px}.ev-prose{padding:16px;min-height:280px;line-height:1.6;overflow-wrap:anywhere}.ev-prose p{margin:0 0 12px}.ev-preview{display:block;width:100%;max-width:480px;aspect-ratio:16/9;object-fit:cover;border-radius:12px}.ev-actions{justify-content:flex-end}.ev-panel p{line-height:1.5}.ev-panel .ev-hint{margin:4px 0 12px;font-size:14px;color:var(--ev-textSecondary)}.ev-panel .geoapify-autocomplete-items{max-height:240px;overflow-y:auto;margin:4px 0 0;padding:4px 0;border:1px solid var(--ev-border);border-radius:${radii.md}px;background:var(--ev-surface);z-index:10}.ev-panel .geoapify-autocomplete-items div{min-height:48px;padding:12px;color:var(--ev-textPrimary);font:inherit;font-size:14px;cursor:pointer;border:0;border-radius:0;background:transparent}.ev-panel .geoapify-autocomplete-items div:hover,.ev-panel .geoapify-autocomplete-items .active{background:var(--ev-surfaceAlt)}.ev-map{position:relative;z-index:0;margin:4px 0 12px}.ev-map-canvas{height:240px;width:100%;border:1px solid var(--ev-border);border-radius:${radii.md}px;overflow:hidden}.ev-map-pin{background:transparent;border:0}.ev-map-pin span{display:block;width:20px;height:20px;border-radius:50%;background:var(--ev-primary);border:3px solid var(--ev-surface);box-shadow:0 1px 4px rgba(0,0,0,.35)}`;
