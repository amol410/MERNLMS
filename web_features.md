# Web Application Features & Functional Architecture (`web_features.md`)

> **Specification Purpose:** This document provides a complete, page-by-page functional and structural skeleton of the DolphinCoder Learning Management System (Web Application). It is written to serve as an architectural prompt for generative design and UI generation tools (such as Google Stitch), enabling design overhaul or theme redesign while preserving 100% of the platform's functionality, data fields, and interactive workflows. It specifies structural components and behavior without prescribing CSS styling.

---

## 1. Global Navigation & Platform Header
* **Route Scope:** Persistent on all authenticated pages (with role-based links).
* **Structural Elements:**
  * **Brand Logo & Title Link**: Clicking redirects to `/dashboard` (or `/` if unauthenticated).
  * **Primary Navigation Links**:
    * **Dashboard**: Link to `/dashboard`.
    * **Notes**: Link to `/notes`.
    * **Quizzes**: Link to `/quizzes`.
    * **Flashcards**: Link to `/flashcards`.
    * **Videos**: Link to `/videos`.
    * **Activity**: Link to `/activity` (Student study tracker).
  * **Trainer / Admin Conditional Controls**:
    * **Create Note** button: Opens the multi-tab Note Creation Modal directly from the header.
    * **Admin Panel**: Link to `/admin/users` (visible only for `admin` role).
  * **User Profile & Session Dropdown**:
    * User avatar and full name.
    * User role badge (`Student`, `Trainer`, `Admin`).
    * Dropdown menu items:
      * **Profile & Settings**: Link to `/profile`.
      * **Activity Tracker**: Link to `/activity`.
      * **Logout**: Clears JWT token from storage and redirects to `/login`.
  * **Responsive Mobile Drawer**:
    * Hamburger toggle button on small screens.
    * Slide-out panel replicating all navigation links, user profile details, and logout action.

---

## 2. Landing / Marketing Page
* **Route:** `/` (Public)
* **Page Purpose:** Welcome prospective learners, showcase platform offerings, and direct users to login or registration.
* **Structural Layout:**
  * **Top Navigation Bar**: Brand emblem, feature anchors, "Sign In" button, "Get Started" CTA.
  * **Hero Section**:
    * Main headline and subheadline introducing interactive language learning and code mastery.
    * Primary CTA: "Start Learning for Free" (redirects to `/register`).
    * Secondary CTA: "Try Interactive Demo" (redirects to `/notes/karaoke/demo`).
  * **Live Metrics & Stats Banner**:
    * Total active students counter.
    * Published study notes counter.
    * Quizzes completed counter.
    * Audio reading hours counter.
  * **Core Modules Showcase Grid**:
    * Interactive Karaoke Notes feature preview.
    * Sprechen (Speaking Practice) with voice recognition preview.
    * Smart Quiz assessments (MCQ, Code, Match the Pairs) preview.
    * 3D Flashcards and YouTube Video lessons preview.
  * **Testimonials / Learning Outcomes Section**: User feedback and course coverage summary.
  * **Footer**: Platform copyright, terms of service link, privacy policy link, contact email.

---

## 3. Authentication Pages

### 3.1 Sign In Page
* **Route:** `/login` (Public / Guest)
* **Functional Elements:**
  * **Header**: Brand logo and greeting prompt ("Welcome back").
  * **Input Fields**:
    * Email Address field (type `email`, validation for required and format).
    * Password field (type `password`, with visibility toggle eye icon).
  * **Action Buttons**:
    * "Sign In" primary submission button (with loading spinner during API request).
    * "Forgot Password?" helper link.
  * **Redirection Link**: "Don't have an account? Sign Up" linking to `/register`.
  * **Error Feedback**: Inline alert banner displaying authentication errors (invalid credentials, inactive account).

### 3.2 Registration Page
* **Route:** `/register` (Public / Guest)
* **Functional Elements:**
  * **Header**: Brand logo and registration prompt ("Create your free account").
  * **Input Fields**:
    * Full Name field (text, required).
    * Email Address field (type `email`, required).
    * Password field (type `password`, min length validation, strength requirements, visibility toggle).
    * Confirm Password field (matches password validation).
  * **Role Selection**: Defaults to `student` (trainer registration requires admin invitation or admin assignment).
  * **Terms Agreement**: Checkbox agreeing to platform terms and privacy guidelines.
  * **Action Button**: "Create Account" submission button (with loading spinner).
  * **Redirection Link**: "Already have an account? Sign In" linking to `/login`.

