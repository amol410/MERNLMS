# DolphinCoder LMS — Comprehensive Features Reference

A complete feature inventory and technical breakdown of the DolphinCoder Learning Management System (Web and Mobile).

---

## 🐬 1. Platform & User Experience
- **Brand Identity**: Rebranded from SpeedUpExam to **DolphinCoder** across the entire web application, mobile clients, headers, and metadata.
- **Responsive Dark Theme**: Modern glassmorphism UI designed with deep ocean hues (`#0A0F1E`), gradient accents, and Tailwind CSS.
- **Landing Page**: Animated background orbs, live stats section, interactive feature preview cards, and call-to-action flows.
- **Role-Based Access Control (RBAC)**:
  - `student`: Access to all published notes, videos, quizzes, flashcards, karaoke reading, and personal activity tracking.
  - `trainer`: Full student permissions plus authoring, editing, deleting, and bulk-uploading content.
  - `admin`: Full system access, user role promotion/demotion, account activation toggling, and administrative control.

---

## 🎤 2. Interactive Karaoke Notes & Sprechen (Speaking Practice) Mode
An immersive language-learning and audio-reading engine located at `/notes/karaoke/demo` and integrated into `/notes/:id`.

### Audio-Text Synchronization
- **Word-Level Timing**: Real-time highlighting of individual German words as native audio plays.
- **Playback Tempo Controls**: Configurable playback speeds (0.75x default for Sprechen mode, 1.0x, and 1.25x).
- **Real-Time Sync Offset Adjuster**: Interactive timing adjusters (-0.25s, 0s, +0.25s) allowing students to recalibrate audio/text sync dynamically for any device latency.
- **Translations & Vocabulary**:
  - English sentence translations rendered directly below each German sentence with a toggle visibility button.
  - Interactive vocabulary words with inline tooltip popups showing word meanings, translations, and grammatical types.
- **Database-Backed Audio Storage**:
  - Audio files stored directly in MySQL (`karaoke_audios` table) as `LONGBLOB` data.
  - Full HTTP 206 Partial Content range-seeking support (`/api/notes/audio/db/:id`), eliminating audio file loss on ephemeral or shared server filesystems.
- **JSON Alignment Import & Export**:
  - Built-in tool to download structured JSON templates.
  - Seamless import mechanism that normalizes alignments while permanently preserving original audio stream bindings.

### Sprechen (Speaking Practice) Mode
- **Dual Mode Toggle**: One-click toggle between continuous **Listening Mode** (plays uninterrupted from start to finish) and **Sprechen Practice Mode** (guided sentence-by-sentence training).
- **Sentence-Boundary Auto-Pause**:
  - Audio plays the sentence at 0.75x speed and automatically pauses cleanly at the end of the sentence to open the speaking challenge.
  - Synchronous boundary detection prevents race conditions or audio stalling across sentence transitions.
- **Continuous Speech Recognition (`de-DE`)**:
  - Web Speech API integration with `continuous: true`, allowing natural pauses between German words without premature microphone cutoffs.
- **Dual Submission Mechanism**:
  - **Trigger 1 (Automatic)**: Automatically submits and evaluates speech after **3 seconds of continuous silence**.
  - **Trigger 2 (Manual)**: Prominent, vibrant **"Done Speaking (Check Now ✓)"** button allows instant submission without waiting.
- **Pronunciation Evaluation Engine**:
  - Word-level fuzzy matching algorithm evaluates German pronunciation against the target sentence.
  - Live feedback shows matched words in green and mispronounced words in amber/strikethrough.
  - Pass threshold set at **≥75% accuracy**.
- **Interactive Audio & Visual Feedback**:
  - **Celebration Chimes**: Synthesized C-major chord arpeggio via Web Audio API on successful pronunciation.
  - **Retry Chimes**: Low harmonic tone on unsuccessful attempts.
  - **3-Chance Counter**: Visual chance counter per sentence. Students have 3 attempts before being prompted to listen again or proceed.
  - **Autoplay Handling**: Automatic progression to subsequent sentences with user-gesture fallback handling.

---

## 📝 3. Rich Text, DOCX, and HTML Slide Notes
- **Tiptap Rich Text Editor**: Heading levels (H1–H3), bold, italic, underline, blockquotes, ordered/unordered lists, code blocks, horizontal rules, and custom accent colors.
- **DOCX Import**: Instant conversion of Microsoft Word documents into styled notes via server-side `mammoth` parsing.
- **HTML Slide Viewer (16:9 Presentation Mode)**:
  - Upload self-contained HTML/CSS/JS slide files.
  - Embedded in an isolated sandboxed iframe (`allow-scripts`).
  - Fullscreen toggle button for full-screen classroom presentation.
- **Categorization & Filtering**:
  - Color accents: Default, Blue, Green, Yellow, Pink, Purple.
  - Pinning / unpinning important notes to the top of the list.
  - Tagging system with tag-based filtering and instant search.
- **6-Item Pagination**: Notes list renders with a 6-item pagination control for fast, organized browsing.

---

