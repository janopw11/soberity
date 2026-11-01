/* global URLSearchParams, location, document */
const copy = {
  en: {
    notice: 'UI proposal v4 · Demonstration content · Not a live service',
    footer: 'Science first. Connection always.',
    home: 'Main page',
    eyebrow: 'YOUR SPACE FOR ALCOHOL-FREE LIVING',
    title: 'More to discover.<br><em>More to experience.</em>',
    intro:
      'Explore the science. Find your people. Make room for experiences without alcohol.',
    scienceCta: 'Explore the science',
    eventsCta: 'Discover events',
    two: 'Two ways to explore',
    source: 'Understand the evidence',
    scienceBody:
      'Research made approachable, with sources and room for nuance.',
    eventTitle: 'Find your next sober night out',
    eventBody:
      'From sober raves to a slower Sunday. Discover experiences that bring people together.',
    principle: 'Curiosity, without judgement.',
    principleBody:
      'Learn at your own pace. Discover what matters to you. There is no perfect path to follow.',
    scienceIntro: 'A clearer view starts with better questions.',
    scienceSub:
      'Explore research, understand its limits and go straight to the source.',
    feature: 'THE RESEARCH DESK',
    research: 'How do we know what we know?',
    researchBody:
      'A preview of the editorial format: a clear question, a readable summary and a visible place for evidence and uncertainty.',
    evidence: 'Source · Study type · Limitations',
    read: 'Read the article',
    topics: 'Start with a question',
    topicNames: [
      'Alcohol & sleep',
      'Brain & behaviour',
      'Reading the evidence',
    ],
    topicBody: 'A space for sourced explanations and further reading.',
    eventIntro: 'Good music.<br>Great company. No alcohol.',
    eventSub: 'Discover sober parties, raves and moments worth showing up for.',
    city: 'City',
    when: 'When',
    allCities: 'All cities',
    dates: 'Any date',
    categories: 'Category',
    allTypes: 'All activities',
    upcoming: 'A little inspiration',
    demo: 'Illustrative events · dates, venues, organisers and prices are placeholders. No booking or availability.',
    art: 'Illustration · not an event photograph',
    names: [
      'Afterglow · Sober rave',
      'Sunday in motion',
      'Coffee & connection',
    ],
    places: [
      'Vienna · Venue to be confirmed',
      'Warsaw · Meeting point to be confirmed',
      'Berlin · Venue to be confirmed',
    ],
    organisers: 'Demo organiser',
    price: 'Price to be confirmed',
    details: 'Event details',
    date: 'Illustrative date',
    demoArticle:
      'Editorial layout only. No published research, health claims or working quiz in this preview.',
    modal:
      'Preview only — this screen demonstrates the layout. No live content or transaction.',
  },
  pl: {
    notice: 'Propozycja UI v4 · Treści demonstracyjne · Podgląd projektu',
    footer: 'Nauka i wspólne doświadczenia.',
    home: 'Strona główna',
    eyebrow: 'TWOJA PRZESTRZEŃ BEZ ALKOHOLU',
    title: 'Więcej do odkrycia.<br><em>Więcej do przeżycia.</em>',
    intro:
      'Poznaj badania. Znajdź swoich ludzi. Zrób miejsce na doświadczenia bez alkoholu.',
    scienceCta: 'Poznaj badania',
    eventsCta: 'Odkryj wydarzenia',
    two: 'Dwie drogi do odkrywania',
    source: 'Zrozum, co mówią badania',
    scienceBody: 'Przystępna nauka, widoczne źródła i miejsce na niuanse.',
    eventTitle: 'Znajdź swój wieczór bez alkoholu',
    eventBody:
      'Od sober rave po spokojną niedzielę. Odkrywaj doświadczenia, które łączą ludzi.',
    principle: 'Ciekawość bez oceniania.',
    principleBody:
      'Poznawaj wiedzę w swoim tempie. Odkrywaj to, co jest dla Ciebie ważne. Nie ma jednej idealnej drogi.',
    scienceIntro: 'Lepsze pytania. Jaśniejszy obraz.',
    scienceSub:
      'Poznawaj badania, rozumiej ich ograniczenia i sprawdzaj źródła.',
    feature: 'BLIŻEJ BADAŃ',
    research: 'Skąd wiemy to, co wiemy?',
    researchBody:
      'Propozycja formatu redakcyjnego: jasne pytanie, przystępne podsumowanie i widoczne miejsce na dowody oraz niepewność.',
    evidence: 'Źródło · Rodzaj badania · Ograniczenia',
    read: 'Otwórz artykuł',
    topics: 'Zacznij od pytania',
    topicNames: ['Alkohol i sen', 'Mózg i zachowanie', 'Jak czytać badania'],
    topicBody: 'Miejsce na wyjaśnienia ze źródłami i dalszą lekturę.',
    eventIntro: 'Dobra muzyka.<br>Świetni ludzie. Bez alkoholu.',
    eventSub:
      'Odkrywaj sober parties, rave’y i spotkania, na których warto być.',
    city: 'Miasto',
    when: 'Termin',
    allCities: 'Wszystkie miasta',
    dates: 'Dowolny termin',
    categories: 'Kategoria',
    allTypes: 'Wszystkie aktywności',
    upcoming: 'Trochę inspiracji',
    demo: 'Przykładowe wydarzenia · daty, miejsca, organizatorzy i ceny są demonstracyjne. Bez rezerwacji i dostępności.',
    art: 'Ilustracja · nie jest zdjęciem wydarzenia',
    names: ['Afterglow · Sober rave', 'Niedziela w ruchu', 'Kawa i rozmowy'],
    places: [
      'Wiedeń · Miejsce do ustalenia',
      'Warszawa · Punkt zbiórki do ustalenia',
      'Berlin · Miejsce do ustalenia',
    ],
    organisers: 'Przykładowy organizator',
    price: 'Cena do ustalenia',
    details: 'Szczegóły wydarzenia',
    date: 'Przykładowy termin',
    demoArticle:
      'Wyłącznie układ redakcyjny. Podgląd nie zawiera opublikowanych badań, twierdzeń zdrowotnych ani działającego quizu.',
    modal: 'To podgląd układu ekranu. Brak rzeczywistych treści i transakcji.',
  },
};
Object.assign(copy.en, {
  notice: 'Design v4 · Illustrative content and dates',
  title: 'Follow your curiosity.<br><em>Find your next experience.</em>',
  eyebrow: 'CLEAR MIND. OPEN POSSIBILITIES.',
  intro:
    'A question that changes your perspective. A night you will remember. Start exploring life without alcohol.',
  start: 'What are you curious about?',
  discover: 'Make a discovery',
  go: 'Find your next night out',
  explore: 'Choose a topic. Follow the question.',
  latest: 'A different kind of night.',
  pick: 'Find your rhythm',
  all: 'All',
  rave: 'Music & raves',
  move: 'Outdoors',
  coffee: 'Meet-ups',
  open: 'Take a closer look',
  sources: 'Where does the evidence begin?',
  question: [
    'What makes a study worth trusting?',
    'What should a study on sleep measure?',
    'How do researchers study behaviour?',
  ],
  prompts: [
    'Look beyond the headline. Explore how a question becomes evidence.',
    'Explore the question, the method and the limits of a possible study.',
    'Start with the research method, then ask what it can actually tell us.',
  ],
  topic: ['Reading research', 'Sleep', 'Brain & behaviour'],
  method: 'The question',
  limits: 'The limits',
  origin: 'The source',
  sourceBody:
    'This is a demonstration of the reading experience. A published article would include a verified reference, study population, methods and limitations. No scientific result is asserted here.',
  sample: 'DEMO / NOT A REAL EVENT',
  results: 'illustrative experiences',
  empty: 'No illustrative events match. Try another city or category.',
  reset: 'Reset filters',
  location: 'Choose a city',
  view: 'Explore the line-up',
  next: 'Next experience',
  previous: 'Previous experience',
  demoDetail:
    'Event layout preview. This event, venue and organiser are illustrative. Date and price are not set. Booking is unavailable.',
  noClaims: 'Editorial preview · no health claims or published research.',
  cities: ['All cities', 'Vienna', 'Warsaw', 'Berlin'],
  inFocus: 'IN FOCUS',
  city: 'City',
  change: 'Change the scene',
});
Object.assign(copy.pl, {
  notice: 'Projekt v4 · Przykładowe treści i daty',
  title: 'Podążaj za ciekawością.<br><em>Znajdź swój kolejny plan.</em>',
  eyebrow: 'OTWARTA GŁOWA. NOWE MOŻLIWOŚCI.',
  intro:
    'Pytanie, które zmienia perspektywę. Wieczór, który zapamiętasz. Zacznij odkrywać życie bez alkoholu.',
  start: 'Co Cię dzisiaj ciekawi?',
  discover: 'Odkryj coś nowego',
  go: 'Znajdź swój kolejny wieczór',
  explore: 'Wybierz temat. Podążaj za pytaniem.',
  latest: 'Wieczór w innym rytmie.',
  pick: 'Znajdź swój rytm',
  all: 'Wszystko',
  rave: 'Muzyka i rave',
  move: 'W plenerze',
  coffee: 'Spotkania',
  open: 'Zajrzyj głębiej',
  sources: 'Od czego zaczynają się dowody?',
  question: [
    'Po czym rozpoznać wiarygodne badanie?',
    'Co powinno mierzyć badanie snu?',
    'Jak naukowcy badają zachowanie?',
  ],
  prompts: [
    'Zajrzyj poza nagłówek. Odkryj, jak pytanie prowadzi do dowodów.',
    'Poznaj pytanie, metodę i ograniczenia przykładowego badania.',
    'Zacznij od metody badawczej. Sprawdź, na jakie pytania może odpowiedzieć.',
  ],
  topic: ['Jak czytać badania', 'Sen', 'Mózg i zachowanie'],
  method: 'Pytanie',
  limits: 'Ograniczenia',
  origin: 'Źródło',
  sourceBody:
    'To demonstracja sposobu czytania treści. Opublikowany artykuł zawierałby zweryfikowane źródło, opis badanej populacji, metod i ograniczeń. Nie przedstawiamy tutaj wyników badań.',
  sample: 'DEMO / PRZYKŁADOWE WYDARZENIE',
  results: 'przykładowe doświadczenia',
  empty: 'Brak pasujących przykładów. Wybierz inne miasto lub kategorię.',
  reset: 'Wyczyść filtry',
  location: 'Wybierz miasto',
  view: 'Odkryj program',
  next: 'Następne doświadczenie',
  previous: 'Poprzednie doświadczenie',
  demoDetail:
    'Podgląd układu wydarzenia. Wydarzenie, miejsce i organizator są przykładowi. Termin i cena nie są ustalone. Rezerwacja jest niedostępna.',
  noClaims:
    'Podgląd redakcyjny · bez twierdzeń zdrowotnych i opublikowanych badań.',
  cities: ['Wszystkie miasta', 'Wiedeń', 'Warszawa', 'Berlin'],
  inFocus: 'POD LUPĄ',
  city: 'Miasto',
  change: 'Zmień klimat',
});
Object.assign(copy.en, {
  welcomeLabel: 'WELCOME TO SOBERITY',
  welcomeTitle: 'Good to see you here.',
  welcomeBody:
    'Explore the latest articles and research on alcohol and alcohol-free living. At your own pace, with curiosity.',
  newsTitle: 'The latest in science',
  newsLabel: 'LATEST FROM SCIENCE',
  allNews: 'All updates',
  articles: 'Articles',
  studies: 'Research',
  feedCount: 'publications',
  dateLabel: 'Soberity publication date (demo)',
  newsTitles: [
    'Beyond the headline: how to read a study',
    'Alcohol and sleep: questions to ask about a publication',
    'How do researchers study alcohol and the brain?',
    'Correlation and causation: what is the difference?',
  ],
  newsDescriptions: [
    'A guide to methods, sources and the limits of scientific conclusions.',
    'An example of a research summary with room for the study design and its limitations.',
    'A demonstration of how a research publication could be presented.',
    'An editorial format for explaining the language of research.',
  ],
  newsDemo:
    'Layout preview · all entries and dates are illustrative. These are not real recent publications.',
  published: 'Published in Soberity (demo)',
  originalDate: 'Original study date: not assigned in this preview.',
  newsRead: 'Read more',
  newsAbout: 'About this publication',
});
Object.assign(copy.pl, {
  welcomeLabel: 'WITAJ W SOBERITY',
  welcomeTitle: 'Miło Cię tu widzieć.',
  welcomeBody:
    'Odkrywaj najnowsze artykuły i badania o alkoholu oraz życiu bez niego. W swoim tempie, z ciekawością.',
  newsTitle: 'Najnowsze publikacje',
  newsLabel: 'NAJNOWSZE ZE ŚWIATA NAUKI',
  allNews: 'Wszystkie',
  articles: 'Artykuły',
  studies: 'Badania',
  feedCount: 'publikacje',
  dateLabel: 'Data publikacji w Soberity (demo)',
  newsTitles: [
    'Poza nagłówkiem: jak czytać badanie naukowe',
    'Alkohol i sen: o co pytać, czytając publikację?',
    'Jak naukowcy badają alkohol i mózg?',
    'Korelacja i przyczynowość: czym się różnią?',
  ],
  newsDescriptions: [
    'Przewodnik po metodach, źródłach i granicach naukowych wniosków.',
    'Przykładowe omówienie badania z miejscem na opis metody i jej ograniczeń.',
    'Demonstracja sposobu prezentacji publikacji naukowej.',
    'Format redakcyjny wyjaśniający język badań naukowych.',
  ],
  newsDemo:
    'Podgląd układu · wszystkie wpisy i daty są przykładowe. To nie są rzeczywiste najnowsze publikacje.',
  published: 'Publikacja w Soberity (demo)',
  originalDate: 'Data oryginalnego badania: nieprzypisana w podglądzie.',
  newsRead: 'Czytaj dalej',
  newsAbout: 'O publikacji',
});
const params = new URLSearchParams(location.search);
const lang = params.get('lang') === 'pl' ? 'pl' : 'en';
const screen = ['science', 'events'].includes(params.get('screen'))
  ? params.get('screen')
  : 'home';
