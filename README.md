# DolphinCoder LMS 🐬

A complete Learning Management System built with MERN stack for [dolphincoder.com](https://dolphincoder.com).

## Features
- 📝 Rich text Notes with tags, colors, search
- 🎬 YouTube Video embedding & library
- 🧠 Interactive Quizzes with auto-grading
- 🃏 Flashcard Decks with flip animations & progress tracking
- 🔐 JWT Authentication with Student/Instructor roles

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Tiptap Editor
- **Backend**: Node.js + Express.js + MongoDB + Mongoose
- **Auth**: JWT + bcrypt

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your MongoDB URI & JWT secret
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # Set VITE_API_BASE_URL
npm run dev
```

## Production (Hostinger)

1. Build frontend: `cd frontend && npm run build`
2. Upload `frontend/dist/` to Hostinger public_html
3. Deploy `backend/` to Node.js hosting
4. Set environment variables on Hostinger panel

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=production
CLIENT_URL=https://dolphincoder.com
```

### Frontend `.env`
```
VITE_API_BASE_URL=https://api.dolphincoder.com/api
```

Deployed on Hostinger with auto-deployment from GitHub.

## Versions
- **v1**: Auth + User Management
- **v2**: Notes Feature
- **v3**: YouTube Videos
- **v4**: Quizzes
- **v5**: Flashcards + UI Polish
