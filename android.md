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
| **Dashboard** | Stat cards, Today's Performance (countsOnly), Activity history | Stat cards, Recent Notes, Featured Quiz | ⚠️ Needs Today's Performance (`/api/activity/summary`) |
| **Notes** | Richtext, DOCX, HTML slides, **Karaoke Audio Reader** | Richtext (`flutter_html`), DOCX, HTML slides (WebView) | 🔴 Needs **Karaoke Audio Reader & Sprechen Mode** |
| **Quizzes** | MCQ, True/False, Code-MCQ, **Match the Pairs (`match_pairs`)**, **Quiz Review** | MCQ, True/False, Code (text) | 🔴 Needs **Match Pairs widget** & **Quiz Review screen** |
| **Flashcards** | Decks, 3D flip card study, mastery score | Decks, flip card study, mastery score | ⚠️ Needs card-id progress alignment |
| **Videos** | YouTube embeds, view count, tags | YouTube player in WebView | ⚠️ Video reload guard polish |
| **Activity History**| `/activity` with localized Day categories & Daily hours | Not implemented | 🔴 Needs Activity History screen |
| **Pagination** | 6-item pagination across lists | Single-page fetch | ⚠️ Needs pagination or infinite scroll |

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
│   │   └── profile/                   # ProfileScreen, EditProfileScreen, ChangePasswordScreen, SettingsScreen
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

## 5. Mobile Alignment Roadmap (Upcoming Implementation)

To bring the Flutter mobile app to complete parity with the latest web releases, the following screens and capabilities will be added:

### 1. Karaoke Audio Reader & Sprechen Speaking Practice
- **Audio Playback Engine**: Integrate `just_audio` to stream audio with range seeking from `/api/notes/audio/db/:id`.
- **Word-by-Word Synchronized Transcript**: Highlighting words in real time matching `story.sentences[i].words[j]`.
- **Sprechen Practice Mode**:
  - Auto-pause audio at sentence boundaries.
  - Integrate `speech_to_text` for native Android German speech recognition (`de-DE`).
  - **Dual Submission**: 3-second continuous silence auto-evaluator + "Done Speaking" action button.
  - Word accuracy matching and celebration audio chimes.

### 2. Match the Pairs Question Type (`match_pairs`)
- Build a dedicated `MatchPairsWidget` within `QuizTakeScreen`:
  - Left column: Terms.
  - Right column: Definitions.
  - Interactive tap-to-connect pairing with dynamic color badges and reset capabilities.

### 3. Dedicated Quiz Review Screen
- Build `quiz_review_screen.dart` to view previous test submissions:
  - Displays user's selected answers vs correct answers.
  - Shows trainer explanations for each question.

### 4. Activity & Study Performance Screen
- Create `activity_screen.dart` consuming `/api/activity/summary`:
  - Show Today's study milestones.
  - Categorized weekly cards (**Today**, **Yesterday**, **Day Before Yesterday**).
  - Display daily study hours and engagement seconds.

### 5. 6-Item Pagination
- Standardize 6-item pagination across Notes, Quizzes, and Flashcard lists using pull-to-refresh and page navigation.