---

## 4. Student Dashboard
* **Route:** `/dashboard` (Authenticated)
* **Page Purpose:** Central cockpit for student progress, daily study metrics, quick resumption, and activity tracking.
* **Structural Hierarchy:**
  * **Greeting Banner**:
    * Dynamic greeting ("Good morning / afternoon / evening, [User Name]").
    * Current date display.
    * Motivational tagline and study streak badge.
  * **Today's Performance Module**:
    * High-priority real-time metrics tracking engagement for the current day:
      * **Notes Read Today**: Count of distinct notes viewed/studied today.
      * **Quizzes Taken Today**: Count of quiz attempts submitted today.
      * **Flashcards Reviewed Today**: Count of flashcards flipped/mastered today.
      * **Hours Studied Today**: Total active study time accumulated today.
    * Link to "View Full Activity History" (redirects to `/activity`).
  * **Overview KPI Stats Grid**:
    * Overall Notes studied count.
    * Overall Quiz average percentage score.
    * Flashcard mastery percentage.
    * Completed video lectures count.
  * **Quick Navigation & Action Hub**:
    * "Jump to Karaoke Notes" shortcut button.
    * "Take a Quiz" shortcut button.
    * "Review Flashcards" shortcut button.
  * **Recent Activity Timeline**:
    * Chronological list of user's latest 5 actions (e.g. "Completed German Quiz 1 with 92%", "Read Note: Die Schildkröte").
    * Timestamp per item (relative time format: "2 hours ago").
    * Empty state graphic when no recent activity exists.

---

## 5. Notes Library Page
* **Route:** `/notes` (Authenticated)
* **Page Purpose:** Browse, filter, search, and access notes, DOCX documents, slide presentations, and interactive karaoke notes.
* **Structural Layout:**
  * **Page Header**:
    * Title: "Study Notes & Reading Library".
    * Trainer/Admin Action: "Create Note" button triggering creation modal.
  * **Filter & Search Toolbar**:
    * Search input field with real-time debounced query filtering across note titles and content.
    * **Subject Filter Dropdown**: Lists all subjects ("All Subjects", "German", "Computer Science", etc.).
    * **Topic Filter Dropdown**: Dynamically populated based on selected subject ("All Topics", "Grammar", "Vocabulary", etc.).
    * **Content Type Tabs / Pills**: All Notes, Standard Notes, Interactive Karaoke Notes, Pinned Notes.
  * **Notes Grid / List**:
    * Each note card contains:
      * Pinned indicator icon (if pinned by user or trainer).
      * Note category badge (Subject & Topic names).
      * Content format badge (`Karaoke Audio`, `DOCX Document`, `HTML Slides`, `Rich Text`).
      * Note Title.
      * Text excerpt / preview snippet.
      * Metadata row: Author name, creation date, view counter.
      * Action buttons:
        * Primary "Open & Read" button (redirects to `/notes/:id`).
        * Pin / Unpin toggle button.
        * Edit button (trainer/author/admin only).
        * Delete button (trainer/author/admin only, with confirmation prompt).
  * **Empty State**: Graphic icon, "No notes found", and "Clear filters" or "Create note" action.
  * **Pagination Controls**:
    * Previous Page button, Page number indicators (`Page X of Y`), Next Page button (6 items per page).

---

