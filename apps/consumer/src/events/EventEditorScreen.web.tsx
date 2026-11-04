import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useAuthStatus } from '../auth/AuthStatusContext';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { CATEGORY_CODES } from './eventsApi';
import { EventEditorError, eventEditorImage, eventEditorRequest, type Organization, type EditorEvent, type Venue } from './eventEditorApi';

const blank = () => ({ title: '', organizerUrl: '', start: '', end: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  category: 'SOBER_PARTY', name: '', address: '', city: '', region: '', country: '', priceKind: 'UNKNOWN', amount: '', currency: '',
  policy: 'ALCOHOL_FREE', rules: '', drinks: '', entry: '', source: '', rights: false, strictConfirmed: false, friendlyConfirmed: false, alt: '', ticket: '' });
const localTime = (value: unknown) => {const d = new Date(String(value));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};

export default function EventEditorScreen() {
  const { t, i18n } = useTranslation();const { colors } = useThemePreferences();const { getIdToken, user } = useAuthStatus();
  const [organizations, setOrganizations] = useState<Organization[]>([]);const [org, setOrg] = useState('');const [orgPage, setOrgPage] = useState(0);const [orgTotal, setOrgTotal] = useState(0);
  const [host, setHost] = useState({ name: '', description: '', website: '', email: user?.email ?? '' });
  const [catalog, setCatalog] = useState<{items: {id: string;title: string;status: string}[];total: number} | null>(null);const [page, setPage] = useState(0);
  const [current, setCurrent] = useState<EditorEvent | null>(null);const [editing, setEditing] = useState(false);const [form, setForm] = useState(blank);
  const [cover, setCover] = useState<string | null>(null);const [preview, setPreview] = useState('');const [busy, setBusy] = useState(false);const [error, setError] = useState('');const [success, setSuccess] = useState('');
  const [verification, setVerification] = useState('');const [dirty, setDirty] = useState(false);const selectedVenue = useRef<{id: string; fingerprint: string} | null>(null);
  const editor = useEditor({immediatelyRender: false, extensions: [StarterKit.configure({codeBlock: false, heading: {levels: [2,3]}, link: false}), TextAlign.configure({types: ['heading','paragraph']})],
    content: {type:'doc',content:[{type:'paragraph'}]}, editorProps: {attributes: {class:'ev-prose',role:'textbox','aria-label':t('eventEditor.description'),'aria-multiline':'true'}}, onUpdate: () => setDirty(true)});
  const token = async () => {const value = await getIdToken();if (!value) throw new Error('No identity');return value;};
  const failure = (reason: unknown) => setError(t(reason instanceof EventEditorError && reason.status === 409 ? 'eventEditor.conflict' : reason instanceof EventEditorError && reason.status === 403 ? 'eventEditor.forbidden' : 'eventEditor.error'));
  const act = async (work: () => Promise<void>) => {if (busy) return;setBusy(true);setError('');setSuccess('');try {await work();} catch(reason) {failure(reason);} finally {setBusy(false);}};
  const loadOrganizations = useCallback(async () => {
    const value = await getIdToken();if (!value) return;
    const result = await eventEditorRequest<{items: Organization[];total:number}>(value,`/organizations?page=${orgPage}`);
    setOrganizations(result.items);setOrgTotal(result.total);setOrg(previous => result.items.some(item => item.id === previous) ? previous : result.items[0]?.id ?? '');
  }, [getIdToken, orgPage]);
  useEffect(() => {void loadOrganizations().catch(failure);}, [loadOrganizations]); // Access is enforced for every request by backend membership.
  useEffect(() => {let active = true;setCatalog(null);if (org) void (async () => {
    const value = await getIdToken();if (!value) return;
    const result = await eventEditorRequest<{items:{id:string;title:string;status:string}[];total:number}>(value,`/organizations/${org}/events?page=${page}`);
    if(active)setCatalog(result);
  })().catch(reason => {if(active)failure(reason);});return () => {active=false;};}, [org,page,getIdToken]);
  useEffect(() => {let active=true;let url='';setPreview('');if(org && cover)void (async () => {
    const value=await getIdToken();if(!value)return;url=await eventEditorImage(value,org,cover);
    if(active)setPreview(url);else URL.revokeObjectURL(url);
  })().catch(reason => {if(active)failure(reason);});return () => {active=false;if(url)URL.revokeObjectURL(url);};}, [org,cover,getIdToken]);
  useEffect(() => {editor?.setEditable(!busy && (!current || ['DRAFT','CHANGES_REQUESTED','IN_REVIEW','APPROVED','PUBLISHED'].includes(current.status)));}, [editor,busy,current]);
  useEffect(() => {const protect=(event:BeforeUnloadEvent) => {if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',protect);return () => window.removeEventListener('beforeunload',protect);},[dirty]);
  const update = <K extends keyof ReturnType<typeof blank>>(key:K,value:ReturnType<typeof blank>[K]) => {setForm(previous=>({...previous,[key]:value}));setDirty(true);};
  const fingerprint = (f: ReturnType<typeof blank>) => JSON.stringify([f.name,f.address,f.city,f.region,f.country]);
  const refresh = async () => {setCatalog(await eventEditorRequest(await token(),`/organizations/${org}/events?page=${page}`));await loadOrganizations();};
  const open = (id?:string) => {void act(async () => {
    if(dirty && !window.confirm(t('eventEditor.discard')))return;
    if(!id){setCurrent(null);setForm(blank());setCover(null);selectedVenue.current=null;editor?.commands.setContent({type:'doc',content:[{type:'paragraph'}]});}
    else {
      const key=await token();const detail=await eventEditorRequest<EditorEvent>(key,`/events/${id}`);const c=detail.content;
      // Fetch the exact immutable venue rather than assuming it is on the first catalog page.
      const venue=await eventEditorRequest<Venue>(key,`/organizations/${org}/venues/${c.venue_id}`);
      const next={...blank(),title:c.title,organizerUrl:String(c.organizer_url ?? ''),start:localTime(c.starts_at),end:localTime(c.ends_at),timezone:String(c.timezone),category:String(c.category_code),
        name:venue.name,address:venue.address,city:venue.city,region:venue.region ?? '',country:venue.country_code,priceKind:String(c.price_kind),currency:String(c.currency ?? ''),amount:'',policy:String(c.alcohol_policy),
        rules:String(c.alcohol_rules),drinks:String(c.beverage_notes),entry:String(c.entry_rules),source:String(c.source_reference),rights:c.content_rights_attested===true,
        strictConfirmed:c.alcohol_sold===false && c.alcohol_served===false && c.alcohol_permitted===false,friendlyConfirmed:c.alcohol_free_participation===true,ticket:String(c.external_ticket_url ?? '')};
      if(c.currency && c.price_minor!=null){const digits=new Intl.NumberFormat('en',{style:'currency',currency:String(c.currency)}).resolvedOptions().maximumFractionDigits ?? 2;next.amount=String(Number(c.price_minor)/10**digits);}
      setCurrent(detail);setForm(next);setCover(c.cover_id);selectedVenue.current={id:venue.id,fingerprint:fingerprint(next)};
      editor?.commands.setContent(c.description_document ?? {type:'doc',content:[{type:'paragraph',content:[{type:'text',text:String(c.description)}]}]});
    }
    setEditing(true);setDirty(false);
  });};
  const save = async () => {
    if(!editor || editor.isEmpty || !form.title.trim() || !form.organizerUrl.trim() || !form.start || !form.end || !form.name || !form.address || !form.city || !form.country || !form.rules || !form.drinks || !form.entry || !form.source){setError(t('eventEditor.required'));return;}
    const start=new Date(current && form.start===localTime(current.content.starts_at)?String(current.content.starts_at):form.start),end=new Date(current && form.end===localTime(current.content.ends_at)?String(current.content.ends_at):form.end);
    if(!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || localTime(start.toISOString())!==form.start || localTime(end.toISOString())!==form.end || end<=start){setError(t('eventEditor.dateError'));return;}
    let amount:number|null=form.priceKind==='FREE'?0:null;let currency:string|null=null;
    if(form.priceKind==='PAID'){
      currency=form.currency.trim().toUpperCase();const normalized=form.amount.replace(',','.');
      if(!/^[A-Z]{3}$/.test(currency)||!/^\d+(\.\d+)?$/.test(normalized)){setError(t('eventEditor.priceError'));return;}
      const digits=new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits ?? 2;
      amount=Math.round(Number(normalized)*10**digits);if(!Number.isSafeInteger(amount)||amount<=0||(normalized.split('.')[1]?.length ?? 0)>digits){setError(t('eventEditor.priceError'));return;}
    }
    const key=await token();const mark=fingerprint(form);
    if(selectedVenue.current?.fingerprint!==mark){const venue=await eventEditorRequest<{id:string}>(key,`/organizations/${org}/venues`,'POST',{name:form.name,address:form.address,city:form.city,region:form.region || null,countryCode:form.country.toUpperCase(),latitude:null,longitude:null});selectedVenue.current={id:venue.id,fingerprint:mark};}
    const saved=await eventEditorRequest<EditorEvent>(key,`/organizations/${org}/events${current?`/${current.id}`:''}`,current?'PUT':'POST',{
      expectedVersion:current?.version ?? null,venueId:selectedVenue.current!.id,title:form.title,description:editor.getText(),descriptionDocument:editor.getJSON(),organizerUrl:form.organizerUrl,
      locale:current?.content.locale ?? (i18n.resolvedLanguage==='pl'?'pl':'en'),track:['SOBER_PARTY','SOBER_RAVE','DANCE','LIVE_MUSIC'].includes(form.category)?'SOBER_NIGHTLIFE':'SOBER_LIFESTYLE',category:form.category,
      alcoholPolicy:form.policy,alcoholRules:form.rules,controls:{alcoholSold:form.strictConfirmed?false:null,alcoholServed:form.strictConfirmed?false:null,alcoholPermitted:form.strictConfirmed?false:null,explicitAlcoholFreeParticipation:form.friendlyConfirmed?true:null},
      beverageNotes:form.drinks,startsAt:start.toISOString(),endsAt:end.toISOString(),timezone:form.timezone,priceKind:form.priceKind,priceMinor:amount,currency,
      accessibility:current?.content.accessibility ?? 'UNKNOWN',accessibilityNotes:current?.content.accessibility_notes ?? null,availability:current?.content.availability ?? 'UNKNOWN',entryRules:form.entry,externalTicketUrl:form.ticket || null,sourceUrl:form.organizerUrl,sourceReference:form.source,contentRightsAttested:form.rights,coverId:cover,
    });setCurrent(saved);setDirty(false);setSuccess(t('eventEditor.saved'));await refresh();
  };
  const input=(key:Exclude<keyof ReturnType<typeof blank>,'rights'|'strictConfirmed'|'friendlyConfirmed'>,type='text',required=false) => <label>{t(`eventEditor.fields.${key}`)}{required?' *':''}<input type={type} value={form[key]} onChange={e=>update(key,e.target.value)} maxLength={key==='title'?300:2048} /></label>;
  const select=(key:'category'|'priceKind'|'policy',values:string[]) => <label>{t(`eventEditor.fields.${key}`)}<select value={form[key]} onChange={e=>update(key,e.target.value)}>{values.map(value=><option key={value} value={value}>{t(key==='category'?`events.categories.${value}`:key==='policy'?(value==='ALCOHOL_FREE'?'events.alcoholFree':'events.soberFriendly'):`events.priceKinds.${value}`)}</option>)}</select></label>;
  const check=(key:'rights'|'strictConfirmed'|'friendlyConfirmed') => <label className="ev-check"><input type="checkbox" checked={form[key]} onChange={e=>update(key,e.target.checked)} />{t(`eventEditor.fields.${key}`)}</label>;
  const style=Object.fromEntries(Object.entries(colors).map(([key,value])=>[`--ev-${key}`,value])) as CSSProperties;
  const editable=!current || ['DRAFT','CHANGES_REQUESTED','IN_REVIEW','APPROVED','PUBLISHED'].includes(current.status);
  return <div className="ev-panel" style={style}>
    <style>{css}</style><header><h1>{t('eventEditor.title')}</h1><Link href="/events">{t('events.detail.browse')}</Link></header>
    {error?<p role="alert" className="ev-error">{error}</p>:null}{success?<p role="status" className="ev-success">{success}</p>:null}
    {!editing?<>
      <section><h2>{t('eventEditor.organizations')}</h2><select aria-label={t('eventEditor.organizations')} value={org} disabled={busy} onChange={e=>{setOrg(e.target.value);setPage(0);}}>{organizations.map(item=><option key={item.id} value={item.id}>{item.name} · {t(`eventEditor.states.${item.verification}`)}</option>)}</select>
        {orgTotal>50?<nav><button disabled={busy||orgPage===0} onClick={()=>setOrgPage(p=>p-1)}>{t('discover.previous')}</button><span>{orgPage+1}</span><button disabled={busy||(orgPage+1)*50>=orgTotal} onClick={()=>setOrgPage(p=>p+1)}>{t('discover.next')}</button></nav>:null}
        <details><summary>{t('eventEditor.newOrganizer')}</summary>{(['name','description','website','email'] as const).map(key=><label key={key}>{t(`eventEditor.host.${key}`)}<input type={key==='email'?'email':key==='website'?'url':'text'} value={host[key]} onChange={e=>setHost(previous=>({...previous,[key]:e.target.value}))} /></label>)}
          <button disabled={busy} onClick={()=>{void act(async()=>{const created=await eventEditorRequest<Organization>(await token(),'/organizations','POST',{...host,contactEmail:host.email});setOrganizations(previous=>[created,...previous]);setOrg(created.id);setPage(0);setHost({name:'',description:'',website:'',email:user?.email ?? ''});setSuccess(t('eventEditor.organizerCreated'));});}}>{t('eventEditor.createOrganizer')}</button></details>
        {org && ['UNVERIFIED','REJECTED'].includes(organizations.find(item=>item.id===org)?.verification ?? '')?<details><summary>{t('eventEditor.verifyOrganizer')}</summary><p>{t('eventEditor.verificationHint')}</p><label>{t('eventEditor.verificationReference')}<textarea value={verification} onChange={e=>setVerification(e.target.value)} /></label><button disabled={busy||!verification.trim()} onClick={()=>{void act(async()=>{const host=organizations.find(item=>item.id===org)!;await eventEditorRequest(await token(),`/organizations/${org}/submit`,'POST',{expectedVersion:host.version,evidenceReference:verification});setSuccess(t('eventEditor.sent'));await loadOrganizations();});}}>{t('eventEditor.submit')}</button></details>:null}
      </section>
      {org?<section><header><h2>{t('eventEditor.myEvents')}</h2><button disabled={busy} onClick={()=>open()}>{t('eventEditor.newEvent')}</button></header>
        {!catalog?<p role="status">{t('events.loading')}</p>:catalog.items.length===0?<p>{t('eventEditor.empty')}</p>:catalog.items.map(item=><button className="ev-event" disabled={busy} key={item.id} onClick={()=>open(item.id)}><strong>{item.title}</strong><span>{t(`eventEditor.states.${item.status}`)}</span></button>)}
        {catalog && catalog.total>50?<nav><button disabled={page===0||busy} onClick={()=>setPage(p=>p-1)}>{t('discover.previous')}</button><span>{page+1}</span><button disabled={busy||(page+1)*50>=catalog.total} onClick={()=>setPage(p=>p+1)}>{t('discover.next')}</button></nav>:null}
      </section>:null}
    </>:<>
      <header><button disabled={busy} onClick={()=>{if(!dirty||window.confirm(t('eventEditor.discard'))){setEditing(false);setDirty(false);}}}>{t('eventEditor.library')}</button><span>{t(`eventEditor.states.${current?.status ?? 'DRAFT'}`)}</span></header>
      <fieldset disabled={busy||!editable}>
        <section>{input('title','text',true)}<label>{t('eventEditor.description')} *</label><div className="ev-editor"><div className="ev-toolbar">
          {(['bold','italic','underline','bulletList','orderedList','heading','left','center','right','justify'] as const).map(command=><button key={command} type="button" title={t(`eventEditor.tools.${command}`)} aria-label={t(`eventEditor.tools.${command}`)} onClick={()=>{
            const chain=editor?.chain().focus();if(!chain)return;
            if(command==='bold')chain.toggleBold().run();else if(command==='italic')chain.toggleItalic().run();else if(command==='underline')chain.toggleUnderline().run();else if(command==='bulletList')chain.toggleBulletList().run();else if(command==='orderedList')chain.toggleOrderedList().run();else if(command==='heading')chain.toggleHeading({level:2}).run();else chain.setTextAlign(command).run();
          }}>{t(`eventEditor.tools.${command}`)}</button>)}
        </div><EditorContent editor={editor} /></div>
        {input('organizerUrl','url',true)}{input('alt')}
        <label>{t('eventEditor.photo')}<input type="file" accept="image/jpeg,image/png" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>5*1024*1024){setError(t('eventEditor.imageError'));return;}void act(async()=>{if(!form.alt.trim()){setError(t('eventEditor.altRequired'));return;}const data=new FormData();data.append('file',file);data.append('altText',form.alt);const image=await eventEditorRequest<{id:string}>(await token(),`/organizations/${org}/media`,'POST',data);setCover(image.id);setDirty(true);});}} /></label>
        {preview?<><img className="ev-preview" src={preview} alt={form.alt || t('eventEditor.photo')} /><button onClick={()=>{setCover(null);setDirty(true);}}>{t('eventEditor.removePhoto')}</button></>:null}
        </section>
        <section><h2>{t('eventEditor.listingData')}</h2><p>{t('eventEditor.dateHint')}</p><div className="ev-grid">{input('start','datetime-local',true)}{input('end','datetime-local',true)}{input('timezone','text',true)}{select('category',[...CATEGORY_CODES])}{input('name','text',true)}{input('address','text',true)}{input('city','text',true)}{input('region')}{input('country','text',true)}{select('priceKind',['UNKNOWN','FREE','PAID'])}{form.priceKind==='PAID'?<>{input('amount')}{input('currency')}</>:null}{input('ticket','url')}</div></section>
        <section><h2>{t('eventEditor.rulesTitle')}</h2>{select('policy',['ALCOHOL_FREE','SOBER_FRIENDLY'])}{form.policy==='ALCOHOL_FREE'?check('strictConfirmed'):check('friendlyConfirmed')}{(['rules','drinks','entry','source'] as const).map(key=><label key={key}>{t(`eventEditor.fields.${key}`)} *<textarea value={form[key]} onChange={e=>update(key,e.target.value)} maxLength={5000} /></label>)}{check('rights')}</section>
      </fieldset>
      <div className="ev-actions"><button disabled={busy||!editable} onClick={()=>{void act(save);}}>{t('eventEditor.save')}</button>
        {current && ['DRAFT','CHANGES_REQUESTED'].includes(current.status)?<button disabled={busy||dirty} onClick={()=>{void act(async()=>{await eventEditorRequest(await token(),`/events/${current.id}/submit`,'POST',{expectedVersion:current.version});setCurrent(await eventEditorRequest(await token(),`/events/${current.id}`));setSuccess(t('eventEditor.sent'));await refresh();});}}>{t('eventEditor.submit')}</button>:null}
      </div><p>{t('eventEditor.publicationHint')}</p>
    </>}
  </div>;
}
const css=`.ev-panel{max-width:1120px;margin:auto;padding:${spacing.space24}px ${spacing.space16}px;color:var(--ev-textPrimary);font-family:system-ui,sans-serif;box-sizing:border-box}.ev-panel *{box-sizing:border-box}.ev-panel header,.ev-actions,.ev-panel nav{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.ev-panel h1{font-size:${typography.h2.fontSize}px;color:var(--ev-primary)}.ev-panel h2{font-size:${typography.h3.fontSize}px}.ev-panel section{padding:16px;border:1px solid var(--ev-border);border-radius:${radii.lg}px;background:var(--ev-surface);margin:16px 0}.ev-panel fieldset{border:0;padding:0;min-width:0}.ev-panel label{display:flex;flex-direction:column;gap:8px;margin:12px 0;color:var(--ev-primary);font-size:14px}.ev-panel input,.ev-panel textarea,.ev-panel select{min-height:48px;width:100%;padding:12px;border:1px solid var(--ev-border);border-radius:8px;background:var(--ev-surface);color:var(--ev-textPrimary);font:inherit;min-width:0}.ev-panel textarea{min-height:100px;resize:vertical}.ev-panel button,.ev-panel summary,.ev-panel a{min-height:48px;padding:12px;color:var(--ev-primary);font:inherit;cursor:pointer;border:1px solid var(--ev-border);border-radius:8px;background:var(--ev-surface);overflow-wrap:anywhere}.ev-panel button:hover:not(:disabled){background:var(--ev-surfaceAlt)}.ev-panel :focus-visible{outline:2px solid var(--ev-focusRing);outline-offset:2px}.ev-panel button:disabled{opacity:.5;cursor:default}.ev-panel .ev-check{flex-direction:row;align-items:center;color:var(--ev-textPrimary)}.ev-check input{width:24px;min-height:24px;flex-shrink:0}.ev-panel .ev-error{color:var(--ev-danger)}.ev-panel .ev-success{color:var(--ev-success)}.ev-event{display:flex;width:100%;justify-content:space-between;gap:16px;margin:8px 0;text-align:left}.ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:0 16px}.ev-editor{border:1px solid var(--ev-border);border-radius:12px;overflow:hidden}.ev-toolbar{display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:var(--ev-surfaceAlt)}.ev-toolbar button{font-size:14px}.ev-prose{padding:16px;min-height:280px;line-height:1.6;overflow-wrap:anywhere}.ev-prose p{margin:0 0 12px}.ev-preview{display:block;width:100%;max-width:480px;aspect-ratio:16/9;object-fit:cover;border-radius:12px}.ev-actions{justify-content:flex-end}.ev-panel p{line-height:1.5}`;
