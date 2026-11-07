# Admin event editor — P2-I04

Updated 2026-11-06. Web entry: **Profile → Events panel** (`/editorial-events`).
The panel uses `/api/v1/admin/events` for listing, media, creation, editing,
publication and deletion. An Events administrator needs no organizer account,
organizer verification or independent event review in the curated stage.

## Access

Every operation checks the verified Firebase identity and an active `events_admin`
grant. Article AUTHOR/REVIEWER and event organizer/moderator roles do not imply
this grant. Profile checks Events access independently from editorial roles;
direct navigation as a non-admin displays an access error without edit actions.
Grant the intended verified UID through the operator workflow documented in
`LOCATIONS_IMPORT.md`. Never promote all authors or expose self-assigned roles.
The old organizer/moderation endpoints remain blocked.

## Creation and publication

Select country, then city from the global location catalog. Text search never
becomes a location ID; changing country clears city. Reopening restores record
labels, region and district. Optional venue name/address refine the city; existing
exact venue coordinates are preserved when editing within the same city.

Complete title, rich description, HTTPS organizer and source URLs, start, IANA
timezone, category, source confirmation, alcohol/beverage rules and a cover photo.
End is optional; entered times follow the device timezone as explained in the
form, while the event's IANA timezone controls public display. JPEG/PNG uploads
require alt text, max 5 MB; the server normalizes images. Source/content-rights,
strict no-sale/service/BYOB and checked beverage/ABV statements are explicit.
No organization, pricing or organizer-verification form is required by this API.

Save draft, then **Publish event**. Changes to a published event withdraw it to
DRAFT until republished. Version guards reject stale writes. The library is
paginated at 20 per page. Country/city library filters are independent from the
event form and are applied on the server before count and pagination. Changing
country clears city; changes reset the page. Clear location restores the entire
library. Rows show localized city/country names.

The web panel has its own bounded, keyboard-focusable vertical scroll container
inside the app layout. Switching between library and form scrolls to the top.

Delete requires confirmation, uses expectedVersion,
refreshes the library and removes the event from public projections. Catalog,
Home and details already reload on route focus; requests do not cache private
responses. Joined remains deferred to P2-I05.

Descriptions keep the existing Tiptap editor. The curated API validates structured
JSON with BlogDocument, rejects embedded images/unsupported nodes and stores it
with the immutable revision. Private/public detail decode JSONB into structured
JSON for reopening and reading. No migration was required.

Native editing remains web-only, as before. This repair does not claim native
editor support or a complete P2-I04 acceptance.

## Verification

See PHASES.md for the actual test results and remaining acceptance work. Backend
lifecycle/ACL tests use isolated PostgreSQL and mocked verified identities; browser
editor tests use controlled API fixtures and do not log in as the owner's account.
The owner's email was matched against development Firebase before provisioning
its local PostgreSQL grant. No production role or Firebase account was modified.

The scrolling/location-filter correction on 2026-11-06 is NOT VERIFIED: the owner
requested no tests. Only formatting and a backend package/restart with test
execution and test compilation disabled were performed. Previous test results
cover the earlier admin-access repair, not this follow-up.