## 6. Note Creation & Edit Modal
* **Trigger:** "Create Note" button in Navbar or Notes page; "Edit Note" button on note card.
* **Modal Architecture:**
  * **Step 1: Note Type Selection** (on initial creation):
    * **Normal Study Note**: Standard rich text, DOCX import, code snippets, tags.
    * **Interactive Karaoke Note**: Time-aligned word-by-word audio reading and Sprechen mode.
  * **Step 2: Note Editor Form**:
    * **General Metadata**:
      * Note Title input (text, required).
      * Subject selection dropdown.
      * Topic selection dropdown (dependent on Subject).
      * Pin Note checkbox.
      * Accent Color picker (color choices for note tagging).
    * **Tab 1: JSON Alignment Import (for Karaoke Notes)**:
      * "Download Template JSON" action button.
      * Drag-and-drop / file selector for alignment `.json` file.
      * Alignment validation indicator (displays parsed sentence count, word count, total audio duration).
      * **English Version of Script (for Understanding Purpose Only)**:
        * Clearly labeled as static reference for understanding while speaking.
        * "Upload English Script (.txt / .json)" button.
        * Line-by-line translation textarea (1 sentence per line).
        * Translation alignment counter (e.g. "8 of 8 sentences translated").
    * **Tab 2: Text Script Input (Auto-Alignment Mode)**:
      * Target language story text area (German sentences separated by periods or newlines).
      * English translation text area (matches sentences 1-to-1).
      * Guidance notice: English sentences serve as static understanding reference only and are never read aloud.
    * **Audio Attachment Box (Shared across tabs)**:
      * Audio file selector (`.mp3`, `.wav`, `.m4a`).
      * Audio stream source selection (local file upload vs pre-hosted URL).
      * Audio duration calculator indicator.
    * **Sprechen (Speaking Practice) Mode Toggle**:
      * Checkbox / Switch enabling Sprechen Mode.
      * Helper explanation: pauses audio after each sentence at 0.75x speed for pronunciation check.
      * Status tag: shows "English Reference Linked" when translations are provided.
    * **Modal Actions**:
      * "Cancel" button.
      * "Save Note / Create Note" submission button (with loading spinner).

---

## 7. Interactive Karaoke Note Reader & Sprechen Engine
* **Route:** `/notes/:id` (when `note.isKaraoke === true`) and `/notes/karaoke/demo`
* **Page Purpose:** Core language immersion engine featuring synchronized audio-text playback and real-time German speaking pronunciation practice.
* **Structural Hierarchy:**

### 7.1 Header & Control Toolbar
* Story Title and Subject/Topic badge.
* Back link to `/notes`.
* **Mode Switcher Toggle**:
  * **Listening Mode**: Continuous playback from start to finish without pausing.
  * **Sprechen Practice Mode**: Sentence-by-sentence training with auto-pauses and voice recording.
* **Audio Playback Speed Selector**: Segmented options for `0.75x` (default for Sprechen), `1.0x`, and `1.25x`.
* **Sync Offset Timing Adjuster**: Real-time calibration buttons (`-0.25s`, `Reset 0s`, `+0.25s`) allowing students to adjust word highlight timing for device audio latency.
* **Translations Toggle Button**: "Translations ON / OFF" button (controls visibility of static English translation subtitles).

### 7.2 Main Audio Player Bar
* Play / Pause toggle button.
* Current playback time / Total audio duration indicators (`mm:ss / mm:ss`).
* Interactive progress scrubber bar (drag or click to jump audio position).
* Volume and mute slider.

### 7.3 Transcript & Reading Canvas
* Full text arranged in numbered sentence blocks.
* **Active Sentence Focus**: The sentence currently playing is emphasized with clear active state styling.
* **Word-by-Word Highlighting**: Each word lights up in exact millisecond synchronization with audio playback.
* **Vocabulary Tooltips**: Words with registered definitions have an indicator dot; clicking opens an inline glossary popup displaying word definition, translation, and grammatical part of speech.
* **Static English Sentence Translation**:
  * Rendered directly below each German sentence when translations are enabled.
  * Statically displayed for meaning and understanding.
  * **Strict playback rule**: The English sentence is NEVER read aloud via audio/TTS and NEVER pops up in an intrusive dialog.

### 7.4 Sprechen (Speaking Practice) Interactive Challenge Panel
* Appears dynamically under the active sentence during Sprechen Mode when the audio reaches the end of the sentence and auto-pauses.
* **Status Bar**:
  * "Sprechen (Speaking Practice)" label with microphone icon.
  * **3-Chance Indicator**: 3 dots showing remaining attempts for this sentence (e.g. `(3 left)`).
  * **Success Badge**: "Ausgezeichnet! ✓" badge displayed when pronunciation passes.
* **Pronunciation Target Sentence**:
  * Displays the target German sentence words clearly.
  * Matched words highlighted in green; mispronounced/missed words highlighted in amber with strikethrough.
* **Static English Meaning Reference Box**:
  * Muted subtitle box displaying `Meaning: [English translation text]`.
  * Serves strictly as a static reference so the student understands what they are speaking into the microphone.
