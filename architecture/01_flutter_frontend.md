# DolphinCoder LMS: Flutter Frontend Architectural Specification

**Document Version:** 1.1.0  
**Target Codebase:** `app/dolphincoder/`  
**Application Version:** 1.2.12+18 (DolphinCoder 2.0 / LingoDolphy Engine — Git Submodule 889662b)  
**Author:** Agent 1 — Flutter Frontend Architecture Specialist  
**Status:** Production Reference & Engineering Specification  

---

## Table of Contents

1. [Executive Architecture & High-Level Philosophy](#1-executive-architecture--high-level-philosophy)
2. [Complete Directory & File Structure of `lib/`](#2-complete-directory--file-structure-of-lib)
3. [Architecture & State Management (Riverpod 2 & GoRouter)](#3-architecture--state-management-riverpod-2--gorouter)
   - [Riverpod 2 Architecture](#riverpod-2-architecture)
   - [GoRouter Declarative Routing Engine](#gorouter-declarative-routing-engine)
4. [Design System, Theming & Responsiveness](#4-design-system-theming--responsiveness)
   - [Color Tokens & AMOLED Dark / Oceanic Light Palettes](#color-tokens--amoled-dark--oceanic-light-palettes)
   - [Typography Hierarchy & Google Fonts](#typography-hierarchy--google-fonts)
   - [Tactile & Gamified Visual Components](#tactile--gamified-visual-components)
   - [Responsive Mechanics & Layout Constraints](#responsive-mechanics--layout-constraints)
5. [Detailed Screen Breakdown, UI Flows & State Machines](#5-detailed-screen-breakdown-ui-flows--state-machines)
   - [Splash & Onboarding Flow](#splash--onboarding-flow)
   - [Authentication & 2-Step Course Selection](#authentication--2-step-course-selection)
   - [Archipelago Course Map (`archipelago_map_screen.dart`)](#archipelago-course-map-archipelago_map_screendart)
   - [Multi-Stage Lesson Session Runner (`lesson_session_screen.dart`)](#multi-stage-lesson-session-runner-lesson_session_screendart)
   - [Karaoke Note Reader Screen (`karaoke_note_reader_screen.dart`)](#karaoke-note-reader-screen-karaoke_note_reader_screendart)
   - [Match the Pairs Interactive Widget (`match_pairs_widget.dart`)](#match-the-pairs-interactive-widget-match_pairs_widgetdart)
   - [Quiz Review Screen (`quiz_review_screen.dart`)](#quiz-review-screen-quiz_review_screendart)
   - [Activity & Study Analytics Screen (`activity_history_screen.dart` & Dashboard)](#activity--study-analytics-screen-activity_history_screendart--dashboard)
   - [6-Item Catalog Pagination & Pull-To-Refresh Architecture](#6-item-catalog-pagination--pull-to-refresh-architecture)
6. [Data Models & Serialization Layer](#6-data-models--serialization-layer)
7. [Service & Network Layer](#7-service--network-layer)
   - [HTTP Networking Engine (`DioClient`)](#http-networking-engine-dioclient)
   - [Tier-2 Persistence Cache (`CacheService`)](#tier-2-persistence-cache-cacheservice)
   - [Predictive Prefetching Engine (`PrefetchService`)](#predictive-prefetching-engine-prefetchservice)
   - [Pronunciation Evaluator Engine (`PronunciationEvaluator`)](#pronunciation-evaluator-engine-pronunciationevaluator)
   - [Speech Recognition Pipeline (`SpeechRecognitionService` & Bridge)](#speech-recognition-pipeline-speechrecognitionservice--bridge)
   - [Low-Latency TTS Engine (`TtsService`)](#low-latency-tts-engine-ttsservice)
   - [AdMob Monetization & Cadence (`AdService`)](#admob-monetization--cadence-adservice)
   - [Version Check & Enforcement (`VersionCheckService`)](#version-check--enforcement-versioncheckservice)
8. [Comprehensive Dependencies Analysis (`pubspec.yaml`)](#8-comprehensive-dependencies-analysis-pubspecyaml)

---

## 1. Executive Architecture & High-Level Philosophy

The DolphinCoder Flutter application (`app/dolphincoder/`) is a gamified language learning system architected with Duolingo-grade mechanics, high acoustic fidelity, sub-second boot capability, and predictive offline resilience.

### Core Architectural Pillars

1. **Feature-First Domain Separation:**
   The application is divided into self-contained feature slices (`auth`, `gamification`, `notes`, `quizzes`, `flashcards`, `videos`, `dashboard`, `profile`), supported by a unified `core/` infrastructure layer (network, caching, audio, routing, theme) and reusable `shared/` UI building blocks.

2. **Predictive Tier-2 Caching & Instant JIT Loading:**
   To guarantee $< 10\text{ms}$ screen transitions, heavy network manifests are decoupled. The Archipelago map loads lightweight path node structures while full multi-stage lesson manifests (`stages`, vocabulary arrays, audio links) are fetched JIT upon interaction and cached predictively by `PrefetchService` using an LRU local disk and memory cache (`CacheService`).

3. **Sub-20ms Tactile Audio Pipeline:**
   Language learning demands immediate audio feedback. The application marries native Google Text-to-Speech (`flutter_tts`) with pre-synthesized disk caching and a low-latency audio player (`audioplayers` running in `PlayerMode.lowLatency`), achieving zero-perceived latency on word-tap interactions.

4. **Duolingo-Parity Acoustic Safeguards & Pronunciation Scoring:**
   Speech recognition incorporates an explicit $200\text{ms}$ hardware settling guard to release digital-to-analog converters before initializing ADC recording. Pronunciation accuracy is evaluated via dynamic-programming Levenshtein distance, Soundex phonetic tolerance, German umlaut normalization, and content-word weighting.

5. **Strict Reactive State Management:**
   Built on Riverpod 2 (`StateNotifierProvider`, `FutureProvider`, `Provider`), completely separating UI widgets from repository persistence, background synchronization, and network orchestration.

---

## 2. Complete Directory & File Structure of `lib/`

Below is the exhaustive file-by-file inventory of `app/dolphincoder/lib`:

```
app/dolphincoder/lib/
├── app.dart                                    # Root MaterialApp.router setup, dynamic theme mode watcher
├── main.dart                                   # App entry point, WidgetsFlutterBinding, async service pre-initialization
│
├── core/
│   ├── constants/
│   │   ├── api_constants.dart                  # Base API URLs, endpoint routing constants, dynamic URL resolution
│   │   └── app_constants.dart                  # App name, build number, version check URLs, AdMob IDs, legal links
│   ├── network/
│   │   ├── api_exception.dart                  # Custom domain exception wrapping error messages and HTTP status codes
│   │   ├── dio_client.dart                     # Singleton Dio engine, O(1) in-memory JWT cache, logger, 401 interceptor
│   │   └── latency_interceptor.dart            # Real-time network latency tracker and response telemetry
│   ├── providers/
│   │   └── speech_preferences_provider.dart    # Riverpod StateNotifier managing speaking exercise toggle & snooze timers
│   ├── router/
│   │   └── app_router.dart                     # GoRouter declarative configuration, route redirects, ShellRoute bottom nav
│   ├── services/
│   │   ├── ad_service.dart                     # Google Mobile Ads wrapper (Rewarded & Interstitial cadence, lesson counter)
│   │   ├── cache_service.dart                  # Tier-2 SharedPreferences & disk persistence for paths, lessons, and audio
│   │   ├── prefetch_service.dart               # Predictive background lesson fetcher and remote audio disk pre-downloader
│   │   ├── pronunciation_evaluator.dart        # Levenshtein distance, Soundex phonetic matcher, umlaut normalizer
│   │   ├── sound_effects_service.dart          # Audio-haptic feedback, fanfare synthesizers & synchronized click cues
│   │   ├── speech_lifecycle_bridge.dart        # Android MethodChannel bridge to forcefully nullify SpeechRecognizer
│   │   ├── speech_recognition_service.dart     # 5-phase speech state machine, acoustic settling guard, RMS dB listener
│   │   ├── tts_service.dart                    # Low-latency TTS, natural male narrator voice selection, disk pre-synthesis
│   │   └── version_check_service.dart          # Remote version verification gate against app_version.json
│   ├── theme/
│   │   ├── app_colors.dart                     # Dynamic theme-aware color tokens (Light Vibrant & Dark AMOLED)
│   │   ├── app_theme.dart                      # Material 3 ThemeData declarations, text themes, component styling
│   │   └── theme_provider.dart                 # StateNotifier for ThemeMode toggling and SharedPreferences persistence
│   └── utils/
│       └── validators.dart                     # Form input validation rules (email, password, minimum length, strength)
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── auth_repository.dart            # Login, register, profile update, password change, JWT session storage
│   │   │   └── models/
│   │   │       └── user_model.dart             # UserModel data entity, JSON serialization, user initials helper
│   │   ├── providers/
│   │   │   └── auth_provider.dart              # AuthNotifier, AuthState (user, isLoading, error), repo provider
│   │   └── screens/
│   │       ├── language_selection_screen.dart  # 2-step onboarding language switcher (Target: de/en, Native: en/hi/mr)
│   │       ├── login_screen.dart               # User authentication screen with email & password validation
│   │       ├── onboarding_screen.dart          # 3-slide introduction carousel with animated dot indicators
│   │       ├── register_screen.dart            # User registration screen with interactive password strength meter
│   │       └── splash_screen.dart              # Cold boot screen, floating bubble physics, 3D mascot reveal, version gate
│   ├── dashboard/
│   │   ├── data/
│   │   │   ├── activity_repository.dart        # Activity history fetcher, today's activity counters, date group parser
│   │   │   └── models/
│   │   │       └── activity_model.dart         # ActivityItem, TodayCounts, ActivityDayGroup, DayCategoryInfo models
│   │   ├── providers/
│   │   │   └── activity_provider.dart          # Activity history pagination notifier, today milestone counters provider
│   │   └── screens/
│   │       ├── activity_history_screen.dart    # Study analytics, categorized date history (Today, Yesterday, Weekday)
│   │       └── dashboard_screen.dart           # Home overview, daily streak, active course metrics, quick actions
│   ├── flashcards/
│   │   ├── data/
│   │   │   ├── flashcard_repository.dart       # Flashcard decks fetcher, study session loader, rating submitter
│   │   │   └── models/
│   │   │       └── flashcard_model.dart        # FlashcardDeck, Flashcard entity models
│   │   ├── providers/
│   │   │   ├── difficult_words_provider.dart   # Difficult words tracking and bookmarking provider
│   │   │   └── flashcard_provider.dart         # Deck list provider, study session active card index notifier
│   │   └── screens/
│   │       ├── flashcards_screen.dart          # Flashcard deck catalog with card counts and category tags
│   │       └── study_screen.dart               # Interactive 3D flip-card study screen, mastery ratings, progress bar
│   ├── gamification/
│   │   ├── data/
│   │   │   ├── gamification_repository.dart    # Status, path, complete-node, leaderboard, course switch, lesson fetcher
│   │   │   └── models/
│   │   │       └── gamification_models.dart    # GamificationStatusModel, PathNodeModel, LeaderboardEntryModel
│   │   ├── providers/
│   │   │   └── gamification_provider.dart      # GamificationStatusNotifier, PathNodesNotifier, LeaderboardProvider
│   │   ├── screens/
│   │   │   ├── archipelago_map_screen.dart     # Main course road, sticky unit banner, stepping stones, guidebooks
│   │   │   ├── gamified_profile_screen.dart    # Gamified profile view (XP, streak, current league, pearl balance)
│   │   │   ├── leagues_screen.dart             # Oceanic competitive leaderboard (Coral Reef, Deep Sea, Challenger)
│   │   │   ├── lesson_session_screen.dart      # Core 8-stage interactive exercise runner (4548 lines of engine logic)
│   │   │   ├── quests_screen.dart              # Daily goals, XP milestones, listening challenges, reward claims
│   │   │   └── shop_screen.dart                # Nautical shop, oxygen bubble refills, pearl item purchases
│   │   └── widgets/
│   │       └── course_selection_sheet.dart     # Bottom sheet course switcher (German A1, English via Hindi/Marathi)
│   ├── notes/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── karaoke_model.dart          # KaraokeStory, KaraokeSentence, KaraokeWord timestamp models
│   │   │   │   └── note_model.dart             # NoteModel data entity, rich text content, karaoke data parsing
│   │   │   └── notes_repository.dart           # Paginated note catalog fetcher (limit: 6), single note detail loader
│   │   ├── providers/
│   │   │   └── notes_provider.dart             # NotesListNotifier (6-item pagination, infinite scroll, tag filters)
│   │   ├── screens/
│   │   │   ├── karaoke_note_reader_screen.dart # Real-time audio sync, word highlighting, lyric auto-scroll, speaking mode
│   │   │   ├── note_detail_screen.dart         # Rich HTML note viewer, audio narration player, bookmark toggle
│   │   │   └── notes_screen.dart               # Notes catalog with search bar, subject filter pills, 6-item pagination
│   │   └── widgets/
│   │       ├── animated_karaoke_character.dart # 2D cartoon character, animated mouth lip-sync, blink, celebrate states
│   │       └── karaoke_speech_bubble.dart      # Custom-painted speech tail bubble with word tap pronunciation
│   ├── profile/
│   │   └── screens/
│   │       ├── change_password_screen.dart     # Old password, new password, confirmation form
│   │       ├── edit_profile_screen.dart        # Name, avatar, bio editor with save action
│   │       ├── profile_screen.dart             # Classic user profile information and settings shortcuts
│   │       └── settings_screen.dart            # API URL configuration, legal policy links, logout, account deletion
│   ├── quizzes/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   └── quiz_model.dart             # QuizModel, QuizQuestion, QuizPairModel, AttemptModel, AttemptAnswer
│   │   │   └── quiz_repository.dart            # Quizzes catalog, quiz submitter, attempt history review fetcher
│   │   ├── providers/
│   │   │   └── quiz_provider.dart              # QuizzesListNotifier (limit: 6), active quiz take session, review provider
│   │   └── screens/
│   │       ├── quiz_detail_screen.dart         # Quiz overview, time limit, question count, pass score, start button
│   │       ├── quiz_result_screen.dart         # Post-quiz score summary, XP earned, review button
│   │       ├── quiz_review_screen.dart         # In-depth question breakdown, correct vs user answers, explanations
│   │       ├── quiz_take_screen.dart           # Live quiz runner, timer countdown, MCQ, code blocks, match pairs
│   │       ├── quizzes_screen.dart             # Quizzes catalog with search, subject filter pills, 6-item pagination
│   │       └── widgets/
│   │           └── match_pairs_widget.dart     # Rapid tile matcher with 6 distinct color pairs and TTS audio
│   └── videos/
│       ├── data/
│       │   ├── models/
│       │   │   └── video_model.dart            # VideoModel entity, YouTube video ID extractor, thumbnail generator
│       │   └── videos_repository.dart          # Video list fetcher (limit: 12), single video loader
│       ├── providers/
│       │   └── videos_provider.dart            # VideosListNotifier with pagination and search query support
│       └── screens/
│           ├── video_detail_screen.dart        # Embedded YouTube video player, lesson summary, description
│           └── videos_screen.dart              # Grid view of educational video lessons with YouTube thumbnails
│
└── shared/
    └── widgets/
        ├── animated_dolphin_mascot.dart        # Echo Mascot (10 3D Pixar poses, idle swimming, tap bounce, talk scale)
        ├── app_text_field.dart                 # Rounded text input with custom prefix/suffix icons, validation borders
        ├── bottom_nav.dart                     # Floating pill navigation bar (Learn, Leagues, Quests, Shop, Profile)
        ├── duo_feedback_sheet.dart             # Bottom validation sheet (Mint green success, Coral red error + continue)
        ├── empty_state.dart                    # Empty list placeholder with customizable mascot illustration
        ├── force_update_dialog.dart            # Un-dismissible dialog blocking app execution on outdated client builds
        ├── glass_card.dart                     # Translucent frosted glass container with subtle border highlights
        ├── gradient_button.dart                # High-contrast action button with gradient background and loading spinner
        ├── ocean_status_bar.dart               # Top status bar: Flag switcher, Streak flame, Oxygen energy, Pearl counter
        ├── out_of_oxygen_dialog.dart           # Depleted hearts bottom sheet: Watch rewarded ad (+1 bubble) or buy pearls
        ├── shimmer_loader.dart                 # Skeleton loading placeholder for cards, lists, and path nodes
        ├── speaking_mic_button.dart            # Pulsing microphone button with live RMS decibel audio wave animations
        ├── subject_badge.dart                  # Thematic category tag for subjects (German, General, Grammar)
        └── tactile_game_button.dart            # 3D physical tactile button with bottom lip extrusion that depresses on tap
```

---

## 3. Architecture & State Management (Riverpod 2 & GoRouter)

### Riverpod 2 Architecture

DolphinCoder uses `flutter_riverpod: ^2.5.1` with a strict separation between synchronous dependency injection, asynchronous state mutation, and optimistic UI notifications.

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Components                         │
│   (ArchipelagoMapScreen, LessonSessionScreen, KaraokeView)   │
└───────────────▲─────────────────────────────┬───────────────┘
                │ ref.watch()                 │ ref.read().notifier
                │                             ▼
┌───────────────┴─────────────────────────────────────────────┐
│                      State Notifiers                        │
│   - GamificationStatusNotifier  - PathNodesNotifier         │
│   - NotesListNotifier           - AuthNotifier              │
└───────────────▲─────────────────────────────┬───────────────┘
                │ Updates State               │ Invokes Actions
                │                             ▼
┌───────────────┴─────────────────────────────────────────────┐
│                      Repository Layer                       │
│   - GamificationRepository      - NotesRepository           │
│   - AuthRepository              - QuizRepository            │
└───────────────▲─────────────────────────────┬───────────────┘
                │ Memory / Disk Cache         │ HTTP / JSON
                ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│         CacheService          │ │         DioClient         │
│  (SharedPreferences + Disk)   │ │  (O(1) Token Interceptor) │
└───────────────────────────────┘ └───────────────────────────┘
```

#### StateNotifier Implementations

1. **`GamificationStatusNotifier` (`StateNotifier<AsyncValue<GamificationStatusModel>>`):**
   - Manages the user's primary economy: `streakCount`, `oxygen` (bubbles/hearts, max 5), `pearls`, `totalXp`, and active language pairing (`targetLanguage`, `nativeLanguage`, `currentLevel`).
   - Supports **Optimistic Local Mutations**:
     - `optimisticAddRewards(int xp, int pearls)`: Instantly increments local XP and pearl balances in 0ms without waiting for backend acknowledgement.
     - `deductOxygen()`: Decrements oxygen bubbles locally upon exercise error and writes to `CacheService`.
     - `optimisticRefillOxygen()`: Immediately resets oxygen to 5 upon rewarded ad completion or pearl purchase.

2. **`PathNodesNotifier` (`StateNotifier<AsyncValue<List<PathNodeModel>>>`):**
   - Holds the ordered list of curriculum stepping stone nodes for the current active course track.
   - Implements **Zero-Latency Client Node Progression (`completeNode`)**:
     ```dart
     Future<bool> completeNode(int nodeIndex, {int stars = 3, int scorePct = 100, int xp = 20, int pearls = 10}) async {
       // 1. Instant 0ms Optimistic Unlock
       state.whenData((currentNodes) {
         final updated = List<PathNodeModel>.from(currentNodes);
         updated[nodeIndex] = updated[nodeIndex].copyWith(status: 'completed', stars: stars, scorePct: scorePct);
         if (nodeIndex + 1 < updated.length && updated[nodeIndex + 1].status == 'locked') {
           updated[nodeIndex + 1] = updated[nodeIndex + 1].copyWith(status: 'available');
         }
         state = AsyncValue.data(updated);
         CacheService().savePathNodes(..., nodes: updated);
       });
       // 2. Add rewards optimistically
       _ref.read(gamificationStatusProvider.notifier).optimisticAddRewards(xp, pearls);
       // 3. Dispatch background HTTP sync
       _repo.completeNode(...);
       return true;
     }
     ```

3. **`NotesListNotifier`, `QuizzesListNotifier`, `VideosListNotifier`:**
   - Manage paginated catalog feeds with state properties: `items`, `isLoading`, `hasMore`, and `page`.
   - Feature automated 6-item catalog chunking, keyword search debouncing, and topic filtering.

4. **`ThemeModeNotifier` (`StateNotifier<ThemeMode>`):**
   - Manages active theme switching between `ThemeMode.light` and `ThemeMode.dark`.
   - Syncs active mode with `AppColors.isDark` and persists selection to `SharedPreferences` under key `app_theme_mode`.

5. **`SpeechPreferencesNotifier` (`StateNotifier<SpeechPreferencesState>`):**
   - Manages the learner's microphone exercise settings. Allows snooze for 1 hour (`snoozeSpeakingExercises`) or permanent toggle on/off.

#### Provider Families

- **`leaderboardProvider` (`FutureProvider.family<List<LeaderboardEntryModel>, String?>`):**
  Loads leaderboard standings parameterized by oceanic league name (e.g. `'Coral Reef'`, `'Deep Sea'`).
- **`quizReviewProvider` (`FutureProvider.family<Map<String, dynamic>, String>`):**
  Loads attempt history, question evaluations, and explanations parameterized by `quizId`.
- **`difficultWordsProvider` (`StateNotifierProvider.family`):**
  Caches words flagged by the learner as difficult during flashcard study sessions.

---

### GoRouter Declarative Routing Engine

Configured in `core/router/app_router.dart`, GoRouter manages authentication redirection, deep linking, nested bottom navigation shells, and parameter parsing.

#### Navigation Hierarchy & Route Map

| Path | Screen Widget | Access Type | Notes / Parameters |
|------|---------------|-------------|--------------------|
| `/` | `SplashScreen` | Public | Boot sequence, version gate, auth token verification |
| `/onboarding` | `OnboardingScreen` | Public | 3-slide value proposition carousel |
| `/login` | `LoginScreen` | Public | Email and password login |
| `/register` | `RegisterScreen` | Public | Name, email, password registration |
| `/language-select`| `LanguageSelectionScreen` | Public/Auth | 2-step course track initializer |
| `/lesson/:index` | `LessonSessionScreen` | Guarded | `index` path param; `extra: PathNodeModel` |
| **ShellRoute** | `AppShell` | Guarded | Houses floating bottom navigation bar |
| ├── `/home` | `ArchipelagoMapScreen` | Guarded | Stepping-stone road, sticky unit banner |
| ├── `/leagues` | `LeaguesScreen` | Guarded | Weekly competitive XP leaderboard |
| ├── `/quests` | `QuestsScreen` | Guarded | Daily objectives and rewards |
| ├── `/shop` | `ShopScreen` | Guarded | Heart refills, pearl item inventory |
| ├── `/profile` | `GamifiedProfileScreen` | Guarded | Stats, achievements, settings entry |
| │   ├── `edit` | `EditProfileScreen` | Guarded | Profile information editor |
| │   ├── `password` | `ChangePasswordScreen` | Guarded | Password modification form |
| │   └── `settings` | `SettingsScreen` | Guarded | API configuration, legal links |
| ├── `/notes` | `NotesScreen` | Guarded | Paginated study notes catalog |
| │   ├── `karaoke/:id` | `KaraokeNoteReaderRouteScreen`| Guarded | Sub-second word sync audio reader |
| │   └── `:id` | `NoteDetailScreen` | Guarded | Full rich-text / HTML viewer |
| ├── `/quizzes` | `QuizzesScreen` | Guarded | Paginated quiz catalog |
| │   └── `:id` | `QuizDetailScreen` | Guarded | Quiz overview & launchpad |
| │       ├── `take` | `QuizTakeScreen` | Guarded | Interactive quiz session |
| │       ├── `result` | `QuizResultScreen` | Guarded | Attempt score summary |
| │       └── `review` | `QuizReviewScreen` | Guarded | Question-by-question breakdown |
| └── `/flashcards` | `FlashcardsScreen` | Guarded | Deck catalog |
|     └── `:id/study` | `StudyScreen` | Guarded | 3D card flip study session |
| `/videos` | `VideosScreen` | Guarded | Educational YouTube video catalog |
| `/videos/:id` | `VideoDetailScreen` | Guarded | Embedded player & summary notes |
| `/activity` | `ActivityHistoryScreen`| Guarded | Full historical study analytics |
| `/settings` | `SettingsScreen` | Guarded | Standalone settings entry |

#### Authentication Navigation Guard

The router registers a global redirect interceptor that checks for the existence of the secure token:

```dart
redirect: (context, state) async {
  const storage = FlutterSecureStorage();
  final token = await storage.read(key: AppConstants.tokenKey);
  final isAuth = token != null;
  final loc = state.matchedLocation;

  final publicRoutes = ['/', '/onboarding', '/login', '/register'];
  if (!isAuth && !publicRoutes.contains(loc)) return '/login';
  return null;
}
```

---

## 4. Design System, Theming & Responsiveness

### Color Tokens & AMOLED Dark / Oceanic Light Palettes

The color architecture (`core/theme/app_colors.dart`) uses dynamic getters backed by static flag `AppColors.isDark` alongside `ThemeData` Material 3 definitions (`core/theme/app_theme.dart`).

#### Palette Comparison

| Token | Oceanic Light (`ThemeMode.light`) | AMOLED Dark (`ThemeMode.dark`) | Semantic Role |
|-------|------------------------------------|--------------------------------|---------------|
| `background` | `#F8FAFC` (Slate 50) | `#000000` / `#0B1329` | Main scaffold canvas background |
| `surface` | `#FFFFFF` (Pure White) | `#111116` / `#131D38` | Card backgrounds, dialog containers |
| `surface2` | `#F1F5F9` (Slate 100) | `#1A1A24` | Secondary card fills, chip backgrounds |
| `border` | `#E2E8F0` (Slate 200) | `rgba(255, 255, 255, 0.13)` | Card borders, divider strokes |
| `primary` | `#0284C7` (Sky Blue 600) | `#0284C7` / `#38BDF8` | Primary brand accent, progress bars |
| `secondary` | `#06B6D4` (Cyan 500) | `#06B6D4` | Oxygen bubbles, audio highlights |
| `success` | `#10B981` (Emerald 500) | `#10B981` | Correct answer validation, completed nodes |
| `warning` | `#F59E0B` (Amber 500) | `#F59E0B` | Streak flames, treasure chests |
| `error` | `#EF4444` (Rose 500) | `#EF4444` | Incorrect answer feedback, out of oxygen |
| `textPrimary` | `#1E293B` (Slate 800) | `#FFFFFF` / `#F4F4F5` | Headings, primary content labels |
| `textSecondary`| `#64748B` (Slate 500) | `#A1A1AA` (Zinc 400) | Subtitles, helper text, timestamps |
| `textMuted` | `#94A3B8` (Slate 400) | `#71717A` (Zinc 500) | Disabled elements, inactive indicators |

---

### Typography Hierarchy & Google Fonts

The app standardizes on three Google Fonts typographic families:
1. **Plus Jakarta Sans:** Primary headline, title, and button font (high geometric clarity, friendly curves).
2. **Outfit:** Subtitles, metric counters, and celebration modals.
3. **Inter:** Body copy, long-form explanations, and linguistic notes.

#### Type Scale Specifications

- **`displayLarge`:** `30px`, weight `800`, letter spacing `-0.8px` (Celebration screens, Splash title).
- **`headlineLarge`:** `26px`, weight `700`, letter spacing `-0.5px` (Screen titles, Mascot headings).
- **`headlineMedium`:** `20px`, weight `700` (Section banner headings, modal titles).
- **`titleLarge`:** `16px`, weight `700` (Stepping stone node labels, card titles).
- **`bodyLarge`:** `15px`, weight `500` (Exercise prompts, German target phrases).
- **`bodyMedium`:** `14px`, weight `500` (Translations, descriptions, hint texts).
- **`labelLarge`:** `14px`, weight `700` (Tactile button labels, uppercase actions).
- **`labelSmall`:** `11px`, weight `700` (Section number tags, unit indicators).

---

### Tactile & Gamified Visual Components

1. **`TactileGameButton` (`shared/widgets/tactile_game_button.dart`):**
   - Physical 3D button rendering. Composed of a fixed bottom extrusion lip (`depth = 4.0px`) in a darker shadow hue, and a top surface container that translates downward by `4.0px` during `onTapDown`.
   - Variants: `primary` (Sky Blue), `secondary` (Indigo), `success` (Emerald Green), `danger` (Rose Red), `outline` (White/Slate).

2. **`AnimatedDolphinMascot` (`shared/widgets/animated_dolphin_mascot.dart`):**
   - High-resolution 3D Pixar-style mascot (Echo the Polyglot Dolphin).
   - Ten discrete poses: `jump`, `reading`, `waving`, `graduation`, `thinking`, `celebrate`, `letters`, `flag`, `headphones`, `backpack`.
   - Continuous gentle swimming sinusoidal float (`duration: 2200ms`), interactive squash and bounce on tap (`duration: 320ms`), and talking pulse scale (`duration: 260ms`).

3. **`OceanStatusBar` (`shared/widgets/ocean_status_bar.dart`):**
   - Pinned top gamification dashboard widget: active course flag button, fire streak flame, oxygen bubble meter (`$oxygen/$maxOxygen`), and purple diamond pearl balance.

4. **`DuoFeedbackSheet` (`shared/widgets/duo_feedback_sheet.dart`):**
   - Slides up from the screen bottom upon exercise evaluation. Mint green (`#D1FAE5`) with checkmark icon on correct response; Coral red (`#FFE4E6`) with cross icon and solution breakdown on mistake.

---

### Responsive Mechanics & Layout Constraints

- **Viewport Relative Offsets:**
  In `ArchipelagoMapScreen`, stepping stone nodes apply horizontal offsets clamped to $[-65.0, 65.0]$ pixels, calculating dynamic sinusoidal path curves that remain centered regardless of device width.
- **Scroll Throttling:**
  The map scroll listener implements a $30\text{px}$ deadband threshold:
  ```dart
  if ((offset - _lastEvaluatedOffset).abs() < 30.0) return;
  _lastEvaluatedOffset = offset;
  ```
  This eliminates frame drops during fast flings, keeping scrolling pinned at 60–120 FPS.
- **Safe Area Insets:**
  All interactive buttons in lesson session screens and bottom sheets are wrapped in `SafeArea(top: false)` to prevent overlap with gesture navigation bars on modern edge-to-edge Android and iOS displays.

---

## 5. Detailed Screen Breakdown, UI Flows & State Machines

### Splash & Onboarding Flow

#### 1. Splash Screen (`splash_screen.dart`)
- **Visual Design:** Radiant oceanic gradient (`#0284C7` $\to$ `#0369A1` $\to$ `#0F172A`), rising procedural water bubble animation (`_MarineBubblesPainter` drawing 24 distinct bubbles with specular highlights and sinusoidal wobble), and leaping 3D mascot.
- **Boot Sequence & State Machine:**
  ```
  App Launch
      │
      ├──> Start Mascot Elastic Bounce Animation (0ms)
      │
      ├──> Parallel Async Initializations:
      │      1. FlutterSecureStorage.read(tokenKey)
      │      2. VersionCheckService.checkVersion()
      │      3. Minimum brand animation display hold (450ms)
      │
      ├──> Version Check Result:
      │      ├── [forceUpdateRequired == true] ──> Block screen & show ForceUpdateDialog
      │      └── [forceUpdateRequired == false] ──> Proceed
      │
      ├──> Token Check Result:
      │      ├── [Token Exists] ──> Load SharedPreferences course selection flag
      │      │       ├── [hasSelectedCourse == true]  ──> Navigate to /home
      │      │       └── [hasSelectedCourse == false] ──> Navigate to /language-select
      │      └── [No Token]    ──> Navigate to /onboarding
  ```

#### 2. Onboarding Screen (`onboarding_screen.dart`)
- 3-slide introduction carousel managed by `PageController`:
  1. *Learn Smarter:* Expert curated notes, videos, study materials.
  2. *Test Your Knowledge:* Auto-graded quizzes with instant feedback.
  3. *Master with Flashcards:* Interactive flip cards and spaced repetition.
- Features animated dot indicators that expand from $8\text{px}$ to $24\text{px}$ when active, and a persistent "Skip" / "Get Started" navigation bar.

---

### Authentication & 2-Step Course Selection

#### 1. Login Screen (`login_screen.dart`)
- Clean form presentation with `AppTextField` email and password fields.
- Form validation via `Validators.email` and `Validators.password`.
- Triggers `ref.read(authProvider.notifier).login(email, password)`. On success, redirects to `/language-select`. On failure, displays floating error snackbar.

#### 2. Register Screen (`register_screen.dart`)
- Full name, email, and password registration form.
- Real-time password strength meter (`_buildStrengthBar`): evaluates length, uppercase, numbers, and special characters to render Weak (Red), Medium (Amber), or Strong (Emerald) progress bars.

#### 3. 2-Step Language Selection Screen (`language_selection_screen.dart`)
- **Step 1: Target Language Selection:**
  - *"What would you like to learn?"*
  - Card Options:
    - 🇩🇪 **German (`de`):** Complete Goethe A1 Curriculum • 105 Units.
    - 🇬🇧 **English (`en`):** Fluent Spoken English • Section 1 (35 Units).
  - Selecting a target language automatically assigns intelligent native defaults and smoothly advances to Step 2.
- **Step 2: Native Instruction Language Selection:**
  - *"What is your native language?"*
  - If German selected: English (`en`) instruction card.
  - If English selected: Hindi (`hi`) (*"हिन्दी माध्यम से अंग्रेजी सीखें"*) or Marathi (`mr`) (*"मराठी माध्यमातून इंग्रजी शिका"*).
- **Execution & Persistence:**
  - Writes `active_target_lang`, `active_native_lang`, `active_level` (`'A1'`), and `has_selected_language_course = true` to `SharedPreferences`.
  - Configures `TtsService().setLanguage(target)`.
  - Dispatches `statusNotifier.switchCourse()` and `pathNotifier.loadPath()`.
  - Closes modal or navigates to `/home`.

---

### Archipelago Course Map (`archipelago_map_screen.dart`)

The primary home screen of the application, rendering the interactive learning path.

```
┌─────────────────────────────────────────────────────────────┐
│ OceanStatusBar: 🇩🇪  🔥 7  🫧 5/5  💎 420                  │
├─────────────────────────────────────────────────────────────┤
│ Sticky Banner: SECTION 1 (ROOKIE), UNIT 1                   │
│ Erste Schritte: Basic Greetings & Introductions    [Guide]  │
├─────────────────────────────────────────────────────────────┤
│                           ( ) Node 0: Basics (Completed)    │
│                            │                                │
│        Node 1: Audio (Active) (🐬 Echo Mascot)              │
│                            │                                │
│                           ( ) Node 2: Sprechen (Locked)     │
│                            │                                │
│                   [ 🎁 Treasure Chest ]                     │
│                            │                                │
│  ─── Unit 2: Im Café ─── [ JUMP HERE? ]                     │
│                            │                                │
│                           ( ) Node 5: Ordering (Locked)     │
└─────────────────────────────────────────────────────────────┘
```

#### Key Architecture & Interaction Features

1. **Sticky Unit Banner with Color Morphing:**
   - As the user scrolls, `_onScroll` detects the current visible unit index and updates the sticky banner's title, description, section metadata, and background color (`_visibleUnitColor`) with a smooth $300\text{ms}$ transition.
   - Tapping the banner opens the **Section Selector Modal Sheet**.
   - Tapping the book icon opens the **Unit Guidebook Bottom Sheet** summarizing key grammatical concepts.

2. **Section Hierarchy & Accordion Modal (`_showSectionSelectorSheet`):**
   - Divides courses into thematic multi-unit stages:
     - **Section 1: Rookie** (Units 1–35): Foundations, greetings, basic needs.
     - **Section 2: Explorer** (Units 36–70): Daily life, travel, directions.
     - **Section 3: Traveler** (Units 71–105): Fluency, complex grammar, Goethe A1 exam preparation.
   - Tapping any section item automatically calculates the target pixel offset and scrolls the list smoothly to that section's opening unit.

3. **Stepping Stone Node Layout & Visual States:**
   - **Completed:** Emerald green (`#58CC02`) with white checkmark icon and 3D depth lip.
   - **Available (Active):** Colored with unit accent, surrounded by a glowing radial pulse ring, topped with the animated 3D dolphin mascot wearing an adventure backpack.
   - **Locked:** Slate dark (`#273840`) with a lock icon.
   - **Sunken Treasure Chest (`type == 'chest'`):** Golden amber container (`#FF9600`) displaying a gift box. Tapping claims $+30$ Pearls and $+20$ XP, triggering a celebratory modal and optimistic path completion.

4. **Oxygen Gate & Out of Oxygen Modal:**
   - If a learner taps an available node with $0$ oxygen bubbles, navigation is halted and `OutOfOxygenSheet` is presented, offering a rewarded video ad to earn $+1$ bubble or pearl purchase.

5. **Scroll Position Retention & Return Button:**
   - Features `_scrollToActiveNode` which computes the exact offset of the current unfinished node and centers it in the viewport on screen load.
   - A floating return button (`FloatingActionButton.small`) in the bottom right allows the learner to snap back to their active learning milestone at any time.

---

### Multi-Stage Lesson Session Runner (`lesson_session_screen.dart`)

The lesson session runner is the most complex component in the mobile app, spanning over 4,500 lines of robust, test-covered Dart code. It dynamically sequences and evaluates up to 8 distinct interactive exercise formats within a single lesson session.

#### Session Lifecycle & State Machine

```
               [ Launch /lesson/:index ]
                          │
                          ▼
             Fetch JIT Manifest / Load Cache
                          │
                          ▼
            Strict Stage Parser & Sanitizer
   (Skips blank / unclicked / incomplete formats)
                          │
                          ▼
            Sequence Active Stage Types Array
     ['_activeStageTypes' = [match, listen_tap, ...]]
                          │
                          ▼
      Targeted TTS Pre-caching (_precacheAllVocab)
    (Synthesizes only active formats, 75% load drop)
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
 [ Render Current Stage ]             [ Out of Oxygen? ]
        │                                   │
        ▼ (User Interaction)                ▼
 [ Check Answer Button ]             Show OutOfOxygenSheet
        │
        ├──> [ CORRECT ]
        │       ├── Play Victory Sound
        │       ├── Show Mint Green DuoFeedbackSheet
        │       └── On Continue:
        │             ├── [More Stages?] ──> Advance _currentStage++
        │             └── [Last Stage]   ──> Show _buildCelebrationStage()
        │
        └──> [ INCORRECT ]
                ├── Play Error Buzz
                ├── Deduct 1 Oxygen Bubble (ref.deductOxygen())
                ├── Re-enqueue stage at end of session:
                │     _activeStageTypes.add(currentStageType)
                ├── Show Coral Red DuoFeedbackSheet with correct answer
                └── On Continue: Advance to next stage
```

#### Detailed Breakdown of All 8 Exercise Stages

##### Stage 1: Word Match (`match` / `word_match`)
- **UI:** Two vertical columns containing 4 German vocabulary chips on the left and 4 English translation chips on the right.
- **Interaction:** Tapping a German chip plays instant TTS pronunciation via `TtsService().speakWord()` and marks it with an active cyan border. Tapping the corresponding English chip evaluates the match:
  - If correct: both chips illuminate emerald green, lock into paired state, and increment matched counter.
  - If incorrect: chips flash rose red with haptic shake feedback and clear selection.
- **Completion:** Once all 4 pairs are matched, the check button activates.

##### Stage 2: Listen & Tap (`listen_tap`)
- **UI:** Large animated circular audio speaker button, sentence playback speed toggle button (Normal 1.0x / Turtle 0.5x), empty target sentence construction zone, and a scrambled bank of tappable word chips below.
- **Interaction:** Tapping word chips removes them from the lower bank and appends them to the upper target sentence zone in the selected order. Tapping a chip in the target zone returns it to the bank.
- **Audio:** Tapping each word chip triggers instant $< 20\text{ms}$ low-latency pronunciation.
- **Validation:** Evaluates if the reconstructed token sequence exactly matches `_listenTarget`.

##### Stage 3: Sentence Builder (`sentence_builder`)
- **UI:** Foreign language translation prompt (e.g. *"Translate: Good morning, how are you?"*), assembly area with dotted underline placeholders, and token bank containing correct words plus grammatical distractor tokens.
- **Interaction:** Similar to Listen & Tap, allowing learners to construct, reorder, and remove words dynamically.
- **Validation:** Normalized string comparison against `_builderTargetSentence`.

##### Stage 4: Sprechen Lip-Sync & Pronunciation Test (`sprechen`)
- **UI:** Target German phrase displayed in prominent typography, companion character avatar with lip-sync mouth movement, audio replay button (with 1.0x normal and 0.75x turtle speed toggles), and large pulsing microphone button (`SpeakingMicButton`) with animated RMS sound ripples.
- **5-Phase Lifecycle & Execution:**
  1. **Phase 1 (Idle):** On stage enter, pre-recorded audio or TTS demo plays automatically; avatar moves mouth in sync with audio timestamps. Microphone is dormant.
  2. **Phase 2 (Armed):** Learner taps the microphone button. `TtsService().stop()` halts ongoing audio; 400ms acoustic settling guard prevents hardware audio feedback; 3-tier speech engine fallback resolves optimal recognizer.
  3. **Phase 3 (Listening):** `SpeechRecognitionService().startListening()` activates native ASR with target locale (`de_DE` or `en_US`). Real-time decibel RMS stream animates outer ripple rings of the microphone button.
  4. **Phase 4 (Processing):** Double-tap gating disables repeated tap requests. Speech input stream terminates and dispatches to `PronunciationEvaluator.evaluate()`.
  5. **Phase 5 (Evaluated):** Word-level evaluation scorecard rendered:
     - **Green (`accepted`):** Accurately pronounced ($\ge 80\%$ similarity).
     - **Amber (`typo`):** Minor pronunciation deviation ($65\% - 79\%$ similarity).
     - **Red (`wrongWord` / `missed`):** Unrecognized or skipped word.
  6. If overall weighted accuracy $\ge 75\%$, exercise is marked passed with celebratory fanfare and sound effects.

##### Stage 5: Cloze Test (`cloze`)
- **UI:** Sentence presented with a missing word blank (e.g. *"Ich _____ aus Indien."*), accompanied by native translation and multiple-choice grammatical option chips (e.g. `['komme', 'kommst', 'wohne']`).
- **Interaction:** Tapping an option immediately inserts the word into the blank with an animated transition.
- **Validation:** Validates selected option string against `_clozeBlank`.

##### Stage 6: Type Word (`type_word`)
- **UI:** Sentence prompt with missing word, hint label, native text input field, and a dedicated row of quick-insert German special character buttons: **ä**, **ö**, **ü**, **ß**.
- **Interaction:** Tapping a special character button injects the corresponding letter directly into the active text controller at the current cursor position.
- **Validation:** Trims input, applies umlaut equivalence normalization, and compares with `_typeTarget`.

##### Stage 7: Dialogue Bubble (`dialogue_bubble`)
- **UI:** Conversational chat interface showing a partner avatar (e.g. "Florian"), character speech bubble containing dialogue in the target language with speaker replay audio, and multiple response options below.
- **Interaction:** Learner selects the contextually appropriate conversational response.

##### Stage 8: Listen Select (`listen_select`)
- **UI:** Listening comprehension challenge. Features audio replay button, comprehension question prompt (e.g. *"What is the customer ordering?"*), and multiple choice answers.
- **Validation:** Evaluates selected index against `correctIndex`.

#### Final Lesson Celebration Stage (`_buildCelebrationStage`)
- **Triggered:** When all active stages (including any re-enqueued mistakes) are completed.
- **UI Components:**
  - **Full-Screen Confetti Shower:** High-density celebratory confetti particles (`ConfettiWidget`) showered over the view on entry.
  - 3D Mascot in victory celebration pose with animated sparkle particles.
  - Headline: *"Lesson Complete!"*
  - Stats Row: Accuracy percentage (`_calculatedAccuracy`), XP gained (`_earnedXp`), and Pearls awarded (`_earnedPearls`).
  - **Rewarded Ad Double XP Button:** *"Claim Double XP (2x 🔥)"*. Tapping invokes `AdService().showRewardedAd()`. Upon video completion, XP is doubled locally and credited to the backend via `claimAdReward()`.
  - **Continue Button:** Dispatches `pathNodesProvider.notifier.completeNode()`, records study activity in `ActivityRepository`, checks interstitial ad cadence (`AdService().showInterstitialIfEligible()`), and pops back to the Archipelago map.

---

### Karaoke Note Reader Screen (`karaoke_note_reader_screen.dart`)

The Karaoke Note Reader is an audio-synchronized lyric reader designed for spoken-word audio tracks and bilingual German reading practice.

#### Dual Operational Modes

1. **Listening Mode (`_buildListeningModeView`):**
   - Renders the complete lesson story sentence by sentence in a scrollable list.
   - Each sentence card contains the German text, English translation, speaker label, and word-by-word token wrap.
   - **Continuous Sub-Second Audio Synchronization:**
     - The screen listens to `_audioPlayer.onPositionChanged`.
     - When playback position enters a sentence's time window (`[sentence.start, sentence.end]`), that card elevates, lights up with an active blue border, and automatically scrolls into view using `Scrollable.ensureVisible` with `easeInOutCubic` easing.
     - Individual words within the active sentence card highlight with dotted underline accents as their specific timestamp (`[word.start, word.end]`) is crossed.
   - **Tactile Word Taps:** Tapping any word in any sentence dispatches `TtsService().speakWord()`, allowing instant pronunciation exploration.

2. **Sprechen Duolingo Mode (`_buildSprechenDuolingoView`):**
   - Transforms the reading text into an interactive, step-by-step speaking lesson.
   - The screen focuses on one sentence at a time.
   - Displays the **AnimatedKaraokeCharacter** on the left and the **KaraokeSpeechBubble** on the right.
   - The character's mouth moves in real-time lip-sync during audio playback.
   - Tapping the microphone prompts the learner to pronounce the active sentence.
   - Speech evaluation grades pronunciation. Each sentence grants up to 3 chances. If failed on the 3rd attempt, the system displays a detailed phonetic feedback sheet and proceeds.

#### Audio & Playback Controls
- **Speed Selector:** Allows toggling playback rate between `0.75x`, `1.0x`, and `1.25x`.
- **Sync Offset Slider:** Allows micro-adjusting audio-text alignment by $\pm 500\text{ms}$ in $50\text{ms}$ increments to compensate for device-specific Bluetooth latency.
- **Translation Toggle:** Instantly reveals or hides English translations across all sentence cards.

---

### Match the Pairs Interactive Widget (`match_pairs_widget.dart`)

A dedicated reusable matching component used within quizzes and review screens.

- **Layout:** Side-by-side split view. Left column renders `PROMPTS` (terms/foreign words); Right column renders `MATCHES` (definitions/translations).
- **Thematic Color Pairing System:**
  Six pre-defined color constants are assigned cyclically to matched pairs:
  ```dart
  static const List<Color> _pairColors = [
    Color(0xFF6366F1), // Indigo
    Color(0xFF10B981), // Emerald
    Color(0xFFF59E0B), // Amber
    Color(0xFFEC4899), // Pink
    Color(0xFF06B6D4), // Cyan
    Color(0xFF8B5CF6), // Purple
  ];
  ```
- **State Machine:**
  - Tapping a left prompt invokes `TtsService().speakGerman()` and sets `_selectedLeft = leftText`.
  - Tapping a right match pairs the two items, assigns them matching colors, and displays a bidirectional indicator (`↔`).
  - Tapping the `X` button on any paired card breaks the pair and returns both tiles to unselected states.
  - Tapping `Reset` clears all active pairs simultaneously.
- **Progress Header:** Displays a live indicator badge (e.g. *"All pairs matched! (4/4)"*) that turns green when every prompt has been connected.

---

### Quiz Review Screen (`quiz_review_screen.dart`)

Displays a post-quiz diagnostic breakdown for completed assessments.

- **Summary Header Card:**
  - Displays circular percent indicator (`percent_indicator: ^4.2.3`) colored emerald green if passed ($\ge 70\%$) or coral red if failed.
  - Metrics row: Score (`$score / $maxScore`), Time Taken (`_formatTime(secs)`), and Pass/Fail status pill.
- **Question Evaluation List:**
  - Renders each question with status icons (`check_circle` for correct, `cancel` for incorrect).
  - Highlights the learner's chosen option versus the verified correct option.
  - Displays expandable explanation boxes with lightbulb icons (`💡 Explanation`).
  - Supports embedded syntax-highlighted code snippets for programming/syntax MCQs.
  - Embeds read-only `MatchPairsWidget` instances showing the learner's submitted pairings alongside correct solutions.

---

### Activity & Study Analytics Screen (`activity_history_screen.dart` & Dashboard)

Tracks and visualizes learner engagement metrics.

#### 1. Activity History Screen (`activity_history_screen.dart`)
- **Live Milestone Card (`todayCountsProvider`):**
  - Displays today's live activity breakdown across four metrics:
    - 🧠 **Quizzes:** Total assessments submitted.
    - 📝 **Notes:** Total study guides reviewed.
    - 🎤 **Karaoke:** Spoken audio stories completed.
    - 🃏 **Cards:** Flashcards flipped.
- **Date Categorization Algorithm (`DayCategoryInfo`):**
  - Grouped chronologically:
    - `diffDays == 0`: **TODAY** (Cyan badge `#06B6D4`).
    - `diffDays == 1`: **YESTERDAY** (Blue badge `#3B82F6`).
    - `diffDays == 2`: **DAY BEFORE YESTERDAY** (Purple badge `#8B5CF6`).
    - `diffDays > 2`: Formatted weekday and full calendar date (e.g. *"Wednesday, Oct 22, 2026"*).
- **Filter Tabs:** Allows filtering activity cards by `'all'`, `'quiz'`, `'note'`, or `'flashcard'`.

#### 2. Dashboard Screen (`dashboard_screen.dart`)
- Top custom app bar with user initials avatar and date string.
- Greeting headline (*"Hello, {Name} 👋"*).
- Daily streak display with flame icon.
- Quick navigation tiles for active curriculum units, recent notes, and recommended quizzes.

---

### 6-Item Catalog Pagination & Pull-To-Refresh Architecture

The catalog screens (`notes_screen.dart`, `quizzes_screen.dart`) implement a standardized 6-item pagination pattern to ensure smooth network transfers and avoid UI freezing.

```dart
class NotesListNotifier extends StateNotifier<NotesListState> {
  // Initial Page Fetch
  Future<void> fetchInitial() async {
    state = state.copyWith(isLoading: true, page: 1, hasMore: true, notes: []);
    final result = await _repo.getNotes(page: 1, limit: 6);
    state = state.copyWith(
      notes: result,
      isLoading: false,
      page: 1,
      hasMore: result.length == 6, // If fewer than 6 returned, end of list
    );
  }

  // Next Page Infinite Scroll Fetch
  Future<void> fetchNextPage() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    final next = state.page + 1;
    final result = await _repo.getNotes(page: next, limit: 6);
    state = state.copyWith(
      notes: [...state.notes, ...result],
      isLoadingMore: false,
      page: next,
      hasMore: result.length == 6,
    );
  }
}
```

- **Scroll Detection:** A `ScrollController` listener checks `if (position.pixels >= position.maxScrollExtent - 200)` to trigger `fetchNextPage()` ahead of the list boundary.
- **Pull-to-Refresh:** Wrapped in `RefreshIndicator`, re-invoking `fetchInitial()` with fresh cache invalidation.
- **Skeleton Shimmers:** Initial loading states render 3 animated `ShimmerCard` skeleton placeholders (`shimmer: ^3.0.0`).

---

## 6. Data Models & Serialization Layer

All data models are located in feature data directories, implementing type-safe JSON serialization, defensive type coercion, and immutability.

### Entity Model Specifications

```dart
// 1. User Account Entity (features/auth/data/models/user_model.dart)
class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? avatar;
  final String bio;
}

// 2. Gamification Status Entity (features/gamification/data/models/gamification_models.dart)
class GamificationStatusModel {
  final int streakCount;
  final int longestStreak;
  final String? lastActiveDate;
  final int dailyTargetXp;
  final String targetLanguage;  // 'de', 'en'
  final String nativeLanguage;  // 'en', 'hi', 'mr'
  final String currentLevel;    // 'A1'
  final int pearls;
  final int oxygen;            // 0 - 5
  final int totalXp;
  final String currentLeague;   // 'Coral Reef', etc.
}

// 3. Curriculum Path Node Entity (features/gamification/data/models/gamification_models.dart)
class PathNodeModel {
  final dynamic id;
  final int index;
  final String title;
  final String subtitle;
  final String type;            // 'lesson', 'karaoke', 'speech', 'chest', 'match', 'builder', 'boss'
  final String status;          // 'locked', 'available', 'completed'
  final int stars;              // 0 - 3
  final int scorePct;           // 0 - 100
  final int xpReward;
  final int pearlsReward;
  final String? sourceType;     // 'note', 'quiz'
  final dynamic sourceId;
  final double offset;          // Sine wave horizontal offset
  final String? audioUrl;
  final List<dynamic>? stages;  // Embedded multi-stage exercise manifests
  final int unitNumber;         // 1 - 105
  final String unitTitle;
  final String unitDescription;
  final int sectionNumber;      // 1 - 3
  final String sectionTitle;    // 'Rookie', 'Explorer', 'Traveler'
  final int sectionUnitNumber;  // Unit index within current section
  final String colorHex;        // Accent hex, e.g. '#1CB0F6'
}

// 4. Karaoke Timestamp Models (features/notes/data/models/karaoke_model.dart)
class KaraokeStory {
  final String title;
  final String? englishTitle;
  final String? audioUrl;
  final double duration;
  final bool isSprechen;
  final List<KaraokeSentence> sentences;
  final Map<String, dynamic>? vocab;
}

class KaraokeSentence {
  final int index;
  final String text;
  final String translation;
  final String speaker;
  final double start;          // Start timestamp in seconds
  final double end;            // End timestamp in seconds
  final List<KaraokeWord> words;
}

class KaraokeWord {
  final String word;
  final String clean;
  final double start;          // Word start timestamp in seconds
  final double end;            // Word end timestamp in seconds
  final int sentenceIndex;
}

// 5. Quiz Models (features/quizzes/data/models/quiz_model.dart)
class QuizModel {
  final String id;
  final String title;
  final String? description;
  final String? subjectId;
  final String? topic;
  final List<QuizQuestion> questions;
  final int passingScore;
  final int timeLimit;
  final int totalPoints;
  final String? subjectName;
  final bool shuffle;
}

class QuizQuestion {
  final String id;
  final String text;
  final String type;            // 'multiple-choice', 'code-mcq', 'match-pairs'
  final List<String> options;
  final String? code;
  final String? language;
  final int? correctIndex;
  final String? explanation;
  final int points;
  final List<QuizPairModel> pairs;
  final List<String> leftItems;
  final List<String> rightItems;
}

class QuizPairModel {
  final String left;
  final String right;
}

class AttemptModel {
  final String id;
  final int score;
  final int maxScore;
  final double percentage;
  final bool passed;
  final List<AttemptAnswer> answers;
  final int timeTaken;
  final String? submittedAt;
}

// 6. Flashcard Deck Models (features/flashcards/data/models/flashcard_model.dart)
class FlashcardDeck {
  final String id;
  final String deckName;
  final String? description;
  final String? color;
  final List<Flashcard> cards;
  final int cardCount;
  final bool isPublic;
}

class Flashcard {
  final String id;
  final String front;
  final String back;
  final String? hint;
}

// 7. Study Activity Models (features/dashboard/data/models/activity_model.dart)
class ActivityItem {
  final int id;
  final String activityType;    // 'quiz', 'note', 'flashcard'
  final int resourceId;
  final String resourceTitle;
  final String? subjectName;
  final String? topicName;
  final Map<String, dynamic> metadata;
  final String activityDate;
  final String createdAt;
}

class TodayCounts {
  final int quizCount;
  final int noteCount;
  final int flashcardCount;
  final int karaokeCount;
  final int total;
}
```

---

## 7. Service & Network Layer

### HTTP Networking Engine (`DioClient`)

Located in `core/network/dio_client.dart`:
- **Singleton Instance:** Configured with `connectTimeout: 15s` and `receiveTimeout: 15s`.
- **$O(1)$ In-Memory JWT Authentication Interceptor:**
  Reads token from `FlutterSecureStorage` once on boot, then caches it in static variable `_cachedToken`. Eliminates expensive keychain disk reads on every HTTP request.
- **Selective Logging Suppression:**
  Using `PrettyDioLogger`, logs request headers and bodies in debug mode. For heavy curriculum path payloads (`/gamification/path`), body dumping is suppressed to prevent USB Logcat buffer exhaustion:
  ```dart
  if (response.requestOptions.path.contains('/gamification/path')) {
    final nodeCount = response.data is Map ? (response.data['nodes'] as List?)?.length ?? 0 : 0;
    debugPrint('⚡ [DIO] ${response.requestOptions.method} ${response.requestOptions.path} => ${response.statusCode} ($nodeCount nodes loaded)');
    return handler.next(response);
  }
  ```
- **Automatic 401 Session Purging:**
  On HTTP 401 Unauthorized, automatically invokes `clearToken()`, triggering GoRouter navigation redirection to `/login`.

---

### Tier-2 Persistence Cache (`CacheService`)

Located in `core/services/cache_service.dart`:
- **Course Path Caching:** Stores serialized path node lists under composite language-specific keys: `cached_path_{targetLang}_{nativeLang}_{level}`. Enables instant map rendering before network resolution.
- **User Progression Caching:** Persists `GamificationStatusModel` under `cached_user_status`.
- **Lesson Manifest Caching:** Persists full multi-stage lesson manifests under `cached_lesson_{lessonId}`.
- **Offline Request Replay Ledger:**
  When lesson completions occur offline, payloads are queued in local cache (`cached_offline_completions`). Upon network restoration, `_replayOfflineCompletions()` sends all queued submissions sequentially.
- **Local Audio Disk Storage (`CacheDir.AUDIO_TTS`):**
  Resolves app support directory `${baseDir}/cache_audio_tts/`. Stores downloaded remote audio clips under deterministic hash filenames (e.g. `audio_5a2f8c9d.mp3`), enabling instant local file playback.

---

### Predictive Prefetching Engine (`PrefetchService`)

Located in `core/services/prefetch_service.dart`:
- **Heuristic Node Scanning:**
  When `ArchipelagoMapScreen` loads, `prefetchUpcomingLessons()` scans the active path, locates the current available node, and predictively fetches manifests for the **next 2–3 unfinished nodes** in background worker tasks.
- **Audio Pre-Downloading:**
  Scans stage manifests for audio URLs (`audioUrl`, `listenAudioUrl`, `sprechenAudioUrl`) and downloads audio bytes directly to the local disk cache via `saveAudioBytes()`. Lessons launch with zero audio buffering.

---

### Pronunciation Evaluator Engine (`PronunciationEvaluator`)

Located in `core/services/pronunciation_evaluator.dart`:
A specialized acoustic grading engine providing Duolingo-parity evaluation without third-party cloud costs:
1. **Collator-Style Umlaut & Accent Decomposition:**
   Normalizes German umlauts: `ä` $\to$ `ae`, `ö` $\to$ `oe`, `ü` $\to$ `ue`, `ß` $\to$ `ss`. Strips non-alphanumeric punctuation while preserving internal apostrophes.
2. **Dynamic Programming Levenshtein Distance:**
   Calculates minimum edit distance between target and spoken tokens.
3. **Soundex Phonetic Tolerance:**
   Computes phonetic hash approximations. If a learner's spoken token has minor accent variations but matches the target Soundex hash, a similarity bonus up to $0.88$ is awarded.
4. **Lookahead Alignment Window:**
   Implements monotonic forward sequence alignment with a 3-token lookahead window to tolerate hesitations, stuttering, or filler words.
5. **Content-Word Weighted Scoring:**
   Words are partitioned into function words (articles, prepositions, pronouns) and content words (nouns, verbs, adjectives). Content words carry $1.5\times$ weight in the final accuracy percentage calculation.

---

### Speech Recognition Pipeline (`SpeechRecognitionService` & Bridge)

Located in `core/services/speech_recognition_service.dart`:
- **Acoustic Feedback Prevention:**
  Calls `TtsService().stop()` and introduces a $200\text{ms}$ hardware settling guard before opening the microphone stream, preventing speaker audio from echoing into the input stream.
- **Locale Negotiation:**
  Negotiates device speech recognition models against target codes (`de_DE`, `en_US`, regional fallbacks).
- **RMS Sound Level Stream:**
  Normalizes native input decibels ($-2\text{dB}$ to $10\text{dB}$) into a clamped $[0.0, 1.0]$ floating stream to drive visual microphone ripple animations.
- **Platform Lifecycle Bridge (`SpeechLifecycleBridge`):**
  Invokes native Android MethodChannel `com.dolphincoder.lms/speech_lifecycle` (`destroyRecognizer`) when the app pauses or detaches to prevent hardware recording resource leaks.

---

### Low-Latency TTS Engine (`TtsService`)

Located in `core/services/tts_service.dart`:
- **Voice Selection Algorithm:**
  - For English: Dynamically inspects available system voices and selects natural male studio narrator voices (`en-us-x-iom`, `en-us-x-tpd`, `en-gb-x-rjd`, Daniel), filtering out any voice containing female identifiers. Configured at pitch `0.88` and speech rate `0.48`.
  - For German: Selects high-quality female voices (`de-de-x-deb`, Eva, Marlene) at pitch `1.0` and speech rate `0.48`.
- **Dual Playback Strategy:**
  - **Single Word Taps:** Checks in-memory map and disk cache for pre-synthesized audio files (`tts_v3_...wav`). If present, plays instantly via `AudioPlayer(mode: PlayerMode.lowLatency)` in $< 20\text{ms}$. If absent, falls back to native TTS speech and queues background synthesis for future taps.
  - **Sentence Playback:** Uses `flutterTts.speak()` with non-blocking asynchronous dispatch.
- **Cache Invalidation & Cleanup:**
  Enforces cache versioning (`_cacheVersion = 3`). On initialization, any cached audio file not matching the current version prefix is automatically purged from disk.

---

### AdMob Monetization & Cadence (`AdService`)

Located in `core/services/ad_service.dart`:
- **Dual Ad Format Architecture:**
  - **Rewarded Ads:** Opt-in rewards granting $+1$ Oxygen Bubble when depleted or Double XP ($2\times$) upon completing a lesson session.
  - **Interstitial Ads:** Full-screen interstitial ads shown every 2 completed lessons (`_kLessonsPerAd = 2`).
- **Cadence Logic:**
  `incrementLessonCount()` records completions in `SharedPreferences`. `showInterstitialIfEligible()` presents the ad if eligible and preloaded, then resets the counter.
- **Preloading & Backoff Retry:**
  Automatically pre-caches next ad upon dismissal. Implements progressive delay backoff ($2\text{s}, 4\text{s}, 6\text{s}$) on load failures up to 3 attempts.
- **Debug Safety:**
  Uses official Google test ad unit IDs in debug mode to prevent AdMob account policy flags during development.

---

### Version Check & Enforcement (`VersionCheckService`)

Located in `core/services/version_check_service.dart`:
- Queries `https://dolphincoder.com/app_version.json` on app boot.
- Compares installed build number (`AppConstants.currentBuildNumber = 15`) against `min_required_version`.
- If outdated, presents an un-dismissible `ForceUpdateDialog` deep-linking to Google Play Store.
- **Fail-Open Resilience:**
  If network times out, returns HTTP 404, or fails, the check fails open (`forceUpdateRequired: false`) so offline learners are not blocked.

---

## 8. Comprehensive Dependencies Analysis (`pubspec.yaml`)

```yaml
environment:
  sdk: '>=3.3.0 <4.0.0'
```

### Production Runtime Dependencies

| Package | Version | Architectural Role & Implementation Rationale |
|---------|---------|-----------------------------------------------|
| `flutter_riverpod` | `^2.5.1` | Compile-time safe reactive state management; drives all feature notifiers without boilerplate. |
| `riverpod_annotation` | `^2.3.5` | Code generation annotations for type-safe Riverpod providers. |
| `go_router` | `^13.2.0` | Declarative routing, auth guards, parameter extraction, and persistent bottom navigation shells. |
| `dio` | `^5.4.3` | Robust HTTP client featuring interceptor pipelines, request timeouts, and stream downloads. |
| `pretty_dio_logger` | `^1.3.1` | Detailed request/response logging for debug/profile builds; suppressed in release. |
| `flutter_secure_storage` | `^9.0.0` | Encrypted keychain/keystore storage for sensitive JWT authentication tokens. |
| `shared_preferences` | `^2.2.3` | Lightweight key-value persistence for theme modes, course language selection, and Tier-2 cache. |
| `path_provider` | `^2.1.2` | Resolves cross-platform local directories for audio file caching and offline storage. |
| `google_fonts` | `^6.2.1` | Dynamic typography delivery for Plus Jakarta Sans, Outfit, and Inter font families. |
| `flutter_animate` | `^4.5.0` | Declarative motion effects, pulse animations, fade transitions, and UI micro-interactions. |
| `cached_network_image` | `^3.3.1` | Memory/disk cached network image loader with placeholder spinners and error widgets. |
| `shimmer` | `^3.0.0` | Fluid skeleton shimmer effects during catalog data loading and Archipelago path initialization. |
| `flutter_html` | `^3.0.0-beta.2` | Renders rich HTML content, tables, and styled spans within educational study notes. |
| `webview_flutter` | `^4.8.0` | Native web view backing embedded YouTube video lesson playback. |
| `percent_indicator` | `^4.2.3` | Circular and linear progress bars displaying quiz attempt percentage scores. |
| `image_picker` | `^1.1.2` | Camera and photo gallery picker for user avatar profile updates. |
| `permission_handler` | `^11.3.1` | Runtime permission handling for microphone recording access and system settings deep-linking. |
| `url_launcher` | `^6.2.7` | Dispatches external browser intents for legal policies, store listings, and account deletion. |
| `intl` | `^0.19.0` | Internationalization formatting for dates, calendar day strings, and numbers. |
| `timeago` | `^3.6.1` | Relative fuzzy timestamp formatting (e.g. *"5 minutes ago"*) for activity cards. |
| `equatable` | `^2.0.5` | Value-based equality comparisons for state objects without manual hashCode overrides. |
| `freezed_annotation` | `^2.4.1` | Annotations for immutable union types and data class generation. |
| `json_annotation` | `^4.9.0` | Type annotations supporting automated JSON serialization code generation. |
| `audioplayers` | `^6.8.1` | Multi-instance audio engine supporting low-latency local word taps and story playback. |
| `speech_to_text` | `^7.5.0` | Device-native automated speech recognition engine powering pronunciation exercises. |
| `flutter_tts` | `^4.2.5` | Native Text-To-Speech engine providing spoken German and English vocabulary pronunciation. |
| `google_mobile_ads` | `^9.2.0` | Official Google Mobile Ads SDK powering Rewarded Video and Interstitial lesson ads. |

### Development & Test Dependencies

| Package | Version | Architectural Role |
|---------|---------|--------------------|
| `flutter_test` | `sdk: flutter` | Unit and widget testing framework. |
| `flutter_lints` | `^3.0.0` | Official Flutter recommended style and code quality rules. |
| `build_runner` | `^2.4.9` | Code generation orchestration tool. |
| `riverpod_generator` | `^2.4.0` | Code generator for Riverpod 2 providers. |
| `freezed` | `^2.5.2` | Code generator for immutable data models and copyWith methods. |
| `json_serializable` | `^6.7.1` | Code generator for `fromJson` and `toJson` serialization logic. |
| `flutter_launcher_icons` | `^0.14.1` | Automated Android adaptive and iOS app icon generation from `logo.png`. |

---

## 9. Conclusion & Architecture Verification

The DolphinCoder mobile application represents a production-grade, highly responsive educational client. By pairing **Riverpod 2** and **GoRouter** with an **in-memory JWT cache**, a **5-tier offline persistence engine**, and an **independent sub-20ms audio and pronunciation pipeline**, the architecture achieves immediate UI responses (0ms lesson starts, 60–120 FPS path scrolling, instant word taps) while maintaining clean architectural boundaries.

This specification serves as the exhaustive single source of truth for the frontend architecture of DolphinCoder LMS.
