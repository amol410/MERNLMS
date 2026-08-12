# DolphinCoder LMS — Flutter App Plan

> Cross-platform mobile app (Android & iOS) for the DolphinCoder LMS backend.  
> Built with Flutter, targeting a premium dark-themed UI that matches the web app's identity.

---

## 1. App Identity

| Property | Value |
|----------|-------|
| App Name | DolphinCoder |
| Package ID | com.dolphincoder.lms |
| Platforms | Android 6.0+ (API 23+), iOS 13+ |
| Theme | Dark glassmorphism — navy/slate dark base, indigo/violet accents |
| Typography | Google Fonts — **Plus Jakarta Sans** (headings), **Inter** (body) |
| State Mgmt | **Riverpod** (flutter_riverpod + riverpod_annotation) |
| Navigation | **go_router** (deep links, named routes) |
| HTTP | **Dio** with interceptors (auth token, refresh, error) |
| Storage | **flutter_secure_storage** (JWT), **shared_preferences** (settings) |

---

## 2. Design System

### Color Palette
```
Background:     #0A0F1E  (deep navy)
Surface:        #111827  (card bg)
Surface2:       #1A2235  (elevated card)
Border:         #FFFFFF12  (subtle border)
Primary:        #6366F1  (indigo)
Primary Light:  #818CF8
Accent:         #A855F7  (violet)
Success:        #10B981
Warning:        #F59E0B
Error:          #EF4444
Text Primary:   #F9FAFB
Text Secondary: #9CA3AF
Text Muted:     #4B5563
```

### Component Tokens
- **Card radius:** 16px
- **Button radius:** 12px
- **Input radius:** 12px
- **Elevation:** Shadow with primary color tint (0.1 opacity)
- **Glassmorphism:** BackdropFilter blur 12, bg white 0.05 opacity
- **Animation:** 250ms ease-out for transitions, spring for cards

### Typography Scale
```
displayLarge:  Plus Jakarta Sans  28sp  Bold
headlineMedium: Plus Jakarta Sans 22sp  SemiBold
titleLarge:    Plus Jakarta Sans  18sp  SemiBold
titleMedium:   Inter             16sp  Medium
bodyLarge:     Inter             15sp  Regular
bodyMedium:    Inter             14sp  Regular
labelLarge:    Inter             13sp  Medium
labelSmall:    Inter             11sp  Medium
```

---

## 3. Tech Stack — Full Package List

```yaml
dependencies:
  # Core
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5
  go_router: ^13.2.0

  # Network
  dio: ^5.4.3
  pretty_dio_logger: ^1.3.1

  # Storage
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.3

  # UI & Styling
  google_fonts: ^6.2.1
  flutter_animate: ^4.5.0
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  lottie: ^3.1.2

  # Video
  youtube_player_flutter: ^9.1.1     # Android
  youtube_player_ios: ^1.0.0         # iOS

  # Content Rendering
  flutter_html: ^3.0.0-beta.2        # Render note HTML content
  flutter_highlight: ^0.7.0           # Code syntax highlighting
  webview_flutter: ^4.8.0            # HTML note slide viewer

  # Quiz / Study
  circular_countdown_timer: ^0.2.3   # Quiz timer ring
  percent_indicator: ^4.2.3          # Score ring, progress

  # Forms & Interaction
  image_picker: ^1.1.2               # Avatar upload
  file_picker: ^8.0.3                # DOCX upload
  permission_handler: ^11.3.1
  url_launcher: ^6.2.7

  # Utils
  intl: ^0.19.0
  timeago: ^3.6.1
  equatable: ^2.0.5
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0

dev_dependencies:
  build_runner: ^2.4.9
  riverpod_generator: ^2.4.0
  freezed: ^2.5.2
  json_serializable: ^6.7.1
```

---

## 4. Project Structure

