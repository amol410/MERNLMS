# android.md — Agent Context for the Flutter Mobile App

> **Purpose:** Onboarding context for coding agents (and humans) working in
> `app/dolphincoder/` (the Flutter app; the `android/` folder holds only planning docs —
> see §8). Documents what exists, how it is wired, which conventions to follow, which
> parts are logically broken, and the improvement backlog. Analysis only — no code was
> changed. Verified against the source on 2026-08-29.
>
> **Rules of engagement for agents:**
> 1. The app is a **read-only student companion** to the API in `backend/` (which is
>    MySQL + Sequelize — see `backend.md`). Content creation lives on the web
>    (`frontend.md`); every screen here consumes the same REST endpoints.
> 2. State is **Riverpod 2** with hand-written `StateNotifier`s (no codegen, despite
>    codegen packages in pubspec — see §5.8). Match the existing provider patterns.
> 3. Navigation is **go_router** with a token-check redirect; auth data lives in
>    `flutter_secure_storage` (token) + `SharedPreferences` (user JSON). Do not move
>    the token into SharedPreferences.

---

## 1. What this is

**DolphinCoder** mobile app (`pubspec` name: `dolphincoder`, v1.0.0+2) — a dark-themed
Material 3 student client for the LMS. Features:

| Feature | Screens | Mutations supported? |
|---|---|---|
| Auth | splash (animated), onboarding, login, register | login / register / logout / update profile / change password |
| Dashboard | greeting, stat cards, recent notes, featured quiz, latest video, deck shortcuts | read-only (watches the list providers) |
| Notes | grid list (search + subject/topic chips), detail | read-only |
| Videos | grid list (search), detail (YouTube via WebView) | read-only |
| Quizzes | list (search + subject chips + infinite scroll), detail (rules + past attempts), take (timer, navigator sheet, flag-for-review), result (score ring + answer review) | submit attempt |
| Flashcards | deck grid, study session (flip cards, know/still-learning, progress ring) | save progress |
| Profile | profile, edit profile, change password, settings | name/bio, password |

Not implemented (deliberately, so far): content creation/editing, quiz review from past
attempts, flashcard deck detail page (list goes straight into study), notifications,
localization, light theme.

## 2. Run & build

```bash
cd app/dolphincoder
flutter pub get
flutter run                    # debug — talks to https://dolphincoder.com/api (see §5.1!)
flutter build apk --release    # pretty_dio_logger is skipped in release (JWT protection)
```

- **API base URL:** `lib/core/constants/api_constants.dart` — `defaultBaseUrl =
  'https://dolphincoder.com/api'` (the **web** domain) is the only URL ever used;
  `productionBaseUrl = 'https://api.dolphincoder.com/api'` is declared but dead (§5.1).
  Pointing at the right host is a one-line change **plus** wiring `getBaseUrl()`.
- Min SDK 23, launcher icons configured via `flutter_launcher_icons` (assets from
  `assets/images/logo.png`), adaptive icon background `#0A0F1E`.

## 3. Directory map

```
app/dolphincoder/
├── pubspec.yaml
├── lib/
│   ├── main.dart                   # ProviderScope + runApp
│   ├── app.dart                    # MaterialApp.router(theme: AppTheme.dark)
│   ├── core/
│   │   ├── constants/api_constants.dart   # endpoints + base URL logic (§5.1)
│   │   ├── constants/app_constants.dart   # storage keys, app name/version
│   │   ├── network/dio_client.dart        # Dio singleton, auth interceptor, handleError
│   │   ├── network/api_exception.dart
│   │   ├── router/app_router.dart         # GoRouter: splash/onboarding/auth + ShellRoute tabs
│   │   ├── theme/app_colors.dart          # palette, gradients, noteColorFromString, deckGradientFromString
│   │   ├── theme/app_theme.dart           # M3 dark theme, Plus Jakarta Sans + Inter
│   │   └── utils/validators.dart          # email/password/strength helpers
│   ├── features/
│   │   ├── auth/         # splash, onboarding, login, register + auth_provider + auth_repository
│   │   ├── dashboard/    # dashboard_screen (aggregates all list providers)
│   │   ├── notes/        # models / notes_repository / notes_provider / notes+detail screens
│   │   ├── videos/       # same layering; detail plays YouTube in a WebView
│   │   ├── quizzes/      # quiz_model (quiz/question/attempt), repo, providers, 4 screens
│   │   ├── flashcards/   # deck/card models, repo, providers, deck grid + study screen
│   │   └── profile/      # profile, edit profile, change password, settings
│   └── shared/widgets/   # glass_card, gradient_button, shimmer_loader, empty_state,
│                         # subject_badge (+TopicBadge), app_text_field, bottom_nav
└── (repo-root android/ folder is planning docs only — §8)
```

