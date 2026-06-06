# Home, Feed & Auth redesign — design assets

Supports issues **#403** (unified auth surface) and **#404** (browse-first Home/Feed states).

**Spec (source of truth):** [`docs/superpowers/specs/2026-06-06-home-feed-auth-states-design.md`](../../superpowers/specs/2026-06-06-home-feed-auth-states-design.md)

## Artifacts (open the HTML in a browser)

| File | What it is |
|---|---|
| `loggedout-website-vs-native.html` | The final logged-out model: website Landing + Explore + ghost Home/Feed vs native browse-first Home; account-less RSVP (18+) and the hard invite gate. |
| `mockups-states.html` | Signed-in / member states catalog: one event card, Home spine, Feed warming/active, center rows. |
| `flow-prototype.html` | Clickable end-to-end prototype (iOS + desktop): the two paths — account-less RSVP and invite-gated account → onboarding. |
| `journey-map.html` | Approved user-journey map (vouch → browse → RSVP → join → engage → invite loop), with the logged-out-vs-member feature matrix. |
| `screenshots/` | Static renders embedded in the issues. |

## The model in one paragraph

Two decoupled tiers. **Anyone 18+ can RSVP** to an event with name + email, no account (backend already supports this: `POST /attendEventGuest` + `event_guest_rsvps` + `upgradeGuestRsvpsForUser`, #191). **A full account is hard invite-gated** — invite link is the common path, manual code entry is the fallback — and requires the full profile (name, birthdate, home center, interests). Logged-out: the **website** opens on a marketing Landing and uses Explore as the browse surface (Home/Feed ghost); the **native app** keeps a browse-first Home. No public feed is shown to guests on any surface. 18+ is asked once.
