# Architectural Specification: Web Frontend & Admin Dashboard

**System Name:** DolphinCoder LMS Web Client & Admin CMS  
**Document Code:** `04_web_frontend_admin.md`  
**Location:** `/frontend/` (with companion tools in `/sync_your_audio/` and `/ViRemotion/`)  
**Target Environment:** Node.js 18+, Modern Desktop & Mobile Browsers (Chrome, Edge, Safari, Firefox)  
**Production Build Target:** Static bundle deployed to `../backend/dist/`  
**Document Status:** Complete & Verified against active source code  

---

## 1. Complete Frontend Directory & File Structure

The frontend application is structured as a modular React 18 Single-Page Application (SPA) bundled with Vite 5. The source code resides in `frontend/src/` with clear separation among API services, contexts, custom hooks, atomic components, and top-level page views.

```
frontend/
├── .env.example                               # Environment variable blueprint
├── .gitignore                                 # Git ignore definitions
├── README.md                                  # Local development instructions
├── eslint.config.js                           # ESLint configuration
├── index.html                                 # Single Page Application HTML shell
├── package.json                               # Dependencies & build scripts
├── postcss.config.js                          # PostCSS plugin registration (Tailwind, Autoprefixer)
├── tailwind.config.js                         # Design system tokens, color scales & keyframes
├── vite.config.js                             # Vite configuration (proxy & dist outDir)
├── public/                                    # Static assets served at root
│   ├── favicon.svg                            # Application favicon
│   └── audio/
│       └── demo_german_story.mp3              # Demonstration audio for karaoke reader
└── src/
    ├── main.jsx                               # Application entrypoint (StrictMode, createRoot)
    ├── App.jsx                                # Central Router declaration, Layout wrapper & Toaster
    ├── App.css                                # Root application styles
    ├── index.css                              # Baseline stylesheet
    ├── styles/
    │   └── index.css                          # Tailwind layers, glassmorphic cards, typography & animations
    ├── api/
    │   └── axios.js                           # Axios HTTP singleton, auth injection, timezone headers & 401 interceptor
    ├── contexts/
    │   └── AuthContext.jsx                    # Authentication context, JWT storage, profile updates & role checks
    ├── hooks/
    │   ├── useSubjects.js                     # Shared subject & topic taxonomy management with inline creation
    │   └── useDifficultWords.js               # Reactive bookmarking store with auto-paginated "Difficult Words - Vol X" decks
    ├── data/
    │   └── demoKaraokeStory.json              # Canonical German demonstration story ("Die Schildkröte und der Hase")
    ├── assets/
    │   ├── hero.png                           # Marketing hero graphic
    │   ├── vite.svg                           # Vite logo asset
    │   └── react.svg                          # React logo asset
    ├── utils/
    │   ├── downloadTemplateDoc.js             # Client-side DOCX generator for quiz & note bulk imports
    │   └── downloadKaraokeTemplate.js         # JSON template generator & normalizer for karaoke alignment imports
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx                     # Role-aware navigation header with mobile drawer & profile menu
    │   │   ├── ProtectedRoute.jsx             # Role-based route guard enforcing authentication & permission levels
    │   │   ├── Pagination.jsx                 # Standardized 6-item pagination control with dynamic page links
    │   │   ├── Loader.jsx                     # Loading spinners & full-page loader components
    │   │   ├── EmptyState.jsx                 # Reusable empty data placeholder graphic & action CTA
    │   │   └── StarBookmarkButton.jsx         # Interactive star toggle button syncing with Difficult Words decks
    │   ├── dashboard/
    │   │   ├── TodayPerformance.jsx           # Lightweight daily summary chips (notes, quizzes, karaoke, flashcards)
    │   │   └── YesterdayPerformance.jsx       # Historical yesterday performance benchmark
    │   ├── quiz/
    │   │   ├── CodeSnippetQuestion.jsx        # Code-MCQ question editor and taking UI with highlight.js syntax highlighting
    │   │   └── MatchPairsQuestion.jsx         # Match the Pairs question editor, taking widget & review comparison display
    │   ├── lingodolphy/
    │   │   └── LingoLessonModal.jsx           # Fullscreen 8-stage interactive lesson runner with Web Speech & Web Audio APIs
    │   ├── notes/
    │   │   └── KaraokeNoteModal.jsx           # Modal for creating/editing karaoke notes, audio uploads & JSON alignment
    │   ├── curriculum/
    │   │   ├── LessonEditorModal.jsx          # Comprehensive multi-stage curriculum lesson builder
    │   │   ├── UnitOutlineModal.jsx           # Unit title, description, and CEFR milestone metadata editor
    │   │   └── BulkUploadModal.jsx            # Bulk JSON import modal for entire curriculum unit batches
    │   └── editor/
    │       └── TipTapImage.js                 # Custom TipTap image extension with responsive attributes
    └── pages/
        ├── Landing.jsx                        # Public marketing page with hero, live statistics & feature showcases
        ├── Login.jsx                          # Authentication sign-in form
        ├── Register.jsx                       # New learner account registration form
        ├── Dashboard.jsx                      # Central learner & trainer dashboard with stat cards & quick actions
        ├── NotesPage.jsx                      # Notes directory with 6-item pagination, search & tag filtering
        ├── NoteDetailPage.jsx                 # Note reader supporting rich-text, sandboxed HTML slides & karaoke mode
        ├── NoteEditorPage.jsx                 # Note creation & editing suite (TipTap rich text, DOCX import, HTML slide upload)
        ├── KaraokeNoteReader.jsx              # Standalone interactive word-synchronized audio reader & Sprechen practice engine
        ├── VideosPage.jsx                     # YouTube video catalog with subject & topic filtering
        ├── VideoDetailPage.jsx                # Responsive 16:9 YouTube video player with study notes
        ├── VideoFormPage.jsx                  # Video embedding & editing interface for trainers/admins
        ├── QuizzesPage.jsx                    # Quiz directory with subject/topic filtering and pass/fail indicators
        ├── QuizFormPage.jsx                   # Quiz authoring interface (MCQ, True/False, Code-MCQ, Match Pairs, DOCX bulk)
        ├── QuizTakePage.jsx                   # Timed exam interface with question navigation, flagging, and sessionStorage persistence
        ├── QuizReviewPage.jsx                 # Post-exam review with circular score chart, correct/incorrect badges & bookmarking
        ├── FlashcardsPage.jsx                 # Flashcard deck catalog with progress indicators
        ├── FlashcardFormPage.jsx              # Flashcard deck creation & card editing suite with DOCX bulk import
        ├── StudyPage.jsx                      # 3D interactive flashcard flip study session with spaced repetition tracking
        ├── LingoDolphyPage.jsx                # Gamified language learning archipelago with serpentine path & economy status
        ├── CurriculumPage.jsx                 # Curriculum Studio managing languages, CEFR levels, units, and lesson sequences
        ├── ActivityHistoryPage.jsx            # Weekly activity breakdown with calendar-day grouping and study duration charts
        ├── ProfilePage.jsx                    # Learner profile settings, password update & account statistics
        ├── AdminPage.jsx                      # User management, role provisioning (trainers/admins), and taxonomy controls
        ├── AdminPagesPage.jsx                 # CMS dynamic pages directory (status, slug copy, views, creation links)
        ├── PageEditorPage.jsx                 # Custom CMS page builder with slug routing, metadata, and TipTap editor
        └── PublicPageView.jsx                 # Dynamic public renderer for custom CMS pages at `/:slug`
```

