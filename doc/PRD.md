# BNOC – Daily Meetup Selfie App  
**Product Requirements Document — MVP v0.1 (June 2025)**  

---

## 1. Problem & Opportunity  

Stanford undergraduates want to broaden their social circles yet rarely step outside existing friend groups. Current social apps emphasise either heavily curated personas (Instagram) or ephemeral chat (Snapchat) and do not actively **catalyse new, in‑person connections**.  
BNOC (“Big Name On Campus”) fills this gap by  

1. *Pairing* two students every day at 07 : 00 PT;  
2. Providing a **temporary 1‑to‑1 chat** so partners can coordinate;  
3. Requiring each partner to submit a selfie before 22 : 00 PT;  
4. Publishing a dual‑photo post to their mutual friends, rewarding follow‑through and gently penalising flakes.  

---

## 2. Goals & Success Metrics  

| Objective | Metric | Target (first 30 days) |
|-----------|--------|------------------------|
| Onboard active students | Verified sign‑ups | ≥ 100 |
| Core loop completion | % of assigned pairs that submit BOTH photos within 24 h | ≥ 50 % |
| Stability | Crash‑free sessions | ≥ 98 % |

---

## 3. Personas  

* **First‑year Explorer** – eager to meet new people, limited existing network.  
* **Busy Sophomore** – limited free time, values lightweight social prompts.  
* **Community Builder** – socially‑active upper‑class student, keen to connect peers.

---

## 4. Core User Journey (MVP)

1. **Onboarding**  
   * Stanford‑verified login (Apple / Google).  
   * Choose username.  

2. **Morning Pairing (07 : 00)**  
   * Push notification → opens *Pairings* tab → sees partner & chat.  

3. **Coordination Chat**  
   * Simple text chat, auto‑expires after 24 h.  

4. **Selfie Capture**  
   * Tap **Take Photo** → `expo‑camera` view → capture → preview → submit.  

5. **Completion / Flake**  
   * Feed updates instantly when the 2nd photo arrives.  
   * At 22 : 01 Cloud Function marks incomplete pairs as **Flaked**; increments both users’ counters.  

6. **Feed Interaction**  
   * Feed lists completed pairings for mutual friends (read‑only).

---

## 5. Functional Requirements (Launch Scope)

| # | Requirement | Priority |
|---|-------------|----------|
| FR‑1 | Stanford‑verified authentication (Apple/Google OAuth restricted to @stanford.edu). | Must |
| FR‑2 | Daily pairing job assigns each user one partner, avoiding repeats within 7 days. | Must |
| FR‑3 | Simple 24‑hour text chat for the pair; messages auto‑delete after expiry. | Must |
| FR‑4 | Each user can capture and submit one selfie to the pairing. | Must |
| FR‑5 | Pair status lifecycle: `pending` → `submitted` (per user) → `completed` / `expired`. | Must |
| FR‑6 | Minimal feed displaying the one or two selfies and timestamp to mutual friends. | Must |
| FR‑7 | Basic block/report user action (hides future pairings). | Should |

---

## 6. Non‑Functional Requirements  

* **Performance** – Feed first paint < 1 s on iPhone 11.  
* **Privacy** – Images stored in Firebase Storage, hard‑deleted after 60 days (feed shows max 30 days).  
* **Security** – Firestore rules lock chat & pairing docs to participants; no world‑readable paths.  

---

## 7. Out of Scope (Launch)

* Likes, comments, or reactions on feed posts.  
* Push notifications and reminders (will rely on in‑app polling initially).  
* Flake‑Streak tracking and visualisations.  
* Friend management and social‑graph features.  
* Rich‑media chat, image moderation, or Snooze tokens.

---

## 8. Technical Architecture (Excerpt)  

* **Client** – React Native + Expo (`expo‑camera`, `nativewind`).  
* **Backend** – Firebase:  
  * **Auth** – Email/Apple/Google sign‑in with `@stanford.edu` domain check.  
  * **Firestore** – Collections: `users`, `pairings`, `chats`, `feedPosts`.  
  * **Storage** – Path `pairings/{pairingId}/{userId}.jpg`.  
  * **Cloud Functions** –  
    * `createDailyPairings` (07 : 00)  
    * `checkFlakesDaily` (22 : 01)  
    * `dispatchNotifications` (trigger‑based)  

---

## 9. Analytics Instrumentation  

| Event | Parameters |
|-------|------------|
| `signup_success` | `user_id` |
| `pair_assigned` | `pairing_id`, `user1_id`, `user2_id` |
| `chat_opened` | `user_id`, `pairing_id` |
| `message_sent` | `user_id`, `pairing_id` |
| `single_photo_submitted` | `user_id`, `pairing_id` |
| `pair_completed` | `pairing_id` |
| `flake_incremented` | `user_id`, `streak_length` |

---

## 10. Risks & Mitigations  

| Risk | Impact | Mitigation |
|------|--------|-----------|
| One‑sided submission | Frustration & churn | Clear rules, in‑app reminders, future “Nudge” feature |
| Inappropriate photos / messages | Safety & brand damage | Block/report in MVP, AI moderation Post‑MVP |
| Low chat engagement | Lower completion rate | Push when partner messages, UX prompts |
| Privacy concerns | User trust | Auto‑delete chat & photos, transparent policy |

---

## 11. Roadmap (Post‑MVP)

1. Push notifications for pair assignment & reminders.  
2. Likes, comments, and Flake‑Streak gamification.  
3. AI image moderation pipeline.  
4. Rich‑media chat and longer retention.  
5. Friend suggestions & invite flow.  
6. Analytics instrumentation & growth metrics.

---

## 12. Open Questions  

1. **Friend Mechanics** – Does adding a friend require mutual acceptance or one‑way follow?  
2. **Pairing Pool** – Are users paired campus‑wide or only with mutual‑friend overlap?  
3. **Photo Privacy Option** – Can a user mark their selfie private to partner only?  
4. **Flake Visibility** – Are Flake Streaks public, private, or friends‑visible?  
5. **Grace Period** – Any allowance after 22 : 00 (tokens)?  
6. **Moderation Queue** – Is manual review needed before posting?  
7. **Onboarding Bottleneck** – What if a new user can’t reach 5 friends immediately?  
8. **Data Retention Beyond 60 days** – Needed for metrics or research?  
9. **Notification Preferences** – Is 20 : 00 reminder configurable?  
