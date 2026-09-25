# frontend.md — Agent Context for the React Web App

> **Purpose:** Comprehensive onboarding context for coding agents and engineers working in `frontend/`.
> Documents architecture, routing, component hierarchy, state management, speech recognition engines,
> assessment interfaces, and conventions.
> Verified against active source on 2026-09-26.
>
> **Rules of engagement for agents:**
> 1. Read "Architecture & conventions" before creating or modifying components — follow established patterns.
> 2. The build output directory is `../backend/dist` (`vite.config.js`). Never change this; the Express server serves it statically.
> 3. Global notifications use `react-hot-toast` (configured in `src/App.jsx`).
> 4. Voice recognition components must handle browser capabilities gracefully (e.g. Chrome, Edge, Safari Web Speech API `webkitSpeechRecognition`).

---

## 1. What This Is

**DolphinCoder LMS Web Client** — A high-performance React 18 Single Page Application (SPA) built with Vite 5, React Router 6, Tailwind CSS 3, and Tiptap.

- **Target Audience & Roles**:
  - `student`: Accesses notes, karaoke reader with speaking practice, videos, quizzes, flashcards, profile, and study activity analytics.
  - `trainer`: Full student permissions plus creating, uploading, editing, and managing their own content.
  - `admin`: Platform-wide administrative access, user role toggling, trainer provisioning, and system configuration.

---

## 2. Run & Build

```bash
cd frontend
npm install
npm run dev        # Vite dev server on http://localhost:5173 (proxies /api → http://localhost:5000)
npm run build      # Compiles production bundle directly into ../backend/dist
npm run preview    # Local preview of the production build
```

- **API Proxy**: Configured in `vite.config.js`. All frontend API calls use relative `/api/*` endpoints via `src/api/axios.js`.
- **CSS Architecture**: Tailwind utility classes combined with custom glassmorphism components in `src/styles/index.css` (`.glass-card`, `.btn-primary`, `.btn-secondary`, `.input-field`, `.badge-*`, `.flip-card`).

---

## 3. Directory Map

```
frontend/
├── vite.config.js                     # outDir: '../backend/dist', proxy: /api → localhost:5000
├── tailwind.config.js                 # Dolphin/Ocean color palette, glassmorphism utilities
├── index.html                         # SPA root with Google Fonts (Inter, Plus Jakarta Sans)
└── src/
    ├── main.jsx                       # Entrypoint mounting BrowserRouter + AuthProvider + App
    ├── App.jsx                        # Central route declarations, Layout wrapper, Toaster
    ├── styles/index.css               # Tailwind directives, custom glassmorphic classes, keyframe animations
    ├── api/axios.js                   # Axios singleton with JWT authorization header & 401 interceptor
    ├── contexts/AuthContext.jsx       # Auth state, login, register, profile update, localStorage sync
    ├── data/
    │   └── demoKaraokeStory.json      # German demonstration story ("Die Schildkröte und der Hase")
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx             # Role-aware navigation bar
    │   │   ├── Footer.jsx             # Platform footer
    │   │   ├── ProtectedRoute.jsx     # Route guard enforcing authentication and specific roles
    │   │   ├── ConfirmModal.jsx       # Reusable delete/action confirmation modal
    │   │   └── Pagination.jsx         # 6-item pagination control with next/prev buttons
    │   ├── notes/
    │   │   └── KaraokeNoteModal.jsx   # Modal for creating/editing Karaoke notes with audio attachment
    │   ├── quiz/
    │   │   ├── CodeSnippetQuestion.jsx# Syntax-highlighted code question component (highlight.js)
    │   │   ├── MatchPairsQuestion.jsx # Interactive student pairing interface (Match the Pairs)
    │   │   ├── MatchPairsForm.jsx     # Authoring form for 4-item pair matching questions
    │   │   └── MatchPairsDisplay.jsx  # Dynamic pairing column renderer with click/drag selection
    │   └── dashboard/
    │       ├── TodayPerformance.jsx   # Fast lightweight daily metrics (completed notes, quizzes, cards)
    │       └── WeeklyPerformance.jsx  # Aggregated activity summary cards
    ├── pages/
    │   ├── Landing.jsx                # Public home page with animated orbs and feature previews
    │   ├── Login.jsx / Register.jsx   # Authentication forms
    │   ├── Dashboard.jsx              # Main student/trainer dashboard with study stats & quick links
    │   ├── NotesPage.jsx              # Notes directory with 6-item pagination & search/tag filters
    │   ├── NoteEditorPage.jsx         # Tiptap rich-text editor & DOCX/HTML slide upload
    │   ├── NoteDetailPage.jsx         # Note reader with color themes or embedded slide iframe
    │   ├── KaraokeNoteReader.jsx      # Word-level sync audio reader + Sprechen speaking practice engine
    │   ├── QuizzesPage.jsx            # Quiz catalog with 6-item pagination and Subject/Topic filters
    │   ├── QuizFormPage.jsx           # Quiz authoring (MCQ, True/False, Code, Match Pairs, DOCX bulk)
    │   ├── QuizTakePage.jsx           # Timed exam interface, sticky question navigator, state persistence
    │   ├── QuizReviewPage.jsx         # Post-exam test review showing selected answers vs correct answers
    │   ├── FlashcardsPage.jsx         # Flashcard deck directory with 6-item pagination
    │   ├── FlashcardFormPage.jsx      # Deck authoring form with card builder & DOCX bulk upload
    │   ├── StudyPage.jsx              # 3D interactive flashcard flip study session
    │   ├── ActivityHistoryPage.jsx    # Full weekly activity history with localized day categories & daily hours
    │   ├── ProfilePage.jsx            # Student/Trainer profile and password management
    │   └── AdminPage.jsx              # Admin user management and trainer account provisioning
    └── utils/
        ├── downloadTemplateDoc.js     # Generates downloadable .doc templates for quiz/note bulk uploads
        └── downloadKaraokeTemplate.js # Generates downloadable JSON template for karaoke alignment import
```

