# android.md — Agent Context & Synchronization Guide for the Flutter Mobile App

> **Purpose:** Comprehensive onboarding and technical specification for coding agents and engineers working in
> `app/dolphincoder/` (the Flutter mobile client for Android and iOS).
> Documents existing architecture, Riverpod state models, navigation, network client, and the roadmap
> for synchronizing mobile features with the latest web releases.
> Verified against active source on 2026-09-26.
>
> **Rules of engagement for agents:**
> 1. The mobile app is located in `app/dolphincoder/` (the root `android/` directory contains legacy planning artifacts).
> 2. State management is **Riverpod 2** using hand-written `StateNotifier`s and `FutureProvider.family`.
> 3. Navigation is **GoRouter** with token-checking redirects. Session tokens live in `flutter_secure_storage` (`tokenKey`), while user data JSON lives in `SharedPreferences` (`userDataKey`).
> 4. Do NOT modify any Flutter code until instructed. Update documentation first.

---

## 1. What This Is

**DolphinCoder Mobile Client** (`pubspec` package: `dolphincoder`, v1.0.0+2) — A native, dark-themed Material 3 mobile application for Android (SDK 23+) and iOS, serving as the student companion for [dolphincoder.com](https://dolphincoder.com).

### Feature Comparison Matrix (Web vs Mobile Status)

| Feature Domain | Web LMS Status | Flutter Mobile Status | Synchronization Needed |
|---|---|---|---|
| **Authentication** | Login, Register, Profile, Password, Roles | Login, Register, Profile, Password | ✅ Parity achieved |
| **Dashboard** | Stat cards, Today's Performance (countsOnly), Activity history | Stat cards, Today's Performance Card, History link | ✅ Parity achieved (`/api/activity/summary`) |
| **Notes** | Richtext, DOCX, HTML slides, **Karaoke Audio Reader** | Richtext, DOCX, HTML, **Karaoke Reader & Sprechen Mode** | ✅ Parity achieved (`audioplayers` & `speech_to_text`) |
| **Quizzes** | MCQ, True/False, Code-MCQ, **Match the Pairs (`match-pairs`)**, **Quiz Review** | MCQ, Code, **MatchPairsWidget**, **QuizReviewScreen** | ✅ Parity achieved (`/quizzes/:id/review`) |
| **Flashcards** | Decks, 3D flip card study, mastery score | Decks, flip card study, mastery score | ✅ Parity achieved |
| **Videos** | YouTube embeds, view count, tags | YouTube player in WebView | ✅ Parity achieved |
| **Activity History**| `/activity` with localized Day categories & Daily hours | `ActivityHistoryScreen` with Daily hours & Categories | ✅ Parity achieved (`/activity`) |
| **Pagination** | 6-item pagination across lists | 6-item pagination across Notes & Quizzes | ✅ Parity achieved |
| **Curriculum & Archipelago** | `/curriculum` studio, Units, multi-stage lessons | `ArchipelagoMapScreen`, `LessonSessionScreen`, `audioplayers` | ✅ Parity achieved (`/api/gamification/*`) |

---

## 2. Run & Build

```bash
cd app/dolphincoder
flutter pub get
flutter run                    # Debug mode (defaults to https://dolphincoder.com/api)
flutter build apk --release    # Production Android APK
flutter build appbundle        # Production Google Play App Bundle
```

- **API Base URL**: `lib/core/constants/api_constants.dart`.
  - Default URL is `https://dolphincoder.com/api` (relies on web reverse proxy to backend port 5000).
  - Production direct URL is `https://api.dolphincoder.com/api`.
  - For local Android emulator testing, point to `http://10.0.2.2:5000/api`.

---

## 3. Directory Map

```
app/dolphincoder/
├── pubspec.yaml
├── lib/
│   ├── main.dart                      # ProviderScope initialization & runApp
│   ├── app.dart                       # MaterialApp.router with AppTheme.dark
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_constants.dart     # Endpoint URLs and base domain configuration
│   │   │   └── app_constants.dart     # Storage keys (tokenKey, userDataKey)
│   │   ├── network/
│   │   │   ├── dio_client.dart        # Dio singleton with JWT Bearer interceptor & error handling
│   │   │   └── api_exception.dart     # Custom exception mapping status codes to UI messages
│   │   ├── router/
│   │   │   └── app_router.dart        # GoRouter: ShellRoute for bottom navigation tabs & auth redirects
│   │   ├── theme/
│   │   │   ├── app_colors.dart        # Deep ocean `#0A0F1E`, gradient accents, note & deck colors
│   │   │   └── app_theme.dart         # Material 3 dark theme, Google Fonts (Plus Jakarta Sans + Inter)
│   │   └── utils/
│   │       └── validators.dart        # Email, password strength, and field validators
│   ├── features/
│   │   ├── auth/                      # Splash, Onboarding, Login, Register + AuthProvider & Repository
│   │   ├── dashboard/                 # Dashboard screen with greetings, stats, and quick links
│   │   ├── notes/                     # NoteModel, NotesRepository, NotesProvider, NotesScreen, NoteDetailScreen
│   │   ├── videos/                    # VideoModel, VideosRepository, VideosScreen, VideoDetailScreen (WebView)
│   │   ├── quizzes/                   # QuizModel, QuizTakeScreen, QuizResultScreen, providers & repo
│   │   ├── flashcards/                # FlashcardModel, DecksScreen, StudyScreen, providers & repo
│   │   ├── profile/                   # ProfileScreen, EditProfileScreen, ChangePasswordScreen, SettingsScreen
│   │   └── gamification/              # ArchipelagoMapScreen, LessonSessionScreen, AnimatedDolphinMascot, economy
│   └── shared/
│       └── widgets/
│           ├── app_text_field.dart    # Styled input with prefix icon and validator
│           ├── bottom_nav.dart        # Custom 5-tab floating bottom navigation bar
│           ├── empty_state.dart       # Empty list placeholders with emojis and action buttons
│           ├── glass_card.dart        # Frosted glass container with border gradients
│           ├── gradient_button.dart   # Primary button with loading indicator
│           ├── shimmer_loader.dart    # Shimmer placeholder animations for loading lists
│           └── subject_badge.dart     # Color-coded Subject and Topic chips
```

---

## 4. Mobile Architecture & Conventions

### 4.1 Data & State Layering
Each feature directory adheres strictly to the three-tier pattern:
1. `data/models/<feature>_model.dart`: Hand-written serialization (`fromJson` and `toJson`). All models extract `_id` defensively:
   ```dart
   id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
   ```
2. `data/<feature>_repository.dart`: Dio client wrapper. Always initializes via:
   ```dart
   final dio = await DioClient.getInstance();
   ```
3. `providers/<feature>_provider.dart`:
   - List providers are `StateNotifier`s that self-fetch on creation.
   - Detail providers use `FutureProvider.family<T, String>`.

### 4.2 Network & Authentication Pipeline
- `DioClient` attaches the JWT token from `FlutterSecureStorage` dynamically on every request.
- Logs are gated with `!kReleaseMode` (`PrettyDioLogger`) to ensure sensitive authentication tokens are never exposed in release APK builds.
- On HTTP 401, the interceptor purges the local secure token, triggering GoRouter's redirect to `/login` on the next navigation transition.

---

## 5. Verified Implementation Features (Full Web Parity)

The Flutter mobile client (`app/dolphincoder/`) has achieved complete parity with the web platform across all core domains:

### 1. Karaoke Audio Reader & Sprechen Speaking Practice (`karaoke_note_reader_screen.dart`)
- **Audio Playback Engine**: Powered by `audioplayers` with range-seeking from `/api/notes/audio/db/:id` and demo playback.
- **Word-by-Word Synchronized Transcript**: Word-level highlighting matching native German audio playback timestamps.
- **Playback & Latency Calibration**:
  - Configurable tempo speeds (`0.75x` default for Sprechen, `1.0x`, and `1.25x`).
  - Real-time sync offset buttons (`-0.25s`, `0s`, `+0.25s`) allowing instant recalibration for speaker or Bluetooth latency.
- **Sprechen Practice Mode**:
  - Auto-pause audio at sentence boundaries.
  - Native Android German speech recognition (`de-DE`) using `speech_to_text`.
  - **Continuous Dictation**: Initialized with `stt.ListenMode.dictation`, `listenFor: const Duration(seconds: 90)`, and `pauseFor: const Duration(seconds: 6)` to eliminate premature cutoffs during natural breathing pauses.
  - **True 3-Second Silence Timer**: Dedicated 3000ms timer resets on every recognized word and strictly waits for 3 seconds of continuous silence before auto-evaluating.
  - **Live Visual Countdown**: Status indicator displaying `"Submits in 3s of silence, or tap Done"`.
  - **Instant Evaluation Action**: Prominent `"Done Speaking (Check Now ✓)"` button bypasses the silence timer for immediate checking.
  - **Static English Translation Reference**: Displayed as a clean subtitle box (`Meaning: ...`) inside the Sprechen challenge card strictly for comprehension; **never read aloud via audio/TTS** and **never interrupts with popups**.
  - Word accuracy matching (≥75% pass threshold) and visual feedback.

### 2. Quizzes with Dual Subject & Topic Filtering (`quizzes_screen.dart`)
- **Subject Chips Carousel**: Horizontally scrollable chip row for fast subject filtering.
- **Dynamic Topic Chips Carousel**: Automatically renders below the subject row when a subject is active.
  - Includes **"All Topics"** reset chip alongside granular topic chips (e.g. `Grammar`, `Vocabulary`).
  - Cyan accent styling distinguishes topic tier from subject tier.
  - State synchronized with `ref.read(quizzesListProvider.notifier).filterTopic(topic)`.

### 3. Match the Pairs Question Type (`match_pairs_widget.dart`)
- Integrated within `QuizTakeScreen`:
  - Left column: Terms.
  - Right column: Definitions.
  - Interactive tap-to-connect pairing with dynamic color badges and reset capabilities.

### 4. Dedicated Quiz Review Screen (`quiz_review_screen.dart`)
- Full post-submission review:
  - Overall score percentage ring and pass/fail status.
  - Detailed breakdown of user's selected answers vs correct answers.
  - Full trainer pedagogical explanations for every question.

### 5. Activity History & Daily Study Hours (`activity_history_screen.dart`)
- Direct consumption of `/api/activity/summary`:
  - Today's study milestones card.
  - Categorized weekly cards (**Today**, **Yesterday**, **Day Before Yesterday**).
  - Daily study hours chart and activity distribution.

### 6. Standardized 6-Item Pagination
- Standard 6-item pagination across Notes and Quizzes with pull-to-refresh and infinite scroll.

---

---

## 6. Verified Implementation: Animated Speaking Character & Duolingo Sprechen Mode

The interactive, animated character companion and single-sentence Duolingo-style Sprechen mode have been fully implemented in `app/dolphincoder/lib/features/notes/`:

### 6.1 Architecture & Components
1. **`AnimatedKaraokeCharacter` (`widgets/animated_karaoke_character.dart`)**:
   - Custom 60 FPS vector character drawn with Flutter `CustomPainter`.
   - **Real-Time Lip-Sync**: Smoothly opens and articulates mouth (`mouthOpen` oscillation) specifically while `currentSeconds >= activeWord.start && currentSeconds <= activeWord.end`. Mouth closes naturally on inter-word pauses.
   - **Eye Blinking Engine**: Periodic 3.2s cycle with realistic 150ms eye blinks.
   - **Subtle Breathing**: Sinusoidal floating offset (`sin(t)`) keeping the character lively.
   - **Dynamic States**:
     - *Idle*: Calm, friendly expression with glance towards speech bubble.
     - *Speaking*: Dynamic mouth movements with visible teeth and tongue.
     - *Listening*: Head tilt (`headTilt: 0.08`) and attentive cupping gesture when student speaks into the microphone.
     - *Celebration*: Smiling arched closed eyes (`^‿^`), cheerful open laugh, raised arms, and twinkling gold star confetti.
2. **`KaraokeSpeechBubble` (`widgets/karaoke_speech_bubble.dart`)**:
   - Comic-style speech bubble with triangular tail pointing to the character's mouth.
   - Circular speaker replay icon button (`🔊`) allowing immediate audio replay.
   - Word-by-word highlighted German sentence text.
3. **Duolingo-Style Sprechen Screen (`karaoke_note_reader_screen.dart`)**:
   - **Top Navigation Bar**: Exit button (`✕`), Gold/Orange sentence progress bar with star counter (`X OF Y IN A ROW`), and Hearts counter (`❤️ 3`).
   - **Prompt**: Large bold `"Speak this sentence"` header.
   - **"TAP TO SPEAK" Card**: Prominent rounded action card (`Color(0xFF1CB0F6)`), switching to active recording canvas with silence countdown and instant `"Done Speaking (Check Now ✓)"` button.
   - **Duolingo Bottom Feedback Sheet**:
     - **On Pass (≥75%)**: Pastel green sheet (`#D7FFB8`), `"Excellent! Meaning:"` with English translation, and full-width green **`CONTINUE`** button advancing to the next sentence.
     - **On Retry**: Pastel red sheet (`#FFDFE0`), `"Not quite! Meaning:"`, with `"Listen (0.75x)"` and `"TRY AGAIN"` action buttons.
     - **Lesson Complete**: Celebration dialog upon mastering all sentences.
   - **Mode Preserved**: Continuous full-script reading view remains fully accessible via the top `"Full Script"` toggle pill.

---

## 7. Verified Implementation: Gamified Archipelago & Multi-Stage Lesson Session

The Duolingo-grade gamified language path and interactive multi-stage lesson challenge runner are implemented in `app/dolphincoder/lib/features/gamification/`:

### 7.1 Archipelago Map Screen (`archipelago_map_screen.dart`)
- **Top Ocean Status Bar**:
  - Flag switcher: `🇩🇪 German (A1)`.
  - Oxygen Energy counter (`🫧 5/5`) with automatic time-based replenishment.
  - Pearls virtual currency (`💎 420`) and streak flame counter (`🔥 7`).
- **3D Sinusoidal Island Path**:
  - Curved serpentine stepping stones oscillating across horizontal offsets.
  - Interactive node states:
    - **Completed**: Gold star badge (`⭐ 1–3`), glowing emerald ring.
    - **Active**: Elevated vibrant circular button with animated pulsing halo and mascot icon.
    - **Locked**: Subtly muted stone with lock padlock icon (`🔒`).
    - **Bonus**: Sunken treasure chests and checkpoint lighthouses.
- **Dynamic Curriculum Integration**:
  - Fetches live learning nodes from `/api/gamification/path`.
  - Automatically loads authored curriculum units and lessons from MySQL backend.

### 7.2 Multi-Stage Interactive Lesson Session (`lesson_session_screen.dart`)
- **Stage Orchestration Engine**:
  - Dynamically parses stages from `node.stages` JSON via `_initStagesData()`.
  - Seamlessly runs through all authored challenges:
    1. **Stage 0: Match the Word Pairs (`word_match` / `match_pairs`)**: Dynamic vocabulary pairing loaded directly from lesson stage data (supporting `target`/`native` and `german`/`english` structures) with tactile pairing and green success dissolution.
    2. **Stage 1: Listen and Tap What You Hear (`listen_tap`)**:
       - **Native `audioplayers` Streaming**: High-fidelity streaming directly from `/api/notes/audio/db/:id` resolved to `https://dolphincoder.com/api/notes/audio/db/:id`.
       - **Interactive Speaker Button**: Toggles between `volume_up_rounded` and `pause_rounded` reflecting active playback state.
       - **Mascot Listening Reaction**: Vector dolphin mascot (`AnimatedDolphinMascot`) wears headphones (`hasHeadphones: true`) and reacts with attentive listening animation (`isListening: true`).
       - **Dynamic Word Bank & Tap-to-Pronounce**: Tappable word chips derived from `stages[listen_tap].tokens`. When learners tap any word chip, the app checks `stages[listen_tap].wordTimestamps` (with automatic fallback to `karaokeData.words`), pre-buffers the audio source on screen initialization, and executes an instant in-memory seek to `start` with position-monitored clamping to `end`, guaranteeing crisp word pronunciation without network reconnection latency.
       - **Interactive Assembly Canvas**: Tapping tokens moves them into the target assembly box; tapping assembled tokens returns them to the bank.
       - **Tolerant Verification**: Whitespace-normalized, punctuation-insensitive sequence validation.
    3. **Stage 2: Sentence Builder (`sentence_builder`)**: English prompt card, scrambled German token bank, and grammar syntax check.
    4. **Stage 3: Sprechen Pronunciation (`sprechen`)**: German challenge phrase, parallel English translation reference, and microphone dictation.
    5. **Stage 4: Celebration & Rewards**: Flip animation, XP earnings, accuracy percentage, pearls reward, and progress submission to `/api/gamification/complete-node`.
- **Duolingo-Style Feedback Sheets (`DuoFeedbackSheet`)**:
  - **Success**: Emerald green card (`#D7FFB8`) with checkmark and full-width green "CONTINUE →" button.
  - **Correction**: Warm rose card (`#FFDFE0`) displaying correct translation with retry action.
