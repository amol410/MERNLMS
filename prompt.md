# DolphinCoder LMS — Master Architecture & Complete Build Prompt

> **Purpose:** This file is the master, self-contained implementation prompt. Any advanced AI coding agent or engineering team can take this document and build the entire **DolphinCoder LMS** platform from scratch across Backend (Node/MySQL), Frontend (React SPA), and Mobile (Flutter Android/iOS).

---

## 🎯 Master Prompt Overview & Objectives

You are tasked with building **DolphinCoder LMS** (formerly SpeedUpExam), a modern, full-featured Learning Management System designed for language learning, coding education, and interactive assessments.

### Key Pillars & Philosophy
1. **Unified Stack**: Node.js + Express 4 + Sequelize 6 + **MySQL 8** backend serving both the REST API and the built React SPA bundle from a single process.
2. **Interactive Audio & Speech Recognition**: Native Karaoke note-reading engine with word-by-word synchronized highlighting and a **Sprechen (Speaking Practice)** training mode utilizing the Web Speech API and Web Audio API synthesizer.
3. **Database-Backed Media Streaming**: Binary audio storage in MySQL (`LONGBLOB`) with full HTTP 206 Partial Content range seeking, preventing media loss on containerized or ephemeral filesystems.
4. **Rich Assessment Engine**: Multiple Choice (MCQ), True/False, Code Snippet questions with syntax highlighting, and interactive **Match the Pairs (`match_pairs`)** questions with `.docx` bulk upload.
5. **Activity Analytics & Timezone Engine**: Real-time study engagement logging, lightweight dashboard summary metrics (`countsOnly=true`), and full weekly activity history with client-local day categorization (**Today**, **Yesterday**, **Day Before Yesterday**) and accumulated daily study hours.
6. **Flutter Mobile Companion**: A native, dark-themed Material 3 mobile application for Android and iOS providing complete student-side parity.

---

## 🏗️ 1. Complete Technology Stack

| Layer | Technologies & Libraries |
|---|---|
| **Backend Core** | Node.js 20 LTS, Express.js 4, Sequelize ORM 6, MySQL 8 |
| **Authentication** | JWT (`jsonwebtoken`, 7-day expiration), `bcryptjs` (12 rounds) |
| **Media & File Handling**| `multer` (memory storage), `mammoth` (DOCX to HTML), HTTP 206 Partial Content Range streaming |
| **Web Frontend** | React 18, Vite 5, React Router 6, Tailwind CSS 3, Tiptap (`@tiptap/react`), Lucide React, `react-hot-toast` |
| **Audio & Speech (Web)**| Web Speech API (`webkitSpeechRecognition`, German `de-DE`), Web Audio API (`AudioContext` synthesizer) |
| **Mobile App** | Flutter 3, Dart 3, Riverpod 2 (`StateNotifier`), `go_router`, `dio`, `flutter_secure_storage`, `shared_preferences`, Google Fonts (`Plus Jakarta Sans`, `Inter`) |
| **Production Hosting**| Hostinger VPS / Ubuntu 22.04, PM2 (`ecosystem.config.js`), Nginx reverse proxy, Certbot SSL |

---

## 🗄️ 2. Database Schema & Data Models (Sequelize + MySQL)

Every model MUST define an integer primary key `id` **plus a virtual `_id` getter** returning `this.id` for cross-client compatibility. Complex objects are stored in `DataTypes.TEXT('long')` with robust JSON getter/setter pairs.

### 2.1 Table: `users`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `_id`: VIRTUAL getter returning `id`
- `name`: VARCHAR(100) NOT NULL
- `email`: VARCHAR(150) NOT NULL UNIQUE
- `password`: VARCHAR(255) NOT NULL (hashed with bcrypt 12 rounds)
- `role`: ENUM('student', 'trainer', 'admin') DEFAULT 'student'
- `avatar`: VARCHAR(255) NULL
- `isActive`: BOOLEAN DEFAULT true
- `timestamps`: createdAt, updatedAt

### 2.2 Table: `notes`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `_id`: VIRTUAL getter returning `id`
- `title`: VARCHAR(255) NOT NULL
- `content`: LONGTEXT NULL (HTML string for richtext/docx/html slide viewer)
- `contentType`: ENUM('richtext', 'docx', 'html', 'karaoke') DEFAULT 'richtext'
- `color`: ENUM('default', 'blue', 'green', 'yellow', 'pink', 'purple') DEFAULT 'default'
- `isPinned`: BOOLEAN DEFAULT false
- `tags`: TEXT (JSON array of strings)
- `subjectId`: INT NULL (FK to `subjects.id`)
- `topicId`: INT NULL (FK to `topics.id`)
- `ownerId`: INT NOT NULL (FK to `users.id`)
- `audioUrl`: VARCHAR(500) NULL (Relative API path `/api/notes/audio/db/:id` or external URL)
- `duration`: FLOAT DEFAULT 0 (Total audio length in seconds)
- `karaokeData`: LONGTEXT NULL (Structured JSON containing sentences, word alignments, vocabulary, and `isSprechen` flag)
- `timestamps`: createdAt, updatedAt

