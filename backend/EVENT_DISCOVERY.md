# P2-I02 — Event discovery handoff

Prepared 2026-11-04, **NOT VERIFIED**. No tests, build, typecheck, browser,
simulator, API requests, backend restart or migration execution were performed
at the owner's request. P2-I01 and V17 remain prerequisites, not automatically
accepted or applied by implementing this screen.

## Scope

`/events` now renders the shared Expo/React Native discovery screen on web,
iOS and Android instead of UnavailableScreen. Existing menu/header navigation
is retained. Data comes exclusively from the public Events API. No seeded events,
fictional dates/prices or extension of the Home preview are introduced.

- City, category, inclusive calendar-day date range and explicit alcohol-policy
  selector; extra filters for region/country, price kind, ISO currency and maximum
  amount, venue accessibility and optional radius.
- Apply button validates and resets pagination. Reset clears all filters, sorting
  and the in-memory search point. Filter edits do not silently change displayed
  results until applied; the screen explains this behavior.
- Server-side start-date ordering (ascending/descending),12 items/page, bounded
  requests, retry, initial loading, empty search, out-of-range-page recovery,
  stale-response cancellation and refetch on screen focus.
- Locale-aware dates in each event's IANA timezone, start/end shown even across
  midnight, price display honoring currency minor units, category/strict-friendly
  badges, organizer/venue, availability and known accessibility. Sober party/rave
  category badges have stronger brand emphasis. Missing/failed images use a quiet
  calendar fallback. Event language differing from UI language is identified;
  interface language does not filter out events or pretend to translate content.
- Responsive wrapping grid/filter rows, semantic Ocean tokens in both themes,
  existing Screen/TextField/Button/Dialog/SettingsGroup/SettingsRow/Pagination.
  Filter menus use dialogs with existing keyboard/Back/Escape behavior.

Cards are informational summaries in this iteration: event-detail navigation,
calendar export and ticket links belong to **P2-I03**, not fake disabled actions.
No changes to unrelated Home sections or new dependencies.

## Backend additions

`GET /api/v1/events` additionally accepts `region` (case-insensitive exact match)
and `sort=START_ASC|START_DESC|PRICE_ASC` (default START_ASC). Ordering occurs
before pagination, with ID tie-breakers. PRICE_ASC requires a valid ISO currency,
avoiding comparisons of different currencies; UI currently offers date ordering.
Existing public eligibility rules and projection remain unchanged. No additional
migration is needed beyond the pending V17 from P2-I01.

## Date and location privacy

From/through fields use calendar days in the viewer's device timezone, identified
in the form. The client converts local midnight to UTC and advances the end by
one calendar day with Date.setDate, rather than adding a fixed24 hours across
DST. Backend start-inclusive/end-exclusive filtering and ended-event exclusion
remain authoritative. Changing UI language does not reinterpret dates.

Radius search is opt-in. Manual coordinates work on all platforms, without
permissions; web additionally offers an explicit one-shot browser geolocation
button when supported. The browser may request foreground permission after that
click. No automatic request on mount, location watcher, native background/device
permission or storage dependency. In Expo native, this iteration uses manual
coordinates; automatic native GPS is not provided. Denied/unavailable browser
location leaves city/manual search usable. Unmounted or cleared requests are
ignored. Coordinates are kept only in component memory and sent as search query
parameters when applied; they are not put into navigation URLs/profile/storage.
Venue records without coordinates cannot match a radius query.

## Owner acceptance — NOT EXECUTED

After V17/backend activation and publication of a real reviewed event:

1. Open `/events` from the Sober Events menu on web/iOS/Android. Check real data,
   loading/failure/retry/empty states and both EN/PL themes.
2. Apply city, region/country, category, free/paid/unknown, maximum price with
   currency and accessibility. Check reset and validation. Strict is default;
   friendly appears only after explicit selection, without silent fallback.
3. Page and change ordering/filters; ensure server-wide order and page reset.
   Check an event removed between page fetches and return to the first page.
4. Check midnight crossings, event vs viewer timezone, inclusive final day,
   leap/invalid dates, DST boundaries and non-two-decimal currencies.
5. Enable nearby only explicitly; deny browser permission, enter manual valid
   and invalid coordinates/radius, clear during an in-flight request, navigate
   away and return. Confirm no prompt occurs by merely opening the screen.
6. Check320px/large-font/mobile/tablet/desktop layouts, image failures, long
   titles/translations, keyboard focus and modal dismissal, VoiceOver/TalkBack,
   screen-reader labels and contrast. These are not yet verified.

CHANGELOG entry deferred until actual verification; PHASES checkboxes remain open.
