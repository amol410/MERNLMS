# DolphinCoder LMS — Frontend Web Application 🐬

The high-performance React Single Page Application (SPA) powering [dolphincoder.com](https://dolphincoder.com). Built with **React 18**, **Vite 5**, **Tailwind CSS 3**, and **Tiptap**.

---

## 🌟 Architecture & Key Features

### 1. Unified Monorepo Build Target
- **Destination**: Compiles directly into `../backend/dist` via `vite.config.js`. Express serves this directory as a static SPA with dynamic single-level SEO injection.
- **API Proxy**: In local development, requests matching `/api/*` are automatically forwarded to `http://localhost:5000`.

### 2. Interactive Notes & HTML Presentation Viewer
- **Tiptap Rich-Text Editor**: Multi-level headings, blockquotes, code blocks, lists, tags, color-coded themes, and pinning.
- **DOCX Import**: Automated Microsoft Word conversion using `mammoth`.
- **HTML Slide Viewer (16:9 Presentation Sandbox)**:
  - Renders slide presentations in an isolated sandboxed `iframe` via `srcdoc` with fullscreen support.
  - **In-Page Anchor Navigation Fix (`NoteDetailPage.jsx`)**: Automatically injects a client-side smooth-scroll interceptor script (`prepareHtmlContent`) that cancels default navigation on `#hash` fragment clicks and smoothly scrolls targeted elements, preventing modern browsers from navigating to `about:srcdoc#hash` and unloading into a blank screen.

### 3. Interactive Karaoke Reader & Sprechen Practice
- **Real-Time Word Synchronization**: Highlight words in sync with native German audio streamed from MySQL (`/api/notes/audio/db/:id`).
- **Sprechen Practice Mode**: Auto-pauses playback at sentence boundaries for active speaking practice.
- **German Web Speech Recognition (`de-DE`)**: Continuous dictation recognition with dual submission: automatic evaluation after 3 seconds of continuous silence OR instant evaluation via **"Done Speaking (Check Now ✓)"**.
- **Web Audio API Synth Chimes**: Harmonious celebratory arpeggio on pass ($\ge 75\%$ accuracy) and low retry chime with a 3-chance counter.

### 4. LingoDolphy Language Learning Platform (`/lingodolphy`)
- **Duolingo-Grade Archipelago Path**: 3D alternating sinusoidal island progression path with section pagination (Rookie, Explorer, Traveler).
- **Dual Language Tracks**: German A1 (105 units) and English A1 with native Hindi & Marathi medium instruction (Section 1, 35 units).
- **Full Suite of 8 Interactive Stages**: `word_match`, `listen_tap`, `sentence_builder`, `sprechen` (Google Speech STT, accuracy meter, complete sentence validation), `cloze_test`, `type_word` (with Umlauts), `dialogue_bubble`, and `listen_select` (1.0x & 0.75x slow speeds).
- **Voice Persona Selector**: Persistent selector for English (`👩 Female / Samantha` vs `👨 Male / Daniel`), `Anna` for German, filtering out novelty voices.

### 5. Comprehensive Quiz & Assessment Engine
- Multiple Choice (MCQ), True/False, syntax-highlighted code snippets, and **Match the Pairs (`match_pairs`)** interactive column matching.
- Timed examination engine with sticky sidebar question navigator and session-preserved state.
- **Dedicated Quiz Review (`/quizzes/:id/review`)**: Post-exam review showing chosen answers, correct answers, and instructor explanations.

### 6. Dynamic CMS Pages & SEO (`/admin/pages`)
- **Public CMS Page Rendering (`PublicPageView.jsx`)**: Renders custom company pages, articles, terms, and privacy policies with dynamic slug matching (`/:slug`).
- **Admin Page Editor (`PageEditorPage.jsx`)**: Allows administrators to draft, edit, publish, and manage SEO metadata (title, meta description, OpenGraph images).
- **Crawler & Verification Support**:
  - `public/app-ads.txt`: Direct AdMob crawler verification asset matching backend delivery.

### 7. Activity Analytics & Study Tracking
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
npm run build      # Compiles production assets into ../backend/dist
npm run preview    # Local preview of the compiled bundle
```

---

## 📂 Directory Layout

```
frontend/
├── public/                            # Static assets served at root
│   ├── app-ads.txt                    # Google AdMob crawler verification
│   ├── favicon.svg                    # Application favicon
│   └── audio/                         # Demo audio assets
├── src/
│   ├── api/
│   │   └── axios.js                   # Axios HTTP singleton with auth & timezone headers
│   ├── assets/                        # SVG & Image branding assets
│   ├── components/
│   │   ├── common/                    # Navbar, Footer, ProtectedRoute, Pagination, Loaders
│   │   ├── lingodolphy/               # Archipelago map, interactive lesson modal, exercise stages
│   │   ├── notes/                     # Tiptap editor, DOCX importer, HTML slide sandbox
│   │   └── quizzes/                   # Quiz taker, match-pairs interactive widget, review components
│   ├── contexts/
│   │   └── AuthContext.jsx            # User session, JWT tokens, profile state
│   ├── hooks/
│   │   ├── useSubjects.js             # Taxonomy hooks for subjects & topics
│   │   └── useDifficultWords.js       # Bookmarking hook for difficult vocabulary
│   ├── pages/                         # All 28 application route pages
│   ├── styles/                        # Tailwind design tokens, glassmorphism utilities
│   ├── utils/                         # Template generators, audio synthesizers, date formatters
│   ├── App.jsx                        # Central Router & toast configuration
│   └── main.jsx                       # Application DOM root
├── index.html                         # SPA shell with Google Fonts & responsive meta tags
├── package.json                       # Dependencies & build scripts
├── tailwind.config.js                 # Design tokens & color palettes
└── vite.config.js                     # Proxy & ../backend/dist outDir configuration
```
