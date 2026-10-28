# DolphinCoder LMS — Comprehensive Features Reference

A complete feature inventory and technical breakdown of the DolphinCoder Learning Management System (Web and Mobile).

---

## 🐬 1. Platform & User Experience
- **Brand Identity**: Rebranded from SpeedUpExam to **DolphinCoder** across the entire web application, mobile clients, headers, and metadata.
- **Responsive Dark Theme**: Modern glassmorphism UI designed with deep ocean hues (`#0A0F1E`), gradient accents, and Tailwind CSS.
- **Landing Page**: Animated background orbs, live stats section, interactive feature preview cards, and call-to-action flows.
- **Role-Based Access Control (RBAC)**:
  - `student`: Access to all published notes, videos, quizzes, flashcards, karaoke reading, and personal activity tracking.
  - `trainer`: Full student permissions plus authoring, editing, deleting, and bulk-uploading content.
  - `admin`: Full system access, user role promotion/demotion, account activation toggling, and administrative control.

---

## 🎤 2. Interactive Karaoke Notes & Sprechen (Speaking Practice) Mode
An immersive language-learning and audio-reading engine located at `/notes/karaoke/demo` and integrated into `/notes/:id`.

### Audio-Text Synchronization
- **Word-Level Timing**: Real-time highlighting of individual German words as native audio plays.
- **Playback Tempo Controls**: Configurable playback speeds (0.75x default for Sprechen mode, 1.0x, and 1.25x).
- **Real-Time Sync Offset Adjuster**: Interactive timing adjusters (-0.25s, 0s, +0.25s) allowing students to recalibrate audio/text sync dynamically for any device latency.
- **Translations & Vocabulary**:
  - English sentence translations rendered directly below each German sentence with a toggle visibility button.
  - **Understanding-Only Constraint**: English translations serve strictly as a static comprehension reference; they are **never spoken aloud via audio/TTS** and **never interrupt with popups**.
  - Interactive vocabulary words with inline tooltip popups showing word meanings, translations, and grammatical types.
- **Database-Backed Audio Storage**:
  - Audio files stored directly in MySQL (`karaoke_audios` table) as `LONGBLOB` data.
  - Full HTTP 206 Partial Content range-seeking support (`/api/notes/audio/db/:id`), eliminating audio file loss on ephemeral or shared server filesystems.
- **JSON Alignment Import & English Script Upload**:
  - Built-in tool to download structured JSON templates.
  - Multi-source alignment loader supporting JSON timestamps plus optional English script upload (`.txt` / `.json`) or line-by-line pasting to map English meaning to every sentence.
  - Normalizes alignments while permanently preserving original audio stream bindings.

### Sprechen (Speaking Practice) Mode
- **Dual Mode Toggle**: One-click toggle between continuous **Listening Mode** (plays uninterrupted from start to finish) and **Sprechen Practice Mode** (guided sentence-by-sentence training).
- **Sentence-Boundary Auto-Pause**:
  - Audio plays the sentence at 0.75x speed and automatically pauses cleanly at the end of the sentence to open the speaking challenge.
  - Synchronous boundary detection prevents race conditions or audio stalling across sentence transitions.
- **Continuous Speech Recognition (`de-DE`)**:
  - Web Speech API integration (Web) and `speech_to_text` with `ListenMode.dictation` (Android Mobile), allowing natural pauses without premature microphone cutoffs.
- **Dual Submission Mechanism**:
  - **Trigger 1 (Automatic)**: Automatically submits and evaluates speech after **3 seconds of continuous silence**.
  - **Trigger 2 (Manual)**: Prominent, vibrant **"Done Speaking (Check Now ✓)"** button allows instant submission without waiting.
- **Static Meaning Reference**:
  - Clean subtitle box (`Meaning: ...`) directly in the active speaking prompt, allowing students to comprehend what they are speaking without disruptive popups or sound.
- **Pronunciation Evaluation Engine**:
  - Word-level fuzzy matching algorithm evaluates German pronunciation against the target sentence.
  - Live feedback shows matched words in green and mispronounced words in amber/strikethrough.
  - Pass threshold set at **≥75% accuracy**.