const t = copy[lang];
const url = (s) => `?screen=${s}&lang=${lang}`;
const arrow = '<span aria-hidden="true">↗</span>';
const topics = () =>
  `<div class="topic-picker" role="group" aria-label="${t.topics}">${t.topic.map((label, i) => `<button data-topic="${i}" aria-pressed="${i === 0}"><span>0${i + 1}</span>${label}${arrow}</button>`).join('')}</div>`;
const wave = `<svg viewBox="0 0 520 300" fill="none" aria-hidden="true"><g class="wave-lines" stroke="currentColor">${Array.from({ length: 19 }, (_, i) => `<path d="M ${36 + i * 24} 240 C ${60 + i * 19} ${30 + i * 2}, ${360 - i * 14} ${30 + i * 3}, ${478 - i * 15} 240"/>`).join('')}</g><circle cx="260" cy="150" r="92" stroke="currentColor" stroke-dasharray="2 12"/><circle class="wave-dot" cx="260" cy="58" r="8" fill="currentColor"/></svg>`;
const poster = (i, interactive = false) =>
  `<div class="poster poster-${i}" ${interactive ? 'id="hero-poster"' : ''}><span class="poster-top">SOBERITY / ${i === 0 ? 'AFTER HOURS' : i === 1 ? 'OPEN AIR' : 'TOGETHER'}</span><div class="poster-art" aria-hidden="true">${i === 0 ? '<div class="tunnel">' + Array.from({ length: 8 }, (_, n) => `<i style="--i:${n}"></i>`).join('') + '</div>' : i === 1 ? '<div class="sun"></div><div class="hill one"></div><div class="hill two"></div>' : '<div class="cup left"></div><div class="cup right"></div>'}</div><strong>${['AFTER<br>GLOW.', 'OUT<br>SIDE.', 'GOOD<br>COMPANY.'][i]}</strong><span class="poster-bottom">${['SOBER RAVE / VIENNA', 'MOVE TOGETHER / WARSAW', 'COFFEE & CONNECTION / BERLIN'][i]}</span></div>`;
