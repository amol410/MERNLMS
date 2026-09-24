# DolphinCoder LMS — Native Android App (Kotlin)

## Overview

A native Android app for the DolphinCoder LMS platform, replicating all features of the Flutter app and adding more polished, platform-native UI patterns. Built with **Kotlin**, **Jetpack Compose**, and the existing **REST API** backend (same endpoints, Bearer token auth).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Kotlin (100%) |
| UI | Jetpack Compose + Material Design 3 |
| Architecture | MVVM + Clean Architecture |
| Navigation | Navigation Compose |
| DI | Hilt (Dagger) |
| Networking | Retrofit 2 + OkHttp3 |
| JSON | Gson |
| Auth Storage | EncryptedSharedPreferences |
| Image Loading | Coil |
| Video Playback | Media3 (ExoPlayer) |
| Async | Kotlin Coroutines + Flow |
| State | StateFlow + ViewModel |
| Build | Gradle (KTS) |
| Min SDK | 26 (Android 8.0) |
| Target SDK | 35 (Android 15) |

---

## Project Structure

```
android/
├── app/
│   ├── src/main/java/com/dolphincoder/lms/
│   │   ├── core/
│   │   │   ├── network/          # Retrofit, OkHttp, interceptors
│   │   │   ├── data/             # Base repository, Result wrapper
│   │   │   ├── di/               # Hilt modules
│   │   │   ├── theme/            # Color, Typography, Shape, Theme
│   │   │   └── utils/            # Extensions, formatters, constants
│   │   ├── features/
│   │   │   ├── auth/             # Login, Register, Splash, Onboarding
│   │   │   ├── dashboard/        # Home screen
│   │   │   ├── quizzes/          # Quiz list, detail, take, result
│   │   │   ├── notes/            # Notes list, note detail
│   │   │   ├── flashcards/       # Deck list, study mode
│   │   │   ├── videos/           # Video list, video player
│   │   │   └── profile/          # Profile, settings, edit, password
│   │   ├── shared/
│   │   │   ├── components/       # Reusable composables
│   │   │   └── navigation/       # NavGraph, Routes, BottomBar
│   │   └── MainActivity.kt
│   ├── res/
│   │   ├── drawable/             # Icons, splash, logo
│   │   ├── values/               # Strings, legacy colors
│   │   └── xml/                  # Network config, backup rules
│   └── AndroidManifest.xml
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── keystore/
│   └── release.jks
├── plan.md
└── screens.md
```

---

## Feature Modules

### 1. Authentication
- **Splash Screen** — Animated logo reveal (Canvas animation), auto-redirect on token check
- **Onboarding** — 3-screen swipeable HorizontalPager with skip button
- **Login** — Email + Password, Google Sign-In, Forgot Password link
- **Register** — Name, Email, Password, Confirm Password fields
- **Token Management** — JWT in EncryptedSharedPreferences, auto-attached via OkHttp interceptor
- **Auto-logout** — 401 interceptor clears token, navigates to Login

### 2. Bottom Navigation (5 tabs)
- Home, Quizzes, Notes, Flashcards, Profile
- Material 3 NavigationBar with filled/outline icon pairs
- No excessive ripple — M3 default standard behavior

### 3. Dashboard (Home)
- Welcome banner with user first name + greeting (morning/evening)
- 4 stat cards: Quizzes Taken, Pass Rate, Notes Read, Decks Studied
- Recent Attempts section: last 3 quiz attempts with score badges
- Quick action buttons: Start Quiz, Browse Notes, Study Flashcards
- Pull-to-refresh

### 4. Quizzes
**List:** Search, subject filter chips, quiz cards with all metadata, Take Quiz button
**Detail:** Info grid, previous 2 attempts, Start Quiz button
**Take Quiz:** Timer, progress bar, option tiles, mark for review, question navigator sheet (7/row), submit dialog
**Result:** Score ring, pass/fail badge, stat mini cards, full question review with explanations, retake button

### 5. Notes
**List:** Search, subject/topic chips, 2-column grid with colored left border
**Detail:** Title, subject badge, date; WebView renderer for richtext/html/docx content types; fullscreen toggle for html slides

### 6. Flashcards
**Deck List:** 2-column gradient cards, card count, private lock icon
**Study Mode:** 3D flip animation (graphicsLayer rotationY), front/back cards, hint button, self-rating, completion screen with mastery %

### 7. Videos
**List:** 2-column grid with Coil thumbnails, play overlay, view count
**Player:** Media3 ExoPlayer, fullscreen landscape lock, title, description, tags

### 8. Profile
- Avatar with initials + gradient
- Stats row (Quizzes, Passed, Decks)
- Menu: Edit Profile, Change Password, Settings, Logout
- Edit Profile, Change Password, Settings (theme toggle, app version, links)

