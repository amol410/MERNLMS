# DolphinCoder LMS — Bug Fixes & Migration Catalog

A documented record of critical bug fixes, race condition resolutions, and database migration guidelines across the DolphinCoder codebase.

---

## 🗄️ 1. Database Synchronization (`alter: true` vs `force: false`)

### Background & Context
In `backend/config/database.js`, the Sequelize boot sequence currently runs:
```js
await sequelize.sync({ alter: true });
```
This was enabled to automatically apply schema additions across deployment environments (e.g., adding `contentType` and `karaokeData` to `notes`, creating `karaoke_audios`, and creating `user_activities`).

### Production Advisory
- **The Issue**: In production PM2 cluster mode (`instances: 'max'`), multiple Node worker processes starting simultaneously issue concurrent `ALTER TABLE` DDL queries against MySQL. This can lead to table metadata lock contention or transient startup delays.
- **Migration Path to `force: false`**:
  Once all tables (`users`, `notes`, `karaoke_audios`, `user_activities`, `quizzes`, `quiz_attempts`, `flashcards`, `flashcard_progress`, `subjects`, `topics`, `videos`) are confirmed present and stable in production MySQL:
  1. Open `backend/config/database.js`.
  2. Change `await sequelize.sync({ alter: true });` to:
     ```js
     await sequelize.sync({ force: false });
     ```
  3. Deploy to production and restart PM2.
  4. For future schema additions, use dedicated Sequelize migration files (`npx sequelize-cli db:migrate`) or isolated DDL scripts rather than runtime schema altering.

---

## 🛠️ 2. Resolved Critical Bugs & Fix Log

### 2.1 Karaoke Sprechen Mode: Stale Sentence Pause Loop & Audio Stalling
- **Symptom**: During karaoke playback, the audio unexpectedly halted on Sentence 9 (at 0:28) and Sentence 13. When users manually clicked Sentence 10, it resumed but then halted again on Sentence 13.
- **Root Cause**:
  1. In `playSentence(nextIdx)`, `lastPausedSentenceRef.current` was being reset to `-1`.
  2. Because React updates refs in `useEffect` asynchronously, the audio player fired a `timeupdate` immediately after seeking to the next sentence start (e.g., `29.5s`).
  3. `handleTimeUpdate` read the stale `activeSentenceIndexRef.current` (which was still 9).
  4. The check evaluated `29.5s >= sentences[9].end (28.0s)`. Since `lastPausedSentenceRef.current` was `-1` (not 9), it immediately re-paused the audio and set the active speaking index back to 9, trapping the user.
- **Fix**:
  - `playSentence(sIdx)` now sets `lastPausedSentenceRef.current = sIdx - 1`, explicitly marking the previous sentence as completed.
  - `handleTimeUpdate` computes the current sentence synchronously from `currentTime` rather than depending on stale React state.
  - `jumpToWord` similarly marks `lastPausedSentenceRef.current = targetIdx - 1` and closes stale practice cards.
- **Files Modified**: `frontend/src/pages/KaraokeNoteReader.jsx`.

---

### 2.2 Speech Recognition Premature Cut-Offs in German Speaking Practice
- **Symptom**: When practicing speaking German sentences, the browser speech engine cut off after short 0.5-second pauses between words, prematurely evaluating speech and yielding false low accuracy scores (e.g., 20% or 53%).
- **Root Cause**: `recognition.continuous` was set to `false`, causing the browser's native speech recognizer to abort as soon as the speaker took a breath between words.
- **Fix**:
  1. Enabled `recognition.continuous = true` and accumulated interim + final transcripts across all result events.
  2. Added a **3.0-second silence timer** that automatically resets on every captured word and evaluates pronunciation only after 3 full seconds of silence.
  3. Added a dedicated, prominent **"Done Speaking (Check Now ✓)"** button allowing users to immediately submit without waiting for the silence timer.
  4. Filtered out benign `aborted` events from `recognition.onerror` to prevent console spam.
- **Files Modified**: `frontend/src/pages/KaraokeNoteReader.jsx`.

---

### 2.3 Ephemeral Shared Hosting Audio Loss
- **Symptom**: Audio files uploaded for karaoke notes disappeared on Hostinger VPS / shared hosting after server restarts or deployment rebuilds because files were saved to local disk (`/uploads/audio/`).
- **Root Cause**: The container or ephemeral filesystem wiped uncommitted asset directories.
- **Fix**:
  1. Created the `karaoke_audios` MySQL table (`backend/models/KaraokeAudio.js`) storing audio data as a `LONGBLOB` (up to 50MB per audio file).
  2. Created `/api/notes/upload-audio` using Multer in-memory storage to pipe buffers straight into MySQL.
  3. Created `/api/notes/audio/db/:id` with complete HTTP 206 Partial Content Range streaming support (`Accept-Ranges: bytes`, `Content-Range`, `Content-Length`), enabling seamless timeline seeking.