const events = [0, 1, 2];
const catNames = [t.rave, t.move, t.coffee];
const eventRows = () =>
  events
    .map(
      (i) =>
        `<button class="event-row" data-event="${i}" data-city="${i + 1}" data-category="${i}" aria-label="${t.open}: ${t.names[i]}"><span class="event-index">0${i + 1}</span><span class="event-name"><strong>${t.names[i]}</strong><small>${t.cities[i + 1]} · ${catNames[i]} · DEMO<span class="mobile-type"> · ${i === 2 ? 'Sober-friendly' : 'Alcohol-free'}</span></small></span><span class="event-type">${i === 2 ? 'Sober-friendly' : 'Alcohol-free'}</span><span class="row-arrow">↗</span></button>`,
    )
    .join('');
const categories = () =>
  `<div class="category-picker" role="group" aria-label="${t.categories}">${[t.all, ...catNames].map((name, i) => `<button data-category-filter="${i - 1}" aria-pressed="${i === 0}">${name}</button>`).join('')}</div>`;
const city = () =>
  `<label class="city-select">${t.city}<select id="city">${t.cities.map((name, i) => `<option value="${i}">${name}</option>`).join('')}</select></label>`;
const scienceSection = () =>
  `<section class="science-explore" id="science-explore"><div class="section-top"><div><span class="eyebrow">01 / SCIENCE & DISCOVER</span><h2>${t.explore}</h2></div><a class="text-link" href="${url('science')}">${t.scienceCta} ${arrow}</a></div><div class="science-layout">${topics()}<div class="research"><div class="research-visual">${wave}<span class="diagram-label">QUESTION → METHOD → EVIDENCE</span></div><div class="research-copy"><span class="eyebrow">${t.inFocus} / <span id="topic-caption">${t.topic[0]}</span></span><h3 id="question">${t.question[0]}</h3><p id="prompt">${t.prompts[0]}</p><button class="round-link" id="read">${t.open}<span>↗</span></button></div></div></div><p class="disclosure">${t.noClaims}</p></section>`;
