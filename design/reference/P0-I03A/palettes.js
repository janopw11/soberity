/* global document, URL, URLSearchParams, location, history */
const colorOptions = [
  {
    bg: '#211B2A',
    surface: '#2A2235',
    alt: '#342A43',
    lilac: '#695382',
    accent: '#A58ACE',
    primary: '#C1A4F6',
    pressed: '#D8C0FF',
    text: '#F1ECF8',
    secondary: '#D0C2E0',
    muted: '#B9A7CB',
    border: '#5B4A6C',
    illustrationHighlight: '#ECE1FF',
    id: 'plum-soft',
    pl: 'Ciemny — Śliwka',
    en: 'Dark — Plum',
    descriptionPl: 'Zatwierdzony motyw domyślny · jaśniejsza Śliwka',
    descriptionEn: 'Approved default theme · softer plum',
    scheme: 'dark',
    onPrimary: '#14111C',
  },
  {
    id: 'violet',
    pl: 'Jasny — Fiolet',
    en: 'Light — Violet',
    descriptionPl: 'Zatwierdzony motyw jasny · fiolet i biel',
    descriptionEn: 'Approved light theme · violet and white',
    bg: '#FAF9FD',
    surface: '#FFFFFF',
    alt: '#EDE7F6',
    lilac: '#DCCFF5',
    accent: '#A78BFA',
    primary: '#6D3CC3',
    pressed: '#5B2AA8',
    text: '#242136',
    secondary: '#4B425D',
    muted: '#6B7280',
    border: '#D9D0E6',
    scheme: 'light',
    onPrimary: '#FFFFFF',
    illustrationHighlight: '#FFFFFF',
  },
];
const illustrationSources = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#EDE7F6"/><stop offset="1" stop-color="#FAF9FD"/></linearGradient><radialGradient id="orb" cx=".3" cy=".2" r=".9"><stop stop-color="#FAF9FD"/><stop offset=".4" stop-color="#DCCFF5"/><stop offset=".75" stop-color="#A78BFA"/><stop offset="1" stop-color="#6D3CC3"/></radialGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#DCCFF5" stop-opacity=".3"/></linearGradient></defs><rect width="800" height="520" fill="url(#bg)"/><path d="M -60 80 Q 200 420 420 160 T 860 220" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 104 Q 200 408 420 168 T 860 238" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 128 Q 200 396 420 176 T 860 256" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 152 Q 200 384 420 184 T 860 274" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 176 Q 200 372 420 192 T 860 292" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 200 Q 200 360 420 200 T 860 310" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 224 Q 200 348 420 208 T 860 328" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 248 Q 200 336 420 216 T 860 346" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 272 Q 200 324 420 224 T 860 364" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 296 Q 200 312 420 232 T 860 382" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 320 Q 200 300 420 240 T 860 400" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 344 Q 200 288 420 248 T 860 418" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 368 Q 200 276 420 256 T 860 436" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><ellipse cx="434" cy="432" rx="160" ry="24" fill="#6D3CC3" opacity=".08"/><circle cx="428" cy="248" r="154" fill="url(#orb)"/><ellipse cx="428" cy="248" rx="236" ry="64" transform="rotate(-28 428 248)" fill="none" stroke="#6D3CC3" stroke-width="2"/><ellipse cx="428" cy="248" rx="210" ry="82" transform="rotate(38 428 248)" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".8"/><circle cx="632" cy="132" r="18" fill="url(#orb)"/><circle cx="220" cy="349" r="10" fill="#6D3CC3"/><rect x="112" y="80" width="104" height="72" rx="16" fill="url(#glass)" stroke="#FFFFFF"/><path d="M136 128l16-20 16 8 24-20" fill="none" stroke="#6D3CC3" stroke-width="2"/><circle cx="192" cy="96" r="4" fill="#6D3CC3"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#EDE7F6"/><stop offset="1" stop-color="#FAF9FD"/></linearGradient><radialGradient id="orb" cx=".3" cy=".2" r=".9"><stop stop-color="#FAF9FD"/><stop offset=".4" stop-color="#DCCFF5"/><stop offset=".75" stop-color="#A78BFA"/><stop offset="1" stop-color="#6D3CC3"/></radialGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#DCCFF5" stop-opacity=".3"/></linearGradient></defs><rect width="800" height="520" fill="url(#bg)"/><path d="M -60 80 Q 200 420 420 160 T 860 220" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 104 Q 200 408 420 168 T 860 238" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 128 Q 200 396 420 176 T 860 256" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 152 Q 200 384 420 184 T 860 274" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 176 Q 200 372 420 192 T 860 292" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 200 Q 200 360 420 200 T 860 310" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 224 Q 200 348 420 208 T 860 328" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 248 Q 200 336 420 216 T 860 346" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 272 Q 200 324 420 224 T 860 364" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 296 Q 200 312 420 232 T 860 382" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 320 Q 200 300 420 240 T 860 400" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 344 Q 200 288 420 248 T 860 418" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 368 Q 200 276 420 256 T 860 436" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><circle cx="420" cy="240" r="168" fill="#DCCFF5"/><circle cx="420" cy="240" r="124" fill="url(#orb)"/><circle cx="466" cy="192" r="112" fill="url(#bg)"/><g fill="#6D3CC3"><circle cx="248" cy="144" r="5"/><circle cx="596" cy="352" r="4"/><path d="M578 109v24m-12-12h24" stroke="#6D3CC3" stroke-width="2"/></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#EDE7F6"/><stop offset="1" stop-color="#FAF9FD"/></linearGradient><radialGradient id="orb" cx=".3" cy=".2" r=".9"><stop stop-color="#FAF9FD"/><stop offset=".4" stop-color="#DCCFF5"/><stop offset=".75" stop-color="#A78BFA"/><stop offset="1" stop-color="#6D3CC3"/></radialGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#DCCFF5" stop-opacity=".3"/></linearGradient></defs><rect width="800" height="520" fill="url(#bg)"/><path d="M -60 80 Q 200 420 420 160 T 860 220" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 104 Q 200 408 420 168 T 860 238" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 128 Q 200 396 420 176 T 860 256" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 152 Q 200 384 420 184 T 860 274" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 176 Q 200 372 420 192 T 860 292" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 200 Q 200 360 420 200 T 860 310" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 224 Q 200 348 420 208 T 860 328" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 248 Q 200 336 420 216 T 860 346" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 272 Q 200 324 420 224 T 860 364" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 296 Q 200 312 420 232 T 860 382" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 320 Q 200 300 420 240 T 860 400" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 344 Q 200 288 420 248 T 860 418" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 368 Q 200 276 420 256 T 860 436" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><g transform="translate(400 260)"><circle r="152" fill="url(#orb)"/><ellipse rx="218" ry="68" transform="rotate(-36)" fill="none" stroke="#6D3CC3" stroke-width="2"/><ellipse rx="218" ry="68" transform="rotate(36)" fill="none" stroke="#6D3CC3" stroke-width="2"/><circle r="92" fill="url(#glass)" stroke="#FFFFFF"/><circle r="38" fill="#6D3CC3"/><circle cx="-168" cy="100" r="12" fill="#6D3CC3"/><circle cx="170" cy="100" r="12" fill="#A78BFA"/></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#EDE7F6"/><stop offset="1" stop-color="#FAF9FD"/></linearGradient><radialGradient id="orb" cx=".3" cy=".2" r=".9"><stop stop-color="#FAF9FD"/><stop offset=".4" stop-color="#DCCFF5"/><stop offset=".75" stop-color="#A78BFA"/><stop offset="1" stop-color="#6D3CC3"/></radialGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#DCCFF5" stop-opacity=".3"/></linearGradient></defs><rect width="800" height="520" fill="url(#bg)"/><path d="M -60 80 Q 200 420 420 160 T 860 220" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 104 Q 200 408 420 168 T 860 238" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 128 Q 200 396 420 176 T 860 256" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 152 Q 200 384 420 184 T 860 274" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 176 Q 200 372 420 192 T 860 292" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 200 Q 200 360 420 200 T 860 310" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 224 Q 200 348 420 208 T 860 328" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 248 Q 200 336 420 216 T 860 346" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 272 Q 200 324 420 224 T 860 364" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 296 Q 200 312 420 232 T 860 382" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 320 Q 200 300 420 240 T 860 400" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 344 Q 200 288 420 248 T 860 418" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><path d="M -60 368 Q 200 276 420 256 T 860 436" fill="none" stroke="#A78BFA" stroke-width="1" opacity=".3"/><g transform="translate(400 260) rotate(-20)"><rect x="-148" y="-160" width="240" height="296" rx="24" fill="url(#orb)"/><rect x="-90" y="-116" width="240" height="296" rx="24" fill="url(#glass)" stroke="#FFFFFF" stroke-width="2"/><g stroke="#6D3CC3" stroke-width="4"><path d="M-50-56H90M-50-20H62M-50 16H80" opacity=".6"/><path d="M-42 100l32-32 32 16 56-52" fill="none"/></g><circle cx="78" cy="32" r="8" fill="#6D3CC3"/></g></svg>',
];
const colorLanguage = document.documentElement.lang;
const isPolish = colorLanguage === 'pl';
const colorPicker = document.querySelector('#palette-picker');
colorPicker.innerHTML = `<div class="palette-heading"><span>${isPolish ? 'Zatwierdzone motywy' : 'Approved themes'}</span><span id="palette-description" aria-live="polite"></span></div><div class="palette-options" role="group" aria-label="${isPolish ? 'Wariant kolorystyczny' : 'Color palette'}">${colorOptions.map((p) => `<button data-palette="${p.id}" aria-pressed="false" style="--swatch:${p.primary}"><span class="palette-dot" aria-hidden="true"></span>${isPolish ? p.pl : p.en}</button>`).join('')}</div>`;
let activePalette;
function applyPalette(id) {
  const palette = colorOptions.find((p) => p.id === id) || colorOptions[0];
  activePalette = palette.id;
  document.documentElement.style.colorScheme = palette.scheme;
  document.body.dataset.theme = palette.scheme;
  const reference = {
    id: 'violet',
    pl: 'Fiolet',
    en: 'Violet',
    descriptionPl: 'Obecny kierunek · spokojny i kreatywny',
    descriptionEn: 'Current direction · calm and creative',
    bg: '#FAF9FD',
    surface: '#FFFFFF',
    alt: '#EDE7F6',
    lilac: '#DCCFF5',
    accent: '#A78BFA',
    primary: '#6D3CC3',
    pressed: '#5B2AA8',
    text: '#242136',
    secondary: '#4B425D',
    muted: '#6B7280',
    border: '#D9D0E6',
  };
  const replacements = new Map(
    Object.keys(reference)
      .filter((key) => /^#[A-Fa-f\d]{6}$/.test(reference[key]))
      .map((key) => [reference[key].toUpperCase(), palette[key]]),
  );
  for (const key of [
    'bg',
    'surface',
    'alt',
    'lilac',
    'accent',
    'primary',
    'pressed',
    'text',
    'secondary',
    'muted',
    'border',
  ])
    document.documentElement.style.setProperty(`--${key}`, palette[key]);
  document.documentElement.style.setProperty('--focus', palette.pressed);
  document.documentElement.style.setProperty('--on-primary', palette.onPrimary);
  replacements.set('#FFFFFF', palette.illustrationHighlight);
  document.body.dataset.palette = palette.id;
  document.querySelector('#palette-description').textContent = isPolish
    ? palette.descriptionPl
    : palette.descriptionEn;
  document
    .querySelectorAll('button[data-palette]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.palette === palette.id),
      ),
    );
  document.querySelectorAll('.news-art img').forEach((img, i) => {
    const recolored = illustrationSources[i].replace(
      /#[A-Fa-f\d]{6}/g,
      (hex) => replacements.get(hex.toUpperCase()) || hex,
    );
    img.src =
      'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(recolored);
  });
  document.querySelectorAll('a[href*="?screen="]').forEach((link) => {
    const target = new URL(link.href);
    target.searchParams.set('palette', palette.id);
    link.href = target.href;
  });
  const current = new URL(location.href);
  current.searchParams.set('palette', palette.id);
  history.replaceState(null, '', current);
}
document.querySelectorAll('button[data-palette]').forEach((button) => {
  button.onclick = () => applyPalette(button.dataset.palette);
});
document.querySelector('#language').onclick = () => {
  const current = new URL(location.href);
  current.searchParams.set('lang', isPolish ? 'en' : 'pl');
  current.searchParams.set('palette', activePalette);
  location.href = current.href;
};
applyPalette(
  new URLSearchParams(location.search).get('palette') || 'plum-soft',
);