- **Interactive Audio & Visual Feedback**:
  - **Celebration Chimes**: Synthesized C-major chord arpeggio via Web Audio API on successful pronunciation.
  - **Retry Chimes**: Low harmonic tone on unsuccessful attempts.
  - **3-Chance Counter**: Visual chance counter per sentence. Students have 3 attempts before being prompted to listen again or proceed.
  - **Autoplay Handling**: Automatic progression to subsequent sentences with user-gesture fallback handling.

---

## 📝 3. Rich Text, DOCX, and HTML Slide Notes
- **Tiptap Rich Text Editor**: Heading levels (H1–H3), bold, italic, underline, blockquotes, ordered/unordered lists, code blocks, horizontal rules, and custom accent colors.
- **DOCX Import**: Instant conversion of Microsoft Word documents into styled notes via server-side `mammoth` parsing.
- **HTML Slide Viewer (16:9 Presentation Mode)**:
  - Upload self-contained HTML/CSS/JS slide files.
  - Embedded in an isolated sandboxed iframe (`allow-scripts`).
  - Fullscreen toggle button for full-screen classroom presentation.
  - **In-Page Anchor Navigation Fix**: Injects client-side smooth-scroll interceptor script inside iframe `srcdoc`, intercepting `#hash` anchor clicks and preventing `about:srcdoc` blank screen navigation.
- **Categorization & Filtering**:
  - Color accents: Default, Blue, Green, Yellow, Pink, Purple.
  - Pinning / unpinning important notes to the top of the list.
  - Tagging system with tag-based filtering and instant search.
- **6-Item Pagination**: Notes list renders with a 6-item pagination control for fast, organized browsing.

---

## 🧠 4. Quizzes & Timed Assessments
- **Diverse Question Types**:
  1. **Multiple Choice (MCQ)**: Standard 4-option single-answer questions with explanations.
  2. **True / False**: Quick concept validation questions.
  3. **Code Snippet Questions (`code-mcq`)**: Syntax-highlighted code blocks in a 2×2 grid supporting Python, JavaScript, Java, SQL, C++, and PHP.
  4. **Match the Pairs (`match_pairs`)**:
     - Interactive side-by-side matching columns (Terms on left, Definitions on right).
     - Drag-and-drop / click-to-pair interface with dynamic color-coded pairing tags.
     - Supports `.docx` bulk upload formatting.
- **Bulk Upload via .docx**:
  - Upload formatted Word files to automatically generate full quizzes with questions, options, correct answers, and explanations.
- **Exam-Taking Experience**:
  - Sticky sidebar question navigator with status indicators:
    - 🟣 Purple = Current question
    - 🟢 Green = Answered
    - 🟠 Orange = Marked for review
    - ⚪ Gray = Unanswered
  - **Mark for Review**: Flag questions to revisit before final submission.
  - **Session-Preserved Countdown Timer**: Timer state saved in `sessionStorage`; page reloads do not reset the exam clock. Timer turns red when under 60 seconds.
  - **Unanswered Warning**: Confirmation modal warns students if they attempt to submit with unanswered questions.
- **Grading & Test Review**:
  - Instant automated grading with score percentage, circular progress ring, and pass/fail indicators.
  - **Dedicated Test Review Page (`/quizzes/:id/review`)**: Detailed post-submission review showing selected answers, correct answers, and full explanations.
  - **Clean Attempt Replacement**: Retaking a quiz cleanly updates and archives attempt history without orphaned records.
- **6-Item Pagination**: Quizzes list displays 6 items per page.

---

## 🃏 5. Flashcards & Spaced Learning
- **Deck Management**: Create and categorize flashcard decks with multi-stop gradient themes and subject associations.
- **Interactive 3D Study Mode**:
  - Realistic card flip animation with front (question/prompt) and back (answer/explanation).
  - Hint button on each card that **automatically resets** when navigating between cards.
  - Self-assessment ratings: **"Got It"** (marked as mastered) vs. **"Still Learning"**.