const eventSection = () =>
  `<section class="events-explore" id="events-explore"><div class="section-top"><div><span class="eyebrow">02 / SOBER EVENTS</span><h2>${t.latest}</h2></div><a class="text-link" href="${url('events')}">${t.eventsCta} ${arrow}</a></div><div class="event-browser"><div class="event-feature"><div id="poster-slot">${poster(0)}</div><div class="poster-controls"><span id="poster-count">01 / 03</span><span>${t.change}</span><div><button id="previous" aria-label="${t.previous}">←</button><button id="next" aria-label="${t.next}">→</button></div></div></div><div class="event-agenda"><div class="agenda-top"><h3>${t.pick}</h3>${city()}</div>${categories()}<div id="event-list">${eventRows()}</div><p id="empty" hidden>${t.empty}</p><div class="results"><span id="result-count" aria-live="polite">3 ${t.results}</span><button id="reset">${t.reset} ↺</button></div><p class="disclosure">${t.demo}</p></div></div></section>`;
const newsDates = ['2026-11-01', '2026-10-31', '2026-10-30', '2026-10-29'];
const newsTypes = ['article', 'study', 'study', 'article'];
const newsTypeLabel = (i) =>
  newsTypes[i] === 'article' ? t.articles : t.studies;
const dateText = (i) =>
  new Intl.DateTimeFormat(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(newsDates[i] + 'T12:00:00Z'));