```
lib/
├── main.dart
├── app.dart                    # MaterialApp.router setup
├── core/
│   ├── constants/
│   │   ├── api_constants.dart  # Base URL, endpoints
│   │   └── app_constants.dart  # App-wide constants
│   ├── theme/
│   │   ├── app_theme.dart      # ThemeData (dark)
│   │   ├── app_colors.dart     # Color palette
│   │   └── app_text_styles.dart
│   ├── router/
│   │   └── app_router.dart     # go_router config
│   ├── network/
│   │   ├── dio_client.dart     # Dio instance + interceptors
│   │   └── api_exception.dart  # Error handling
│   └── utils/
│       ├── validators.dart
│       └── extensions.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── auth_repository.dart
│   │   │   └── models/user_model.dart
│   │   ├── providers/
│   │   │   └── auth_provider.dart
│   │   └── screens/
│   │       ├── splash_screen.dart
│   │       ├── onboarding_screen.dart
│   │       ├── login_screen.dart
│   │       └── register_screen.dart
│   │
│   ├── dashboard/
│   │   └── screens/
│   │       └── dashboard_screen.dart
│   │
│   ├── notes/
│   │   ├── data/
│   │   │   ├── notes_repository.dart
│   │   │   └── models/note_model.dart
│   │   ├── providers/
│   │   │   └── notes_provider.dart
│   │   └── screens/
│   │       ├── notes_screen.dart
│   │       └── note_detail_screen.dart
│   │
│   ├── videos/
│   │   ├── data/
│   │   │   ├── videos_repository.dart
│   │   │   └── models/video_model.dart
│   │   ├── providers/
│   │   │   └── videos_provider.dart
│   │   └── screens/
│   │       ├── videos_screen.dart
│   │       └── video_detail_screen.dart
│   │
│   ├── quizzes/
│   │   ├── data/
│   │   │   ├── quiz_repository.dart
│   │   │   └── models/
│   │   │       ├── quiz_model.dart
│   │   │       └── attempt_model.dart
│   │   ├── providers/
│   │   │   └── quiz_provider.dart
│   │   └── screens/
│   │       ├── quizzes_screen.dart
│   │       ├── quiz_detail_screen.dart
│   │       ├── quiz_take_screen.dart
│   │       └── quiz_result_screen.dart
│   │
│   ├── flashcards/
│   │   ├── data/
│   │   │   ├── flashcard_repository.dart
│   │   │   └── models/flashcard_model.dart
│   │   ├── providers/
│   │   │   └── flashcard_provider.dart
│   │   └── screens/
│   │       ├── flashcards_screen.dart
│   │       └── study_screen.dart
│   │
│   └── profile/
│       └── screens/
│           └── profile_screen.dart
│
└── shared/
    ├── widgets/
    │   ├── glass_card.dart         # Glassmorphism container
    │   ├── gradient_button.dart    # Primary CTA button
    │   ├── app_text_field.dart     # Styled input field
    │   ├── subject_badge.dart      # Subject/topic pill
    │   ├── shimmer_loader.dart     # Loading skeletons
    │   ├── empty_state.dart        # No-content illustration
    │   └── bottom_nav.dart         # Persistent bottom nav
    └── hooks/
        └── use_debounce.dart
```

---

## 5. Screens Inventory (20 screens)

### Auth Flow (4 screens)
| # | Screen | Route | Auth Required |
|---|--------|-------|---------------|
| 1 | Splash | `/` | No |
| 2 | Onboarding | `/onboarding` | No |
| 3 | Login | `/login` | No |
| 4 | Register | `/register` | No |

### Main App — Bottom Nav (5 tabs)
| Tab | Screen | Route |
|-----|--------|-------|
| 1 | Dashboard / Home | `/home` |
| 2 | Notes | `/notes` |
| 3 | Quizzes | `/quizzes` |
| 4 | Flashcards | `/flashcards` |
| 5 | Profile | `/profile` |

### Nested Screens
| # | Screen | Route | Auth Required |
|---|--------|-------|---------------|
| 6 | Note Detail | `/notes/:id` | Yes |
| 7 | Videos List | `/videos` | No |
| 8 | Video Detail | `/videos/:id` | No |
| 9 | Quiz Detail | `/quizzes/:id` | Yes |
| 10 | Quiz Take | `/quizzes/:id/take` | Yes |
| 11 | Quiz Results | `/quizzes/:id/result` | Yes |
| 12 | Flashcard Study | `/flashcards/:id/study` | Yes |
| 13 | Settings | `/settings` | Yes |

---

## 6. API Integration Map

### Base URL
```
Production: https://api.dolphincoder.com/api
Local:      http://localhost:5000/api
```

