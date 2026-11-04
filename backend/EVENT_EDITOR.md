# Manual event editor — scoped P2-I04 work

Prepared2026-11-04. **NOT VERIFIED** at the owner's request: no tests/builds,
typecheck, API/browser/simulator checks, migrations or backend restart.

## Entry and fields

Web: **Profile → Events panel** (`/editorial-events`), alongside existing article,
weekly-feature and quiz editorial entries. Entry follows existing editorial
membership visibility; the authenticated route and every API operation enforce
identity and organizer membership separately. Use an existing own organizer or
create one with name/about/HTTPS website/private contact email. An unverified
host can save drafts; host verification is required before submission.

Main event fields: name, Tiptap description (bold/italic/underline, headings,
bullets/numbers and text alignment), photo with alt text, HTTPS organizer URL.
Existing Tiptap dependencies and Ocean semantic tokens are reused. Photos use
existing member-only upload/preview, normalized JPEG1600×900,5MB limit; object URLs
are revoked on replacement/unmount. No remote-image fetching or inline images.

Catalog requires real dates, IANA timezone, category, venue/address/city/country,
price kind, alcohol/beverage/entry rules and private source confirmation. These
are grouped below the main fields. Unknown price stays UNKNOWN; alcohol controls
are never assumed false without confirmation. Permissions attestation and human
review still gate publication. No fake dates, venues, policy assertions or prices
are invented to bypass the data model. Save draft validates the existing required
event fields; it is not a four-field incomplete-draft persistence API.

Library lists own events, paginated50/page, with status and reopening for edit.
Organization pages are likewise bounded50/page. Saving appends an immutable
revision and uses expectedVersion. Existing accessibility/availability/locale
values are preserved on edits. Venue changes create new immutable venue snapshots;
unchanged venues are reused. Exact owned-venue lookup avoids assuming a venue is
on the first page. Unsaved descriptions have a before-unload warning. Events can
be sent for review after saving; no self-verification/approval/publish bypass was
introduced. Existing independent moderator API remains responsible for approval
and publication; no moderation UI or public organizer-profile page is claimed.
The rest of P2-I04 remains open.

## V18 contract

`events_revision.description_document` nullable JSONB and `organizer_url` optional
HTTPS field. Organizer EventInput additionally accepts `descriptionDocument`
(Tiptap JSON) and `organizerUrl`. Existing clients can omit both. Documents pass
existing server BlogDocument allowlist/depth/complexity checks, exclude embedded
images and require nonempty text, max30000 plain characters/200000 serialized
characters. No arbitrary HTML is persisted. Private revision/public detail decode
JSON to structured content; public list avoids sending the full rich document.
Public detail renders RichDocument with plain-text fallback for older records.
Calendar/metadata retain plain text. The event-specific organizer URL is rechecked
on external navigation; organization website remains fallback for older records.

`GET /api/v1/organizer/organizations/{org}/venues/{venue}` is member-only and
returns only a venue owned by that organization, otherwise404. Private contact
and evidence data remain excluded from public projections.

Activation requires pending V17 plus V18 and a backend rebuild/restart by the
owner; none performed here. Native editing shows the same web-only message as
the existing article editor; native public event reading retains formatting.

## Acceptance handoff — NOT EXECUTED

Owner: open Profile → Events panel, create/select own organizer, add real fields
and photo, save/reopen/edit rich content, submit after host verification. Check
formatting in public details only after independent publication; cross-organizer
venue/media ACL, stale-version conflict, changed published content hiding until
review, image failures/size/alt, UTF-8, EN/PL/Ocean themes/mobile web, DST and price
validation, unsaved content and object-URL lifecycle. Verify V18 on existing/plain
records and direct API invalid document/link inputs. No results claimed.
CHANGELOG deferred until verification; P2-I04 checkboxes remain open.
