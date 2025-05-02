# Daily Meetup Selfie App - Product Requirements Document

## Executive Summary

Stanford students want new connections but stay inside narrow friend circles, a gap our Daily Meetup Selfie app can fill. Every 24 hours the backend pairs two friends and nudges them to snap a dual-camera selfie—IRL or over a quick video call—then auto-posts the composite to a scrolling feed. Missing a day increments a visible Flake Streak, borrowing proven habit-forming mechanics from streak-based apps such as BeReal and Duolingo. The MVP will ship on iOS + Android with React Native, Firebase, and react-native-vision-camera, keeping friction—and overhead—low.

## Goals & Success Metrics

- **Serendipitous connections** – ≥ 60% of active users add three or more new contacts within 90 days
- **Daily engagement** – Selfie-completion rate ≥ 55% (pairs posted ÷ pairs assigned)
- **Viral growth** – K-factor ≥ 0.35 inside dorm clusters
- **Healthy pressure** – Median Flake Streak ≤ 2 consecutive days

## User Insights

- Ten Stanford sophomores interviewed said they want excuses to reach out but fear awkwardness; they welcome structured prompts.
- Peer pressure strongly drives mobile-social participation; no one wants to let their partner down.
- Filter-bubble research at Stanford shows students stay inside like-minded circles unless nudged outward.

## Personas

- **Jamie (20)** – Busy CS major: needs low-effort social prompts during packed schedules.
- **Riley (19)** – Out-of-state sophomore: wants structured ways to deepen weak-tie friendships.
- **Alex (21)** – Social connector: loves playful mechanics that motivate their circle.

## Key User Flows

1. **07:00 PT push**: "Today you're paired with Chris—take a selfie together!"
2. **Camera screen**: simultaneous front+rear capture with time remaining counter showing deadline (10:00 PM PT).
3. **Upload**: app stitches the two images side-by-side and posts instantly to the feed.
4. **Feed scroll**: newest pairs on top; tap to zoom and leave a "👋 Wave". Feed pulls from Firestore for speed.
5. **Flake handling**: if day ends without completion (at 10:00 PM PT), the tile shows a "🥶 Flaked" badge and both users' Flake Streaks increment.

## MVP Feature Scope

- Firebase email / Apple / Google auth with Stanford email verification
- Cloud Function (05:00 PT) that shuffles active users and pairs adjacent IDs; avoids repeats via simple graph check
- Dual-camera capture with react-native-vision-camera
- Real-time feed in Firestore; storage for 30 days then auto-delete
- Flake Streak counter and badge logic
- Push reminders via Expo FCM
- Reactions ("Wave" overlay), profile page, block/report

Post-MVP targets: AI moderation, throwback reel, dorm leaderboards.

## UX/UI Requirements

### Visual Language
- Neutral palette + Stanford Cardinal accent; photos supply most color.
- Motion: 200 ms slide-up feed load; confetti when a Flake Streak resets to 0.

### Screen-by-Screen
- **Splash/Onboarding**: logo fade-in → camera + notification permission cards.
- **Home/Feed**: vertical list of 1:1 pair tiles; bottom tab bar (Feed • Capture • Profile).
- **Capture**: rear camera full-bleed; front cam picture-in-picture top-left; circular shutter bottom-center with countdown to daily deadline.
- **Waiting card**: if partner hasn't posted yet, avatar plus pulsing "waiting..." text and "Nudge" button.
- **Profile**: avatar header, live Flake Streak count, history list, settings cog.

## Technical Architecture

### Core Technologies
- **Client**: React Native (Expo Router, TypeScript).
- **Camera**: react-native-vision-camera supports simultaneous streams.
- **Backend**: Firebase Auth, Firestore, Storage, Cloud Functions (Node 18), FCM.
- **Pairing**: pairUsers() function writes daily pairs; future upgrade to weighted graph for fairness.
- **Analytics**: Firebase events — pair_assigned, selfie_posted, flake_increment, wave_sent.

### Implementation Decisions

#### Camera Implementation
- Switch to react-native-vision-camera (RNVC) for dual-camera capture
- Remain on Expo Dev Client (custom-dev-build) rather than fully ejecting
- Minimum iOS 13 and Android 9 (API 28) for multi-camera API support
- Client-side compositing for image stitching with server-side fallback

#### Pairing Algorithm
- Simple daily shuffle + no-repeat constraint within the last 7 days
- "Active" user = opened the app or posted within the past 3 days
- Users with Flake Streak ≥ 5 are skipped until they reopen
- Users left unpaired go to a daily wait-list with priority for next day

#### Notification Strategy
- Schedule: 07:00 "pairing" notification, plus reminder at 15:00 if neither partner has posted
- Final reminder at 19:00 PT if pairing still incomplete
- Rich notifications with partner's avatar thumbnail
- Default quiet hours: 22:00–08:00 local device time
- Time-zone awareness for users outside Stanford area

#### Data Privacy & Retention
- 30-day image lifespan with automatic deletion
- Global feed-sharing toggle and per-pairing privacy controls
- User blocking capability for excluding specific users from pairing

#### Performance Optimizations
- Denormalized data structure for O(1) feed queries
- Cursor-based pagination for infinite scroll
- Archive collection for posts older than 30 days

## Analytics Instrumentation

- Selfie-completion rate
- Average and distribution of Flake Streak
- DAU / WAU
- Invite conversion via branch links

## Risks & Mitigations

- **Ghosting anxiety**: cap Flake Streak at 7; allow one "Snooze day" token per week.
- **Privacy**: delete selfies after 30 days; allow feed-sharing opt-out.
- **Performance on older phones**: detect device capability; fall back to sequential capture.
- **Matching fairness**: schedule graph-based algorithm once scale demands it.

## Post-MVP Roadmap

### Feature Priority
1. AI Safe-Search moderation (protects feed, low engineering risk)
2. Throwback reel (client-side gallery reusing archived images)
3. Dorm leaderboards (requires additional campus-affiliation data)

### Monetization Prep
- Extensible camera overlay system for sponsored frames and paid theme packs
- Optional subscription tier for unlimited throwback access

### Growth Mechanics
- Referral links (Branch) granting one extra Snooze token to inviter + invitee
- "Share to Instagram Stories" from the expanded selfie modal