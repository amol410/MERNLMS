# backend.md — Agent Context for the Express API

> **Purpose:** Comprehensive onboarding context for coding agents and engineers working in `backend/`.
> Documents architecture, data models, audio streaming pipelines, activity analytics, routing conventions,
> and verified system characteristics.
> Verified against active source on 2026-09-26.
>
> **Rules of engagement for agents:**
> 1. This backend uses **MySQL 8 + Sequelize 6**, NOT MongoDB / Mongoose.
> 2. Every model exposes a virtual `_id` alongside the primary integer `id` for client compatibility. Always preserve this pattern in new models.
> 3. Audio files for Karaoke notes are stored directly in MySQL (`karaoke_audios` table as `LONGBLOB`) and streamed via HTTP 206 Partial Content. Do NOT save uploaded media solely to local disk.
> 4. Activity timestamps and daily groupings MUST account for client local timezones via `utils/dateHelper.js`. Never assume pure server UTC dates for client study days.

---

## 1. What This Is

**DolphinCoder LMS REST API** — Express 4 + Sequelize 6 + MySQL 8.
Serves all `/api/*` REST endpoints and serves the built React SPA from `backend/dist`.

- **User Roles**: `student`, `trainer`, `admin`.
- **Core Domains**:
  - `auth`: Registration, JWT authentication, user profile, password updates.
  - `notes`: Rich text notes (Tiptap), DOCX upload, HTML slide decks, and **Interactive Karaoke Notes** with audio streaming.
  - `videos`: YouTube video embeddings, tag filtering, view count increments.
  - `quizzes`: MCQ, True/False, Code-MCQ, **Match the Pairs (`match_pairs`)**, timer tracking, attempt grading, test review (`/quizzes/:id/review`).
  - `flashcards`: Decks, 3D flip card study, progress tracking, DOCX bulk upload.
  - `activity`: User study engagement tracking, today's performance counts, weekly performance history with localized day categorization and daily study hours.
  - `subjects`: Relational Subject and Topic hierarchy across curriculum.
  - `admin`: User activation toggle, trainer creation, user management.

---

## 2. Run & Deploy

```bash
cd backend
npm install
npm run dev        # nodemon, port 5000 (server.js uses process.env.PORT || 5000)
npm start          # node server.js
```

- **Database Configuration**: Loaded via `dotenv.config()`. Required `.env` keys:
  `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRE`, `BCRYPT_ROUNDS`, `PORT`, `NODE_ENV`, `CLIENT_URL`.
- **Single Process Architecture**: Frontend builds directly into `backend/dist`. Express serves `backend/dist` statically with an SPA catch-all (`*`) for non-`/api` requests.
- **Production Process Manager**: Managed by PM2 via `ecosystem.config.js`.

---

## 3. Directory Map

