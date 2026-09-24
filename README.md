# DolphinCoder LMS 🐬

A complete Learning Management System for [dolphincoder.com](https://dolphincoder.com),
formerly known as **SpeedUpExam**. (The repo folder is still named `MERNLMS` for
historical reasons — the database is **MySQL**, not MongoDB.)

## Features
- 📝 Rich text Notes (Tiptap) with docx/HTML import, tags, colors, search
- 🎬 YouTube Video embedding & library
- 🧠 Interactive Quizzes with auto-grading, attempts, timers & docx bulk upload
- 🃏 Flashcard Decks with flip animations, progress tracking & docx bulk upload
- 📚 Subjects & Topics organization across content
- 🔐 JWT Authentication with Student / Trainer / Admin roles
- 📱 Flutter mobile app (student companion)

## Tech Stack
- **Backend**: Node.js + Express.js + Sequelize + **MySQL** (serves the API *and* the built web app)
- **Frontend**: React 18 + Vite + Tailwind CSS + Tiptap Editor
- **Mobile**: Flutter + Riverpod + go_router (`app/dolphincoder/`)
- **Auth**: JWT (7d) + bcrypt

## Repo Layout
```
backend/    Express API + Sequelize models + MySQL   (port 5000)
frontend/   React web app (builds into backend/dist)
app/dolphincoder/   Flutter mobile app
android/    Flutter planning docs
```

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL running locally (create an empty database, e.g. `lms_dev`)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your MySQL credentials & JWT secret
npm run dev            # http://localhost:5000
```
The server syncs models on boot (`sequelize.sync({ alter: true })` — a temporary
crutch, see `fix.md`), so tables are created automatically.

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173, proxies /api → localhost:5000
```
No `.env` needed — the dev server proxy handles API routing.

### Mobile (optional)
```bash
cd app/dolphincoder
flutter pub get
flutter run
```
The app defaults to `https://dolphincoder.com/api`. For local development, point
`lib/core/constants/api_constants.dart` at your machine
(e.g. `http://10.0.2.2:5000/api` on the Android emulator).

## Production
The web frontend builds **into the backend** (`frontend/vite.config.js` sets
`outDir: '../backend/dist'`) and Express serves it — one Node process, one deploy.
See [DEPLOYMENT.md](DEPLOYMENT.md) for the full Hostinger + PM2 + Nginx guide.

## Environment Variables

### Backend `.env` (see `backend/.env.example`)
```
PORT=5000
DB_HOST=127.0.0.1
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
JWT_SECRET=<long random string, 64+ chars>
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
CLIENT_URL=https://dolphincoder.com
```

### Frontend
None — always calls `/api` relative paths (dev proxy in `vite.config.js`).

## Documentation
| Doc | Purpose |
|---|---|
| [backend.md](backend.md) | API architecture, conventions, verified bugs — **read before coding** |
| [frontend.md](frontend.md) | Web app architecture, conventions, verified bugs |
| [android.md](android.md) | Flutter app architecture, conventions, verified bugs |
| [features.md](features.md) | Feature inventory & history |
| [fix.md](fix.md) | Pending `sync({ alter: true })` revert plan |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Hostinger deployment guide |

## Versions
- **v1**: Auth + User Management
- **v2**: Notes Feature
- **v3**: YouTube Videos
- **v4**: Quizzes
- **v5**: Flashcards + UI Polish
- **v6**: Migrated from MongoDB/Mongoose to MySQL/Sequelize; Subjects & Topics; Flutter app; rebrand to DolphinCoder