### Auth Header
```
Authorization: Bearer <jwt_token>
```

### Endpoints Used by App

#### Auth
```
POST /auth/register    → Register new student
POST /auth/login       → Login, returns { token, user }
GET  /auth/me          → Get current user
PUT  /auth/profile     → Update name/bio/avatar
PUT  /auth/password    → Change password
```

#### Subjects (dropdown data)
```
GET  /subjects         → List all subjects + topics (public)
```

#### Notes
```
GET    /notes          → List notes (params: q, tag, subject, topic, page, limit)
GET    /notes/:id      → Note detail with HTML content
```

#### Videos
```
GET    /videos         → List videos (params: q, tag, page)
GET    /videos/:id     → Video detail (increments view count)
```

#### Quizzes
```
GET    /quizzes           → List quizzes (params: q, subject, topic, tag, page)
GET    /quizzes/:id       → Quiz detail with questions (no correct answers)
POST   /quizzes/:id/attempt → Submit answers { answers: [{questionId, selectedIndex}] }
GET    /quizzes/:id/attempts → My attempts history
```

#### Flashcards
```
GET    /flashcards          → List decks (own + public)
GET    /flashcards/:id      → Deck with all cards
GET    /flashcards/:id/progress  → My study progress
POST   /flashcards/:id/progress  → Save progress
```

#### Profile
```
PUT   /auth/profile   → { name, bio, avatar }
PUT   /auth/password  → { currentPassword, newPassword }
```

---

## 7. Key UX Flows

### Student Flow
```
Splash → Login → Dashboard
Dashboard → Notes → Note Detail (HTML rendered)
Dashboard → Videos → Video Detail (YouTube player)
Dashboard → Quizzes → Quiz Detail → Take Quiz → Results → Retake
Dashboard → Flashcards → Study Mode (flip cards + self-rating)
Dashboard → Profile → Edit Profile / Change Password
```

### Navigation Architecture
```
ShellRoute (bottom nav)
├── /home       → DashboardScreen
├── /notes      → NotesScreen
│   └── /notes/:id → NoteDetailScreen
├── /quizzes    → QuizzesScreen
│   ├── /quizzes/:id → QuizDetailScreen
│   ├── /quizzes/:id/take → QuizTakeScreen (full screen, no nav)
│   └── /quizzes/:id/result → QuizResultScreen
├── /flashcards → FlashcardsScreen
│   └── /flashcards/:id/study → StudyScreen (full screen)
└── /profile    → ProfileScreen
    └── /settings → SettingsScreen

Floating access:
/videos        → VideosScreen (from dashboard card or profile menu)
/videos/:id    → VideoDetailScreen
```

---

## 8. Screen-by-Screen Design Specs

### S1 — Splash Screen
- Full-screen dark gradient `#0A0F1E → #0F172A`
- Centered animated logo: dolphin icon + "DolphinCoder" wordmark
- Pulsing glow animation (indigo, 2s loop)
- After 2s: check JWT → navigate to Login or Dashboard

### S2 — Onboarding (3 slides, PageView)
- Slide 1: 📚 "Learn Smarter" — illustration, description
- Slide 2: 🧠 "Test Yourself" — quiz preview illustration
- Slide 3: 🃏 "Master with Flashcards" — card flip illustration
- Dot indicator + Next/Skip buttons + "Get Started" on last slide
- Parallax scroll effect on illustrations

### S3 — Login Screen
- Top: DolphinCoder logo (small)
- Glassmorphic card: email + password fields
- "Forgot Password" link (future)
- Primary gradient "Login" button
- "Don't have an account? Register" link
- Error snackbar on 401

### S4 — Register Screen
- Name + Email + Password fields
- Password strength indicator
- Primary "Create Account" button
- Redirect to Login link

### S5 — Dashboard
- Header: "Good morning, {name} 👋" + avatar
- Stats row: 4 mini-cards (notes, videos, quizzes, flashcard decks count)
- Section: "Continue Learning" — recent quiz attempt in progress
- Section: "Recent Notes" — horizontal scroll cards (3)
- Section: "Quick Quiz" — random published quiz card
- Section: "Flashcard Decks" — 2 recent decks
- FAB or bottom sheet: Videos shortcut