* **Live Recording & Speech Feedback Area**:
  * Live speech transcript showing recognized words in real-time as the student speaks.
  * Status message: `"Listening... speak now in German"`.
  * Silence countdown status: `"Submits in 3s silence or click Done"`.
  * Accuracy percentage score badge (e.g. `88% Accuracy`, threshold `≥75%` to pass).
* **Action Buttons**:
  * **"Click to Speak (Auf Deutsch)"** button (initiates German Web Speech recognition).
  * **"Done Speaking (Check Now ✓)"** button (immediately stops listening and evaluates without waiting for silence).
  * **"Cancel"** button (cancels speech recognition).
  * **"Listen Again"** button (re-plays the current German sentence audio at 0.75x speed).
  * **"Next Sentence"** button (manual advance to the next sentence).
* **Audio Feedback Engine**:
  * Synthesized C-major celebration chime on passing (≥75%).
  * Soft low tone on retry.

---

## 8. Standard Notes Reader (Rich Text & Slides)
* **Route:** `/notes/:id` (when `note.isKaraoke === false`)
* **Structural Elements:**
  * Note Title and Subject/Topic metadata header.
  * Mode Switcher (if note contains slide headers):
    * **Article Mode**: Continuous scrolling document with formatted headings, lists, tables, and code snippets.
    * **Presentation Mode**: 16:9 widescreen HTML slide carousel with slide navigation controls, slide counter (`Slide 1 of 12`), and full-screen button.
  * Text-to-Speech (TTS) Reader toolbar for standard text notes (Play, Pause, Speed).
  * Author details and view count.

---

## 9. Quizzes Library Page
* **Route:** `/quizzes` (Authenticated)
* **Page Purpose:** Browse and launch self-paced assessment quizzes.
* **Structural Hierarchy:**
  * **Page Header**: Title, description, and "Create Quiz" button (trainer/admin only).
  * **Filter Toolbar**:
    * Search bar (matches quiz title, topic, description).
    * **Subject Dropdown**: Lists all subjects ("All Subjects", "German", "Computer Science", etc.).
    * **Topic Dropdown**: Dynamically populated based on the selected subject (allows granular topic-specific quiz practice).
    * **Difficulty Filter**: All Difficulties, Easy, Medium, Hard.
  * **Quiz Cards Grid**:
    * Each card displays:
      * Subject and Topic badges.
      * Difficulty pill indicator (`Easy` green, `Medium` amber, `Hard` red).
      * Quiz Title and short summary description.
      * Question count indicator (e.g. `10 questions`).
      * Time limit badge (e.g. `15 mins` or `No limit`).
      * High score / Previous attempt percentage (if previously taken).
      * Primary CTA: "Start Quiz" button (redirects to `/quizzes/:id`).
      * Secondary CTA: "Review Last Attempt" button (if completed, redirects to `/quizzes/:id/review`).
  * **Pagination Controls**: Previous/Next navigation with page counter.

---

## 10. Quiz Taking Interface
* **Route:** `/quizzes/:id` (Authenticated)
* **Page Purpose:** Interactive, distraction-free examination and quiz environment.
* **Structural Elements:**
  * **Quiz Header**:
    * Quiz Title.
    * Progress bar showing answered vs remaining questions.
    * Question counter (`Question X of Y`).
    * Countdown Timer (if timed quiz; alerts user when < 1 minute remains).
  * **Question Content Canvas**:
    * **Question Prompt**: Clear question statement or scenario.
    * **Question Type 1: Standard Multiple Choice (MCQ)**:
      * Radio button options list.
      * Clicking an option selects it.
    * **Question Type 2: Code Snippet MCQ**:
      * Formatted code block with syntax highlighting and line numbers.
      * Radio selection options below the code.
    * **Question Type 3: Match the Pairs (`match_pairs`)**:
      * Dual-column layout: Left column items and Right column targets.
      * Interactive item selection / pairing workflow.
      * Visual link indicators connecting paired items.
      * "Reset Pairs" button.
  * **Bottom Navigation Toolbar**:
    * "Previous Question" button (disabled on first question).
    * "Next Question" button (advances to subsequent question).
    * "Review All" overview drawer button (shows grid of question numbers: answered, flagged, unanswered).
    * "Submit Quiz" button (triggers submission confirmation modal with answered summary).

---

