# SpeedUpExam / DolphinCoder LMS — Latest Code & Features Documentation

> **Last Updated:** April 6, 2026  
> **Version:** v5  
> **Stack:** MERN (MongoDB, Express, React, Node.js)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Core Features](#core-features)
4. [Database Models & Relationships](#database-models--relationships)
5. [API Endpoints](#api-endpoints)
6. [Frontend Pages & Routes](#frontend-pages--routes)
7. [Authentication & Authorization](#authentication--authorization)
8. [UI/UX Design System](#uiux-design-system)
9. [Configuration & Environment](#configuration--environment)
10. [Deployment](#deployment)
11. [Notable Implementation Details](#notable-implementation-details)

---

## Architecture Overview

This is a **monorepo** containing both backend and frontend code under a single Git repository:

```
speedupexam/
├── backend/          # Express.js API server + serves built frontend in production
├── frontend/         # React 18 SPA (Vite build output → ../backend/dist)
└── package.json      # Root convenience scripts
```

**Production Build Integration:**  
The backend's `postinstall` script automatically builds the frontend:
```bash
cd ../frontend && npm install && npx vite build
```
Vite's `outDir` is configured to `../backend/dist`, so the Express server serves the compiled SPA as static files in production.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT + bcryptjs** | Authentication & password hashing |
| **Multer** | File upload handling (memory storage for .docx) |
| **Mammoth** | .docx parsing for bulk quiz uploads |
| **Helmet** | HTTP security headers |
| **CORS** | Cross-origin resource sharing |
| **express-rate-limit** | Rate limiting (global + auth-specific) |
| **Morgan** | HTTP request logging (dev only) |
| **PM2** | Production process manager (cluster mode) |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router DOM v6** | Client-side routing |
| **Tailwind CSS v3** | Utility-first styling with custom dark glass-morphism theme |
| **Tiptap v2** | Rich text editor (StarterKit + Underline) |
| **react-youtube** | YouTube video embedding |
| **Axios** | HTTP client with interceptors |
| **react-hot-toast** | Toast notifications |
| **lucide-react** | Icon library |
| **clsx** | Conditional className utility |

---

## Core Features

### 1. Authentication
- Student registration (email, password, name)
- Login with rate limiting (20 requests / 15 min)
- JWT stored in `localStorage`, sent as Bearer token
- Auto-redirects based on auth state (logged-in users redirected away from login/register/landing)

### 2. Role-Based Access Control (RBAC)
| Role | Capabilities |
|---|---|
| **student** (default) | Read all notes, watch videos, take quizzes, study public flashcards. Cannot create content. |
| **trainer** | CRUD own notes, videos, quizzes, flashcards. Students see their content. |
| **admin** | All trainer capabilities + full user management (create trainers, deactivate/delete users) |

### 3. Dashboard
- Stat cards (notes count, videos count, quizzes count, flashcard decks)
- Quick action links (create note, watch videos, take quiz, study flashcards)
- Recent notes display

### 4. Notes System
- Rich text editing via Tiptap (headings, bold, italic, underline, lists, code blocks, etc.)
- Full toolbar with formatting controls, color picker, link insertion
- Tag-based organization
- Color-coded notes (default, blue, green, yellow, pink, purple)
- Pin/Unpin support for important notes
- Full-text search + tag filtering
- **Asymmetric access model:** Students can read ALL notes but only trainers/admins can create/edit/delete

### 5. Video Library
- YouTube video integration — add by URL, auto-extracts video ID & generates thumbnail
- Public viewing (no auth required to browse/watch)
- View count tracking
- Tag-based organization
- Search + pagination
- Responsive grid layout with YouTube thumbnail previews

### 6. Quiz Engine
- Manual question builder with multiple-choice and true/false question types
- Per-question points, options, correct answer, and explanation
- Bulk quiz upload via `.docx` file (parsed with Mammoth)
- Configurable settings: passing score, time limit (optional), shuffle questions, attempt limits
- **Quiz Taking Flow:**
  - Timer (when time limit is set)
  - Progress bar with question navigation
  - Real-time answer tracking
  - Auto-grading on submission
  - Results screen with circular animated score gauge
  - Pass/Fail indicator with percentage
- Quiz attempt history per student
- Results dashboard for trainers/admins to view all student attempts
- Difficulty badges (Easy/Medium/Hard based on question count)

### 7. Flashcard System
- Deck creation with customizable cards (front, back, hint)
- Color-coded decks (same palette as notes)
- Public/Private visibility toggle
- Tag support
- Auto-calculated card count
- **Study Mode:**
  - 3D flip card animation (CSS perspective + transform)
  - Self-rating system: "Known" / "Still Learning"
  - Session progress tracking
  - Spaced-repetition-style status tracking: unseen → reviewing → known/unknown
  - Completion screen with mastery percentage
  - Persistent progress saving per student per deck

### 8. Profile Management
- Update name and bio
- Change password (requires current password)
- Avatar support

### 9. Admin Panel
- User management table with tabbed views (All / Trainers / Students)
- Create trainer accounts
- Activate/Deactivate users (cannot deactivate admins)
- Delete users (cannot delete admins)
- Update trainer details (name, email, password)
- Role filtering and pagination

### 10. Health Check
- `GET /api/health` returns service status and version

---

## Database Models & Relationships

### User
```
name, email (unique, lowercase), password (hashed, select:false),
role: student|trainer|admin, avatar, bio, isActive, lastLogin, timestamps
```
**Methods:** `matchPassword()`, `getSignedJwtToken()`  
**Hooks:** Pre-save auto-hash password with configurable BCRYPT_ROUNDS

### Note
```
owner → User (required), title (max 200), content (HTML), tags [String],
isPinned, color: default|blue|green|yellow|pink|purple, timestamps
```
**Indexes:** `{owner}`, `{owner, tags}`, text on `{title, content}`

### Video
```
addedBy → User (required), title, description (max 2000),
youtubeUrl, youtubeVideoId (auto-extracted), thumbnailUrl (auto-generated),
tags [String], isPublic (default true), viewCount (0), timestamps
```
**Indexes:** `{addedBy}`, `{youtubeVideoId}`, text on `{title, description}`

### Quiz
```
createdBy → User (required), title, description, questions [Question],
totalPoints (auto-calculated), passingScore (70), timeLimit (0=none),
shuffleQuestions, isPublished, attemptLimit (nullable), tags [String], timestamps
```
**Question subdoc:** `text, type: multiple-choice|true-false, options [String], correctIndex, explanation, points (1)`  
**Hooks:** Pre-save auto-calculates `totalPoints`  
**Indexes:** `{createdBy}`, `{isPublished}`, text on `{title, description}`

### QuizAttempt
```
quiz → Quiz, student → User, answers [{questionId, chosenIndex, isCorrect, pointsEarned}],
score, maxScore, percentage, passed, attemptNumber, startedAt, submittedAt,
timeTakenSecs, timestamps
```
**Indexes:** `{quiz, student}`, `{student}`  
**Cascade:** Deleted when Quiz is deleted

### Flashcard
```
owner → User (required), deckName (max 100), description, cards [Card],
color: default|blue|green|yellow|pink|purple, isPublic (false), tags [String],
cardCount (auto-calculated), timestamps
```
**Card subdoc:** `front (max 500), back (max 1000), hint`  
**Hooks:** Pre-save auto-calculates `cardCount`  
**Indexes:** `{owner}`, text on `{deckName, description}`

### FlashcardProgress
```
student → User, flashcard → Flashcard,
cardResults [{cardId, status: unseen|known|unknown|reviewing, lastReviewedAt, reviewCount}],
sessionCount, masteredCount, lastStudiedAt, timestamps
```
**Indexes:** Unique compound `{student, flashcard}`  
**Cascade:** Deleted when Flashcard is deleted

---

## API Endpoints

### Auth `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register (creates student) |
| POST | `/login` | Public | Login (rate-limited) |
| GET | `/me` | Protected | Get current user |
| PUT | `/profile` | Protected | Update name, bio, avatar |
| PUT | `/password` | Protected | Change password |

### Notes `/api/notes`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Protected | List (students see all, staff see own). Supports `q`, `tag`, pagination |
| POST | `/` | Trainer/Admin | Create note |
| GET | `/:id` | Protected | Get single note |
| PUT | `/:id` | Trainer/Admin | Update own note |
| DELETE | `/:id` | Trainer/Admin | Delete own note |
| PATCH | `/:id/pin` | Trainer/Admin | Toggle pin |

### Videos `/api/videos`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List public videos. Supports `q`, `tag`, pagination |
| GET | `/:id` | Public | Get video (increments viewCount) |
| POST | `/` | Trainer/Admin | Add video (auto-extracts YouTube ID) |
| PUT | `/:id` | Trainer/Admin (owner) | Update video |
| DELETE | `/:id` | Trainer/Admin (owner) | Delete video |

### Quizzes `/api/quizzes`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List published (strips answers). Supports `q`, `tag`, pagination |
| GET | `/:id` | Protected | Get quiz (owners see answers, others see sanitized) |
| POST | `/` | Trainer/Admin | Create quiz |
| PUT | `/:id` | Trainer/Admin (owner) | Update quiz |
| DELETE | `/:id` | Trainer/Admin (owner) | Delete quiz (cascades attempts) |
| POST | `/:id/attempt` | Protected | Submit attempt (auto-grades, enforces limits) |
| GET | `/:id/attempts` | Protected | Get my attempts |
| GET | `/:id/results` | Trainer/Admin | Get all attempts for quiz |
| POST | `/bulk-upload` | Trainer/Admin | Upload .docx parsed into quiz |

### Flashcards `/api/flashcards`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Protected | List (own + public). Supports `q`, pagination |
| POST | `/` | Trainer/Admin | Create deck |
| GET | `/:id` | Protected | Get deck (own or public) |
| PUT | `/:id` | Trainer/Admin (owner) | Update deck |
| DELETE | `/:id` | Trainer/Admin (owner) | Delete deck (cascades progress) |
| POST | `/:id/cards` | Trainer/Admin (owner) | Add cards to deck |
| DELETE | `/:id/cards/:cardId` | Trainer/Admin (owner) | Remove card from deck |
| GET | `/:id/progress` | Protected | Get my progress |
| POST | `/:id/progress` | Protected | Save progress (upsert) |

### Admin `/api/admin`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/trainers` | Admin | Create trainer account |
| GET | `/users` | Admin | List all users (role filter, pagination) |
| PUT | `/users/:id/toggle-active` | Admin | Toggle active (can't deactivate admin) |
| DELETE | `/users/:id` | Admin | Delete user (can't delete admin) |
| PUT | `/trainers/:id` | Admin | Update trainer (name, email, password) |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Returns status + version |

---

## Frontend Pages & Routes

| Route | Component | Access | Description |
|---|---|---|---|
| `/` | `Landing.jsx` | Public → /dashboard if logged in | Hero landing page with features, stats, CTA |
| `/login` | `Login.jsx` | Public → /dashboard if logged in | Email/password login form |
| `/register` | `Register.jsx` | Public → /dashboard if logged in | Student registration |
| `/dashboard` | `Dashboard.jsx` | Protected | Stat cards, quick actions, recent notes |
| `/notes` | `NotesPage.jsx` | Protected | Notes grid with search, tag/color filters, pin support |
| `/notes/new` | `NoteEditorPage.jsx` | Trainer/Admin | Tiptap rich text editor with full toolbar |
| `/notes/:id` | `NoteDetailPage.jsx` | Protected | Read-only note view with rendered HTML |
| `/notes/:id/edit` | `NoteEditorPage.jsx` | Trainer/Admin | Edit existing note |
| `/videos` | `VideosPage.jsx` | Protected | Video grid with YouTube thumbnails, search, pagination |
| `/videos/new` | `VideoFormPage.jsx` | Trainer/Admin | Add YouTube video by URL |
| `/videos/:id` | `VideoDetailPage.jsx` | Protected | YouTube embedded player |
| `/videos/:id/edit` | `VideoFormPage.jsx` | Trainer/Admin | Edit video |
| `/quizzes` | `QuizzesPage.jsx` | Protected | Quiz grid with difficulty badges |
| `/quizzes/new` | `QuizFormPage.jsx` | Trainer/Admin | Create quiz (manual + bulk upload) |
| `/quizzes/:id/edit` | `QuizFormPage.jsx` | Trainer/Admin | Edit quiz |
| `/quizzes/:id/take` | `QuizTakePage.jsx` | Protected | Take quiz (timer, nav, results with score gauge) |
| `/flashcards` | `FlashcardsPage.jsx` | Protected | Deck grid with search, public/private badges |
| `/flashcards/new` | `FlashcardFormPage.jsx` | Trainer/Admin | Create deck with cards |
| `/flashcards/:id/edit` | `FlashcardFormPage.jsx` | Trainer/Admin | Edit deck |
| `/flashcards/:id/study` | `StudyPage.jsx` | Protected | 3D flip card study session with self-rating |
| `/profile` | `ProfilePage.jsx` | Protected | Profile settings + password change |
| `/admin` | `AdminPage.jsx` | Admin only | User management table, create trainer, activate/deactivate |
| `*` | 404 page | Public | Rocket emoji 404 with "Go Home" link |

### Common Components
- **`Navbar.jsx`** — Fixed glass-morphism pill nav with logo, links, admin link (admin only), profile dropdown
- **`ProtectedRoute.jsx`** — Route guard for auth + optional role requirements
- **`Loader.jsx`** — Exports `PageLoader`, `CardSkeleton`, `GridSkeleton(count)`, default spinner
- **`EmptyState.jsx`** — Placeholder with icon, title, description, optional action button

### Context
- **`AuthContext.jsx`** — Provides `user`, `loading`, `login()`, `register()`, `logout()`, `updateUser()`. Persists to `localStorage`. Toast notifications on actions.

### API Client
- **`axios.js`** — Configurable baseURL, 15s timeout, auto Bearer token, 401 interceptor clears auth → redirects to `/login`

---

## Authentication & Authorization

**Flow:**
1. User logs in → backend returns JWT
2. Frontend stores token in `localStorage`
3. Axios interceptor attaches `Authorization: Bearer <token>` to every request
4. Backend `protect` middleware verifies JWT, attaches `req.user` to request
5. `authorize(...roles)` middleware checks user role against allowed roles

**Security Measures:**
- Helmet (CSP disabled, COEP disabled for iframe compatibility)
- CORS with configurable `CLIENT_URL` + credentials
- Global rate limiter: 100 req / 15 min
- Auth rate limiter: 20 req / 15 min
- Body parser limit: 10mb
- Password hashing with configurable BCRYPT_ROUNDS (default 10, recommended 12 for prod)
- Password excluded from queries by default (`select: false`)
- Token expiry configurable (default 7d)

---

## UI/UX Design System

### Theme
- **Dark glass-morphism** design with frosted glass cards
- Custom color palettes: `dolphin` (blue, 10 shades) and `ocean` (teal, 10 shades)
- Font: Inter (Google Fonts)

### CSS Classes
| Class | Purpose |
|---|---|
| `.glass-card` / `.glass-card-hover` | Frosted glass card containers |
| `.btn-primary` / `.btn-secondary` / `.btn-danger` / `.btn-icon` | Button variants |
| `.input-field` / `.select-field` | Form inputs |
| Badge variants | Blue, green, purple, yellow, pink status badges |
| `.skeleton` | Loading shimmer animation |
| `.gradient-border` | Animated gradient border effect |
| ProseMirror/Tiptap styles | Rich text editor styling |
| 3D flip card CSS | Perspective, transform, backface-visibility for flashcards |
| Progress ring SVG | Animated circular score gauge for quiz results |
| Custom scrollbar | Styled scrollbar |
| Dark gradient background | Radial gradients fixed to body |

### Animations (Tailwind config)
- `fade-in` — Opacity entrance
- `slide-up` — Vertical slide entrance
- `float` — Gentle vertical bobbing
- `shimmer` — Loading skeleton sweep

---

## Configuration & Environment

### Backend `.env`
| Variable | Default | Description |
|---|---|---|
| `PORT` | 5000 | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/dolphincoder_lms` | MongoDB connection string |
| `JWT_SECRET` | *(required)* | JWT signing secret (min 32 chars, 64+ for prod) |
| `JWT_EXPIRE` | `7d` | Token expiration |
| `BCRYPT_ROUNDS` | 10 | Password hashing rounds (12 for prod) |
| `NODE_ENV` | `development` | Environment mode |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |

### Frontend `.env`
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Backend API base URL |

### Vite Config
- React plugin enabled
- Build output: `../backend/dist`
- Dev server: port 5173, `/api` proxied to `localhost:5000`

### PM2 Config (`ecosystem.config.js`)
- App: `dolphincoder-lms`
- Mode: cluster (max instances)
- Memory limit: 512MB (auto-restart)
- Logs: `logs/err.log`, `logs/out.log` with date format

### Admin Seeder
```bash
cd backend && npm run seed
```
Creates: `admin@speedupexam.com` / `Admin@SpeedUp2024!`  
Idempotent — checks if admin exists before creating.

---

## Deployment

Production-ready with full documentation in `DEPLOYMENT.md`.

**Supported targets:**
- **Hostinger VPS** — MongoDB Atlas + PM2 + Nginx reverse proxy + Let's Encrypt SSL
- **Shared Hosting** — Node.js app via cPanel/CloudLinux

**Typical production flow:**
1. Clone repo on server
2. Install dependencies (`npm install` in backend triggers frontend build)
3. Configure `.env` with production values
4. Run admin seeder
5. Start with PM2: `pm2 start ecosystem.config.js`
6. Configure Nginx as reverse proxy
7. SSL via Let's Encrypt (Certbot)

---

## Notable Implementation Details

### What's Done Well
- ✅ Clean separation of concerns (models, controllers, middleware, routes)
- ✅ Mongoose pre-save hooks for auto-calculated fields (`totalPoints`, `cardCount`, password hashing)
- ✅ Cascade deletion for dependent models (QuizAttempts, FlashcardProgress)
- ✅ Sanitized quiz responses — students never see `correctIndex` or `explanation` unless they own the quiz
- ✅ Rate limiting on global + auth-specific endpoints
- ✅ Auto-incrementing view count on videos
- ✅ Asymmetric access model for notes (students read all, staff own only)
- ✅ Full-text search via MongoDB text indexes
- ✅ Responsive design with mobile hamburger menu
- ✅ Toast notifications on all auth/CRUD actions

### Known Gaps
- ⚠️ No unit or integration tests
- ⚠️ No CI/CD pipeline configured
- ⚠️ `express-validator` is listed as a dependency but not used anywhere
- ⚠️ No dedicated API service layer on frontend — pages call `api` directly
- ⚠️ No custom hooks — all state logic lives in page components or AuthContext
- ⚠️ Dual branding: "DolphinCoder LMS" in README/landing, "SpeedUpExam" in page titles/admin seed

### Version History
| Version | Feature Added |
|---|---|
| v1 | Authentication system |
| v2 | Notes module |
| v3 | YouTube video integration |
| v4 | Quiz engine |
| v5 | Flashcards + UI polish |

---

*This document reflects the current state of the codebase as of April 6, 2026. No code changes were made during this review.*