- **Files Modified**: `backend/models/KaraokeAudio.js`, `backend/routes/notes.js`, `backend/controllers/noteController.js`, `frontend/src/pages/KaraokeNoteReader.jsx`.

---

### 2.4 ReferenceError: `noteToEdit is not defined` in Karaoke Note Modal
- **Symptom**: Clicking to create or edit a karaoke note triggered an uncaught `ReferenceError: noteToEdit is not defined` crashing the React component tree.
- **Root Cause**: `KaraokeNoteModal.jsx` had a destructured prop signature `{ isOpen, onClose, onSave, storyToEdit }` while inner hooks referenced `noteToEdit`.
- **Fix**: Declared `noteToEdit` in props and aliased `noteToEdit || storyToEdit`.
- **Files Modified**: `frontend/src/components/notes/KaraokeNoteModal.jsx`.

---

### 2.5 React Error #31: Raw Object Rendering
- **Symptom**: React threw Minified React Error #31 (*"Objects are not valid as a React child (found: object with keys {word, meaning, type})"*) when viewing notes or karaoke definitions.
- **Root Cause**:
  1. Vocabulary terms in karaoke JSON contained structured definition objects `{ word, meaning, type }` rather than primitive strings.
  2. Subject/Topic properties in certain notes were populated as `{ id, name }` objects rather than strings.
- **Fix**:
  - Implemented `getVocabItemInfo()` in `KaraokeNoteReader.jsx` and normalized subject/topic string extractions in `NotesPage.jsx` and `NoteDetailPage.jsx`.
- **Files Modified**: `frontend/src/pages/KaraokeNoteReader.jsx`, `frontend/src/pages/NotesPage.jsx`, `frontend/src/pages/NoteDetailPage.jsx`.

---

### 2.6 Dashboard Performance Bottleneck: Heavy Activity Queries
- **Symptom**: Loading the student dashboard took several seconds because it executed full historical joins across every quiz attempt, note view, and flashcard session.
- **Root Cause**: `activityController.getSummary` fetched all raw rows and heavy JSON metadata blobs for the user.
- **Fix**:
  - Introduced `countsOnly=true` parameter in `/api/activity/summary`.
  - Aggregates activity counts directly in a fast, lightweight query for the dashboard, while moving the full historical tables to a dedicated `/activity` page.
- **Files Modified**: `backend/controllers/activityController.js`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/dashboard/TodayPerformance.jsx`.

---

### 2.7 Timezone Discrepancies in Activity Logging
- **Symptom**: Quizzes solved at 2:00 AM local time were logged as "Yesterday" because the server evaluated dates using UTC rather than client local time.
- **Root Cause**: Server assumed UTC day boundaries (`T00:00:00Z`), causing activities between midnight and 5:30 AM local time to shift to the previous day.
- **Fix**:
  - Created `backend/utils/dateHelper.js` with client timezone offset detection.
  - Database queries now query using `getClientDayUtcBounds` and classify calendar days accurately relative to user local time.
- **Files Modified**: `backend/utils/dateHelper.js`, `backend/controllers/activityController.js`, `frontend/src/pages/ActivityHistoryPage.jsx`.

---

### 2.8 Match the Pairs (`match_pairs`) Re-render State Leak
- **Symptom**: When advancing between Match the Pairs questions during a quiz, previous answers and dragged items persisted or scrambled on the next question.
- **Root Cause**: `MatchPairsDisplay` component retained internal state across question changes.
- **Fix**: Added dynamic React `key={question.id || questionIndex}` and initialized fresh randomized right-side columns per question.
- **Files Modified**: `frontend/src/components/quiz/MatchPairsDisplay.jsx`, `frontend/src/pages/QuizTakePage.jsx`.

---

### 2.9 Missing Pagination Across List Pages
- **Symptom**: Notes, Quizzes, and Flashcards only displayed the first page of results with no mechanism to access older records.
- **Fix**: Standardized 6-item pagination across Notes, Quizzes, and Flashcard lists with dynamic page controls.
- **Files Modified**: `frontend/src/pages/NotesPage.jsx`, `frontend/src/pages/QuizzesPage.jsx`, `frontend/src/pages/FlashcardsPage.jsx`.
