# DolphinCoder LMS 🐬

A comprehensive, state-of-the-art Learning Management System powering [dolphincoder.com](https://dolphincoder.com), formerly known as **SpeedUpExam**. (The root repository folder is named `MERNLMS` for historical reasons; the production database is **MySQL**, not MongoDB.)

---

## 🌟 Key Features

### 📝 Notes & Interactive Karaoke Reader
- **Rich Text Notes (Tiptap)**: Bold, italic, underline, headings, lists, blockquotes, code blocks, dividers, tags, color-coded themes, and pin/unpin.
- **DOCX & HTML Import**: Automatic Word file conversion to HTML (`mammoth`) and self-contained 16:9 interactive presentation slide viewer with fullscreen support.
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

### 📱 Flutter Mobile App (Android & iOS)
- Dark-themed Material 3 mobile companion located in `app/dolphincoder/`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js, Express.js 4, Sequelize ORM 6, MySQL 8 |
| **Frontend Web** | React 18, Vite 5, React Router 6, Tailwind CSS 3, Tiptap, Lucide Icons, Web Speech API, Web Audio API |
| **Mobile App** | Flutter 3, Dart, Riverpod 2, GoRouter, Dio |
| **Audio & Media** | MySQL `LONGBLOB` streaming, HTTP 206 Range seeking, YouTube IFrame API |
| **Document Processing** | Mammoth (DOCX to HTML parser), Custom DOCX quiz/flashcard generators |
| **Hosting & Ops** | Hostinger VPS, PM2 Process Manager, Nginx Reverse Proxy, Let's Encrypt SSL |

---

## 📁 Repository Layout

```
MERNLMS/
├── backend/                   # Express API + Sequelize models + MySQL streaming (port 5000)
│   ├── config/database.js     # Sequelize MySQL connection pool
│   ├── controllers/           # API controllers (auth, notes, quizzes, flashcards, activity, etc.)
│   ├── models/                # Sequelize models (User, Note, KaraokeAudio, UserActivity, Quiz, etc.)
│   ├── routes/                # Express REST routes
│   ├── middleware/            # JWT auth, role guard, Multer file upload
│   └── uploads/               # Temporary/fallback file storage
├── frontend/                  # React SPA (Vite builds into backend/dist)
│   ├── src/pages/             # Route views (Dashboard, KaraokeNoteReader, ActivityHistoryPage, etc.)
│   ├── src/components/        # UI components (KaraokeNoteModal, MatchPairsQuestion, etc.)
│   ├── src/contexts/          # AuthContext & global state
│   └── src/styles/            # Tailwind CSS and glassmorphism styling
├── app/dolphincoder/          # Flutter mobile application (Dart)
│   ├── lib/core/              # Constants, network Dio client, routing, theme
│   ├── lib/features/          # Auth, Dashboard, Notes, Quizzes, Flashcards, Profile
│   └── lib/shared/            # Reusable mobile widgets
├── sync_your_audio/           # Standalone Python/Django Aeneas forced alignment audio tool
├── DEPLOYMENT.md              # Production VPS deployment guide
├── features.md                # Comprehensive feature inventory & history
├── backend.md                 # Detailed backend architecture & API reference
├── frontend.md                # Detailed frontend architecture & component guide
├── android.md                 # Mobile app architecture & synchronization plan
└── fix.md                     # Migration logs & resolved critical bug catalog
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally or remotely (e.g., `lms_dev` database)

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
| [backend.md](backend.md) | Express API, Sequelize models, BLOB streaming, activity tracking, route tables |
| [frontend.md](frontend.md) | React SPA, Karaoke Reader, Speech Recognition, Quiz engine, state flow |
| [features.md](features.md) | Complete chronological feature log & capability inventory |
| [android.md](android.md) | Flutter architecture, Riverpod providers, Android alignment roadmap |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Hostinger VPS deployment, PM2 clustering, Nginx range proxy, SSL |
| [fix.md](fix.md) | Catalog of resolved bugs, race conditions, and database migration notes |