### Module Responsibilities Matrix

| Module / Component | Path | Primary Responsibilities | Direct Dependencies |
| :--- | :--- | :--- | :--- |
| **App Routing & Root** | `src/App.jsx` | Top-level declarative routing, ProtectedRoute binding, Layout shell, global Toast container | `react-router-dom`, `react-hot-toast`, `AuthContext` |
| **HTTP Client** | `src/api/axios.js` | Axios singleton instance, Bearer token injection, Local date/timezone headers, Auto 401 logout | `axios` |
| **Auth Context** | `src/contexts/AuthContext.jsx` | User authentication state, LocalStorage hydration, Login/Register/Logout methods, Profile updates | `axios`, `react-hot-toast` |
| **Difficult Words Store** | `src/hooks/useDifficultWords.js` | Singleton pub/sub reactive store managing difficult word bookmarks into 10-card "Difficult Words - Vol X" decks | `axios`, `react-hot-toast` |
| **Subject Taxonomy Hook**| `src/hooks/useSubjects.js` | Fetches subjects & embedded topics, provides inline creation utilities for subjects and topics | `axios`, `react-hot-toast` |
| **Interactive Lesson** | `src/components/lingodolphy/LingoLessonModal.jsx` | 8-stage gamified exercise engine (`word_match`, `listen_tap`, `sentence_builder`, `sprechen`, etc.), Web Speech API, Web Audio chimes | Web Speech API, Web Audio API, `axios` |
| **Karaoke Audio Reader** | `src/pages/KaraokeNoteReader.jsx` | Frame-perfect word-level audio sync reader, Sprechen practice mode, -2s/+2s offset tuner, Beacon engagement tracking | HTML5 Audio, Web Speech API, `axios` |
| **Match Pairs Widget** | `src/components/quiz/MatchPairsQuestion.jsx` | Authoring form (4 left ↔ 4 right), taking UI with derangement shuffle and drag/click pairing, and review comparison | `lucide-react`, `clsx`, `StarBookmarkButton` |
| **Quiz Taker Engine** | `src/pages/QuizTakePage.jsx` | Timed examination runner, state persistence in `sessionStorage`, navigation guard, question flagger | `sessionStorage`, `axios` |
| **Curriculum Studio** | `src/pages/CurriculumPage.jsx` | Language track switcher, CEFR level tabs, section milestones, unit cards, lesson sequence drag-and-drop | `axios`, `react-hot-toast`, `Curriculum modals` |
| **Multi-Stage Editor** | `src/components/curriculum/LessonEditorModal.jsx`| Authors multi-stage lessons, uploads isolated audio to MySQL BLOBs, imports alignment JSON templates | `axios`, `react-hot-toast` |
| **CMS Pages Engine** | `src/pages/PageEditorPage.jsx` & `PublicPageView.jsx` | Custom URL (`/:slug`) page management, TipTap rich text, SEO meta descriptions, public view rendering | `@tiptap/react`, `axios` |

---

## 2. Architecture Overview

### 2.1 React 18 Core & Concurrency
The application is constructed on React 18.2.0 leveraging modern features:
- **Root Mounting via `createRoot`**: Configured in `src/main.jsx`, wrapping the application inside `<StrictMode>` to surface unexpected side-effects during component lifecycles.
- **Automatic Batching**: Multiple state dispatches occurring across asynchronous network promises or browser event handlers (e.g. inside speech recognition callbacks) are automatically batched into a single render pass, avoiding flickering.
- **Client-Side Transitions**: State updates during course switching and audio track seeking remain fluid without blocking main thread responsiveness.

### 2.2 Vite Build Configuration (`vite.config.js`)
The application uses Vite 5.0.8 with `@vitejs/plugin-react` for Fast Refresh and Rollup-powered production compilation.

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

#### Production Build Contract
- **Output Directory**: Explicitly configured as `../backend/dist`.
- **Atomic Cleaning**: `emptyOutDir: true` wipes previous assets prior to generating new hash-versioned chunks.
- **Static Hosting Architecture**: The Node.js Express backend serves `../backend/dist` directly as static assets in production, allowing the entire LMS to run on a single unified port in containerized environments.
- **Development Reverse Proxy**: During local development on `http://localhost:5173`, requests targeting `/api` and `/uploads` are transparently forwarded to `http://localhost:5000` with `changeOrigin: true`.