```
backend/
├── server.js                      # Express app, helmet, CORS, rate limiters, routes, static SPA serving
├── config/database.js             # Sequelize instance, connection pool, connectDB()
├── middleware/
│   ├── auth.js                    # protect (JWT verification via findByPk), authorize(...roles)
│   ├── errorHandler.js            # notFound + centralized error handler
│   └── upload.js                  # Multer memory storage for notes, docx, and audio uploads
├── models/
│   ├── User.js                    # bcrypt hooks, getSignedJwtToken(), roles: student/trainer/admin
│   ├── Note.js                    # contentType: richtext/docx/html/karaoke, karaokeData JSON TEXT, color, pin
│   ├── KaraokeAudio.js            # noteId, filename, mimeType, audioData (LONGBLOB), fileSize
│   ├── UserActivity.js            # userId, activityType (quiz/note/flashcard), metadata JSON, activityDate
│   ├── Quiz.js                    # questions JSON TEXT (MCQ, code-mcq, match_pairs), attemptLimit, timeLimit
│   ├── QuizAttempt.js             # studentId, quizId, answers JSON, score, percentage, passed
│   ├── Flashcard.js               # cards JSON TEXT, cardCount, color
│   ├── FlashcardProgress.js       # studentId, flashcardId, cardResults JSON, masteredCount
│   ├── Subject.js                 # name, description, icon, topics JSON TEXT
│   └── Video.js                   # youtubeVideoId, viewCount, isPublic, tags
├── models/associations.js         # BelongsTo aliases (ownerUser, subject, addedByUser, student, quiz)
├── controllers/
│   ├── activityController.js      # getSummary (countsOnly, single day, ISO week with timezone awareness)
│   ├── adminController.js         # getUsers, createTrainer, toggleActive, deleteUser
│   ├── authController.js          # register, login, getMe, updateProfile, changePassword
│   ├── flashcardController.js     # getDecks, getDeckById, createDeck, updateDeck, deleteDeck, saveProgress
│   ├── noteController.js          # getNotes, getNoteById, createNote, updateNote, deleteNote, uploadAudioFile, streamAudioFromDb, trackView
│   ├── quizController.js          # getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz, submitAttempt
│   ├── subjectController.js       # getSubjects, createSubject, updateSubject, deleteSubject
│   └── videoController.js         # getVideos, getVideoById, createVideo, updateVideo, deleteVideo
├── routes/
│   ├── activity.js                # GET /api/activity/summary
│   ├── admin.js                   # /api/admin/*
│   ├── auth.js                    # /api/auth/*
│   ├── flashcards.js              # /api/flashcards/*
│   ├── notes.js                   # /api/notes/* (includes audio upload & HTTP 206 streaming)
│   ├── quizzes.js                 # /api/quizzes/*
│   ├── subjects.js                # /api/subjects/*
│   └── videos.js                  # /api/videos/*
├── utils/
│   ├── dateHelper.js              # Timezone offset calculations, client day UTC bounds, local date formatting
│   └── extractYouTubeId.js        # Extracts 11-char ID from watch/youtu.be/embed/shorts URLs
├── ecosystem.config.js            # PM2 cluster configuration
└── .env.example                   # Environment configuration template
```

---

## 4. Architecture & Key Patterns

### 4.1 Model Conventions
1. **Primary Keys & Virtual `_id`**:
   Every model defines an integer `id` and exposes a virtual `_id`:
   ```javascript
   id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
   _id: { type: DataTypes.VIRTUAL, get() { return this.id; } },
   ```
   Both the React and Flutter clients consume `_id`. Always maintain this convention.

2. **JSON in TEXT Columns**:
   Complex nested structures (e.g., `questions`, `karaokeData`, `metadata`, `topics`, `cards`) use `DataTypes.TEXT('long')` with safe JSON parsing:
   ```javascript
   get() {
     try { return JSON.parse(this.getDataValue('fieldName')); } catch(e) { return null; }
   },
   set(val) {
     this.setDataValue('fieldName', JSON.stringify(val && typeof val === 'object' ? val : {}));
   }
   ```

3. **Database Audio Storage (`KaraokeAudio`)**:
   Uploaded MP3 audio is stored as `DataTypes.BLOB('long')` (supporting up to 50MB per file). This guarantees audio persists independently of container restarts or shared hosting filesystem purges.

### 4.2 Audio Streaming Pipeline (HTTP 206 Partial Content)
In `controllers/noteController.js`, `streamAudioFromDb` provides full HTTP Range streaming:
- Reads the client's `Range: bytes=start-end` header.
- Calculates chunk boundaries and slices the in-memory `audioData` buffer.
- Emits headers:
  - `HTTP/1.1 206 Partial Content`
  - `Content-Range: bytes ${start}-${end}/${fileSize}`
  - `Accept-Ranges: bytes`
  - `Content-Length: ${chunkSize}`
  - `Content-Type: audio/mpeg`