### 2.3 Table: `karaoke_audios`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `noteId`: INT NULL
- `filename`: VARCHAR(255) NOT NULL
- `mimeType`: VARCHAR(100) DEFAULT 'audio/mpeg'
- `audioData`: LONGBLOB NOT NULL (Binary MP3 file buffer up to 50MB)
- `fileSize`: INT NOT NULL
- `timestamps`: createdAt, updatedAt

### 2.4 Table: `user_activities`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `_id`: VIRTUAL getter returning `id`
- `userId`: INT NOT NULL (FK to `users.id`)
- `activityType`: ENUM('quiz', 'note', 'flashcard') NOT NULL
- `resourceId`: INT NOT NULL
- `resourceTitle`: VARCHAR(255) DEFAULT ''
- `subjectName`: VARCHAR(100) NULL
- `topicName`: VARCHAR(100) NULL
- `metadata`: LONGTEXT NULL (JSON blob: `{ attemptCount, timeTakenSecs, score, maxScore, percentage, passed, engagementSecs, isKaraoke, cardCount, masteredCount }`)
- `activityDate`: DATEONLY NOT NULL (Client local calendar date `YYYY-MM-DD`)
- `timestamps`: createdAt, updatedAt
- `indexes`: `[userId, activityDate]`, `[activityType]`

### 2.5 Table: `quizzes`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `_id`: VIRTUAL getter returning `id`
- `title`: VARCHAR(255) NOT NULL
- `description`: TEXT NULL
- `timeLimit`: INT DEFAULT 15 (Minutes)
- `passingScore`: INT DEFAULT 70 (Percentage)
- `attemptLimit`: INT DEFAULT 0 (0 = unlimited)
- `shuffleQuestions`: BOOLEAN DEFAULT false
- `isPublished`: BOOLEAN DEFAULT true
- `questions`: LONGTEXT NOT NULL (JSON array of questions)
  - Question schemas:
    - **MCQ**: `{ id, question, type: 'mcq', options: [4 strings], correctIndex, explanation, points }`
    - **True/False**: `{ id, question, type: 'true_false', options: ['True', 'False'], correctIndex, explanation, points }`
    - **Code-MCQ**: `{ id, question, type: 'code-mcq', code, language, options: [4 strings], correctIndex, explanation, points }`
    - **Match Pairs**: `{ id, question, type: 'match_pairs', pairs: [{ id, term, definition }], points }`
- `subjectId`: INT NULL, `topicId`: INT NULL, `ownerId`: INT NOT NULL
- `timestamps`: createdAt, updatedAt

### 2.6 Table: `quiz_attempts`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `studentId`: INT NOT NULL (FK to `users.id`)
- `quizId`: INT NOT NULL (FK to `quizzes.id`)
- `answers`: LONGTEXT NOT NULL (JSON snapshot of user submitted answers and grading breakdown)
- `score`: INT NOT NULL, `maxScore`: INT NOT NULL, `percentage`: FLOAT NOT NULL, `passed`: BOOLEAN NOT NULL
- `timeTakenSecs`: INT DEFAULT 0
- `timestamps`: createdAt, updatedAt

### 2.7 Table: `flashcards` & `flashcard_progress`
- `flashcards`: `id`, `title`, `description`, `color`, `cardCount`, `isPublished`, `cards` (JSON array: `[{ id, front, back, hint }]`), `subjectId`, `topicId`, `ownerId`
- `flashcard_progress`: `id`, `studentId`, `flashcardId`, `cardResults` (JSON `{ [cardId]: 'known' | 'unknown' }`), `masteredCount`, `lastReviewedAt`

### 2.8 Table: `subjects`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(100) NOT NULL UNIQUE
- `description`: TEXT NULL
- `icon`: VARCHAR(50) DEFAULT 'BookOpen'
- `topics`: LONGTEXT NULL (JSON array: `[{ id, name, description }]`)

---

## ⚙️ 3. Backend Implementation Directives

### 3.1 HTTP 206 Partial Content Audio Streaming
Implement in `controllers/noteController.js`:
```javascript
exports.streamAudioFromDb = async (req, res) => {
  const audio = await KaraokeAudio.findByPk(req.params.id);
  if (!audio || !audio.audioData) return res.status(404).send('Audio not found');

  const totalSize = audio.fileSize;
  const rangeHeader = req.headers.range;

  if (!rangeHeader) {
    res.writeHead(200, {
      'Content-Length': totalSize,
      'Content-Type': audio.mimeType || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    });
    return res.end(audio.audioData);
  }

  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
  const chunkSize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': audio.mimeType || 'audio/mpeg',
  });

  const chunk = audio.audioData.slice(start, end + 1);
  res.end(chunk);
};
```

### 3.2 Timezone-Aware Activity Aggregator
Implement in `utils/dateHelper.js` & `controllers/activityController.js`:
- Client passes local date or timezone offset header (`x-timezone-offset`).
- `getClientDayUtcBounds(localDate, req)` computes exact UTC boundaries so late-night study sessions (e.g. 2:00 AM) are attributed to the user's actual calendar day.
- Support `countsOnly=true` query param returning `{ quizCount, noteCount, flashcardCount, karaokeCount }` in a fast aggregated query for dashboard rendering.