## 11. Quiz Attempt Review Screen
* **Route:** `/quizzes/:id/review` (Authenticated)
* **Page Purpose:** Comprehensive post-quiz grading report, answer breakdown, and learning explanations.
* **Structural Elements:**
  * **Results Summary Header**:
    * Overall Score display (e.g. `8 / 10` • `80%`).
    * Pass / Fail status banner (`Passed` with checkmark, or `Needs Improvement`).
    * Time spent completing the quiz.
    * Date and timestamp of attempt.
    * Action buttons: "Retake Quiz" and "Back to Quizzes".
  * **Question Breakdown List**:
    * Sequential list of every question from the quiz attempt.
    * Per-question card:
      * Question status indicator (Correct ✓ green, Incorrect ✗ red).
      * Question statement.
      * Student's submitted answer.
      * Correct answer (highlighted clearly if student was incorrect).
      * **Detailed Explanation Box**: Pedagogical rationale explaining why the correct answer is right.
      * For Match-the-Pairs: displays full table of correct pairings vs student pairings.

---

## 12. Flashcards Decks & Study Mode

### 12.1 Decks Overview
* **Route:** `/flashcards` (Authenticated)
* **Structural Elements:**
  * Page title, "Create Deck" action (trainer/admin).
  * Subject and Topic filters.
  * Deck Cards Grid:
    * Deck title and subject tag.
    * Total cards count.
    * User mastery progress bar (% mastered).
    * "Study Deck" button (redirects to `/flashcards/:id`).

### 12.2 3D Flip Card Study Screen
* **Route:** `/flashcards/:id` (Authenticated)
* **Structural Elements:**
  * Deck Header: Title, mastery counter (`X / Y Mastered`), progress bar.
  * **Center Flip Card**:
    * Front Face: Question, vocabulary term, or concept prompt. Click or spacebar to flip.
    * Back Face: Answer, definition, example sentence, grammatical notes.
  * **Response Controls**:
    * "Still Learning" (marks card as unmastered, cycles back into review pile).
    * "Mastered" (marks card as known, increments mastery score).
  * Keyboard navigation shortcuts hint (`Space` to flip, `Left/Right Arrow` to rate).
  * **Deck Completion Summary**: Appears when all cards are reviewed; shows mastery percentage, restart deck button, back to decks button.

---

## 13. Video Lessons Library
* **Route:** `/videos` (Authenticated)
* **Structural Elements:**
  * Search bar and Tag pills filter (e.g. `German A1`, `Grammar`, `Listening`).
  * Video Cards Grid:
    * Video thumbnail with duration overlay.
    * Video title and author.
    * View count and upload date.
    * Subject/Topic tags.
    * Click opens in-app YouTube player modal with auto-tracked view count.

---

## 14. Activity History & Learning Analytics
* **Route:** `/activity` (Authenticated)
* **Page Purpose:** Detailed historical tracking of student study time, activity frequency, and engagement trends.
* **Structural Elements:**
  * **Time Range Selector**: Current Week (ISO localized), Previous Week, Month.
  * **Study Time Summary Card**: Total hours studied this week, daily average, streak days.
  * **Daily Hours Bar Chart**: Daily breakdown showing study hours for Monday through Sunday.
  * **Activity Distribution Breakdown**:
    * Donut / Bar chart showing breakdown by activity type (Notes Reading, Karaoke Sprechen, Quiz Attempts, Flashcards).
  * **Detailed Chronological Activity Log**:
    * Paginated table showing: Date/Time, Activity Type, Resource Title, Duration / Score, Status.

---

## 15. User Profile & Account Settings
* **Route:** `/profile` (Authenticated)
* **Structural Elements:**
  * **Profile Details Card**:
    * User Name, Email, Role badge, Member since date.
    * "Edit Profile" form (updates name, profile bio).
  * **Security & Password Management**:
    * Current password field.
    * New password field and confirm password field.
    * "Update Password" button.
  * **Session Information**: Current login session and active tokens.

---

## 16. Admin User Management Panel
* **Route:** `/admin/users` (Admin Role Required)
* **Structural Elements:**
  * Search and role filter (Students, Trainers, Admins, Inactive).
  * "Create Trainer" action button (opens trainer provisioning modal).
  * **Users Table**:
    * Columns: User Name, Email, Role, Status (`Active` / `Inactive`), Join Date, Actions.
    * Per-user Actions:
      * Role selector dropdown (`student`, `trainer`, `admin`).
      * Active status toggle switch (enable/disable account access).
      * Delete user button (with confirmation modal).