## 4. Architecture & conventions (follow these)

### 4.1 Data layering
Every feature follows the same three-file layering:
- `data/models/<x>_model.dart` — hand-written `fromJson` classes. Tolerant parsing
  conventions: ids via `json['_id']?.toString() ?? ''` (backend exposes the virtual
  `_id`), list payloads via `data is List ? data : (data['<key>'] ?? data['data'] ?? [])`
  because the API envelope varies per controller.
- `data/<x>_repository.dart` — thin Dio wrappers; every method does
  `final dio = await DioClient.getInstance()` then wraps errors with
  `throw DioClient.handleError(e)`.
- `providers/<x>_provider.dart` — Riverpod providers. **List providers are plain (not
  autoDispose) `StateNotifier`s that self-fetch in their constructor**; the Dashboard
  relies on that (it just `ref.watch`es them and the data is already there). Detail
  providers are `FutureProvider.family`.

### 4.2 Networking
`DioClient` is a lazily-created static singleton: 15s timeouts, JSON content type, and an
interceptor that reads the token from secure storage **per request** and attaches
`Authorization: Bearer`. On 401 it deletes the stored token and lets the router's
redirect handle navigation on the next transition (it does not navigate itself).
`PrettyDioLogger` is added only when `!kReleaseMode` so JWTs are never logged in release
builds — preserve that guard. `DioClient.handleError` maps Dio errors to
`ApiException(message, statusCode)`; screens catch `ApiException` for snackbars.

### 4.3 Navigation
`app_router.dart`:
- `redirect` reads the token; no token + protected route → `/login`; token + auth route → `/home`.
- A `ShellRoute` hosts the bottom-nav tabs (home, notes, quizzes, flashcards, profile)
  with subroutes (detail/take/study/edit screens) inside the shell; `/videos` and
  `/settings` are top-level (no bottom nav).
- Quiz results are passed **both** via `extra` and via `quizResultProvider(quizId)` (a
  `StateProvider.family` set just before `context.pushReplacement`) because `extra`
  through ShellRoute child transitions proved unreliable — the result screen prefers the
  provider and falls back to `extra`. Keep both paths when refactoring.

### 4.4 Session storage
`auth_repository._saveSession`: token → `flutter_secure_storage` (`AppConstants.tokenKey`),
user JSON → `SharedPreferences` (`userDataKey`). `AuthProvider` loads the cached user
from prefs synchronously at construction so the UI never flashes unauthenticated.
Logout deletes both and `DioClient.reset()` is *not* called — the singleton keeps the
old base URL only (harmless today because the URL is hardcoded, §5.1).

### 4.5 Styling
- `AppTheme.dark` (Material 3) + `AppColors` (background `#0A0F1E`, surface, primary
  gradient, note color mapper, deck gradient mapper). Google Fonts: Plus Jakarta Sans for
  headings, Inter for body — prefer the `GoogleFonts.*` calls used in existing screens
  over raw `TextStyle`.
- Shared widgets to reuse instead of rebuilding: `GlassCard`, `GradientButton`
  (has `isLoading` + `icon`), `ShimmerListLoader` / `ShimmerGridLoader` / `ShimmerCard`,
  `EmptyState` (emoji + optional action), `SubjectBadge` / `TopicBadge`, `AppTextField`
  (label + validator + prefix icon), `BottomNav`.
- Loading pattern: list screens show shimmer while `isLoading`; detail screens use
  `async.when(...)` with a Retry button that `ref.invalidate(...)`s the provider.

## 5. Verified bugs & logical issues

### 5.1 CRITICAL — base URL points at the web frontend domain
`api_constants.dart`: `defaultBaseUrl = 'https://dolphincoder.com/api'` while the API
actually lives at `https://api.dolphincoder.com/api` (that constant exists as
`productionBaseUrl` but `getBaseUrl()` ignores it *and* ignores the stored preference —
it always returns `defaultBaseUrl`). This only works if the web domain proxies `/api`.
Meanwhile the Settings screen lets users edit "API Base URL" and saves it to
`SharedPreferences` (`settings_screen.dart:_editApiUrl`) — a **dead setting** the app
silently ignores. Fix: make `getBaseUrl()` return the stored pref ?? `productionBaseUrl`,
and have `DioClient.reset()` + app restart messaging stay as is.

### 5.2 CRITICAL — flashcard progress collapses (same root cause as web)
`Flashcard.fromJson` reads `json['_id']` per card, but backend cards are stored as
`{ front, back, hint }` with **no id** (`backend/controllers/flashcardController.js:220`),
so `card.id` is `''` for every card. `study_screen.dart` calls
`rate(card.id, 'known' | 'unknown', total)` → all ratings collapse onto the single `''`
key in `cardResults`; `masteredCount` can never exceed 1 and `POST /flashcards/:id/progress`
saves `{ '': 'known' }`. Fix together with the backend (assign stable card ids) and the
same fix in `frontend/src/pages/StudyPage.jsx`.

