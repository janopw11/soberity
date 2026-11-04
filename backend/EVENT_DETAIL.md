# P2-I03 — Event detail, external checkout & links

Prepared 2026-11-04, **NOT VERIFIED**. No tests, typecheck, compilation, API
requests, browser/simulator checks, migration execution or restart were performed.
P2-I01/V17 and P2-I02 remain unverified dependencies; this iteration does not
mark them DONE. No new dependencies or production hosting changes.

## Routes and scope

`/events` is now an Expo stack, retaining the existing discovery route and
menu/header controls. Cards are whole-card links with real web hrefs and
hover/pressed/focus feedback. `/events/{uuid}` renders details from the existing
public projection; invalid IDs never cause arbitrary-path requests. Native
example: `soberity-dev:///events/{uuid}` with the existing development scheme.
Incoming query parameters are never used as external redirect destinations.
Guests retain public access through the existing auth shell; authenticated users
retain menu/profile/back controls. No new universal/app links or domain ownership
claims have been configured.

Detail shows the real cover/fallback, title/category/policy, start/end in the
IANA event timezone (including dates on both sides of midnight), price in currency
minor units, description, alcohol/beverage rules, venue/address/accessibility,
entry rules and verified organizer data. No contact email or moderation evidence
is exposed. Organizer data failure does not hide the event. No organizer portal
or separate organizer-profile route from P2-I04 was introduced.

Cancelled events show their last published snapshot with a cancellation notice;
ended events show an ended notice. Calendar and checkout actions are omitted for
both, and checkout is omitted for SOLD_OUT/missing/invalid links. Unpublished,
suspended and expired public records retain the API's404 boundary. Fetches use
timeouts, cleanup/abort and refetch on focus, with unavailable/error/retry states.

## External links

Ticket and organizer URLs must parse as absolute HTTPS with a host, no credentials,
control characters or whitespace. Other schemes, protocol-relative paths and
arbitrary client redirect parameters are rejected. A dialog shows the normalized
destination hostname before opening the OS browser. The application does not
implement an open redirect endpoint or relay authentication tokens to sellers.

Before an action, details are fetched again through the public API. Ticket links
must still match the displayed destination, the event must still be published,
not ended or sold out; organizer URLs are likewise fetched again. A changed
link requires a fresh user action. Browser/OS failures produce a localized error.
This does not guarantee the availability, expiry or redirect behavior of an
external website, or guarantee seats after click-through; the provider controls
checkout. No payment integration or transaction is performed by this iteration.

## Calendar

Public `GET /api/v1/events/{uuid}/calendar.ics` reuses the public detail gate,
then rejects cancelled/ended events with410. Returns `text/calendar;charset=UTF-8`,
no-store, attachment with UUID-only filename. UTC DTSTART/DTEND preserve the exact
instants across DST. UID is stable per event, fields are escaped against content
line injection, folded to75 UTF-8 octets without splitting Unicode code points,
and separated with CRLF. Description and location use public content only;
private contact/source data, alarms and external executable fields are omitted.

Web fetches the attachment and starts an ICS download. Native opens the configured
API attachment URL in the OS/browser import flow. This is calendar-file export,
not direct insertion into Apple/Google calendars; app/browser import support
requires owner acceptance. No calendar permission, background synchronization,
calendar modification or guarantee that an event was saved. Re-import behavior
and later event updates are controlled by the user's calendar application.

## Minimal public SEO contract

Current implementation: semantic headings, crawlable internal hrefs, unique
runtime title (`title · Soberity`), dynamic escaped description and explicit
`noindex,follow` while using the existing static Expo shell. Missing/loading pages
clear stale metadata. No fabricated canonical domain, fake Event structured data,
unverified offers or ratings.

Before allowing indexing in production, the minimum requirements are:

- Owned HTTPS canonical origin with one canonical `/events/{uuid}` per event;
  query/filter variants must not create duplicates.
- Hosting must serve direct event URLs and reloads, not only client navigation.
  Current static Expo dynamic routes require an appropriate hosting fallback or
  a deliberate SSR/prerender strategy. This session does not deploy or assert it.
- Render verified public title/description/status in initial HTML; unavailable
  records need real404/410 responses and private/draft records must never render.
- Published/updated/cancelled content must obey the same API visibility and cache
  invalidation rules. Generate sitemap entries only from eligible public records.
- Add schema.org Event metadata only from real public fields, with true status,
  timezone, location and offers only when known. Validate with owner-operated
  checks before removing noindex. Dynamic Open Graph/image and universal links
  require the final owned domain and hosting setup.

T04 establishes these requirements; production SEO/indexing is not claimed done.

## Acceptance handoff — NOT EXECUTED

Owner: activate the backend including V17/new calendar code, publish real reviewed
content, then exercise list → detail → organizer/tickets on web/iOS/Android;
direct reload/native deep link and back; invalid UUID/404/withdrawn/suspended,
ended/cancelled/sold-out states; updated URLs between render and click; rejected
schemes/credentials/control characters; external failure/expiry; image and
organizer errors; calendar download/import with EN/PL Unicode, long text/newlines,
DST and midnight crossings; keyboard/screen readers/large fonts/narrow layouts
and Ocean light/dark. All remain NOT VERIFIED, as do tests/builds/typecheck.

Separate owner tweak: Articles week-star badge visual reduced to36×28 minimum
with a16px icon, retaining a48×44 target and the existing popover. Not verified.
CHANGELOG is deferred until actual verification.
