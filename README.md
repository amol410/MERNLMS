# DolphinCoder LMS 🐬

A comprehensive, state-of-the-art Learning Management System and Gamified Language Learning Platform powering [dolphincoder.com](https://dolphincoder.com), formerly known as **SpeedUpExam**. (The root repository folder is named `MERNLMS` for historical reasons; the production database is **MySQL 8 + Sequelize 6**, not MongoDB.)

> **Current Production Release**: `v33.0.0-stable` | **Mobile App**: `v1.2.12+18` (Flutter 3.22 / Riverpod 2.5 / Submodule `889662b`)  
> **Core Monorepo Focus Folders:**  
> - `app/dolphincoder/` — Flutter Mobile Application (Android/iOS)  
> - `frontend/` — React 18 / Vite 5 Web Client & Admin CMS  
> - `backend/` — Node.js 20 / Express 4 / Sequelize 6 / MySQL 8 API & Database Service  
> *(Note: The legacy folder `app/appit/` is strictly quarantined and inactive.)*

---

## 🌟 Key Features

### 🐬 LingoDolphy Gamified Language Learning Platform (`/lingodolphy`)
- **Duolingo-Grade Archipelago Path**: Serpentine nautical island progression path with oxygen energy (`🫧 5/5`), streak flame counter (`🔥`), and pearls economy (`💎`).
- **Dual Language Tracks**:
  - 🇩🇪 **German A1 (CEFR / Goethe-Zertifikat A1: Start Deutsch 1)**: Complete 105 Units across 3 macro-sections (Rookie, Explorer, Traveler) totaling 1,680 interactive lessons.
  - 🇬🇧 **English A1 (Dual Native Instruction)**: Native Hindi (`en_hi`) and Marathi (`en_mr`) medium instruction across Section 1 (35 Units, 560 lessons).
- **2-Step Onboarding Language Selection**: First-time login / registration prompts a 2-step progressive picker: Step 1 (Target language: German 🇩🇪 / English 🇬🇧) -> Step 2 (Native language: English 🇬🇧 for German; Hindi 🇮🇳 / Marathi 🇮🇳 for English).
- **Clean Map Status Bar (Duolingo UX Standard)**: Direct pair text removed from the active map header; displays only the clean single target flag emoji. Course switching is centralized in Settings & Profile with a 2-step interactive modal.
- **Instant Course Switcher (`POST /api/gamification/switch-course`)**: Smoothly toggles between German and English tracks with background audio initialization and shimmer loading states.
- **Full Suite of 8 Interactive Curriculum Stages**:
  1. **Word Match (`word_match`)**: Dynamic card pairing separated into distinct target and native columns with instant pronunciation and green success dissolution.
  2. **Listen & Tap (`listen_tap`)**: Audio prompt with scrambled token bubbles for sentence arrangement, featuring complete sentence replay.
  3. **Sentence Builder (`sentence_builder`)**: Grammar structure puzzle with prompt cards, shuffled tokens, and syntax verification.
  4. **Sprechen Pronunciation (`sprechen`)**: Real-time microphone practice (Web Speech API / Google Speech STT) with live accuracy score meter (≥75% pass mark), real-time word-by-word illumination, complete sentence validation, and state reset per attempt.
  5. **Cloze Test (`cloze_test`)**: Sentence comprehension gap fills with multiple-choice chips.
  6. **Type Word (`type_word`)**: Accurate spelling drills featuring on-screen German Umlaut quick buttons (`ä`, `ö`, `ü`, `ß`).
  7. **Dialogue Bubble (`dialogue_bubble`)**: Messenger-style conversational chat story with character avatar audio prompts.
  8. **Listen & Select (`listen_select`)**: Audio comprehension with normal (1.0x) and turtle slow (0.75x) playback toggles.
- **Smart Voice Engine & Persona Selector**:
  - German: Prioritizes clear natural female voice (`Anna`).
  - English: Persona-based universal voice selector (`👩 Female Voice / Samantha` vs `👨 Male Voice / Daniel`), stored in user preferences.
  - Novelty Voice Filter: Automatically blocks novelty and joke synthesizer voices (e.g. Bells, Cellos, Zarvox).
  - Speech Normalization: Bidirectional digit and currency symbol normalization (`3€` ↔ `"drei Euro"`).
- **High-Performance Decoupled JIT Architecture**:
  - Lightweight map projection queries (`GET /api/gamification/path`) reducing payload from 28.5 MB to 35 KB (99.88% reduction, 82ms response).
  - Just-In-Time on-demand lesson fetching (`GET /api/gamification/lesson/:id`) loading full 8 stages in <50ms.
  - Section-windowed pagination (Sections 1, 2, 3) across 105 units.

### 📝 Notes & Interactive Karaoke Reader
- **Rich Text Notes (Tiptap)**: Bold, italic, underline, headings, lists, blockquotes, code blocks, dividers, tags, color-coded themes, and pin/unpin.
- **DOCX & HTML Import**: Automatic Word file conversion to HTML (`mammoth`) and self-contained 16:9 interactive presentation slide viewer with fullscreen support.
- **In-Page Anchor Navigation Fix**: Smooth-scroll script injected into HTML presentation `srcdoc` preventing `about:srcdoc#hash` blank screen unload.
- **🎤 Interactive Karaoke Reader & Sprechen (Speaking Practice)**:
  - Synchronized word-by-word highlighted text and audio playback.
  - Native German fable demo (*"Die Schildkröte und der Hase"*).
  - 0.75x default speaking pace, 1x, and 1.25x speed toggles; live timing offset adjusters (-0.25s, 0s, +0.25s).
  - English sentence translations displayed directly below German text (with visibility toggle).
  - Interactive vocabulary popups with parts of speech.
  - **Sprechen Practice Mode**: Sentence-by-sentence boundary auto-pausing for active speaking practice.
  - **Continuous German Speech Recognition (`de-DE`)**: Web Speech API integration that prevents premature cut-offs during natural speaking pauses.
  - **Dual Submission System**: Pronunciation evaluates automatically after **3 seconds of continuous silence** OR immediately upon clicking **"Done Speaking (Check Now ✓)"**.
  - **Web Audio API Synth Chimes**: Harmonious celebratory arpeggio on pass (≥75% accuracy) and low chord chime on retry with a 3-chance counter.
  - **Database-Backed Audio**: MP3 files stored directly in MySQL (`LONGBLOB`) with HTTP 206 Partial Content range seeking, preventing audio loss on ephemeral hosting.

### 🧠 Interactive Quizzes & Assessments
- **Multiple Question Types**: Multiple Choice (MCQ), True/False, Code Snippet questions with syntax highlighting (Python, JS, Java, SQL, C++, PHP), and **Match the Pairs (`match_pairs`)** interactive column matching.
- **Bulk Upload via .docx**: Automatically parses formatted Word documents for quizzes, including matching pairs.
- **Timed Test Engine**: Sticky sidebar navigator, question status tracking (answered, review, unanswered), auto-save timer, and confirmation warnings.
- **Instant Grading & Test Review**: Dedicated review page (`/quizzes/:id/review`) showing selected vs. correct answers and explanations.

### 🃏 Flashcard Decks
- Create, edit, and organize decks with multi-stop color gradients.
- Interactive study mode with 3D flip card animations and reset-on-navigation hints.
- Self-assessment ratings (*"Got It"* / *"Still Learning"*) and progress mastery tracking.
- Bulk deck creation via `.docx` upload.

### 📊 Activity Tracking & Performance Analytics
- **Fast Dashboard Summary**: Lightweight, counts-only query for completed notes, quizzes, and flashcards ensuring near-instant page load.
- **Dedicated Activity History (`/activity`)**: Full weekly view broken down into distinct local calendar days with badges (**Today**, **Yesterday**, **Day Before Yesterday**).
- **Daily Study Time**: Shows total hours and minutes studied on the right side of every day header.
- **Timezone-Aware**: Accurately aggregates user sessions across UTC and local midnight boundaries.

### 📚 Subjects & Topics Organization
- Fully relational hierarchy linking Notes and Quizzes to specific Subjects and Topics for structured curriculum learning.

### 🔐 Authentication & Roles
- Role-based authorization: **Student**, **Trainer**, **Admin**.
- JWT-based authentication (7-day validity) with bcrypt password hashing.
- Admin dashboard for user role management, account toggling, and trainer creation.

### 🏝️ Curriculum Studio & Interactive Lessons (`/lessons`)
- Hierarchical Section -> Unit -> Lesson administrative studio.
- Multi-stage interactive lesson authoring: Match Words, Listen and Tap, Sentence Builder, Sprechen Pronunciation, Cloze Test, Type Word, Dialogue Bubble, and Audio Karaoke Story.
- **Isolated Stage Audio Upload**: Dedicated direct-to-MySQL audio storage per stage; voice clips in Listen & Tap do not bleed into Karaoke or Lesson Overview.
- **Word Match & Timestamp JSON Tools**: Pre-filled template downloads (`word_match_pairs_template.json`, `listen_tap_word_timestamps_template.json`, `sprechen_lipsync_template.json`) and JSON uploads for per-token timestamps and vocabulary pairing.
- **Dedicated Words Audio Track & Sentence Range**: Dedicated audio track for word bank tokens with customizable sentence audio bounds.
- Live / Draft publishing toggle protecting in-progress courses.

### 📱 Flutter Mobile App (Android & iOS — v1.2.6+11)
- Dark-themed Material 3 mobile companion located in `app/dolphincoder/`.
- **Gamified 5-Tab Shell (`bottom_nav.dart`)**: Learn (`/home`), Leagues (`/leagues`), Quests (`/quests`), Shop (`/shop`), and Profile (`/profile`).
- **Gamified Coral Reef Archipelago**: Sinusoidal 3D island progression path with oxygen energy, streak counter, and pearls economy.
- **Decoupled JIT Architecture**: Fast map loading via metadata projections, section windowing, and on-demand lesson fetching.
- **Interactive Multi-Stage Challenge**:
  - Dynamic active stage filtering executing configured challenges.
  - Live audio streaming via `audioplayers` from `https://dolphincoder.com/api/notes/audio/db/:id`.
  - Zero-latency native TTS fallback (`flutter_tts`) with engine pre-warming.
  - Native German `de_DE` and British/US English speech recognition with continuous dictation.
  - Animated dolphin mascot (`AnimatedDolphinMascot`) with vector emotion poses and headphones.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js, Express.js 4, Sequelize ORM 6, MySQL 8 |
| **Frontend Web** | React 18, Vite 5, React Router 6, Tailwind CSS 3, Tiptap, Lucide Icons, Web Speech API, Web Audio API |
| **Mobile App** | Flutter 3, Dart, Riverpod 2, GoRouter, Dio, AudioPlayers, SpeechToText, FlutterTTS |
| **Audio & Media** | MySQL `LONGBLOB` streaming, HTTP 206 Range seeking, YouTube IFrame API |
| **Document Processing** | Mammoth (DOCX to HTML parser), Custom DOCX quiz/flashcard generators |
| **Hosting & Ops** | Hostinger VPS, PM2 Process Manager, Nginx Reverse Proxy, Let's Encrypt SSL |

---

## 📁 Repository Layout

```
MERNLMS/
├── backend/                   # Express API + Sequelize models + MySQL streaming (port 5000)
│   ├── config/database.js     # Sequelize MySQL connection pool
│   ├── controllers/           # API controllers (gamification, curriculum, notes, quizzes, etc.)
│   ├── models/                # Sequelize models (CurriculumLesson, UserNodeProgress, UserQuest, etc.)
│   ├── routes/                # Express REST routes (gamification, curriculum, notes, auth, etc.)
│   ├── middleware/            # JWT auth, role guard, Multer file upload
│   └── uploads/               # Temporary/fallback file storage
├── frontend/                  # React SPA (Vite builds into backend/dist)
│   ├── src/pages/             # Route views (LingoDolphyPage, Dashboard, CurriculumPage, etc.)
│   ├── src/components/        # UI components (LingoLessonModal, KaraokeNoteModal, etc.)
│   ├── src/contexts/          # AuthContext & global state
│   └── src/styles/            # Tailwind CSS and glassmorphism styling
├── app/dolphincoder/          # Flutter mobile application (Dart)
│   ├── lib/core/              # Constants, network Dio client, routing, theme, services (TtsService)
│   ├── lib/features/          # Gamification, Notes, Quizzes, Flashcards, Profile
│   └── lib/shared/            # Reusable mobile widgets (bottom_nav, glass_card)
├── seed_german_a1.sql         # Complete 105-Unit German A1 SQL seed
├── seed_english_a1_hindi.sql  # 35-Unit English A1 (Hindi) SQL seed
├── seed_english_a1_marathi.sql# 35-Unit English A1 (Marathi) SQL seed
├── DEPLOYMENT.md              # Production VPS deployment & SQL import guide
├── features.md                # Comprehensive feature inventory & release log
├── web_features.md            # Web application structural & functional blueprint
├── android_features.md        # Mobile application structural & functional blueprint
├── backend.md                 # Detailed backend architecture & API reference
├── frontend.md                # Detailed frontend architecture & component guide
├── android.md                 # Mobile app architecture & synchronization guide
├── systemdesign.md            # RCA & design study: Solving the 60s Mobile Lag (Payload Decoupling)
├── planlesson.md              # Non-redundant spaced repetition curriculum design plan
├── scaleup.md                 # Scale-up blueprint, business operations & multi-track growth
└── fix.md                     # Catalog of resolved critical bugs & architectural migrations
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally or remotely (e.g., `dolphincoder_lms` database)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Configure DB credentials & JWT secret
npm run dev            # Runs nodemon on http://localhost:5000
```
On boot, `connectDB()` connects to MySQL and synchronizes all models.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev            # Runs Vite on http://localhost:5173 (proxies /api → localhost:5000)
```
Production build:
```bash
npm run build          # Builds production bundle directly into backend/dist
```

### 3. Mobile App (Flutter)
```bash
cd app/dolphincoder
flutter pub get
flutter run
```

---

## ⚙️ Environment Variables

### Backend `.env`
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dolphincoder_lms
DB_USER=lms_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_at_least_64_chars
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
CLIENT_URL=https://dolphincoder.com
```

---

## 📖 System Documentation Index

| Documentation File | Scope & Target Audience |
|---|---|
| [AGENTS.md](AGENTS.md) | **Master Operating Blueprint for the Five Specialized Autonomous Engineering Agents** |
| [backend/README.md](backend/README.md) | Node.js/Express API, Sequelize ORM 6, MySQL 8 setup, Jest tests & benchmark scripts |
| [frontend/README.md](frontend/README.md) | React 18, Vite 5, Tiptap, AdMob crawler verification & production build docs |
| [app/dolphincoder/README.md](app/dolphincoder/README.md) | Flutter 3.22, 5-phase speech lifecycle, native Kotlin bridge & AdMob mobile docs |
| [architecture/01_flutter_frontend.md](architecture/01_flutter_frontend.md) | Agent 1: Flutter Frontend Architecture Specification |
| [architecture/02_speech_audio_engine.md](architecture/02_speech_audio_engine.md) | Agent 2: Speech Recognition, Audio Engine & Pronunciation Architecture |
| [architecture/03_backend_api_and_database.md](architecture/03_backend_api_and_database.md) | Agent 3: Backend API, Database & Business Logic Architecture |
| [architecture/04_web_frontend_admin.md](architecture/04_web_frontend_admin.md) | Agent 4: Web Frontend & Admin Dashboard Architectural Specification |
| [architecture/05_devops_infra_security.md](architecture/05_devops_infra_security.md) | Agent 5: DevOps, Infrastructure, Security & Monetization Architecture |
| [architecture/calculations.md](architecture/calculations.md) | Mathematical verification: Oxygen economy, streaks, and AdMob frequency |
| [features.md](features.md) | Complete chronological feature log & capability inventory (v33.0.0-stable) |
| [web_features.md](web_features.md) | Screen-by-screen web application blueprint & functional specs |
| [android_features.md](android_features.md) | Mobile app screen blueprint & native interaction specifications |
| [backend.md](backend.md) | Express API, Sequelize models, BLOB streaming, JIT endpoints, route matrix |
| [frontend.md](frontend.md) | React SPA, LingoDolphy platform, Karaoke Reader, Speech Recognition, state flow |
| [android.md](android.md) | Flutter architecture, Riverpod providers, Android alignment roadmap |
| [systemdesign.md](systemdesign.md) | System design case study: Solving the 60s Lag (Payload Decoupling & JIT Pagination) |
| [planlesson.md](planlesson.md) | Pedagogical curriculum plan: Spaced repetition & non-redundant lesson structure |
| [scaleup.md](scaleup.md) | Master scale-up blueprint: 2-track anchor strategy, economics, and operations |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Hostinger VPS deployment, PM2 clustering, Nginx range proxy, SSL & SQL seeds |
| [fix.md](fix.md) | Catalog of resolved bugs, race conditions, and database migration notes |