### S6 — Notes Screen
- Search bar at top
- Subject filter chips (horizontal scroll)
- Topic filter dropdown (appears when subject selected)
- Masonry grid of note cards
- Each card: color-accented left border, title, subject badge, date
- Pin indicator (yellow pin icon)
- Pull-to-refresh

### S7 — Note Detail Screen
- Full screen scroll
- Header: color accent top bar, title, subject/topic badges
- Content: flutter_html renders rich HTML content
- For HTML type: WebView in 16:9 container with fullscreen toggle
- Tags row at bottom
- Back button with hero animation

### S8 — Videos Screen
- Search bar
- Grid 2-column YouTube thumbnail cards
- Each card: thumbnail (cached), title, view count, duration badge
- Subject/topic chips filter

### S9 — Video Detail Screen
- YouTube player (16:9, auto-play)
- Below: title, view count, description
- Tags
- Subject/topic badges

### S10 — Quizzes Screen
- Search + Subject/Topic filter bar
- Grid cards: brain icon, subject badge, topic badge, title, question count, pass score, time limit
- Difficulty chip (Easy/Medium/Hard based on question count)
- "Take Quiz" primary button on each card

### S11 — Quiz Detail Screen
- Header: quiz title, subject, topic
- Info grid: questions, time limit, pass score, attempts
- Previous attempts list (score chips)
- Large "Start Quiz" button
- Rules / instructions collapsed section

### S12 — Quiz Take Screen (Full Screen — no bottom nav)
- Top bar: quiz title + timer (countdown ring, red < 60s)
- Progress bar (current/total)
- Question card: question text + (for code-mcq: syntax-highlighted code)
- Options: radio-style selection cards (purple when selected)
- "Mark for Review" toggle (orange flag)
- Navigation: Prev / Next buttons
- Question navigator bottom sheet: color-coded grid
- Submit FAB with confirmation dialog

### S13 — Quiz Results Screen
- Circular score ring (animated, colored by pass/fail)
- Pass/Fail badge + percentage
- Stats: correct, wrong, skipped, time taken
- Full question review list (accordion):
  - Green = correct, Red = wrong
  - Show correct answer + explanation
- "Retake Quiz" button
- "Back to Quizzes" button

### S14 — Flashcards Screen
- Grid of deck cards
- Each card: gradient bg (by deck color), emoji, deck name, card count
- "Study" button

### S15 — Study Screen (Full Screen — no bottom nav)
- Large flip card (3D animation on tap)
  - Front: Question text
  - Back: Answer text + hint (if tapped 💡)
- Progress bar + "X / Y cards" counter
- Bottom: "Still Learning" (red) / "Got It" (green) buttons
- Navigation: swipe or arrow buttons
- Completion screen: mastery % ring + confetti animation

### S16 — Profile Screen
- Large avatar (initials fallback) with edit button
- Name, email, role badge
- Stats: quizzes taken, notes read, flashcards mastered
- Menu items: Edit Profile, Change Password, Videos, Settings, Logout
- Version number at bottom

### S17 — Edit Profile Screen
- Avatar upload (image_picker)
- Name text field
- Bio text field (multiline)
- Save button

### S18 — Change Password Screen
- Current Password + New Password + Confirm Password
- Password visibility toggles
- Save button

### S19 — Settings Screen
- Notifications toggle (future)
- API Base URL field (for dev/staging switch)
- App version info
- Clear cache button
- Rate app (url_launcher to store)

### S20 — Empty / Error States
- Custom illustrated empty states per section
- Retry button on network errors
- Offline banner (connectivity_plus)

---

## 9. Shared Widget Catalog

| Widget | Description |
|--------|-------------|
| `GlassCard` | BackdropFilter blur card with border |
| `GradientButton` | Indigo→violet gradient, rounded, animated press |
| `AppTextField` | Dark-styled input with label, error, prefix icon |
| `SubjectBadge` | Purple pill for subject name |
| `TopicBadge` | Blue pill for topic name |
| `ShimmerLoader` | Skeleton loaders for lists/grids |
| `EmptyState` | Icon + title + subtitle + optional CTA |
| `ScoreRing` | Animated circular score indicator |
| `FlipCard` | 3D flip animation widget |
| `QuestionNavigator` | Color-coded question grid |
| `NoteCard` | Color-bordered note card |
| `QuizCard` | Brain gradient quiz card |
| `DeckCard` | Gradient flashcard deck |
| `VideoCard` | YouTube thumbnail card |