### 5.3 Video player reloads on every rebuild
`video_detail_screen.dart`: `_loadVideo(video.youtubeVideoId)` is called **inside the
`data:` build branch**, and the WebView's `onPageFinished` calls `setState` → rebuild →
`data:` branch → `_loadVideo` again. The player keeps reloading/restarting itself
(audio restarts, page flashes). Fix: load once in `initState`-like flow (e.g. react to the
future completing once with a `bool _loaded` guard) and keep `setState` for the loader only.

### 5.4 Quiz shuffle flag reads a nonexistent field
`QuizModel.fromJson` reads `json['shuffle']`, but the backend model field is
`shuffleQuestions` (`backend/models/Quiz.js`) — `quiz_detail_screen.dart` therefore always
shows "Shuffle: No". Also note `difficulty` is **derived client-side from question count**
(Easy ≤5, Medium ≤15, Hard >15), not a real backend field; and the detail screen
hard-codes "You can retake this quiz anytime" while the backend's `attemptLimit` is never
surfaced anywhere.

### 5.5 Quiz take screen edge cases
- `quiz.questions[qState.currentIndex]` throws a `RangeError` if a quiz has zero
  questions (backend allows empty question arrays in edge cases).
- The `code`/`language` fields are parsed by `QuizQuestion` but **never rendered** —
  code-MCQ questions display as plain text + options (matching the web's rollback state).
- Timer: `secondsRemaining / (quiz.timeLimit * 60)` can exceed 1.0 briefly; auto-submit
  fires at `<= 1` second. Client timing only — the backend doesn't enforce limits either
  (see `backend.md` §5.4), so "auto-submit when time runs out" is advisory.
- After submission the result screen reads `quizResultProvider`, which is **not
  autoDispose** — retaking the same quiz overwrites it (fine), but leaving the screen
  keeps stale data in memory.

### 5.6 Session/token handling gaps
- `changePassword` (`auth_repository.dart:63-70`) **discards the rotated token** the
  backend returns from `PUT /auth/password`; the old token stays in secure storage.
  Harmless while the backend doesn't invalidate old JWTs, but the day it does, password
  changes will log users out unexpectedly. Save the new token like login/register do.
- 401 handling deletes the token but the user stays on the current screen until the next
  navigation triggers the router redirect — API errors meanwhile surface as generic
  failed requests. Consider broadcasting a logout event instead.
- `AuthProvider` never revalidates the cached user with `GET /auth/me`, so role/name
  changes made on the web don't appear until the user logs in again.

### 5.7 Dashboard accuracy
Stat cards use `notesState.notes.length` / `videos.length` / `quizzes.length` /
`decks.length` — i.e. **page-size-capped counts (12)** presented as totals, and "Recent
Notes" is just the first 5 items of page 1 (the API list order is newest-first, so that
part is right). "Featured Quiz" is simply `quizzes.first`. Fine as a placeholder; don't
present these numbers as real analytics. Profile screen stats are hard-coded `'0'`.

### 5.8 Dead weight & minor issues
- **Unused dependencies** (declared in pubspec, never imported in `lib/`):
  `image_picker`, `permission_handler`, `riverpod_annotation`, `freezed_annotation`,
  `freezed`, `json_serializable`, `equatable`, `build_runner`/`riverpod_generator` tooling,
  `flutter_animate`. All models are hand-written; no `.g.dart` files exist. Either adopt
  codegen or prune the pubspec.
- Onboarding shows on **every launch** for logged-out users (no "seen" flag persisted).
- Login's "Forgot Password?" button has no handler (dead); there is no backend endpoint
  for it either.
- Edit Profile's "Change Photo" is a dead button (`onPressed: () {}`) even though the
  backend `PUT /auth/profile` accepts `avatar` and the User model has the column.
- `subjectsProvider` is defined inside `notes/screens/notes_screen.dart` and imported
  cross-feature by `quizzes_screen.dart` — move it to a shared location when touched.
- Search "debounce" schedules a `Future.delayed(400ms)` per keystroke and checks
  `text == q` after — works but stacks timers; a `Timer`-based debounce would be cleaner.
- `saveProgress` in `flashcard_repository.dart` swallows all errors silently
  ("non-critical") — students lose progress with zero feedback.
- `QuizTakeNotifier.unansweredCount` getter hard-returns 0 (computed externally in the
  screen); dead API surface.
- `WillPopScope` (study screen) is deprecated in favor of `PopScope` on newer Flutter.