- Supports timeline seeking, audio scrubbing, and instant playback across Chrome, Safari, Android, and iOS.

### 4.3 Timezone-Aware Activity Analytics
In `controllers/activityController.js` and `utils/dateHelper.js`:
- Client requests pass their local date or timezone offset (`req.headers['x-timezone-offset']` or query `date=YYYY-MM-DD`).
- `getClientDayUtcBounds` calculates the exact UTC start and end timestamps corresponding to the user's local calendar day.
- **Fast Dashboard Summary (`countsOnly=true`)**:
  Performs lightweight count aggregation of completed notes, quizzes, and flashcards for near-instant dashboard rendering.
- **Weekly History (`weekOf=YYYY-MM-DD`)**:
  Retrieves full activity rows with extended ±1 day buffers to safely capture activities crossing midnight, returning detailed metadata (time taken, score, engagement seconds, karaoke practice time).

---

## 5. Route Guard & Endpoint Matrix

| Endpoint | Method | Access / Guard | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Creates student account |
| `/api/auth/login` | POST | Public | Authenticates user & returns JWT (7d) |
| `/api/auth/me` | GET | `protect` | Returns current user profile |
| `/api/auth/profile` | PUT | `protect` | Updates name, email, avatar |
| `/api/auth/password` | PUT | `protect` | Verifies old password & hashes new password |
| `/api/activity/summary` | GET | `protect` | Returns study counts (`countsOnly=true`) or weekly history |
| `/api/notes` | GET | `protect` | Lists published notes with pagination & filters |
| `/api/notes` | POST | `protect`, `trainer/admin` | Creates rich-text or karaoke note |
| `/api/notes/upload` | POST | `protect`, `trainer/admin` | Uploads DOCX/HTML note file |
| `/api/notes/upload-audio` | POST | `protect`, `trainer/admin` | Uploads audio buffer to MySQL `karaoke_audios` |
| `/api/notes/audio/db/:id` | GET | **Public** | Streams audio from MySQL with HTTP 206 Range seeking |
| `/api/notes/audio/:filename`| GET | **Public** | Fallback streaming for local/disk audio files |
| `/api/notes/:id` | GET | `protect` | Returns note detail with karaoke data |
| `/api/notes/:id/track` | POST | `protect` | Logs note reading & karaoke engagement time |
| `/api/quizzes` | GET | `protect` | Lists quizzes with pagination & filters |
| `/api/quizzes` | POST | `protect`, `trainer/admin` | Creates quiz (supports MCQ, code-mcq, match_pairs) |
| `/api/quizzes/:id/take` | GET | `protect` | Retrieves quiz questions for student examination |
| `/api/quizzes/:id/submit` | POST | `protect` | Grades attempt, stores QuizAttempt, logs UserActivity |
| `/api/flashcards` | GET | `protect` | Lists flashcard decks with card counts |
| `/api/flashcards/:id/progress` | POST | `protect` | Saves student mastery & review counts |
| `/api/videos` | GET | **Public** | Lists YouTube videos |
| `/api/subjects` | GET | **Public** | Lists subjects with embedded topic lists |
| `/api/admin/users` | GET | `protect`, `admin` | Lists all users with pagination |
| `/api/admin/users/:id/active` | PATCH | `protect`, `admin` | Toggles user active/inactive status |

---

## 6. Development & Coding Guidelines

1. **Sequelize Associations**:
   Always declare relations in `models/associations.js` using defined aliases (`ownerUser`, `subject`, `addedByUser`).
2. **Response Shapes**:
   Preserve standard response envelopes (`{ success: true, data: ... }` or `{ success: true, [domain]: ... }`).
3. **Database Blob Streaming**:
   When working with binary media, use stream chunking. Never buffer entire massive files into single unbounded string variables.
4. **Reshaped Fields**:
   Controllers reshape database rows (`ownerUser → owner`) before sending responses. Ensure frontend and mobile expectations are preserved.