---

## 💻 4. Frontend Web Implementation Directives

### 4.1 Karaoke Reader & Sprechen Engine (`KaraokeNoteReader.jsx`)
- **Word Sync**: Renders `sentence.words.map(w => ...)` and highlights the active word matching `currentTime >= w.start && currentTime <= w.end`.
- **Sprechen Mode Auto-Pause**:
  - `handleTimeUpdate` detects `effTime >= sentence.end`.
  - Sets `lastPausedSentenceRef.current = currIdx` to guard against duplicate triggers.
  - Pauses audio and opens the speaking challenge card.
  - Advancing to the next sentence sets `lastPausedSentenceRef.current = sIdx - 1` so previous sentence timestamps are never re-evaluated.
- **Continuous Speech Recognition**:
  - Configured with `recognition.continuous = true`, `interimResults = true`, `lang = 'de-DE'`.
  - Accumulates both interim and finalized tokens into `currentSpokenTextRef.current`.
- **Dual Submission System**:
  - **Silence Timer**: Resets on every detected word; automatically submits speech after **3.0 seconds of silence**.
  - **"Done Speaking (Check Now ✓)" Button**: Immediately aborts recognition, clears silence timer, and evaluates speech.
- **Pronunciation Evaluator**:
  - Strips punctuation and computes word-level accuracy. Matches `≥75%` trigger celebration arpeggio chimes (`playCelebrationSound`) and advances; otherwise plays retry chime with 3 chances remaining.

### 4.2 Match the Pairs Question Engine (`MatchPairsQuestion.jsx`)
- Displays Terms in left column and Definitions in randomized right column.
- Clicking/tapping a Term then a Definition links them with a matching color badge.
- Validates student pairs on exam submit against correct definitions.

### 4.3 Activity History Page (`ActivityHistoryPage.jsx`)
- Displays weekly performance grouped by local calendar date.
- Header badges: **Today**, **Yesterday**, **Day Before Yesterday (Day)**.
- Right-aligned daily header displays total daily study time (`X hrs Y mins`).

### 4.4 Pagination Engine
- Deploys clean 6-item pagination across Notes, Quizzes, and Flashcards catalogs.

---

## 📱 5. Flutter Mobile Application Directives (`app/dolphincoder/`)

### 5.1 Architecture & Stack
- **State Management**: Riverpod 2 (`StateNotifier` for lists, `FutureProvider.family` for details).
- **Navigation**: `go_router` with `ShellRoute` hosting a custom 5-tab floating bottom navigation bar.
- **Theme**: Material 3 dark theme (`#0A0F1E` surface) with Google Fonts (*Plus Jakarta Sans* and *Inter*).
- **Networking**: `dio` singleton attaching JWT Bearer from `flutter_secure_storage`.

### 5.2 Required Mobile Features
1. **Karaoke Note Reader Screen**:
   - Audio playback via `just_audio` connecting to `/api/notes/audio/db/:id`.
   - Live sentence and word-by-word highlighted text synchronized with playback.
   - Sprechen mode with German speech-to-text (`speech_to_text`), 3s silence countdown, and manual Done Speaking action.
2. **Match the Pairs Question Widget**:
   - Interactive two-column tap-to-match UI inside `QuizTakeScreen`.
3. **Dedicated Quiz Review Screen (`quiz_review_screen.dart`)**:
   - Displays student answers alongside correct choices and explanations.
4. **Activity & Study Analytics Screen (`activity_screen.dart`)**:
   - Today's milestones card and daily categorized study history.
5. **Pagination**:
   - 6-item pagination / infinite scroll for Notes, Quizzes, and Flashcard lists.

---

## 🚀 6. Step-by-Step Build & Verification Plan

1. **Phase 1: Backend & Database**
   - Setup MySQL database `dolphincoder_lms`.
   - Run Sequelize models with associations.
   - Verify auth, audio streaming, notes, quizzes, and activity endpoints via curl/Postman.
2. **Phase 2: Frontend Web Client**
   - Initialize Vite React project with Tailwind CSS and Tiptap.
   - Implement AuthContext, Navbar, and Dashboard with `TodayPerformance`.
   - Implement Notes, Karaoke Reader with Sprechen Mode, Quizzes (MCQ, Code, Match Pairs), Flashcards, and Activity History.
   - Build production bundle into `backend/dist` (`npm run build`).
3. **Phase 3: Flutter Mobile Client**
   - Setup `app/dolphincoder/` with dependencies (`dio`, `flutter_riverpod`, `go_router`, `just_audio`, `speech_to_text`).
   - Implement Auth, Dashboard, Notes, Karaoke Reader, Quizzes with Match Pairs, and Activity screens.
   - Build APK (`flutter build apk --release`).
4. **Phase 4: Deployment & QA**
   - Deploy backend + dist on VPS with PM2 and Nginx reverse proxy.
   - Configure SSL with Certbot.
   - Conduct cross-device end-to-end testing.