### 2.3 Axios API Client Singleton (`src/api/axios.js`)
All HTTP communication with the backend passes through a configured Axios instance.

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ensure server knows the user's exact calendar date & timezone
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  config.headers['x-client-date'] = `${year}-${month}-${day}`;
  config.headers['x-timezone-offset'] = now.getTimezoneOffset();
  try {
    config.headers['x-client-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    // Fallback if unsupported
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Architectural Features of the API Client
1. **JWT Header Injection**: Retrieves the active token from `localStorage` and appends `Authorization: Bearer <token>` to all outgoing requests.
2. **Client Calendar & Timezone Awareness**: Automatically computes the client's local calendar date (`x-client-date: YYYY-MM-DD`), the UTC timezone offset in minutes (`x-timezone-offset`), and the canonical IANA timezone identifier (`x-client-timezone`, e.g., `Europe/Berlin` or `Asia/Kolkata`). This guarantees that daily activity logs, streak calculations, and today/yesterday boundaries are aggregated according to the user's local day boundaries rather than UTC server midnight.
3. **Automated 401 Unauthorized Eviction**: If any endpoint returns HTTP 401 (token expired or invalidated), the interceptor immediately clears `token` and `user` from storage and redirects the browser window to `/login`.

### 2.4 React Router Setup & Route Hierarchy (`src/App.jsx`)
The platform implements declarative routing using `react-router-dom` v6.20.0.

- **Layout Wrapper**: Renders the persistent `<Navbar />` with a top padding of `pt-24` on all standard pages. When viewing the quiz exam taker (`/quizzes/:id/take`), the navbar is automatically suppressed (`isQuizTake = true`), giving students an uncluttered, distraction-free examination screen.
- **Protected Route Guards (`ProtectedRoute.jsx`)**:
  - Unauthenticated users attempting to access protected routes are redirected to `/login` via `<Navigate to="/login" replace />`.
  - Role-based authorization: When a route defines `roles={['trainer', 'admin']}`, any student attempting to access it is redirected back to `/dashboard`.
- **Custom Dynamic CMS Routing**: Wildcard pattern `/:slug` routes to `<PublicPageView />` before the 404 handler, enabling custom landing pages, policy documents, and blog posts to be accessed at clean root-level URLs.

---

## 3. Design System & Theme Tokens

The web application features an ultra-modern dark glassmorphism theme designed around oceanic and cyan visual motifs.

### 3.1 Color Palette & Tokens (`tailwind.config.js`)

```javascript
theme: {
  extend: {
    colors: {
      dolphin: {
        50: '#eef6ff',
        100: '#d9ebff',
        200: '#bbdaff',
        300: '#8cc3ff',
        400: '#56a3ff',
        500: '#2d7fff',
        600: '#1a5ef5',
        700: '#1347e1',
        800: '#163ab6',
        900: '#18358f',
        950: '#142157',
      },
      ocean: {
        50: '#f0fdf9',
        100: '#ccfbee',
        200: '#99f5dd',
        300: '#5de8c8',
        400: '#2dd3af',
        500: '#14b897',
        600: '#0c9279',
        700: '#0d7563',
        800: '#0e5e50',
        900: '#0e4d43',
      },
    },
  }
}
```

#### Semantic Color Applications
- **Brand Primary (`dolphin-500` - `#2d7fff`)**: Primary CTA buttons, active route tabs, selected borders, progress fills.
- **Brand Secondary (`ocean-500` - `#14b897`)**: Success accents, audio waveforms, secondary CTAs, gradients.
- **Background Baseline (`gray-950` - `#030712`)**: Deep black-slate canvas layered with fixed radial gradients:
  - Top-left glow: `radial-gradient(ellipse at 20% 20%, rgba(45, 127, 255, 0.08) 0%, transparent 50%)`
  - Bottom-right glow: `radial-gradient(ellipse at 80% 80%, rgba(20, 184, 151, 0.06) 0%, transparent 50%)`
- **Gamification Colors**:
  - Green (`#58CC02` / `#46A302`): Completed stepping stones, correct pronunciation, high accuracy scores.
  - Cyan (`#1CB0F6` / `#1899D6`): Available active stepping stone, pronunciation active listening state.
  - Orange (`#FF9600` / `#D97D00`): Streak flames, treasure chests, milestone sections.
  - Rose (`#EF4444` / `#F43F5E`): Oxygen energy hearts, microphone recording pulse, error feedback.
  - Purple (`#8B5CF6` / `#7C3AED`): Match the Pairs widgets, code questions, vocabulary decks.

### 3.2 Typography Tokens
- **Font Family**: Google Fonts `Inter` (`wght@300;400;500;600;700;800;900`), falling back to `system-ui, sans-serif`.
- **Code Typography**: Monospace font family applied to syntax-highlighted code blocks (`highlight.js`) and `.ProseMirror pre code`.
- **Text Hierarchies**:
  - Display / Hero: `text-3xl font-black tracking-tight text-white`
  - Section Headings: `text-xl sm:text-2xl font-black text-white`
  - Body Text: `text-sm text-gray-300 leading-relaxed`
  - Micro-labels & Badges: `text-xs font-bold uppercase tracking-wider`

### 3.3 Component Styling & Glassmorphic Classes (`src/styles/index.css`)

```css
/* Glass morphism card */
.glass-card {
  @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl;
}

.glass-card-hover {
  @apply glass-card transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1;
}

/* Gradient text */
.gradient-text {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-dolphin-400 to-ocean-400;
}

/* Buttons */
.btn-primary {
  @apply px-6 py-3 bg-gradient-to-r from-dolphin-600 to-dolphin-500 text-white font-semibold rounded-xl
         hover:from-dolphin-500 hover:to-dolphin-400 transition-all duration-200
         shadow-lg shadow-dolphin-900/30 hover:shadow-dolphin-800/40 hover:-translate-y-0.5
         active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}

.btn-secondary {
  @apply px-6 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20
         hover:bg-white/15 hover:border-white/30 transition-all duration-200
         hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50;
}

.btn-danger {
  @apply px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg border border-red-500/30
         hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200;
}

/* Input styles */
.input-field {
  @apply w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
         focus:outline-none focus:ring-2 focus:ring-dolphin-500/50 focus:border-dolphin-500/50
         transition-all duration-200;
}

/* 3D Flip Card */
.flip-card { perspective: 1000px; }
.flip-card-inner {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  position: relative;
}
.flip-card-inner.flipped { transform: rotateY(180deg); }
.flip-card-front, .flip-card-back {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flip-card-back { transform: rotateY(180deg); }
```

---

## 4. State Management & Hooks

### 4.1 Authentication Context (`src/contexts/AuthContext.jsx`)
`AuthContext` provides global session state without requiring heavy external state libraries (such as Redux).

- **Hydration**: Initializes `user` synchronously from `localStorage.getItem('user')` wrapped in a `try...catch` block.
- **Methods**:
  - `login(email, password)`: Dispatches `POST /api/auth/login`, stores JWT token and user profile in `localStorage`, updates state, triggers greeting toast.
  - `register(name, email, password, role)`: Dispatches `POST /api/auth/register`, persists authentication, triggers welcome toast.
  - `logout()`: Clears `token` and `user` keys from `localStorage`, resets user state to `null`.
  - `updateUser(updatedUser)`: Persists updated user profile modifications (e.g. name, avatar, bio).

### 4.2 Difficult Words Hook (`src/hooks/useDifficultWords.js`)
An advanced custom hook implementing a singleton pub/sub pattern across all mounted components.

```javascript
const listeners = new Set();
let globalBookmarkedFronts = new Set();
let globalActiveVolume = 1;
let globalCurrentCount = 0;
let globalActiveDeckId = null;
let isInitialized = false;

function notifyListeners() {
  const payload = {
    bookmarkedFronts: new Set(globalBookmarkedFronts),
    activeVolume: globalActiveVolume,
    currentCount: globalCurrentCount,
    activeDeckId: globalActiveDeckId,
  };
  listeners.forEach(cb => cb(payload));
}
```

#### Auto-Pagination Algorithm
1. **Initial Hydration**: Queries `GET /api/flashcards?limit=100`, filtering decks whose names match `/Difficult Words - Vol (\d+)/`.
2. **Volume Calculation**: Determines the highest volume number (`maxVol`).
   - If the latest volume contains fewer than 10 cards (`cards.length < 10`), it is assigned as `globalActiveDeckId`.
   - If the latest volume contains 10 cards, it seals that volume and sets `globalActiveVolume = maxVol + 1`, preparing to spawn a new volume on the next bookmark.
3. **Toggle Action**:
   - **Unbookmarking**: Removes word from local set, scans remote decks to find and remove the matching card (`PUT /api/flashcards/:id`), and triggers trash toast.
   - **Bookmarking**: Appends card to the active volume deck. If card count reaches 10, seals the deck and alerts the learner: `"Added to Difficult Words - Vol X (10/10) • Deck Complete! 🎉"`.

### 4.3 Subject Taxonomy Hook (`src/hooks/useSubjects.js`)
Manages the hierarchical subject and topic taxonomy across note and quiz editors.
- Queries `GET /api/subjects`, caching subjects with their embedded topics.
- Exposes `createSubject(name)` and `createTopic(subjectId, name)`.
- Handles duplicate conflict responses gracefully by returning the existing subject record if HTTP 409 or `err.response.data.subject` is received.
- Normalizes subject ID matching across both MongoDB ObjectId (`_id`) and MySQL integer primary keys (`id`).

---

## 5. Student Web Learning Experience

### 5.1 Course Overview, Section Accordion & Stepping Stone Path (`LingoDolphyPage.jsx`)

The learner's language progression is visualized as an archipelago map of stepping stones arranged along a 3D serpentine curve.

```
[ Active Economy Bar: Flag 🇩🇪 | Streak 🔥 12 | Oxygen ❤️ 5/5 | Pearls 💎 140 | XP ⚡ 450 ]
                               │
                Section 1: Rookie (Units 1 - 35)
                               │
            ┌──────────────────┴──────────────────┐
            │   Sticky Unit Banner: Unit 1        │
            │   "Greet and introduce yourself"    │
            └──────────────────┬──────────────────┘
                               │
                      (●) idx:0, offset: 0px    [Completed: ⭐⭐⭐]
                        \
                         (●) idx:1, offset: 45px   [Completed: ⭐⭐⭐]
                         /
                      (●) idx:2, offset:-45px   [Available: START HERE 🏝️]
                        \
                         (●) idx:3, offset: 25px   [Locked: 🔒]
                         /
                      (●) idx:4, offset:-35px   [Locked: 🔒]
                        \
                         (💎) idx:5, offset: 40px   [Treasure Chest]
```

#### Zig-Zag Sinusoidal Offset Engine
To render the serpentine island trail without heavy canvas rendering, stepping stones are dynamically offset using CSS translations:
```javascript
const zigzagOffsets = [0, 45, -45, 25, -35, 40, -20, 0];
const offset = zigzagOffsets[idx % zigzagOffsets.length];
// Applied to stone container: style={{ transform: `translateX(${offset}px)` }}
```

#### Node Visual States
1. **Completed (`node.status === 'completed'`)**: Emerald background (`#58CC02`), dark emerald bottom border (`#46A302`), white checkmark icon, and 3 golden stars (`⭐⭐⭐`).
2. **Available (`node.status === 'available'`)**: Cyan background (`#1CB0F6`), dark cyan bottom border (`#1899D6`), ring glow animation (`ring-8 ring-cyan-500/20`), bouncing mascot badge (`"START HERE"`).
3. **Treasure Chest (`node.type === 'chest'`)**: Amber-orange background (`#FF9600`), diamond emoji (`💎`).
4. **Locked (`node.status === 'locked'`)**: Charcoal stone (`#273840`), padlock icon (`Lock`), disabled pointer events.

#### 2-Step Course Switcher
1. **Step 1 (Target Language)**: German (`de`) or English (`en`).
2. **Step 2 (Instruction Language)**: If target is German, instructional language defaults to English (`en`). If target is English, learner chooses between Marathi (`mr`) or Hindi (`hi`).
3. Dispatches `POST /api/gamification/switch-course`, reloads the canonical path, and refreshes user economy statistics.

---

### 5.2 8-Stage Interactive Lesson Runner (`LingoLessonModal.jsx`)

When an available or completed stepping stone is tapped, `LingoLessonModal.jsx` mounts as a fullscreen modal running a multi-stage challenge sequence matching mobile parity.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [X]   [============= Progress Bar: 62% =============]   👩 Female   ❤️ 5   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   STAGE TYPE CONTENT AREA                                                  │
│   - word_match: 2 columns of 4 cards (Target vs Native)                    │
│   - listen_tap: Speaker button + dashed assembly line + scrambled word bank│
│   - sentence_builder: Prompt card + tray + token bubbles                   │
│   - sprechen: Word-by-word emerald illumination + real-time accuracy meter │
│   - cloze_test: Gap sentence with 3 multiple-choice cards (A, B, C)        │
│   - type_word: Text input with German Umlaut virtual buttons (ä, ö, ü, ß)  │
│   - dialogue_bubble: 🐬 Dolphin avatar + comic bubble + audio replay      │
│   - listen_select: Turtle/Normal audio speeds + comprehension questions    │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ BOTTOM DRAWER:                                                             │
│ - Idle: [Check Button]                                                     │
│ - Correct: Emerald banner [Wunderbar! Great pronunciation] [Continue]      │
│ - Wrong: Rose banner [Not quite correct. Correct: ...] [Try Again]         │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Breakdown of the 8 Stages

1. **Word Match (`word_match`)**:
   - Left column displays target language terms; right column displays native translations.
   - Independent Fisher-Yates array shuffling ensures pairs are never displayed side-by-side.
   - Tapping a target word speaks it via SpeechSynthesis.
   - Cross-column tapping evaluates matching. Correct pairs turn emerald and are added to `solvedWordIds`. Mismatched pairs trigger a rose error flash with a 700ms reset timeout.
2. **Listen and Tap (`listen_tap`)**:
   - Audio speaker button replays sentence audio.
   - Target tokens are scrambled into an available token bank.
   - Tapping tokens moves them into the dashed assembly tray; tapping placed tokens returns them to the pool.
3. **Sentence Builder (`sentence_builder`)**:
   - Displays a prompt card (`"Translate to German"` or `"Translate to English"`).
   - Learner constructs the phrase by tapping tokens in correct grammatical order.
4. **Sprechen Lip-Sync (`sprechen`)**:
   - Displays the challenge phrase. Words are tokenized and rendered as individual spans.
   - As the learner speaks, recognized words matching target tokens turn emerald (`#10B981`) in real-time.
   - Live accuracy meter (`0–100%`) displays pronunciation fidelity.
5. **Cloze Test (`cloze_test`)**:
   - Sentence with missing gap (e.g. `Ich _____ aus Berlin.`).
   - 3 multiple-choice cards labeled A, B, C with hover effects and radio selection states.
6. **Type Word (`type_word`)**:
   - Centered text input box for spelling practice.
   - Includes virtual touch buttons for German umlauts (`ä`, `ö`, `ü`, `ß`), allowing desktop learners without German keyboard layouts to type correct characters.
7. **Dialogue Bubble (`dialogue_bubble`)**:
   - Messenger conversation layout with a character avatar (Dolphin 🐬), speech bubble, and audio replay button.
   - Tests contextual conversational replies.
8. **Listen & Select (`listen_select`)**:
   - Listening comprehension challenge offering normal speed playback and turtle slow playback (0.75x) to aid beginner ear training.

#### Web Audio API Sound Chime Synthesis
Audio feedback is synthesized natively via the browser's `AudioContext` without requiring external sound files:
- **Correct Chime**: Major chord arpeggio playing staggered triangle waves at C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), and C6 (1046.50 Hz) with an exponential gain decay of 0.3s.
- **Wrong Chime**: Dual-frequency sawtooth wave starting at 220 Hz and dropping to 174.61 Hz over 0.35s.

#### Text-to-Speech Engine & Voice Persona Selection
- **Novelty Voice Filtering**: Automatically strips joke/novelty synthesizer voices (`albert`, `bells`, `cellos`, `zarvox`, `whisper`, etc.).
- **German Voice Prioritization**: Prioritizes `Anna`, `Google Deutsch`, `Marlene`, and `Vicki`.
- **English Persona Switcher**: Allows learners to toggle between `👩 Female Voice (Samantha / Jenny)` and `👨 Male Voice (Daniel / David)`, persisting the preference in `localStorage.lingo_voice_persona`.

---

### 5.3 Web Speech Recognition API Integration

The desktop web application implements pronunciation assessment using the browser's native `webkitSpeechRecognition` engine.

```javascript
// Clean punctuation and normalize symbols to words
function cleanSpeechWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/(\d+)\s*([€$£%])/g, '$1 $2')
    .replace(/€/g, ' euro ')
    .replace(/\$/g, ' dollar ')
    .replace(/%/g, ' prozent ')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'«»„“”’]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// Fuzzy matching with Umlaut normalization & character edit distance
function isFuzzyWordMatch(w1, w2) {
  if (!w1 || !w2) return false;
  if (w1 === w2) return true;
  if (isNumberOrSymbolEquivalent(w1, w2)) return true;

  const norm1 = w1.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  const norm2 = w2.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  if (norm1 === norm2) return true;

  if (Math.abs(norm1.length - norm2.length) <= 1) {
    let diff = 0;
    const minLen = Math.min(norm1.length, norm2.length);
    for (let i = 0; i < minLen; i++) {
      if (norm1[i] !== norm2[i]) diff++;
    }
    return diff <= 1;
  }
  return false;
}
```

#### Speech Recognition Execution Lifecycle
1. **Engine Instantiation**: Initialized with `lang = 'de-DE'` (or `en-US`), `continuous = true`, and `interimResults = true`.
2. **Real-Time Word Matching**: On every speech event (`recognition.onresult`), interim transcripts are compared against the target sentence tokens. Spoken words that fuzzy-match target words immediately receive green illumination.
3. **Number & Currency Transliteration**: Symbol mapping tables convert currency symbols and numeric digits (e.g. `3€` ↔ `drei euro`, `20` ↔ `zwanzig`), ensuring spoken German numbers match written numerals.
4. **Dual Submission Mechanism**:
   - **Automated Silence Timer**: Resets on every detected word. When 3.0 seconds of continuous silence elapse after speech, automatically evaluates accuracy.
   - **Manual "Done Speaking" Button**: Allows confident learners to evaluate immediately without waiting for the silence timer.
5. **Passing Threshold**: Speech challenges pass when total sentence pronunciation accuracy is ≥ 75% (or 100% for short phrases of ≤ 4 words).

---

### 5.4 Interactive Karaoke Story Reader (`KaraokeNoteReader.jsx`)

The Karaoke Note Reader provides word-level audio-synced text reading and sentence-by-sentence speaking practice.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [← Back]  Die Schildkröte und der Hase   [Timing Offset: -0.25s | 0s | +0.25s]
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   Es war einmal eine kleine Schildkröte und ein schneller Hase.           │
│   (Once upon a time there was a little tortoise and a fast hare.)          │
│                                                                            │
│   [ACTIVE PLAYING SENTENCE]                                                │
│   Der  Hase  lachte  oft  über  die  [langsame]  Schildkröte.             │
│   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^   ▲                                 │
│   (Meaning: The hare often laughed at the slow tortoise.)                  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ SPRECHEN CHALLENGE CARD (Auto-paused at sentence boundary):                │
│ "Der Hase lachte oft über die langsame Schildkröte."                      │
│ Meaning: The hare often laughed at the slow tortoise.                      │
│ [🎙️ Speak Aloud]   [Done Speaking (Check Now ✓)]   Chances left: ● ● ○    │
├────────────────────────────────────────────────────────────────────────────┤
│ CONTROLS:                                                                  │
│ [ ▶ Play / ⏸ Pause ]  [ 0:14 / 0:42 ]  [==== Seekbar ====]  [ 0.75x | 1.0x ]│
└────────────────────────────────────────────────────────────────────────────┘
```

#### Key Architecture & Invariants
1. **Word-Level Audio Synchronization**: Tracks HTML5 Audio `currentTime` against millisecond timestamps (`start`, `end`). Words are dynamically wrapped in `<span className={clsx(isActiveWord && "bg-cyan-500/30 text-cyan-300 font-bold")}>`.
2. **Real-Time Timing Offset Tuner**: Bluetooth audio devices often introduce latency (100–300ms). The UI includes an offset slider and quick calibration buttons (`-0.25s`, `0s`, `+0.25s`), computing `effectiveTime = Math.max(currentTime + timingOffset, 0)`.
3. **Strict English Understanding Constraint**: English translations appear strictly beneath German sentences for understanding. English is **never spoken aloud via TTS/audio** and **never interrupts with modal popups**.
4. **Sprechen Mode Auto-Pause**: When `isSprechenMode` is active, audio playback automatically halts when `effectiveTime >= sentence.end`. `lastPausedSentenceRef` prevents stale re-pause loops when seeking backwards.
5. **Engagement Beacon Tracking**: Calculates active reading and audio listening seconds. When the user navigates away or closes the tab, `navigator.sendBeacon` transmits study duration to `POST /api/notes/:id/track` (minimum 15-second qualification threshold).

---

### 5.5 Match the Pairs Web Widget (`MatchPairsQuestion.jsx`)

Provides a 4-item pairing interface used in quizzes and curriculum exercises.

```
PROMPTS (Fixed Column)                         ANSWERS (Deranged Pool)
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│ 1. Guten Morgen                 │           │ [:::] Good evening              │
│    └─► [ Good morning ]  [Unlink]│           ├─────────────────────────────────┤
├─────────────────────────────────┤           │ [:::] Good morning  (PAIRED)    │
│ 2. Auf Wiedersehen              │           ├─────────────────────────────────┤
│    └─► Drop or tap answer to match│◄──Drag───┤ [:::] Goodbye                   │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ 3. Danke schön                  │           │ [:::] Thank you very much       │
│    └─► Drop or tap answer to match│           └─────────────────────────────────┘
└─────────────────────────────────┘
```

#### Features & Algorithms
- **Derangement Shuffle (`getDerangedRightItems`)**: Uses a randomized permutation algorithm ensuring that zero items start opposite their correct match on initial render.
- **Dual Interaction Support**:
  1. **HTML5 Drag-and-Drop**: Draggable answer chips (`draggable={true}`, `onDragStart`, `onDrop`) dragged directly onto prompt drop targets.
  2. **Tap-to-Pair**: Clicking a left prompt highlights it; clicking an unplaced answer on the right instantly establishes a link.
- **Unlinking & Reset**: Individual pairs can be detached with an unlink icon (`Unlink`); a Reset button clears all active links simultaneously.
- **Review Comparison Mode (`MatchPairsReview`)**: Post-exam screen displays submitted pairs side-by-side with correct matches, highlighting correct links in green and incorrect links in strikethrough red with an integrated `StarBookmarkButton`.

---

### 5.6 Quiz Taking & Comprehensive Historical Review Screen

#### Quiz Taking Engine (`QuizTakePage.jsx`)
- **Exam Session Persistence**: Survives accidental reloads by persisting state in `sessionStorage` under `quiz_${id}_${attemptId}_state`:
  ```json
  {
    "startedAt": "2026-10-27T10:00:00.000Z",
    "endTime": 1793095800000
  }
  ```
- **Navigation Guard**: Binds `window.addEventListener('beforeunload')` and intercepts browser history back buttons via `popstate` to warn students before abandoning active exams.
- **Question Navigator**: Left-side grid displays question statuses (Answered, Current, Flagged for Review).

#### Post-Exam Review Screen (`QuizReviewPage.jsx`)
- **Circular Progress Metric**: SVG circle ring displaying overall score percentage, color-coded green (`#22c55e`) for pass (≥70%) or red (`#ef4444`) for fail.
- **Comprehensive Item Breakdown**: Displays every question, the student's selected answer, the correct answer, points earned, and detailed trainer explanations.
- **Star Bookmark Integration**: Every missed question features a `StarBookmarkButton` allowing students to instantly add difficult vocabulary or quiz concepts into their flashcard decks.

---

### 5.7 Activity & Performance Dashboard

#### Daily Summary Chips (`TodayPerformance.jsx`)
Lightweight component rendered on the student dashboard. Queries `/api/activity/summary?date=YYYY-MM-DD&countsOnly=true` to instantly fetch daily completed notes, quizzes, flashcards, and karaoke audio minutes without loading heavy historical tables.

#### Weekly Activity Breakdown (`ActivityHistoryPage.jsx`)
- **Calendar-Day Grouping**: Groups study logs into localized sections:
  - `"TODAY"` (Dolphin Blue badge)
  - `"YESTERDAY"` (Blue badge)
  - `"DAY BEFORE YESTERDAY (DAY OF WEEK)"` (Purple badge)
  - Specific weekdays (Monday, Tuesday, etc.)
- **Study Duration Calculation**: Sums total engagement seconds across reading, quiz taking, and audio listening, displaying formatted hours and minutes (`e.g., 1h 45m`) beside each daily header.
- **Activity Filter Tabs**: Filters between All Activities, Quizzes, Notes, Flashcards, and Audio Karaoke.

---

## 6. Admin CMS & Course Builder

### 6.1 Curriculum & Lesson Studio (`CurriculumPage.jsx`)
The administrative command center for authoring structured language paths.
- **Language & Level Matrix**: Filters curriculum lessons by learning language (`de`, `en`, `es`, `fr`, etc.), native instruction language (`en`, `hi`, `mr`), and CEFR level (`A1`, `A2`, `B1`, `B2`).
- **Section & Unit Management**:
  - Section tabs: Section 1 Rookie (Units 1–35), Section 2 Explorer (Units 36–70), Section 3 Traveler (Units 71–105).
  - Unit outline editor (`UnitOutlineModal.jsx`): Authors unit titles, subtitles, CEFR descriptions, and sequence index.
- **Lesson Sequence Sequencing**:
  - Reorder buttons (`ArrowUp`, `ArrowDown`) adjust lesson positioning within a unit.
  - Live / Draft switch: Defaults new lessons to `isLive = false` (Draft) to ensure unpublished content never surfaces on student maps until explicitly vetted.

---

### 6.2 Multi-Stage Lesson Editor (`LessonEditorModal.jsx`)

The lesson editor provides an authoring workspace for all 8 lesson stages.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Edit Lesson: "Greetings & Polite Phrases"                       [Draft/Live]│
├────────────────────────────────────────────────────────────────────────────┤
│ Stage 1: Word Match Pairs                                                  │
│   Target: "Hallo"         Native: "Hello"                                  │
│   Target: "Danke"         Native: "Thank you"                              │
│   [+ Add Pair]   [Download Template JSON]   [Upload Pairs JSON]            │
├────────────────────────────────────────────────────────────────────────────┤
│ Stage 2: Listen & Tap                                                      │
│   Sentence: "Guten Morgen, wie geht es dir?"                               │
│   Stage Audio: [ ⬆ Upload Audio to MySQL Database ] (guten_morgen.mp3)     │
│   Word Timestamps: [ Upload Word-Level Timestamps JSON ]                   │
│   Distractor Tokens: "Kaffee", "Milch", "Abend"                            │
├────────────────────────────────────────────────────────────────────────────┤
│ Stage 3: Sprechen Lip-Sync Pronunciation                                   │
│   German Prompt: "Ich heiße Anna"                                          │
│   English Meaning: "My name is Anna"                                       │
│   Demonstration Audio: [ ⬆ Upload Voice Track to MySQL Database ]          │
│   Lip-Sync Timestamps: [ Upload Word Timestamps JSON ]                     │
├────────────────────────────────────────────────────────────────────────────┤
│ Stage 4: Synced Audio Karaoke Story                                        │
│   Story Audio: [ ⬆ Upload Story Audio to MySQL Database ]                  │
│   Alignment JSON: [ Upload Frame-Accurate Story JSON ]                     │
├────────────────────────────────────────────────────────────────────────────┤
│ [Cancel]                                            [Save Lesson & Stages] │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Audio Upload Directly to Database Binary BLOB
Audio files uploaded through `LessonEditorModal.jsx` or `KaraokeNoteModal.jsx` are transmitted via `multipart/form-data` to `/api/notes/upload-audio`. The backend converts the audio file into a raw binary BLOB in MySQL's `karaoke_audios` table, streaming it back to clients via `/api/notes/audio/:id`. This eliminates external cloud storage dependencies (such as AWS S3 or Google Cloud Storage) and simplifies self-hosting.

---

### 6.3 Exercise & Quiz Authoring Suite (`QuizFormPage.jsx`)
- Supports 4 distinct question types:
  1. Multiple Choice (`multiple-choice`): 4 options, radio selector for correct answer.
  2. True/False (`true-false`): Binary options.
  3. Code Snippet MCQ (`code-mcq`): Programming language selector (Python, JS, Java, C++, SQL, PHP), code block with syntax highlighting.
  4. Match the Pairs (`match_pairs`): Exactly 4 left prompts and 4 right answers.
- **Bulk Import via DOCX**: Admins can download a pre-formatted Word document template (`downloadQuizTemplate()`), populate questions in plain text, and upload it via `POST /api/quizzes/bulk-upload`.

---

### 6.4 User Management & CMS Pages (`AdminPage.jsx`, `AdminPagesPage.jsx`, `PageEditorPage.jsx`)
- **User Directory**: View all registered users with pagination, role filters, active/inactive toggling, trainer account provisioning, and account deletion.
- **Custom Dynamic CMS Pages**:
  - `AdminPagesPage.jsx` manages public pages with status toggles (`draft` vs `published`), search, view counters, and link copy buttons.
  - `PageEditorPage.jsx` provides a full TipTap rich text editor, custom slug configuration (`/:slug`), featured images, and meta descriptions.
  - `PublicPageView.jsx` dynamically renders published pages at root URLs (e.g. `/privacy-policy`, `/terms`, `/about`).

---

## 7. Audio Synchronization & Alignment Tools

The platform includes two specialized companion tools located in the workspace for audio alignment and video generation:

```
MERNLMS/
├── sync_your_audio/     # Django Python Studio for forced audio-text alignment
└── ViRemotion/          # Remotion React programmatic video & audiogram engine
```

### 7.1 `sync_your_audio` Desktop Synchronization Studio

A localized Django 5 application located in `/sync_your_audio/` that aligns raw audio files with script text to produce frame-accurate `karaoke.json` files.

#### The 5 Alignment Engines (`sync_your_audio/aligner/services.py`)
1. **Stable-Whisper Align (Recommended for Hinglish & Code-Switching)**:
   - Uses Whisper cross-attention acoustic priming with **Needleman-Wunsch / Dynamic Time Warping (DTW)** sequence alignment against exact reference text.
   - Guarantees zero word hallucinations and strictly preserves transliterated Latin script without converting it into Devanagari.
2. **WhisperX Align (Phoneme VAD & Boundary Clamping)**:
   - Snaps word start/end bounds strictly inside active vocal sound energy intervals using voice activity detection (VAD).
   - Eliminates word bleed across breaths and inter-sentence pauses.
3. **Auto Whisper AI (Faster-Whisper ASR)**:
   - Automatic speech-to-text with millisecond word timestamps using CPU int8 quantization via `faster-whisper`.
   - Used when audio exists without reference text.
4. **Waveform Silence-Aware Alignment (`pydub`)**:
   - Detects vocal silence intervals using RMS volume thresholds and maps text sentences to non-silent chunks.
5. **SRT / VTT Subtitle Converter**:
   - Parses existing `.srt` or `.vtt` subtitle files and converts them directly into DolphinCoder Karaoke JSON format.

#### Output Data Contract (`karaoke.json`)
```json
{
  "title": "Die Schildkröte und der Hase",
  "duration": 42.35,
  "sentences": [
    {
      "index": 0,
      "text": "Es war einmal eine kleine Schildkröte und ein schneller Hase.",
      "translation": "Once upon a time there was a little tortoise and a fast hare.",
      "start": 0.0,
      "end": 3.41,
      "words": [
        { "word": "Es", "clean": "Es", "start": 0.0, "end": 0.13, "sentenceIndex": 0 },
        { "word": "war", "clean": "war", "start": 0.13, "end": 0.33, "sentenceIndex": 0 },
        { "word": "Schildkröte", "clean": "Schildkröte", "start": 1.37, "end": 2.09, "sentenceIndex": 0 }
      ]
    }
  ]
}
```

---

### 7.2 `ViRemotion` Programmatic Video Generation Engine

A Remotion-based video rendering engine located in `/ViRemotion/` that converts DolphinCoder audio and alignment JSON into synchronized video clips and social audiograms.

#### Key Modules & Capabilities
- **Remotion Root Composition (`ViRemotion/src/Root.tsx`)**:
  - Configures 16:9 Landscape YouTube compositions (`1920x1080` @ 30 FPS).
  - Automatically derives frame duration: `durationInFrames = Math.ceil(storyData.duration * 30)`.
- **Captions & Lyrics Rendering (`@remotion/captions`)**:
  - Highlights spoken words synchronously as frames advance.
- **Audio Waveform Visualization (`@remotion/media-utils` & `mediabunny`)**:
  - Extracts frequency spectrums and audio energy to animate responsive sound wave bars.

---

## 8. Dependencies in `package.json`

The following table provides an exhaustive breakdown of all runtime and build dependencies specified in `frontend/package.json`:

| Package Name | Version | Role & Architectural Purpose in DolphinCoder LMS |
| :--- | :--- | :--- |
| `react` | `^18.2.0` | Core UI library providing the declarative component model, state hooks, and virtual DOM reconciliation. |
| `react-dom` | `^18.2.0` | DOM renderer mounting the React tree to `index.html` via `createRoot`. |
| `react-router-dom` | `^6.20.0` | Client-side routing engine managing URL navigation, history stack, parameters (`useParams`), and route protection. |
| `axios` | `^1.6.2` | Promise-based HTTP client managing API communication, JWT authentication, local timezone headers, and 401 interceptors. |
| `@tiptap/react` | `^2.1.13` | Headless rich-text editor framework powering `NoteEditorPage.jsx` and `PageEditorPage.jsx`. |
| `@tiptap/starter-kit` | `^2.1.13` | Standard TipTap extensions including headings (H1-H3), bold, italic, bullet lists, ordered lists, blockquotes, and code blocks. |
| `@tiptap/extension-underline` | `^2.1.13` | TipTap extension adding underline text formatting to notes. |
| `@tiptap/extension-color` | `^2.1.13` | TipTap extension enabling custom text color formatting. |
| `@tiptap/extension-text-style` | `^2.1.13` | Prerequisite style wrapper extension for TipTap font color and styling manipulation. |
| `lucide-react` | `^0.294.0` | Comprehensive icon library providing SVG iconography across navigation, editor controls, and status badges. |
| `clsx` | `^2.0.0` | Utility for conditionally constructing `className` strings cleanly across dynamic UI states. |
| `react-hot-toast` | `^2.4.1` | Lightweight, customizable notification toast engine displaying feedback across login, saving, and errors. |
| `highlight.js` | `^11.11.1` | Syntax highlighting engine powering code snippet MCQs (`CodeSnippetQuestion.jsx`) in quizzes. |
| `docx` | `^9.7.1` | Client-side JavaScript library generating real `.docx` Word documents for quiz and note bulk upload templates (`downloadTemplateDoc.js`). |
| `file-saver` | `^2.0.5` | Utility triggering native browser file download dialogs for client-generated Blobs (DOCX, JSON). |
| `react-youtube` | `^10.1.0` | React wrapper for the YouTube IFrame Player API used in `VideoDetailPage.jsx` to embed and control lesson video playback. |
| `tailwindcss` | `^3.3.6` | Utility-first CSS framework providing responsive grid utilities, design tokens, and glassmorphic styles. |
| `postcss` | `^8.4.32` | Tool for transforming CSS with JavaScript plugins, used to execute Tailwind and Autoprefixer. |
| `autoprefixer` | `^10.4.16` | PostCSS plugin parsing CSS and adding vendor prefixes to CSS rules for cross-browser compatibility. |
| `vite` | `^5.0.8` | Next-generation frontend build tool and local development server with Fast Refresh. |
| `@vitejs/plugin-react` | `^4.2.1` | Official Vite plugin providing Babel-based Fast Refresh support for React components. |

---

## 9. Verification & Architectural Integrity Checklist

- [x] **Vite Build Directory**: Confirmed output points to `../backend/dist` with `emptyOutDir: true` (`vite.config.js`).
- [x] **No Mock Placeholders**: Every file, component, hook, and API route referenced matches source code on disk.
- [x] **Web Speech Support**: Uses standard `window.SpeechRecognition || window.webkitSpeechRecognition` with graceful error handling and microphone permission alerts.
- [x] **Karaoke Sync Constraints**: Verified that English translations remain strictly visual for understanding without TTS interruptions.
- [x] **Database BLOB Audio**: Audio upload endpoint `/api/notes/upload-audio` converts audio files directly to binary records in MySQL `karaoke_audios` table.
- [x] **Session Persistence**: Quiz timers and answers persist across page reloads in `sessionStorage` under `quiz_{quizId}_{attemptId}_state`.
- [x] **Derangement Algorithm**: Verified that Match the Pairs uses derangement shuffling to ensure items never start aligned with their answers.