- **Progress & Mastery Tracking**:
  - Student progress saved per deck in the database.
  - Completion summary screen showing mastery percentage and circular score rings.
- **Bulk Upload via .docx**: Upload structured Word documents to populate entire decks instantly.
- **6-Item Pagination**: Flashcard decks list displays 6 items per page.

---

## 📊 6. Activity & Performance Analytics
A comprehensive engagement tracking suite connecting student study habits to actionable metrics.

### Dashboard Today's Performance
- **High-Performance Query**: Lightweight, counts-only backend endpoint (`/api/activity/summary?countsOnly=true`) that queries completed notes, quizzes, and flashcards in milliseconds.
- **Clean Overview**: Displays clear count badges and study milestones directly on the student dashboard without loading heavy historical tables.

### Dedicated Activity History Page (`/activity`)
- **Calendar-Day Categorization**:
  - Aggregates activity into distinct daily cards: **Today**, **Yesterday**, **Day Before Yesterday (Day of Week)**, and full weekly breakdowns.
  - Visual color-coded Day Category badges.
- **Daily Study Time Tracking**:
  - Displays total accumulated study time (hours and minutes) on the right side of every daily section header.
  - Accurately tracks active reading time, quiz time, and flashcard practice time.
- **Karaoke Engagement Integration**:
  - Tracks both active listening time and speaking practice time in seconds, logging sessions directly to `user_activities`.
- **Timezone Awareness**:
  - Accurately accounts for client local timezones so activities completed after UTC midnight are correctly assigned to the user's local calendar day.

---

## 📚 7. Subjects & Topics Architecture
- **Relational Data Model**:
  - Dedicated `Subject` and `Topic` Sequelize models linked to Notes and Quizzes.
- **Unified UI Selectors**:
  - Subject and Topic dropdown filters available across Notes and Quiz lists.
  - Content creation modals include hierarchical Subject → Topic selection.

---

## 🎬 8. YouTube Video Library
- Embed and organize YouTube educational videos.
- Automatic 11-character video ID extraction from standard, short, or embed URLs.
- View count tracking and search by title or tag.

---

## 📱 9. Mobile Application (Flutter Companion)
- **Codebase**: Located in `app/dolphincoder/` (`version: 1.2.6+11`).
- **Architecture**: Flutter 3, Dart, Riverpod 2 (`StateNotifier`), GoRouter navigation, Dio HTTP client with JWT interceptor.
- **Theme**: Dark Material 3 theme with Google Fonts (*Plus Jakarta Sans* & *Inter*).
- **Gamified 5-Tab Shell (`bottom_nav.dart`)**:
  - **Learn** (`/home` -> `ArchipelagoMapScreen`)
  - **Leagues** (`/leagues` -> `LeaguesScreen`)
  - **Quests** (`/quests` -> `QuestsScreen`)
  - **Shop** (`/shop` -> `ShopScreen`)
  - **Profile** (`/profile` -> `GamifiedProfileScreen`)
- **Full Parity & Robustness**:
  - **Real-Time German Lady Voice TTS (`TtsService`)**: Built-in speech synthesis (`flutter_tts`) configured with native German (`de-DE`) female voice, `0.48` speech rate, and `1.10` pitch. Pronounces German words on card tap in Word Match, on word token selection in Listen & Tap, and upon word chip picking in Sentence Builder.
  - **Karaoke & Sprechen Mode**: Mobile word-level highlight synchronized with audio, continuous speech recognition (`ListenMode.dictation`), true 3-second silence timer, and static English meaning display.
  - **Native German Speech Recognition (`de_DE`)**: Configured strictly for native German pronunciation assessment.
  - **Dynamic Stage Filtering**: Session automatically runs only enabled curriculum stages via `_activeStageTypes`.
  - **Mounted Guards & Offline Safety Nets**: Protects against asynchronous unmounted setState errors and supplies offline fallback audio/word data.
  - **Quizzes**: Support for Multiple Choice, Code Snippets, **Match the Pairs (`MatchPairsWidget`)**, and **Dedicated Quiz Review Screen (`QuizReviewScreen`)**.
  - **Dual Subject & Topic Filtering**: Dynamic horizontal topic chips row in `quizzes_screen.dart` with "All Topics" toggle.
  - **Activity History**: Localized daily tracking of study hours, categories, and weekly totals (`ActivityHistoryScreen`).