---

## 4. Key Subsystems & Architectures

### 4.1 Interactive Karaoke Reader & Sprechen Practice (`KaraokeNoteReader.jsx`)
- **Word-Level Audio Synchronization**:
  Tracks `currentTime` on HTML5 `<audio>` elements and highlights active words based on alignment timestamps (`start` and `end`).
- **Real-Time Offset Calibration**:
  Students can adjust audio/text alignment by -0.25s, 0s, or +0.25s to account for Bluetooth latency or system differences.
- **Sprechen (Speaking Practice) Mode**:
  - Automatically pauses playback at sentence boundaries (`effTime >= sentence.end`).
  - Uses `lastPausedSentenceRef.current` to prevent stale sentence re-pause loops during transitions.
  - Defaults to a relaxed 0.75x tempo for clear speech comprehension.
- **German Speech Recognition Engine**:
  - Uses `webkitSpeechRecognition` with native German (`de-DE`).
  - Runs in `continuous: true` mode, accumulating interim and finalized transcripts so natural pauses between words do not abort listening.
- **Dual Submission Mechanism**:
  1. **Automatic 3-Second Silence Timer**: Resets on every detected word; automatically evaluates pronunciation after 3.0 seconds of continuous silence.
  2. **Manual "Done Speaking (Check Now ✓)" Button**: Allows the learner to immediately evaluate their pronunciation without waiting for the timer.
- **Web Audio API Feedback**:
  - Synthesizes major chord arpeggios on successful pronunciation (≥75% accuracy).
  - Synthesizes retry chimes on failed attempts with a 3-chance indicator.

### 4.2 Assessment & Exam Engine (`QuizTakePage.jsx`, `MatchPairsQuestion.jsx`)
- **Question Types Supported**:
  - Single-choice Multiple Choice (`mcq`).
  - True/False (`true_false`).
  - Syntax-highlighted code snippets (`code-mcq`).
  - **Match the Pairs (`match_pairs`)**: Dynamic pairing columns (Terms vs. Definitions) with real-time selection, color matching, and validation.
- **Exam Session Persistence**:
  - Exam timer and question state are persisted in `sessionStorage` under `quiz_{quizId}_{attemptId}_state` to survive accidental page refreshes.
  - `beforeunload` warning alerts students before abandoning active tests.
- **Dedicated Test Review (`QuizReviewPage.jsx`)**:
  - Accessible post-submission, displaying question-by-question breakdowns with user answers, correct answers, and trainer explanations.

### 4.3 Activity Analytics & Weekly Performance (`ActivityHistoryPage.jsx`, `TodayPerformance.jsx`)
- **Dashboard Optimization**:
  - `TodayPerformance.jsx` queries `/api/activity/summary?countsOnly=true` to instantly display daily counts (completed notes, quizzes, flashcards) without loading heavy historical tables.
- **Calendar-Day Categorization**:
  - Groups user activities into distinct daily sections: **Today**, **Yesterday**, and **Day Before Yesterday (Day of Week)** with localized badges.
- **Daily Study Time**:
  - Calculates and displays total study duration (hours and minutes) on the right side of every daily header.
- **Timezone Awareness**:
  - Calculates client local day boundaries to prevent activities completed after UTC midnight from shifting into the wrong day.

### 4.4 Pagination Engine (`Pagination.jsx`)
- Standardized 6-item pagination deployed across Notes, Quizzes, and Flashcards directories, ensuring rapid initial rendering and organized browsing.

---

## 5. Coding & Contribution Rules

1. **Keep Vite Build Output Intact**:
   The build must always emit to `../backend/dist`. Do not change `vite.config.js`.
2. **Notification Standards**:
   Use `toast.success()`, `toast.error()`, or `toast()` from `react-hot-toast` for user feedback.
3. **Safe Object Rendering**:
   Always normalize nested vocabulary, subject, or topic objects to string labels before rendering in JSX to avoid React Error #31.
4. **State Cleanup**:
   Speech recognition, audio timers, and interval counters must be cleaned up on unmount or navigation to prevent memory leaks.