## 6. Feature inventory & logical-correctness verdicts

| Feature | Verdict | Notes |
|---|---|---|
| Splash/onboarding/login/register | ✅ sound | 5-phase splash (~2.2s) then token check → /home or /onboarding. Register has password-strength meter. Onboarding repeats every launch (§5.8). |
| Session persistence | ✅ sound core | Secure storage + prefs split is right; changePassword token rotation gap (§5.6). |
| Dashboard | ⚠ placeholder metrics | Works via self-fetching providers; counts capped at page size (§5.7). |
| Notes browse/detail | ✅ sound | richtext/docx render via `flutter_html`; `html` contentType renders in a WebView with **unrestricted JS** + fullscreen route — trainer-authored content is trusted; keep it that way or sandbox it. |
| Videos browse/detail | ⚠ reload loop | WebView embed with autoplay; rebuild-driven reload bug (§5.3). |
| Quizzes browse/detail/take/result | ✅ strongest feature | Navigator sheet, mark-for-review, timer ring, auto-submit, result review with explanations; shuffle flag + attemptLimit + code-MCQ gaps (§5.4, §5.5). |
| Flashcards study | ⚠ broken progress | Flip UX is good; progress saving is structurally broken (§5.2) and silent on failure (§5.8). |
| Profile/settings | ⚠ partial | Edit name/bio works; change photo dead; API-URL setting ignored (§5.1); clear cache works. |

## 7. Gotchas for coding agents

1. **Always `await DioClient.getInstance()`** — the token interceptor is attached at
   creation; don't create bare `Dio()` instances.
2. Parse defensively: the API envelope differs per controller (`{ notes: [...] }` vs
   `{ data: [...] }` vs bare arrays). Use the existing tolerant pattern in §4.1.
3. IDs are strings (`_id?.toString()`); the backend sends integers as the virtual `_id`.
   Don't `int.parse` them.
4. The router passes complex objects through `extra` unreliably inside the ShellRoute —
   use the `quizResultProvider`-style provider handoff for anything non-primitive.
5. `ref.read(...notifier)` for actions, `ref.watch` for state — consistent throughout.
   List providers self-fetch at construction; **don't** also fetch in screen `initState`
   or you'll double-fetch on every tab visit... except detail `FutureProvider.family`s,
   which cache per-argument and need `ref.invalidate` to refresh.
6. Dark theme only — never hardcode `Colors.black`/`Colors.white` for surfaces; use
   `AppColors` so the palette stays coherent.
7. Keep the `kReleaseMode` guard around any logging interceptor.
8. Backend cards/quizzes JSON: quiz questions get index-based `_id`s at creation
   (`0,1,2...`); flashcard cards have **no ids** (until §5.2 is fixed) — don't assume
   they exist.

## 8. Related folders outside the app

- `android/plan.md`, `android/screens.md` — pre-build **planning documents** (screen
  specs, phased plan). They describe intent, not the shipped code; where they disagree
  with `lib/`, the code wins. No Gradle/manifest lives there — the actual Android shell
  is the standard Flutter `android/` folder *inside* `app/dolphincoder/`.
- `app/plan.md`, `app/prompts.md` — the AI prompts used to generate the screens
  (useful for regenerating in the same style), plus `privacy-policy.html` /
  `data-deletion.html` served from the website (Settings links to
  `dolphincoder.com/privacy`).

## 9. Improvement backlog (prioritized)

**P0 — correctness**
1. Fix the base URL wiring (§5.1): use `productionBaseUrl` (or the stored pref) in
   `getBaseUrl()`, then the Settings toggle actually works.
2. Fix flashcard progress with backend card ids (§5.2) — coordinate with `backend.md` §8.2.
3. Stop the video reload loop (§5.3).

**P1 — completeness**
4. Render code snippets in the quiz take screen; surface `attemptLimit` and real
   `shuffleQuestions`; guard empty-question quizzes (§5.4, §5.5).
5. Save the rotated token after password change; revalidate the session with `/auth/me`
   on app start (§5.6).
6. Handle saveProgress failures visibly; add a deck detail screen; pull-to-refresh on
   dashboard.

**P2 — polish / product**
7. Persist an onboarding "seen" flag; wire or remove "Forgot Password?"; wire avatar
   upload via `image_picker` (the dependency is already there) or prune unused deps (§5.8).
8. Real usage stats for dashboard/profile (needs a backend `/me/summary`-style endpoint —
   coordinate with `backend.md` §8).
9. Adopt the declared freezed/riverpod codegen **or** remove those deps; replace
   `WillPopScope` with `PopScope`.

---

*Cross-references: API contract and its bugs → `backend.md`; web client → `frontend.md`.*
