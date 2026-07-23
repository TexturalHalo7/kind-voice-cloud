# Phased build plan

Shipping in 4 phases so you can review each before the next. All existing categories/report reasons are replaced with the new spec. No AI moderation — trust is rating + report driven.

---

## Phase 1 — Recording flow + rating (this turn)

**Categories (replace existing 4)**
Card grid on the recorder — must be selected before mic unlocks:

- ❤️ Appreciated — "Tell someone why they are valued and appreciated."
- 💪 Encouragement — "Leave a comforting message that could help someone having a difficult day."
- 🎉 Congratulate — "Celebrate someone's achievement with genuine happiness."
- 🙏 Thank you — "Express sincere gratitude to someone who made a difference."
- 🌟 You matter — "Remind someone that their life has value and that they are important."

Kindness reminder banner shown above mic after category picked. Recording capped at **30 seconds** (auto-stop + visible countdown).

**Rating (replaces "Thank You" button on the player)**
After audio `ended`, show 4 large buttons: ❤️ Made my day / 😊 Nice / 😐 Neutral / 🚩 Inappropriate. Listener must rate before "Hear Another" unlocks. One rating per listener per message (unique constraint). Self-messages can't be rated.

**DB (Phase 1 migration)**
- `voice_messages.category` values migrated: `general→you-matter`, `encouragement→encouragement`, `gratitude→thank-you`, `motivation→congratulate`. New value `appreciated` added.
- New `public.message_ratings` (message_id, listener_id, sender_id, rating enum, created_at; unique on message+listener) with RLS + GRANTs.
- Update `get_random_voice_messages` to accept new category values.

---

## Phase 2 — Reports + auto-hide + reputation

- Replace reasons in report dialog with: Bullying/harassment, Hate speech, Threats/violence, Sexual/inappropriate, Spam, Other. Confirmation step before submit. One report per user per message (already enforced).
- New `public.sender_reputation` (user_id PK, score int, hidden_until, suspended_until, updated_at).
- DB trigger on `message_ratings` insert: ❤️=+3, 😊=+1, 😐=0, 🚩=−5 to sender score. Never exposed to clients.
- DB trigger on `voice_message_reports` insert: −2 to sender score; when a message hits **3 distinct reporters**, set `voice_messages.is_hidden=true` (new column, defaults false). Public RPC excludes hidden.
- Suspension: 5 distinct reports in 30 days OR score < −20 → set `suspended_until = now()+7 days`. `AudioRecorder` blocks upload while suspended with reason toast + notification row.
- Anti-abuse: rate-limit reports to 10/day per user via trigger; self-rating/self-report blocked in RLS.

---

## Phase 3 — Admin roles + dashboard

- New `public.app_role` enum (`admin`, `moderator`, `user`), `public.user_roles` table, `has_role(uuid, app_role)` SECURITY DEFINER function (per project rules). You promote yourself via a one-off insert I'll walk through.
- `/admin` route, gated by `has_role`. Stats cards: total messages, messages today, rating breakdown, reports today, auto-hidden count, suspended users, top-rated senders, most-reported senders, popular categories.

---

## Phase 4 — Moderation queue

- `/admin/queue` lists hidden messages with audio player, report count, reasons list.
- Actions (admin-only RPCs): Approve (unhide + clear reports flag), Keep hidden, Delete permanently (removes storage file + row), Suspend sender (extend), Unsuspend sender.

---

## Notes / open items

- **Transcription**: spec mentions "View transcription (if available)" in the queue. Per your answer, no AI this round — queue will show category + reasons only; transcription can be added later.
- **Existing data**: current messages get remapped categories (see Phase 1). Existing `message_thanks` stays as-is; the new rating system is separate.
- **Memory conflict**: no changes needed — the "no AI moderation" rule stays in place. I'll add a new memory documenting the rating/reputation thresholds after Phase 2 lands.

Reply "go" to start Phase 1, or tell me what to tweak.