---

## 🏝️ 10. Curriculum Studio & Gamified Island Archipelago
A Duolingo-grade interactive curriculum management and mobile learning progression engine.

### 🐬 7. LingoDolphy Language Learning Platform & Gamified Archipelago

The flagship language acquisition system powering [dolphincoder.com/lingodolphy](https://dolphincoder.com/lingodolphy) on web and `app/dolphincoder` on Android and iOS.

#### Dual Language Tracks & Global Catalog
- **German A1 (CEFR / Goethe-Zertifikat A1: Start Deutsch 1)**:
  - 105 Thematic Units across 3 Sections:
    - **Section 1: Rookie** (Units 1–35, 560 lesson nodes): Foundations, Present Tense, *sein/haben*, W-Fragen.
    - **Section 2: Explorer** (Units 36–70, 560 lesson nodes): Daily life, Accusative, Modals, Separable verbs.
    - **Section 3: Traveler** (Units 71–105, 560 lesson nodes): Dative case, Prepositions, Perfekt tense, Goethe exam prep.
  - Total: 105 Units • 1,680 Interactive Path Nodes.
- **English A1 (Dual Native Indian Instruction)**:
  - **Hindi Medium Track (`en_hi`)**: 35 Units • 560 lesson nodes (Section 1 Rookie), instructed in natural conversational Hindi.
  - **Marathi Medium Track (`en_mr`)**: 35 Units • 560 lesson nodes (Section 1 Rookie), instructed in Marathi.
- **2-Step Onboarding Language Selection Flow**:
  - Automatically triggered upon first-time user login or registration (`/language-select` in mobile, modal flow on web).
  - Progressive disclosure matching industry-standard language apps (Duolingo/Babbel):
    - **Step 1: Learning Language**: Choice between **German 🇩🇪** or **English 🇬🇧**.
    - **Step 2: Native Language**:
      - If German selected: Native instruction defaults to **English 🇬🇧**.
      - If English selected: Native instruction options for Indian learners: **Hindi 🇮🇳 (हिन्दी)** or **Marathi 🇮🇳 (मराठी)**.
  - Interactive tactile cards with animated dolphin mascot Echo, step dots, and back button.
- **Clean Archipelago Screen & Decoupled Course Management**:
  - Direct paired text is completely removed from the active learning map header. The top status bar displays only the clean single target language flag emoji (🇩🇪 or 🇬🇧).
  - Tapping the flag navigates directly to Settings & Profile.
  - Course switching is maintained inside **Settings** and **Gamified Profile** (`_buildActiveCourseCard`), opening the tactile 2-step course selection modal (`LanguageSelectionScreen(isModal: true)`).
- **Instant Course Switcher (`POST /api/gamification/switch-course`)**:
  - Learners switch active courses with background audio setup, quiet voice engine re-initialization, and shimmer skeleton loading.

#### Full Suite of 8 Interactive Curriculum Stages
1. **Stage 1: Word Match (`word_match`)**:
   - Clean column separation: Target language words on the left column, native translations on the right column.
   - Tactile selection with color transitions: selected (cyan), correct (emerald dissolution), wrong (pulsing rose).
   - Instant speech audio articulation on word tap.
2. **Stage 2: Listen & Tap (`listen_tap`)**:
   - Audio prompt with scrambled token bubbles for sentence arrangement.
   - Tactile speaker button always retaining `volume_up_rounded` iconography, replaying full sentence from 0:00 on every tap.
   - Stage-isolated audio track preventing cross-stage audio pollution.
3. **Stage 3: Sentence Builder (`sentence_builder`)**:
   - Grammar structure puzzle with dedicated prompt card (`"Translate to German"` or `"Translate to Target Language"`).
   - Draggable/tappable tokens assembled into dashed target tray, with tap-to-remove.
4. **Stage 4: Sprechen Pronunciation (`sprechen`)**:
   - Real-time speech recognition (Web Speech API on web; `speech_to_text` with dictation mode on mobile).
   - Real-time word-by-word visual illumination in Emerald Green (`#10B981`) as words are detected.
   - **Live Accuracy Meter**: Displays real-time accuracy percentage (`0%` to `100%`) with color-coded feedback chips.
   - **Complete Sentence Validation**: Enforces full sentence coverage (>=75% word match) to prevent premature passing on 1–2 words.
   - **Per-Attempt State Reset**: Starting a new pronunciation attempt resets prior win/loss status and clears stale transcripts.
   - **Digit & Currency Normalization**: Normalizes numbers and currency symbols (e.g. `"3€"` ↔ `"drei Euro"`, `"1"` ↔ `"eins"`).
5. **Stage 5: Cloze Test (`cloze_test`)**:
   - Sentence comprehension card with an underlined gap, parallel native translation, and multiple-choice option chips (A, B, C).
6. **Stage 6: Type Word (`type_word`)**:
   - Direct spelling and keyboard entry drill with hint support.
   - Quick German Umlaut buttons (`ä`, `ö`, `ü`, `ß`) for easy input on physical or mobile keyboards.
7. **Stage 7: Dialogue Bubble (`dialogue_bubble`)**:
   - Messenger-style conversational chat story with character avatar (Echo the Dolphin or Florian), audio replay button, and interactive reply options.
8. **Stage 8: Listen & Select (`listen_select`)**:
   - Audio comprehension question card with normal (1.0x) and turtle slow (0.75x) playback toggles, followed by multiple-choice selection.

#### Web Audio & Speech Synthesis Architecture
- **Browser Text-to-Speech Engine**:
  - German Voice: Automatically detects and prioritizes natural female German voices (`Anna`, `Google Deutsch`, `Marlene`).
  - English Voice Persona Selector: Persistent user choice between `👩 Female Voice (Samantha)` and `👨 Male Voice (Daniel)`.
  - Novelty Synthesizer Filter: Automatically rejects joke, robotic, or eerie system voices (e.g., Bells, Cellos, Zarvox, Trinoids).
- **Web Audio API Synth Chimes**:
  - Major chord arpeggio (`C5 → E5 → G5 → C6`) synthesized dynamically on pass.
  - Soft dual-tone buzz synthesized on retry.

#### High-Performance Decoupled JIT Architecture
- **Solving the 60-Second Mobile Lag**:
  - **Payload Decoupling**: Map queries (`GET /api/gamification/path`) return lightweight metadata projections only, trimming payload size from 28.5 MB to 35 KB (99.88% reduction).
  - **Just-In-Time (JIT) Lesson Fetching**: Lesson stage details load on-demand (`GET /api/gamification/lesson/:id`) in <50ms only when a student taps a path node.
  - **Section-Windowed Pagination**: Map data partitioned into natural macro-sections (Section 1, 2, 3).
  - **Composite Indexes**: Composite index on MySQL `CurriculumLesson` table (`targetLanguage, nativeLanguage, level, sectionNumber, isLive, orderIndex`) for sub-millisecond lookups.

#### Curriculum Studio (`/lessons`)
- Administrative studio for Trainers and Admins:
  - Section -> Unit -> Lesson hierarchy navigation.
  - Multi-stage authoring tools for all 8 interactive challenge types.
  - Stage-isolated audio uploads directly into MySQL `LONGBLOB` storage.
  - Pre-filled JSON template download and upload tools for word pairs, timestamps, and alignments.
  - Live / Draft toggle protecting in-development units from student visibility.

---

## 🗺️ 8. Pedagogical Curriculum Design & Spaced Repetition (`planlesson.md`)
- **16-Lesson Rhythm per Unit**:
  - Micro-stepping: 1-to-2 word greetings -> Simple Subject + Verb -> Social etiquette -> Micro chat story -> Mid-unit expansion -> Trophy Boss Exam.
  - Spaced Repetition (The 1-4-8-13-16 Cycle): Concept introduced in Lesson $L$, reinforced in Lesson $L+3$, synthesized in Lesson $L+6$, recalled in review Lesson 13, and evaluated without hints in Lesson 16 (Trophy Boss Exam).
  - Zero consecutive redundancy: Minimum of 3 distinct vocabulary slices (A, B, C) and 5 distinct sentence structures per unit.

---

## 📜 9. Complete Version Release Log

| Release Version | Date | Highlights & Core Changes |
|---|:---:|---|
| **`v33.0.0-stable`** | 2026-10-28 | **5-Phase Speech Lifecycle, Confetti Shower & Live Hostinger Benchmarks**: Synced mobile client to `889662b` (Mobile `v1.2.12+18`); implemented 5-phase speech lifecycle, double-tap gating, sound wave ripples, celebratory confetti shower (`ConfettiWidget`), 3-tier speech engine fallback in `MainActivity.kt`, Bluetooth SCO routing, audio becoming noisy listener, tactile audio-haptics (`SoundEffectsService`), 3D word matching, turtle speed audio (0.75x), backend Jest lesson mechanics test suite, and live Hostinger VPS latency benchmarking script (`benchmark_hostinger.js`). |
| **`v32.0.0-stable`** | 2026-10-27 | **Production AdMob Monetization & Backend Test Suite**: Integrated verified Google Play AdMob IDs, interstitial ads every 3 lessons, rewarded video ad awarding +2 Oxygen with a 6 claims/day cap, automated Jest & Supertest test suite (21 tests), calculations architecture documentation, and `/app-ads.txt` crawler verification. |
| **`v31.0.0-stable`** | 2026-10-27 | **Play Store Release & Leak-Proof Speech Recognizer**: Bumped mobile client to `v1.2.10+15`; implemented native Android reflective teardown in `MainActivity.kt` to prevent `AudioRecord` leaks and Binder death; added natural male TTS narrator. |
| **`v30.0.0-stable`** | 2026-10-26 | **Submodule Alignment**: Synchronized DolphinFlutter submodule to `v1.2.9+14` with localized lesson modal headings. |
| **`v29.1.0-stable`** | 2026-10-15 | **English Voice Persona Selector**: Added persistent persona selector on web (`👩 Female / Samantha` vs `👨 Male / Daniel`), kept German as Anna, and enhanced curriculum preview. |
| **`v29.0.1`** | 2026-10-15 | **TTS Voice Hygiene**: Blocked novelty, joke, and ghost synthesizer voices (Bells, Cellos, Zarvox) for English pronunciation across browsers. |
| **`v29.0.0-stable`** | 2026-10-15 | **Speech Digit Normalization**: Added bidirectional number and currency symbol normalization for German and English speech recognition (`3€` ↔ `"drei Euro"`). |
| **`v28.0.0-stable`** | 2026-10-15 | **Lingo Quality & Shuffling**: Native text sanitization for German-English tracks, shuffled sentence builder tokens, and accuracy meter polishing. |
| **`v27.0.0-stable`** | 2026-10-14 | **Course Switcher & Shimmer**: Parallel course switching with background voice initialization, archipelago shimmer skeleton, and snap-back scroll fixes. |
| **`v26.0.0`** | 2026-10-14 | **JIT Performance & English A1**: Scaled curriculum to dual Indian languages (Hindi & Marathi), decoupled 28.5 MB payload to 35 KB via JIT fetching, composite indexing, and added system design study. |
| **`v25.1.0`** | 2026-10-12 | **German Lady Voice TTS**: Integrated real-time German lady voice TTS in mobile multi-stage lessons with engine pre-warming. |
| **`v25.0.0`** | 2026-10-12 | **Gamified Archipelago**: Duolingo-grade 5-tab mobile shell, serpentine island path, and 8 interactive curriculum stage types. |