const home = `<section class="home-welcome"><div><span class="eyebrow"><i class="status-dot"></i>${t.welcomeLabel}</span><h1>${t.welcomeTitle}</h1><p>${t.welcomeBody}</p></div><div class="welcome-mark" aria-hidden="true">${wave}</div></section><section class="news-feed" aria-labelledby="news-heading"><div class="news-heading"><div><h2 id="news-heading">${t.newsTitle}</h2></div><span class="news-count" id="news-count" aria-live="polite">4 ${t.feedCount}</span></div><div class="news-toolbar" role="group" aria-label="${t.categories}">${[
  ['all', t.allNews],
  ['article', t.articles],
  ['study', t.studies],
]
  .map(
    ([id, label], i) =>
      `<button data-news-filter="${id}" aria-pressed="${i === 0}">${label}</button>`,
  )
  .join(
    '',
  )}</div><div class="news-list">${t.newsTitles.map((title, i) => `<article class="news-item ${i === 0 ? 'news-lead' : ''}" data-news-type="${newsTypes[i]}"><button class="news-open" data-news="${i}"><span class="news-art news-art-${i}" aria-hidden="true"><img src="assets/science-${i}.svg" alt="" loading="${i === 0 ? 'eager' : 'lazy'}"></span><span class="news-copy"><span class="news-meta"><span class="news-type">${newsTypeLabel(i)}</span><time datetime="${newsDates[i]}" title="${t.dateLabel}">${dateText(i)}</time></span><h3>${title}</h3><span class="news-description">${t.newsDescriptions[i]}</span><span class="news-read" aria-hidden="true">↗</span></span></button></article>`).join('')}</div></section>`;