---

## 10. Offline & Error Handling

- **JWT expiry:** Dio interceptor catches 401 → auto-logout + redirect to login
- **No network:** Show offline banner (connectivity_plus), cached data via in-memory Riverpod state
- **Pull-to-refresh:** All list screens
- **Pagination:** Infinite scroll (load more on scroll end) for notes/quizzes/videos
- **Error snackbars:** Consistent `AppSnackbar.error(message)` utility

---

## 11. Android-Specific

- `minSdkVersion 23`
- `compileSdkVersion 34`
- Internet permission in `AndroidManifest.xml`
- YouTube player uses `youtube_player_flutter` (WebView-based)
- File picker for DOCX (future trainer feature)
- Adaptive icon (foreground + background layers)
- Splash screen via `flutter_native_splash`

---

## 12. iOS-Specific

- `iOS Deployment Target: 13.0`
- Info.plist: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- YouTube player uses `youtube_player_ios`
- Safe area handling throughout (notch/Dynamic Island)
- App icon set (1024×1024 base)

---

## 13. Development Phases

### Phase 1 — Foundation (Week 1)
- [ ] Flutter project setup (`flutter create dolphincoder`)
- [ ] Theme, colors, typography
- [ ] Dio client + auth interceptor
- [ ] go_router with guards
- [ ] Shared widgets (GlassCard, GradientButton, AppTextField)
- [ ] Splash + Login + Register screens

### Phase 2 — Core Content (Week 2)
- [ ] Dashboard screen
- [ ] Notes list + detail
- [ ] Videos list + detail (YouTube player)
- [ ] Bottom navigation shell

### Phase 3 — Learning Features (Week 3)
- [ ] Quizzes list + detail + take + results
- [ ] Flashcards list + study mode

### Phase 4 — Polish (Week 4)
- [ ] Profile + edit + change password
- [ ] Empty states, error handling, shimmer loaders
- [ ] Pull-to-refresh, infinite scroll
- [ ] Animations (flutter_animate)
- [ ] App icon + splash screen
- [ ] Android build + iOS build testing

---

## 14. Build & Release

### Android APK / AAB
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS IPA
```bash
flutter build ios --release
```

### Environment Config
Use `--dart-define` for API URL:
```bash
flutter run --dart-define=API_BASE_URL=https://api.dolphincoder.com/api
```

---

## 15. API Response Shapes (Reference)

### User
```json
{ "_id": 1, "name": "John", "email": "john@example.com", "role": "student", "avatar": null, "bio": "" }
```

### Note
```json
{ "_id": 1, "title": "Python Basics", "content": "<p>...</p>", "contentType": "richtext",
  "subjectId": 2, "topic": "Variables", "tags": ["python"], "color": "blue",
  "isPinned": false, "subject": { "id": 2, "name": "Python" }, "createdAt": "..." }
```

### Quiz
```json
{ "_id": 1, "title": "Python Quiz", "description": "...", "subjectId": 2, "topic": "Lists",
  "questions": [{ "_id": 0, "text": "What is...", "type": "multiple-choice",
  "options": ["A","B","C","D"] }],
  "passingScore": 70, "timeLimit": 30, "totalPoints": 10,
  "subject": { "id": 2, "name": "Python" } }
```

### Flashcard Deck
```json
{ "_id": 1, "deckName": "Python Terms", "description": "...", "color": "blue",
  "cards": [{ "_id": "abc", "front": "What is a list?", "back": "A mutable sequence", "hint": "Think of arrays" }],
  "cardCount": 15, "isPublic": true }
```

### Quiz Submit Body
```json
{ "answers": [{ "questionId": 0, "selectedIndex": 2 }], "timeTaken": 240 }
```

### Quiz Attempt Response
```json
{ "score": 8, "maxScore": 10, "percentage": 80, "passed": true,
  "answers": [{ "questionId": 0, "selectedIndex": 2, "correct": true, "correctIndex": 2, "explanation": "..." }] }
```
