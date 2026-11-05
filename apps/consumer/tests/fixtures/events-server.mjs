/** Explicit loopback-only synthetic API fixture for native P2-I02 acceptance. Never imported by the application. */
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const image = readFileSync(
  new URL(
    '../../assets/images/schonbrunn-vienna-preview.jpeg',
    import.meta.url,
  ),
);
const country = {
  id: '10000000-0000-4000-8000-000000000001',
  geoname_id: 1,
  name: 'Austria',
  label: 'Austria',
  label_en: 'Austria',
  label_pl: 'Austria',
};
const city = {
  id: '20000000-0000-4000-8000-000000000001',
  geoname_id: 101,
  name: 'Wien',
  label: 'Vienna',
  label_en: 'Vienna',
  label_pl: 'Wiedeń',
  region: 'Vienna',
  district: null,
};
const event = {
  id: '30000000-0000-4000-8000-000000000001',
  title: 'Synthetic sober rave',
  description: 'Synthetic event fixture for native UI acceptance.',
  locale: 'en',
  category_code: 'SOBER_RAVE',
  track: 'SOBER_NIGHTLIFE',
  alcohol_policy: 'ALCOHOL_FREE',
  starts_at: '2029-11-06T19:00:00Z',
  ends_at: null,
  timezone: 'Europe/Vienna',
  city: 'Wien',
  city_en: 'Vienna',
  city_pl: 'Wiedeń',
  region: 'Vienna',
  country_code: 'AT',
  country_id: country.id,
  city_id: city.id,
  venue_name: 'Synthetic venue',
  address: '',
  price_kind: 'UNKNOWN',
  price_minor: null,
  currency: null,
  accessibility: 'UNKNOWN',
  availability: 'UNKNOWN',
  cover_id: '40000000-0000-4000-8000-000000000001',
  cover_alt_text: 'Synthetic fixture image',
  coordinate_source: 'CITY',
  distance_km: 5,
  organizer_url: 'https://example.test/event',
  status: 'PUBLISHED',
  alcohol_rules: 'No alcohol',
  beverage_notes: '0.0% only',
  accessibility_notes: null,
  entry_rules: '',
};
let mode = 'results',
  queries = 0;
const profiles = new Map();
createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'authorization,content-type',
  );
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  const url = new URL(request.url, 'http://127.0.0.1:18180');
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
    response.writeHead(400);
    response.end('{}');
    return;
  }
  let uid = 'fixture';
  try {
    uid =
      JSON.parse(
        Buffer.from(
          (request.headers.authorization ?? '').split('.')[1] ?? '',
          'base64url',
        ).toString(),
      ).user_id ?? uid;
  } catch {
    /* Synthetic identity boundary only. */
  }
  if (url.pathname.includes('/media/')) {
    response.setHeader('Content-Type', 'image/jpeg');
    response.end(image);
    return;
  }
  response.setHeader('Content-Type', 'application/json');
  let value;
  if (url.pathname === '/__fixture/mode') {
    if (request.method === 'POST') mode = body.mode;
    value = { mode, queries };
  } else if (url.pathname === '/api/v1/identity/me')
    value = { uid, emailVerified: true };
  else if (url.pathname === '/api/v1/me') {
    const profile = profiles.get(uid) ?? {
      id: uid,
      displayName: 'Synthetic member',
      city: null,
      interests: [],
      locale: 'en',
      updatedAt: new Date().toISOString(),
    };
    if (request.method === 'PATCH') Object.assign(profile, body);
    profiles.set(uid, profile);
    value = profile;
  } else if (url.pathname === '/api/v1/discover/weekly/current')
    value = { article: null, fallback: false };
  else if (url.pathname === '/api/v1/science/categories') value = [];
  else if (url.pathname === '/api/v1/editorial/me') value = { uid, roles: [] };
  else if (url.pathname === '/api/v1/locations/countries')
    value = { items: [country], page: 0, size: 20, total: 1 };
  else if (url.pathname === '/api/v1/locations/cities')
    value = { items: [city], page: 0, size: 20, total: 1 };
  else if (url.pathname === '/api/v1/events/nearby') {
    queries++;
    if (mode === 'error') {
      response.writeHead(503);
      response.end('{}');
      return;
    }
    value = {
      items:
        mode === 'empty'
          ? []
          : [
              event,
              {
                ...event,
                id: '30000000-0000-4000-8000-000000000002',
                title: 'Synthetic coffee meetup',
                category_code: 'COFFEE_MEETUP',
                distance_km: 20,
              },
            ],
      page: 0,
      size: 3,
      total: mode === 'empty' ? 0 : 2,
      radiusKm: 100,
    };
  } else if (url.pathname === '/api/v1/events')
    value = { items: [event], page: 0, size: 12, total: 1 };
  else if (url.pathname.startsWith('/api/v1/events/')) value = event;
  else {
    response.writeHead(404);
    value = {};
  }
  response.end(JSON.stringify(value));
}).listen(18180, '127.0.0.1', () =>
  console.log('Synthetic native Events fixture listening on loopback 18180'),
);