const science = `<section class="page-intro"><span class="eyebrow">SCIENCE & DISCOVER / EXPLORER</span><h1>${t.scienceIntro}</h1><p class="intro">${t.scienceSub}</p></section>${scienceSection()}<section class="reading-guide"><span class="eyebrow">EVIDENCE, ALWAYS.</span><h2>${t.sources}</h2>${[t.method, t.origin, t.limits].map((name, i) => `<details><summary><span>0${i + 1}</span>${name}<b>+</b></summary><p>${t.sourceBody}</p></details>`).join('')}</section>`;
const eventPage = `<section class="page-intro"><span class="eyebrow">SOBER EVENTS / FIND YOUR PEOPLE</span><h1>${t.eventIntro}</h1><p class="intro">${t.eventSub}</p></section>${eventSection()}`;
document.documentElement.lang = lang;
document.title = `Soberity · ${screen} · UI v4`;
document.querySelector('#notice').textContent = t.notice;
document.querySelector('#footer').textContent = t.footer;
document.querySelector('.brand').href = url('home');
document.querySelector('#language').textContent =
  lang === 'en' ? 'Polski' : 'English';
document.querySelector('#language').onclick = () => {
  location.search = `?screen=${screen}&lang=${lang === 'en' ? 'pl' : 'en'}`;
};
document.querySelector('main').innerHTML = { home, science, events: eventPage }[
  screen
];
document.querySelector('nav').innerHTML = [
  ['home', '🏠', t.home],
  ['science', '🔬', 'Science & Discover'],
  ['events', '🎉', 'Sober Events'],
  ['games', '🎮', 'Sober Games'],
  [
    'community',
    '👥',
    lang === 'pl' ? 'Soberity (społeczność)' : 'Soberity (community)',
  ],
  ['map', '🗺️', 'World Map'],
  ['brain', '🧠', 'Brain Lab'],
  ['myths', '🤖', 'Myth Buster'],
]
  .map(([id, icon, name], i) =>
    i < 3
      ? `<a href="${url(id)}" ${id === screen ? 'aria-current="page"' : ''}>${icon} ${name}</a>`
      : `<button disabled>${icon} ${name}</button>`,
  )
  .join('');
