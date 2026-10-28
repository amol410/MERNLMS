# android.md — Agent Context & Synchronization Guide for the Flutter Mobile App

> **Purpose:** Comprehensive onboarding and technical specification for coding agents and engineers working in
> `app/dolphincoder/` (the Flutter mobile client for Android and iOS).
> Documents existing architecture, Riverpod state models, navigation, network client, native Android Kotlin bridges,
> speech recognition lifecycles, and synchronization with web releases.
> Verified against active source on 2026-10-28.
>
> **Rules of engagement for agents:**
> 1. The mobile app is located in `app/dolphincoder/` (the root `android/` directory contains legacy planning artifacts).
> 2. State management is **Riverpod 2** using hand-written `StateNotifier`s, `AsyncNotifier`s, and `FutureProvider.family`.
> 3. Navigation is **GoRouter 13.2** with token-checking redirects and a 5-tab shell route. Session tokens live in `flutter_secure_storage` (`tokenKey`), with $O(1)$ in-memory caching in `DioClient`.
> 4. Do NOT modify any Flutter code until instructed. Update documentation first.
> 5. Never touch or reference the legacy `app/appit/` folder.

---

## 1. What This Is

**DolphinCoder Mobile Client (LingoDolphy)** (`pubspec` package: `dolphincoder`, version: `1.2.12+18` / submodule: `889662b` / production release: `v33.0.0-stable`) — A native, dark-themed Material 3 mobile application for Android (SDK 23+, tested through Android 14 / API 34) and iOS, serving as the high-fidelity student companion for [dolphincoder.com](https://dolphincoder.com).

### Feature Comparison Matrix (Web vs Mobile Status)

| Feature Domain | Web LMS Status | Flutter Mobile Status (`v1.2.12+18`) | Synchronization Status |
|---|---|---|---|
| **Authentication** | Login, Register, Profile, Password, Roles | Login, Register, Profile, Password, 2-Step Course Picker | ✅ Parity achieved |
| **Dashboard** | Stat cards, Today's Performance (countsOnly), Activity history | Stat cards, Today's Performance Card, History link | ✅ Parity achieved (`/api/activity/summary`) |
| **Notes** | Richtext, DOCX, HTML slides, **Karaoke Audio Reader** | Richtext, DOCX, HTML, **Karaoke Reader & Sprechen Mode** | ✅ Parity achieved (`audioplayers` & `speech_to_text`) |
| **Quizzes** | MCQ, True/False, Code-MCQ, **Match Pairs**, **Quiz Review** | MCQ, Code, **3D MatchPairsWidget**, **QuizReviewScreen** | ✅ Parity achieved (`/quizzes/:id/review`) |
| **Flashcards** | Decks, 3D flip card study, mastery score | Decks, 3D flip card study, mastery score | ✅ Parity achieved |
| **Videos** | YouTube embeds, view count, tags | YouTube player in WebView | ✅ Parity achieved |
| **Activity History**| `/activity` with localized Day categories & Daily hours | `ActivityHistoryScreen` with Daily hours & Categories | ✅ Parity achieved (`/activity`) |
| **Pagination** | 6-item pagination across lists | 6-item pagination across Notes & Quizzes | ✅ Parity achieved |
| **Lingo Archipelago** | `/lingodolphy` with 8 stages, 105 units, English A1 (Hindi/Marathi) | Archipelago map, 8 stages, JIT loading, Course switcher | ✅ Parity achieved (`/api/gamification/*`) |
| **Speech Lifecycle** | Continuous Web Speech API with 3s silence detector | **5-Phase Lifecycle** (Idle, Armed, Listening, Processing, Evaluated) | ✅ Parity achieved with native bridge |
| **Speech Fallback** | Browser engine fallback | **3-Tier Engine Fallback** (Google $\to$ OEM $\to$ Default platform) | ✅ Mobile-native advantage |
| **Visual Polish** | CSS animations & Web Audio synth chimes | Animated sound ripples & **Celebratory Confetti Shower** | ✅ Mobile-native advantage |
| **Audio-Haptics** | Web Audio API chimes | System haptics + synchronized sound cues (`SoundEffectsService`) | ✅ Mobile-native advantage |
| **Monetization** | AdMob crawler verification (`/app-ads.txt`) | Verified Google AdMob SDK (Banner, Interstitial, Rewarded) | ✅ Full production monetization |

---

## 2. Run & Build Commands

```bash
cd app/dolphincoder
flutter pub get
flutter run                    # Debug mode (defaults to https://dolphincoder.com/api)
flutter build apk --release    # Production Android APK
flutter build appbundle        # Production Google Play App Bundle (.aab)
```

- **API Base URL**: `lib/core/constants/api_constants.dart`.
  - Default URL: `https://dolphincoder.com/api` (proxied to backend port 5000).
  - Dedicated mobile URL: `https://api.dolphincoder.com/api`.
  - Local Android emulator testing: `http://10.0.2.2:5000/api`.

---

## 3. Key Architecture Implementations

### 3.1 Native Android Speech Recognition Bridge (`MainActivity.kt`)
- **MethodChannel**: `com.dolphincoder.lms/speech_lifecycle`
- **3-Tier Speech Engine Fallback**:
  1. `Tier 1`: `com.google.android.googlequicksearchbox` (Google App ASR).
  2. `Tier 2`: OEM Recognition Service (`com.samsung.android.bixby.agent`, `com.miui.voiceassist`, etc.).
  3. `Tier 3`: Generic default platform `SpeechRecognizer.createSpeechRecognizer(this)`.
- **Reflective Teardown**: Nullifies `speechRecognizer` field inside `SpeechToTextPlugin` on `onDestroy`, `onPause`, and `onStop` to eliminate Android Binder death (`DEAD_OBJECT`) and `AudioRecord` leaks.
- **Audio Becoming Noisy**: Listens for `AudioManager.ACTION_AUDIO_BECOMING_NOISY` to auto-pause audio when headphones are unplugged.
- **Bluetooth SCO**: Automatically routes speech input to Bluetooth headsets when connected.

### 3.2 5-Phase Speech State Machine (`SpeechRecognitionService`)
- Enforces state progression: `Idle` $\to$ `Armed` $\to$ `Listening` $\to$ `Processing` $\to$ `Evaluated`.
- Gated double-tap submission preventing race conditions.
- Broadcasts real-time normalized RMS audio levels for animated sound ripples.
- Displays celebratory confetti shower (`ConfettiWidget`) upon passing pronunciation challenges ($\ge 75\%$).

### 3.3 Google AdMob Monetization (`AdService`)
- Production Ad Units:
  - App Open: `ca-app-pub-6038618318911032/8348873402`
  - Banner: `ca-app-pub-6038618318911032/6281729064`
  - Interstitial: `ca-app-pub-6038618318911032/5691039801` (Triggered every 3 completed lessons)
  - Rewarded Video: `ca-app-pub-6038618318911032/2144704383` (Awards +2 Oxygen Bubbles, max 6/day)
- Fully aligned with backend `/api/gamification/claim-ad-reward` and crawler verification `/app-ads.txt`.