## 🧠 4. Quizzes & Timed Assessments
- **Diverse Question Types**:
  1. **Multiple Choice (MCQ)**: Standard 4-option single-answer questions with explanations.
  2. **True / False**: Quick concept validation questions.
  3. **Code Snippet Questions (`code-mcq`)**: Syntax-highlighted code blocks in a 2×2 grid supporting Python, JavaScript, Java, SQL, C++, and PHP.
  4. **Match the Pairs (`match_pairs`)**:
     - Interactive side-by-side matching columns (Terms on left, Definitions on right).
     - Drag-and-drop / click-to-pair interface with dynamic color-coded pairing tags.
     - Supports `.docx` bulk upload formatting.
- **Bulk Upload via .docx**:
  - Upload formatted Word files to automatically generate full quizzes with questions, options, correct answers, and explanations.
- **Exam-Taking Experience**:
  - Sticky sidebar question navigator with status indicators:
    - 🟣 Purple = Current question
    - 🟢 Green = Answered
    - 🟠 Orange = Marked for review
    - ⚪ Gray = Unanswered
  - **Mark for Review**: Flag questions to revisit before final submission.
  - **Session-Preserved Countdown Timer**: Timer state saved in `sessionStorage`; page reloads do not reset the exam clock. Timer turns red when under 60 seconds.
  - **Unanswered Warning**: Confirmation modal warns students if they attempt to submit with unanswered questions.
- **Grading & Test Review**:
  - Instant automated grading with score percentage, circular progress ring, and pass/fail indicators.
  - **Dedicated Test Review Page (`/quizzes/:id/review`)**: Detailed post-submission review showing selected answers, correct answers, and full explanations.
  - **Clean Attempt Replacement**: Retaking a quiz cleanly updates and archives attempt history without orphaned records.
- **6-Item Pagination**: Quizzes list displays 6 items per page.

---

## 🃏 5. Flashcards & Spaced Learning
- **Deck Management**: Create and categorize flashcard decks with multi-stop gradient themes and subject associations.
- **Interactive 3D Study Mode**:
  - Realistic card flip animation with front (question/prompt) and back (answer/explanation).
  - Hint button on each card that **automatically resets** when navigating between cards.
  - Self-assessment ratings: **"Got It"** (marked as mastered) vs. **"Still Learning"**.
- **Progress & Mastery Tracking**:
  - Student progress saved per deck in the database.
  - Completion summary screen showing mastery percentage and circular score rings.
- **Bulk Upload via .docx**: Upload structured Word documents to populate entire decks instantly.
- **6-Item Pagination**: Flashcard decks list displays 6 items per page.

---

## 📊 6. Activity & Performance Analytics
A comprehensive engagement tracking suite connecting student study habits to actionable metrics.

### Dashboard Today's Performance
- **High-Performance Query**: Lightweight, counts-only backend endpoint (`/api/activity/summary?countsOnly=true`) that queries completed notes, quizzes, and flashcards in milliseconds.
- **Clean Overview**: Displays clear count badges and study milestones directly on the student dashboard without loading heavy historical tables.

### Dedicated Activity History Page (`/activity`)
- **Calendar-Day Categorization**:
  - Aggregates activity into distinct daily cards: **Today**, **Yesterday**, **Day Before Yesterday (Day of Week)**, and full weekly breakdowns.
  - Visual color-coded Day Category badges.
- **Daily Study Time Tracking**:
  - Displays total accumulated study time (hours and minutes) on the right side of every daily section header.
  - Accurately tracks active reading time, quiz time, and flashcard practice time.
- **Karaoke Engagement Integration**:
  - Tracks both active listening time and speaking practice time in seconds, logging sessions directly to `user_activities`.
- **Timezone Awareness**:
  - Accurately accounts for client local timezones so activities completed after UTC midnight are correctly assigned to the user's local calendar day.

---

## 📚 7. Subjects & Topics Architecture
- **Relational Data Model**:
  - Dedicated `Subject` and `Topic` Sequelize models linked to Notes and Quizzes.
- **Unified UI Selectors**:
  - Subject and Topic dropdown filters available across Notes and Quiz lists.
  - Content creation modals include hierarchical Subject → Topic selection.

---

## 🎬 8. YouTube Video Library
- Embed and organize YouTube educational videos.
- Automatic 11-character video ID extraction from standard, short, or embed URLs.
- View count tracking and search by title or tag.

---

## 📱 9. Mobile Application (Flutter Companion)
- **Codebase**: Located in `app/dolphincoder/`.
- **Architecture**: Flutter 3, Dart, Riverpod 2 (`StateNotifier`), GoRouter navigation, Dio HTTP client with JWT interceptor.
- **Theme**: Dark Material 3 theme with Google Fonts (*Plus Jakarta Sans* & *Inter*).
- **Core Screens**: Authentication (Splash, Login, Register, Profile), Dashboard with greeting and quick links, Notes list/detail, Quiz list/taker, and Flashcard study.
- **Upcoming Parity Roadmap**: Integration of Karaoke Reader, Match the Pairs questions, dedicated test review screen, and daily activity tracking.