const menu = document.querySelector('#navigation');
const trigger = document.querySelector('#menu');
trigger.onclick = () => {
  menu.showModal();
  trigger.setAttribute('aria-expanded', 'true');
};
document.querySelector('#close').onclick = () => menu.close();
menu.addEventListener('click', (e) => {
  if (e.target === menu && e.clientX > menu.getBoundingClientRect().right)
    menu.close();
});
menu.addEventListener('close', () => {
  trigger.setAttribute('aria-expanded', 'false');
  trigger.focus();
});
const detail = document.querySelector('#detail');
document.querySelector('#close-detail').onclick = () => detail.close();
let lastFocus;
function showDetail(html) {
  lastFocus = document.activeElement;
  document.querySelector('#detail-body').innerHTML = html;
  detail.showModal();
}
detail.addEventListener('close', () => lastFocus?.focus());
detail.addEventListener('click', (e) => {
  const r = detail.getBoundingClientRect();
  if (
    e.target === detail &&
    (e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom)
  )
    detail.close();
});
document.querySelectorAll('[data-event]').forEach((button) => {
  button.onclick = () => {
    const i = Number(button.dataset.event);
    showDetail(
      `<span class="eyebrow">${t.sample}</span><h2>${t.names[i]}</h2><p>${t.places[i]}</p><div class="detail-poster">${poster(i)}</div><p>${t.demoDetail}</p>`,
    );
  };
});
let topic = 0;
document.querySelectorAll('[data-topic]').forEach((button) => {
  button.onclick = () => {
    topic = Number(button.dataset.topic);
    document
      .querySelectorAll('[data-topic]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    document.querySelector('#question').textContent = t.question[topic];
    document.querySelector('#prompt').textContent = t.prompts[topic];
    document.querySelector('#topic-caption').textContent = t.topic[topic];
    document.querySelector('.research').dataset.topic = String(topic);
  };
});
const read = document.querySelector('#read');
if (read)
  read.onclick = () =>
    showDetail(
      `<span class="eyebrow">SCIENCE & DISCOVER / DEMO</span><h2>${t.question[topic]}</h2><p>${t.prompts[topic]}</p><hr><h3>${t.origin} & ${t.limits.toLowerCase()}</h3><p>${t.sourceBody}</p>`,
    );
let category = -1;
let featured = 0;
function updateFilter() {
  const selected = Number(document.querySelector('#city').value);
  let count = 0;
  document.querySelectorAll('.event-row').forEach((row) => {
    const visible =
      (!selected || Number(row.dataset.city) === selected) &&
      (category < 0 || Number(row.dataset.category) === category);
    row.hidden = !visible;
    if (visible) count++;
  });
  document.querySelector('#result-count').textContent = `${count} ${t.results}`;
  document.querySelector('#empty').hidden = count !== 0;
}
document.querySelectorAll('[data-category-filter]').forEach((button) => {
  button.onclick = () => {
    category = Number(button.dataset.categoryFilter);
    document
      .querySelectorAll('[data-category-filter]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    updateFilter();
  };
});
const citySelect = document.querySelector('#city');
if (citySelect) citySelect.onchange = updateFilter;
const reset = document.querySelector('#reset');
if (reset)
  reset.onclick = () => {
    category = -1;
    citySelect.value = '0';
    document
      .querySelectorAll('[data-category-filter]')
      .forEach((b) =>
        b.setAttribute(
          'aria-pressed',
          String(b.dataset.categoryFilter === '-1'),
        ),
      );
    updateFilter();
  };
function changePoster(direction) {
  featured = (featured + direction + 3) % 3;
  document.querySelector('#poster-slot').innerHTML = poster(featured);
  document.querySelector('#poster-count').textContent = `0${featured + 1} / 03`;
}
const next = document.querySelector('#next');
if (next) {
  next.onclick = () => changePoster(1);
  document.querySelector('#previous').onclick = () => changePoster(-1);
}

document.querySelectorAll('[data-news-filter]').forEach((button) => {
  button.onclick = () => {
    const filter = button.dataset.newsFilter;
    let count = 0;
    document.querySelectorAll('[data-news-type]').forEach((item) => {
      item.hidden = filter !== 'all' && filter !== item.dataset.newsType;
      if (!item.hidden) count++;
    });
    document
      .querySelectorAll('[data-news-filter]')
      .forEach((item) =>
        item.setAttribute('aria-pressed', String(item === button)),
      );
    document.querySelector('#news-count').textContent =
      `${count} ${t.feedCount}`;
  };
});
document.querySelectorAll('[data-news]').forEach((button) => {
  button.onclick = () => {
    const i = Number(button.dataset.news);
    showDetail(
      `<span class="eyebrow">${newsTypeLabel(i)} / DEMO</span><h2>${t.newsTitles[i]}</h2><p>${t.published} · ${dateText(i)}</p><p>${t.newsDescriptions[i]}</p><h3>${t.origin} & ${t.limits.toLowerCase()}</h3><p>${t.sourceBody}</p>${newsTypes[i] === 'study' ? `<p>${t.originalDate}</p>` : ''}`,
    );
  };
});
