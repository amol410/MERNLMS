# DolphinCoder LMS — Frontend Web Application 🐬

The high-performance React Single Page Application (SPA) powering [dolphincoder.com](https://dolphincoder.com). Built with **React 18**, **Vite 5**, **Tailwind CSS 3**, and **Tiptap**.

---

## 🌟 Architecture & Key Features

### 1. Interactive Notes & HTML Presentation Viewer
- **Tiptap Rich-Text Editor**: Multi-level headings, blockquotes, code blocks, lists, tags, color-coded themes, and pinning.
- **DOCX Import**: Automated Microsoft Word conversion using `mammoth`.
- **HTML Slide Viewer (16:9 Presentation Sandbox)**:
  - Renders slide presentations in an isolated sandboxed `iframe` via `srcdoc` with fullscreen support.
  - **In-Page Anchor Navigation Fix (`NoteDetailPage.jsx`)**: Automatically injects a client-side smooth-scroll interceptor script (`prepareHtmlContent`) that cancels default navigation on `#hash` fragment clicks and smoothly scrolls targeted elements, preventing modern browsers from navigating to `about:srcdoc#hash` and unloading into a blank screen.

### 2. Interactive Karaoke Reader & Sprechen Practice
- **Real-Time Word Synchronization**: Highlight words in sync with native German audio streamed from MySQL (`/api/notes/audio/db/:id`).
- **Sprechen Practice Mode**: Auto-pauses playback at sentence boundaries for active speaking practice.
- **German Web Speech Recognition (`de-DE`)**: Continuous dictation recognition with dual submission: automatic evaluation after 3 seconds of continuous silence OR instant evaluation via **"Done Speaking (Check Now ✓)"**.
- **Web Audio API Synth Chimes**: Harmonious celebratory arpeggio on pass (≥75% accuracy) and low retry chime with a 3-chance counter.

### 3. LingoDolphy Language Learning Platform (`/lingodolphy`)
- **Duolingo-Grade Archipelago Path**: 3D alternating sinusoidal island progression path with section pagination (Rookie, Explorer, Traveler).
- **Dual Language Tracks**: German A1 (105 units) and English A1 with native Hindi & Marathi medium instruction (Section 1, 35 units).
- **Full Suite of 8 Interactive Stages**: `word_match`, `listen_tap`, `sentence_builder`, `sprechen` (Google Speech STT, accuracy meter, complete sentence validation), `cloze_test`, `type_word` (with Umlauts), `dialogue_bubble`, and `listen_select` (1.0x & 0.75x slow speeds).
- **Voice Persona Selector**: Persistent selector for English (`👩 Female / Samantha` vs `👨 Male / Daniel`), `Anna` for German, filtering out novelty voices.

### 4. Comprehensive Quiz & Assessment Engine
- Multiple Choice (MCQ), True/False, syntax-highlighted code snippets, and **Match the Pairs (`match_pairs`)** interactive column matching.
- Timed examination engine with sticky sidebar question navigator and session-preserved state.
- **Dedicated Quiz Review (`/quizzes/:id/review`)**: Post-exam review showing chosen answers, correct answers, and instructor explanations.

### 5. Curriculum Studio & Interactive Lessons (`/lessons`)
- Hierarchical Section -> Unit -> Lesson administrative studio with stage authoring for all 8 challenge types, template downloads, and isolated MySQL audio storage.

### 6. Activity Analytics & Study Tracking
- High-performance counts-only query for dashboard metrics.
- Grouped weekly activity log with localized day categories (**Today**, **Yesterday**, **Day Before Yesterday**) and total daily study hours.

---

## 🛠️ Quick Start

### Installation & Development
```bash
cd frontend
npm install
npm run dev        # Runs Vite dev server on http://localhost:5173 (proxies /api → http://localhost:5000)
```

### Production Build
```bash
npm run build      # Compiles production bundle directly into ../backend/dist
```

> **CRITICAL**: The build output directory is `../backend/dist` (configured in `vite.config.js`). Express serves this directory statically in production. Do NOT modify the output directory.

---

## 📁 Directory Layout

```
frontend/
├── src/
│   ├── api/axios.js             # Axios singleton with JWT authorization header & 401 interceptor
│   ├── contexts/AuthContext.jsx # Global user authentication & profile state
│   ├── components/
│   │   ├── common/              # Navbar, Footer, ProtectedRoute, ConfirmModal, Pagination
│   │   ├── notes/               # KaraokeNoteModal, note list cards
│   │   ├── lingodolphy/         # LingoLessonModal (8-stage challenge runner, voice synthesizer)
│   │   ├── curriculum/          # LessonEditorModal, UnitOutlineModal, BulkUploadModal
│   │   ├── quiz/                # MatchPairsQuestion, CodeSnippetQuestion, MatchPairsForm, MatchPairsDisplay
│   │   └── dashboard/           # TodayPerformance, WeeklyPerformance
│   ├── pages/
│   │   ├── Landing.jsx          # Public showcase & demo landing page
│   │   ├── Dashboard.jsx        # Student & trainer central cockpit
│   │   ├── LingoDolphyPage.jsx  # Student language learning path & course switcher
│   │   ├── CurriculumPage.jsx   # Curriculum Studio & Lesson Management (/lessons)
│   │   ├── NotesPage.jsx        # 6-item paginated notes catalog with search & filters
│   │   ├── NoteDetailPage.jsx   # Article / Slide presentation viewer with anchor navigation fix
│   │   ├── NoteEditorPage.jsx   # Tiptap rich-text editor & file upload
│   │   ├── KaraokeNoteReader.jsx# Word-level sync audio reader & Sprechen practice engine
│   │   ├── QuizzesPage.jsx      # 6-item paginated quizzes with subject/topic filter
│   │   ├── QuizTakePage.jsx     # Active timed assessment interface
│   │   ├── QuizReviewPage.jsx   # Detailed score breakdown & test review
│   │   ├── FlashcardsPage.jsx   # 6-item paginated flashcard decks
│   │   ├── StudyPage.jsx        # 3D interactive flashcard flip study
│   │   ├── ActivityHistoryPage.jsx # Grouped daily study history & active study hours
│   │   ├── ProfilePage.jsx      # User profile, password updates, and settings
│   │   └── AdminPage.jsx        # User role administration & trainer provisioning
│   ├── styles/index.css         # Tailwind directives, custom glassmorphism classes, animations
│   ├── App.jsx                  # React Router 6 route declarations & toast provider
│   └── main.jsx                 # Entrypoint
├── vite.config.js               # outDir: '../backend/dist', proxy: /api -> localhost:5000
└── tailwind.config.js           # Dolphin ocean color theme & glassmorphic utilities
```
