## Premium Tier — $4/month or $27 lifetime

### What unlocks with Premium
1. **Background sounds** in the Message Player (rain, ocean, brown noise, etc.)
2. **Favorites** — saving messages to the Favorites page
3. **Premium avatars** — a new pack of fancier avatars (gradient backgrounds, animated emoji set) added alongside the free 20

### Pricing
- **$4 / month** recurring subscription (Stripe Checkout, `mode: subscription`)
- **$27 one-off** lifetime unlock (Stripe Checkout, `mode: payment`)

### Backend (Stripe + Cloud)
- New `subscribers` table: `user_id`, `email`, `stripe_customer_id`, `subscribed bool`, `lifetime bool`, `subscription_end`, `updated_at`. RLS: user can read own row only; edge functions write via service role.
- Stripe products created via tool: "Voices Premium Monthly" ($4/mo) and "Voices Lifetime" ($27 one-off).
- Edge functions (all `verify_jwt = false`, validate JWT in code):
  - `create-checkout` — creates Stripe subscription Checkout session
  - `create-lifetime-payment` — creates one-off Checkout session
  - `check-subscription` — looks up Stripe subscriptions + checks `lifetime` flag, upserts `subscribers` row, returns `{ premium: bool, plan: 'monthly'|'lifetime'|null, subscription_end }`
  - `customer-portal` — opens Stripe billing portal for subscription management
- Stripe key already present (`STRIPE_SECRET_KEY`).

### Frontend
- **`usePremium()` hook**: calls `check-subscription` on mount/auth change, exposes `{ premium, plan, loading, refresh }`.
- **`/pricing` page**: two cards (Monthly / Lifetime), buttons invoke respective edge function and open Stripe Checkout in new tab.
- **`/premium-success` page**: thanks user, auto-calls refresh.
- **Header**: small "Upgrade" button when not premium; small ✨ Premium badge when premium. Link to manage subscription (portal) for monthly subscribers.
- **Background music** (`MessagePlayer`): if not premium, show controls disabled with a lock + "Unlock with Premium" link.
- **Favorites**:
  - Heart/save button on messages: if not premium, clicking opens an upgrade dialog instead of saving.
  - `/favorites` page: if not premium, replace list with upgrade card.
- **Premium avatars**:
  - Extend `src/lib/avatars.ts` with `PREMIUM_AVATARS` (10–12 new ones, distinct gradient backgrounds + richer emoji set) and a `premium: boolean` flag on each avatar.
  - `getAvatar()` continues to resolve any id; non-premium users selecting a premium id is prevented in the picker (locked overlay + tooltip).
  - Profile page picker shows two sections: Free / Premium (locked unless `premium`).

### Memory updates
- Remove the "100% free / no Stripe" core rule.
- Add new memory entries: `premium-tier` (pricing, what unlocks), `premium-avatars`.

### Technical notes
- Subscription verification approach matches Lovable's standard: query Stripe by email each time `check-subscription` runs, plus an OR check on the `lifetime` column in `subscribers` (set by `create-lifetime-payment` after a successful Checkout via `verify-payment` style follow-up — implemented inside `check-subscription` by listing the user's recent paid Checkout Sessions for the lifetime price).
- All paywalled UI keeps existing components functional for premium users; only the gating layer is added.
- Rule-of-thumb: never trust client `premium` flag for actions that mutate data — `favorites` insert remains protected by the upgrade-dialog UX (no server-side enforcement needed since favorites table already has RLS by `user_id`; users could bypass UI but that's acceptable for this app's scope). If you want strict enforcement, say so and I'll add a `has_premium(uuid)` SQL function + tighten the favorites INSERT policy.
