# frontend.md — Agent Context for the React Web App

> **Purpose:** Comprehensive onboarding context for coding agents and engineers working in `frontend/`.
> Documents architecture, routing, component hierarchy, state management, speech recognition engines,
> assessment interfaces, CMS page management, crawler verification, and conventions.
> Verified against active source on 2026-10-28.
>
> **Rules of engagement for agents:**
> 1. Read "Architecture & conventions" before creating or modifying components — follow established patterns.
> 2. The build output directory is `../backend/dist` (`vite.config.js`). Never change this; the Express server serves it statically.
> 3. Global notifications use `react-hot-toast` (configured in `src/App.jsx`).
> 4. Voice recognition components must handle browser capabilities gracefully (e.g. Chrome, Edge, Safari Web Speech API `webkitSpeechRecognition`).
> 5. Never modify backend or Flutter mobile code while working on frontend tasks unless instructed.

---

## 1. What This Is

**DolphinCoder LMS Web Client** — A high-performance React 18 Single Page Application (SPA) built with Vite 5, React Router 6, Tailwind CSS 3, and Tiptap.

- **Target Audience & Roles**:
  - `student`: Accesses notes, karaoke reader with speaking practice, videos, quizzes, flashcards, profile, study activity analytics, and the LingoDolphy archipelago.
  - `trainer`: Full student permissions plus creating, uploading, editing, and managing curriculum content, quizzes, and notes.
  - `admin`: Platform-wide administrative access, user role toggling, trainer provisioning, system configuration, and CMS page management (`/admin/pages`).

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

## 3. Complete Directory Map & Page Inventory

```
frontend/
├── public/
│   ├── app-ads.txt                    # Google AdMob crawler verification file
│   ├── favicon.svg                    # Brand favicon
│   └── audio/                         # Demo audio assets
├── src/
│   ├── api/
│   │   └── axios.js                   # Axios HTTP client with JWT interceptor & client timezone offset
│   ├── assets/                        # Static brand assets
│   ├── components/
│   │   ├── common/                    # Navbar, Footer, ProtectedRoute, Pagination, Loaders
│   │   ├── lingodolphy/               # Archipelago map, interactive lesson modal, exercise stages
│   │   ├── notes/                     # Tiptap rich-text editor, DOCX importer, HTML slide sandbox
│   │   └── quizzes/                   # Quiz taker, match-pairs interactive widget, review components
│   ├── contexts/
│   │   └── AuthContext.jsx            # User session, JWT tokens, profile state
│   ├── hooks/
│   │   ├── useSubjects.js             # Taxonomy hooks for subjects & topics
│   │   └── useDifficultWords.js       # Bookmarking hook for difficult vocabulary
│   ├── pages/                         # All 28 application route pages:
│   │   ├── ActivityHistoryPage.jsx    # User activity logs, localized study days, hours calculation
│   │   ├── AdminPage.jsx              # User role & status management, trainer provisioning
│   │   ├── AdminPagesPage.jsx         # CMS pages listing, publishing status, dynamic SEO
│   │   ├── CurriculumPage.jsx         # Section -> Unit -> Lesson curriculum editor
│   │   ├── Dashboard.jsx              # Main user hub, today's metrics, study streak & quick links
│   │   ├── FlashcardFormPage.jsx      # Deck authoring & DOCX bulk import
│   │   ├── FlashcardsPage.jsx         # Flashcard deck library & study mode
│   │   ├── KaraokeNoteReader.jsx      # Word-synced audio player with Sprechen mode & chimes
│   │   ├── Landing.jsx                # Public marketing homepage
│   │   ├── LingoDolphyPage.jsx        # Gamified archipelago path & 8-stage interactive runner
│   │   ├── Login.jsx                  # User login form
│   │   ├── NoteDetailPage.jsx         # Note reader with sandboxed HTML slide viewer
│   │   ├── NoteEditorPage.jsx         # Tiptap rich-text editor & DOCX parser
│   │   ├── NotesPage.jsx              # Notes catalog with search, filters & pagination
│   │   ├── PageEditorPage.jsx         # Tiptap editor for CMS pages & SEO metadata
│   │   ├── ProfilePage.jsx            # User profile, password reset, account stats
│   │   ├── PublicPageView.jsx         # Public dynamic CMS page reader (/:slug)
│   │   ├── QuizFormPage.jsx           # Quiz creator with MCQ, Code-MCQ & Match Pairs
│   │   ├── QuizReviewPage.jsx         # Detailed post-exam review with explanations
│   │   ├── QuizTakePage.jsx           # Timed exam runner with question drawer
│   │   ├── QuizzesPage.jsx            # Quiz catalog with subject/topic taxonomy filters
│   │   ├── Register.jsx               # New user registration
│   │   ├── StudyPage.jsx              # Dedicated flashcard study runner with 3D flip cards
│   │   ├── VideoDetailPage.jsx        # YouTube video player with tags & view tracker
│   │   ├── VideoFormPage.jsx          # Video resource creator
│   │   └── VideosPage.jsx             # Video catalog with topic filtering
│   ├── styles/
│   │   └── index.css                  # Custom Tailwind layers & glassmorphism utilities
│   ├── utils/
│   │   ├── downloadTemplateDoc.js     # DOCX template generator for bulk quiz/flashcard imports
│   │   └── downloadKaraokeTemplate.js # JSON alignment template exporter
│   ├── App.jsx                        # Route table & global provider configuration
│   └── main.jsx                       # Application DOM root
├── index.html                         # SPA HTML shell
├── package.json                       # Dependencies & scripts
├── tailwind.config.js                 # Theme design tokens
└── vite.config.js                     # Vite build configuration (outDir: '../backend/dist')
```

---

## 4. Key Workflows & Verified Capabilities

### 4.1 In-Page Anchor Navigation Fix (`NoteDetailPage.jsx`)
- Prevents sandboxed `iframe` from unloading into a blank screen when users click `#hash` navigation links.
- Uses `prepareHtmlContent` to inject an inline event interceptor that intercepts link clicks, looks up targeted elements inside the `srcdoc`, and triggers `element.scrollIntoView({ behavior: 'smooth' })`.

### 4.2 Web Speech API Sprechen Practice (`KaraokeNoteReader.jsx`)
- Speech recognition initializes via `window.SpeechRecognition || window.webkitSpeechRecognition`.
- Continuous listening enabled with a 3-second automatic silence detector OR instant submission via the "Done Speaking" action button.
- Celebratory chords synthesised via the Web Audio API on passing accuracy ($\ge 75\%$).

### 4.3 Crawler Verification (`public/app-ads.txt`)
- Google AdMob crawler verification asset maintained in `public/app-ads.txt` and copied to `../backend/dist/app-ads.txt` during build, ensuring seamless crawler indexing from both development and production hosts.