---

## Architecture

```
UI (Compose Screen)
    ↕ observes StateFlow / collectAsStateWithLifecycle
ViewModel
    ↕ calls suspend functions
Repository Interface
    ↕ implemented by
RepositoryImpl
    ↕ calls
Retrofit API / EncryptedPrefs / DataStore
```

### UiState wrapper
```kotlin
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
```

---

## Navigation Structure

```
NavHost
├── AuthGraph (fullscreen, no bottom bar)
│   ├── splash
│   ├── onboarding
│   ├── login
│   └── register
└── MainGraph (ScaffoldWithBottomBar)
    ├── home
    ├── quizzes/{quizId}/detail
    ├── quizzes/{quizId}/take
    ├── quizzes/{quizId}/result
    ├── notes/{noteId}
    ├── flashcards/{deckId}/study
    ├── videos/{videoId}
    ├── profile/edit
    ├── profile/password
    └── settings
```

---

## Gradle Dependencies (app/build.gradle.kts)

```kotlin
// Compose BOM
implementation(platform("androidx.compose:compose-bom:2024.09.00"))
implementation("androidx.compose.ui:ui")
implementation("androidx.compose.material3:material3")
implementation("androidx.compose.material:material-icons-extended")
implementation("androidx.activity:activity-compose:1.9.2")

// Navigation
implementation("androidx.navigation:navigation-compose:2.8.1")

// Hilt
implementation("com.google.dagger:hilt-android:2.51.1")
ksp("com.google.dagger:hilt-compiler:2.51.1")
implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

// Retrofit + OkHttp
implementation("com.squareup.retrofit2:retrofit:2.11.0")
implementation("com.squareup.retrofit2:converter-gson:2.11.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

// Lifecycle
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")
implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.5")

// DataStore
implementation("androidx.datastore:datastore-preferences:1.1.1")

// Security
implementation("androidx.security:security-crypto:1.1.0-alpha06")

// Coil
implementation("io.coil-kt:coil-compose:2.7.0")

// Media3
implementation("androidx.media3:media3-exoplayer:1.4.1")
implementation("androidx.media3:media3-ui:1.4.1")

// Lottie
implementation("com.airbnb.android:lottie-compose:6.5.2")

// Splash
implementation("androidx.core:core-splashscreen:1.0.1")

// Accompanist (pager for onboarding)
implementation("com.google.accompanist:accompanist-pager:0.36.0")
```

---

## Development Phases

### Phase 1 — Foundation (Week 1)
- [ ] Gradle KTS project setup, Hilt, Compose enabled
- [ ] Theme: dark colors, typography (Inter + Plus Jakarta Sans via downloadable fonts), shapes
- [ ] Core network layer: Retrofit singleton, AuthInterceptor, 401 interceptor
- [ ] Auth module: Login, Register, Splash, token storage
- [ ] Onboarding screen (HorizontalPager)
- [ ] Bottom navigation shell with nested NavGraph

### Phase 2 — Quizzes (Week 2)
- [ ] Dashboard screen with stat cards and recent attempts
- [ ] Quiz list screen: search, filter chips, quiz cards
- [ ] Quiz detail screen: info grid, previous attempts
- [ ] Quiz take screen: timer, options, mark for review
- [ ] Question navigator bottom sheet (7 per row)
- [ ] Quiz result screen: score ring, review answers

### Phase 3 — Content Screens (Week 3)
- [ ] Notes list + Note detail with WebView renderer
- [ ] Flashcard deck list with gradient cards
- [ ] Flashcard study mode with 3D flip animation
- [ ] Videos list with Coil thumbnails
- [ ] Video player with Media3 ExoPlayer

### Phase 4 — Profile & Polish (Week 4)
- [ ] Profile, Edit Profile, Change Password, Settings
- [ ] Shimmer loading states across all screens
- [ ] Empty state screens with illustrations
- [ ] Pull-to-refresh on all list screens
- [ ] Pagination / infinite scroll
- [ ] Error handling with retry

### Phase 5 — Release (Week 5)
- [ ] ProGuard/R8 rules
- [ ] Signed AAB build
- [ ] Firebase Crashlytics integration
- [ ] Firebase Analytics
- [ ] Play Store listing assets
- [ ] Internal testing track upload

---

## API Notes

- Base URL: same as Flutter app backend
- All requests need: `Authorization: Bearer <jwt_token>`
- Token stored in EncryptedSharedPreferences key: `auth_token`
- On 401: clear token + navigate to login (OkHttp Authenticator or Interceptor)
- No backend changes needed — same REST endpoints work for both Flutter and native Android
