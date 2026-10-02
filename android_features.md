# Android Mobile Application Features & Structural Blueprint (`android_features.md`)

> **Specification Purpose:** This document provides a complete, screen-by-screen functional and structural blueprint of the DolphinCoder Android Mobile Application (`app/dolphincoder`). It is written as an architectural specification for generative design and UI tools (such as Google Stitch), enabling redesign and theme generation while preserving 100% of the mobile app's native user interactions, data fields, and functionality. It specifies structural components and interactive flows without prescribing CSS styling.

---

## 1. App Shell, Navigation Architecture & Global Themes
* **Platform Target:** Android (SDK 23+, Android 14 tested) & iOS.
* **Core Navigation Architecture:**
  * Root navigation managed via declarative routing (`GoRouter`).
  * **Bottom Navigation Bar**: Persistent 4-tab shell navigation displayed across primary authenticated views:
    1. **Tab 1: Dashboard / Home** (icon: Home, route: `/dashboard`).
    2. **Tab 2: Notes & Karaoke** (icon: Menu Book, route: `/notes`).
    3. **Tab 3: Quizzes** (icon: Psychology / Quiz, route: `/quizzes`).
    4. **Tab 4: Profile & Settings** (icon: Person, route: `/profile`).
  * **Authentication Guard**: Unauthenticated requests redirect automatically to `/login`. Active session tokens stored securely in native keystore (`flutter_secure_storage`).

---

## 2. Authentication Screens

### 2.1 Splash & Onboarding Screen
* **Route:** `/splash`
* **Structural Elements:**
  * Centered brand emblem and animated typography ("DolphinCoder").
  * Status indicator: verifies stored JWT auth credentials.
  * Auto-transition: routes to `/dashboard` if token is valid; routes to `/login` if unauthenticated.

### 2.2 Mobile Login Screen
* **Route:** `/login`
* **Structural Elements:**
  * **Header**: Brand logo, application title, and welcoming subtitle ("Sign in to your learning account").
  * **Input Fields**:
    * Email address text field with leading mail icon, email format validation, and clear button.
    * Password text field with leading lock icon, obscure text toggle (eye icon), and validation.
  * **Actions**:
    * Primary "Sign In" button with full-width tap area and integrated loading spinner.
    * "Forgot Password?" helper link.
  * **Footer Navigation**: "Don't have an account? Sign Up" linking to `/register`.
  * **Error Handling**: Non-blocking toast/snack banner for invalid credentials or network connection errors.

### 2.3 Mobile Register Screen
* **Route:** `/register`
* **Structural Elements:**
  * **Header**: Back arrow button, brand emblem, title ("Create New Account").
  * **Input Fields**:
    * Full Name text field.
    * Email text field.
    * Password text field (minimum 6 characters, visibility toggle).
    * Confirm Password text field (validation matching password).
  * **Actions**:
    * Primary "Sign Up" button.
    * Link returning to `/login`.

---

## 3. Mobile Dashboard Screen
* **Route:** `/dashboard` (Bottom Tab 1)
* **Screen Purpose:** Daily mobile home screen summarizing the student's learning momentum, daily performance counters, and shortcuts.
* **Structural Hierarchy:**
  * **Top App Bar**:
    * Left: User greeting ("Hello, [User Name]") with current date subtitle.
    * Right: Profile avatar tap target (routes to `/profile`).
  * **Today's Performance Card** (Primary focal module):
    * Header: "Today's Performance" badge with live sync indicator.
    * 4-grid performance metrics:
      * **Notes Read Today**: Count of unique notes studied today.
      * **Quizzes Taken Today**: Count of quizzes completed today.
      * **Cards Reviewed Today**: Count of flashcards reviewed today.
      * **Hours Studied Today**: Formatted active study time (e.g. `1.2 hrs`).
    * Footer Action: "View Full Activity History →" (routes to `/activity`).
  * **Overall Learning Stats Grid**:
    * Notes Completed counter.
    * Quiz Average Score percentage pill.
    * Flashcards Mastered counter.
  * **Quick Learning Resumption Row**:
    * Horizontal quick-action pills: "Practice Sprechen", "Start Quiz", "Review Flashcards", "Watch Lessons".
  * **Recent Activity Feed**:
    * Card list displaying the user's latest 3 study events with activity icon, title, score/duration, and relative timestamp.
  * **Pull-to-Refresh**: Native pull-down gesture refreshing all dashboard counters from `/api/activity/summary`.

---

## 4. Mobile Notes Library Screen
* **Route:** `/notes` (Bottom Tab 2)
* **Screen Purpose:** Browse, search, and filter study notes, DOCX documents, and interactive Karaoke reading notes.
* **Structural Hierarchy:**
  * **Top Search Bar**:
    * Search input field with search icon, clear `(X)` button, and debounced API query.
  * **Subject Filter Row**:
    * Horizontally scrollable chip carousel:
      * "All" chip (resets subject filter).
      * Subject chips (e.g. "German", "Computer Science", etc.).
      * Active subject chip shows filled accent selection.
  * **Topic Filter Row (Dynamic)**:
    * Appears dynamically beneath the subject chips whenever a subject is active.
    * Horizontally scrollable chip carousel:
      * "All Topics" chip (resets topic filter within the subject).
      * Individual topic chips (e.g. "Grammar", "Vocabulary", "A1 Basics").
      * Distinct secondary accent styling to differentiate topic level from subject level.
  * **Notes List View**:
    * Infinite-scroll list (paginated 6 items per batch).
    * Each Note Card displays:
      * Pin indicator (if pinned).
      * Subject name and Topic name badges.
      * Format badge: `Karaoke Note` with music note icon, or `Standard Note` with document icon.
      * Note Title.
      * Text excerpt preview (truncated to 2 lines).
      * Creation timestamp and view count.
      * Entire card is a tap target navigating to Note Reader (`/notes/:id`).
  * **Empty & Loading States**:
    * Shimmer skeleton loading placeholder during initial fetch.
    * Empty state graphic with "No notes match your filter" message and reset button.

---

## 5. Mobile Karaoke & Sprechen Reader Screen
* **Route:** `/notes/:id` (when `note.isKaraoke === true`)
* **Screen Purpose:** Mobile immersion engine pairing synchronized German audio playback with interactive voice pronunciation practice.
* **Structural Hierarchy:**

### 5.1 App Bar & Global Controls
* Back button returning to Notes tab.
* Note Title.
* Action Icon: Translation Visibility Toggle (`Eye` / `Translate` icon) with active/inactive visual state.

### 5.2 Audio Control Bar
* Play / Pause circular primary button.
* Current position / Total duration readout (`01:15 / 03:42`).
* Interactive linear playback slider (tap or drag to scrub).
* **Speed Selector Chips**: `0.75x` (default for speaking practice), `1.0x`, `1.25x`.
* **Sync Offset Buttons**: `-0.25s`, `0s`, `+0.25s` for calibrating word-highlight synchronization with phone speaker/Bluetooth latency.
* **Mode Selector Switch**:
  * **Listening Mode**: Continuous, uninterrupted audio reading from beginning to end.
  * **Sprechen Mode**: Sentence-by-sentence training with automatic pauses at sentence boundaries.

### 5.3 Transcript & Reading Stream
* Vertical scroll view containing every German sentence in sequential order.
* **Active Sentence Card**: High-contrast border and highlighted background when the audio cursor is within its timestamp range.
* **Word-Level Highlighting**: Individual words in the sentence light up synchronously in real time as the native German speaker utters them.
* **Static English Translation Subtitle**:
  * Displayed directly below the German sentence in muted italic text when translations are toggled ON.
  * **Strict Constraint**: English is purely for understanding; it is **never spoken by audio/TTS** and **never opens a popup**.

### 5.4 Sprechen (Speaking Practice) Interactive Challenge Box
* Appears inside the active sentence card when paused in Sprechen Mode.
* **Header Row**:
  * Microphone icon with "SPRECHEN PRACTICE" label.
  * **Chances Counter**: `Chances: X/3` showing remaining attempts.
  * Success Badge: `Ausgezeichnet! ✓` badge displayed if the sentence has been passed.
* **Target Pronunciation Sentence**:
  * Displays the target German sentence clearly for the student to pronounce.
* **Static English Meaning Reference Box**:
  * Clean, compact subtitle container: `Meaning: [English sentence translation]`.
  * Provides instant meaning comprehension while preparing to speak into the microphone.
* **Live Microphone & Recognition Feedback Area**:
  * Displays live recognized German words as the student speaks (`You said: "..."`).
  * Initial prompt when listening starts: `"Listening... speak clearly in German"`.
  * **Continuous Dictation**: Configured with `ListenMode.dictation`, 90-second duration, and 6-second pause tolerance to prevent premature cutoffs.
  * **3-Second Silence Countdown Indicator**:
    * Green pulsing status dot with text: `"Submits in 3s of silence, or tap Done"`.
    * Gives the student a full 3 seconds of continuous silence before auto-evaluating.
  * Accuracy percentage score badge (e.g. `82% Accuracy`, pass threshold `≥75%`).
* **Control Action Buttons**:
  * **"Speak (Auf Deutsch)"** primary button (starts speech recognition with mic permission check).
  * **"Done Speaking (Check Now ✓)"** prominent green button (instantly evaluates without waiting for 3 seconds of silence).
  * **"Cancel"** outlined button (cancels speech session).
  * **"Listen Again"** audio button (replays the current sentence audio at 0.75x speed).
  * **"Next Sentence"** navigation button (advances to the subsequent sentence).

### 5.5 Animated Speaking Character / Avatar Companion (Architectural Specification)
* **Screen Placement Options**:
  * **Layout A (Top Stage Header)**: Positioned above the transcript as an interactive visual companion (100–140dp height) looking towards the user with audio waveform/speech bubbles.
  * **Layout B (Inline Sentence Anchor)**: Renders directly alongside the active sentence card or Sprechen challenge box as the "Speaker Avatar" representing the story speaker (`sentence.speaker`).
  * **Layout C (Floating Assistant FAB/Bubble)**: Draggable or corner-docked interactive mascot avatar that reacts dynamically without consuming vertical scroll height.
* **Structural Elements**:
  * **Vector Character Head & Body**: Vector animation canvas (Rive State Machine or Lottie composition) featuring idle breathing, eye blinks, and dynamic mouth visemes.
  * **Dynamic Lip-Sync Controller**: Synchronized strictly to active word start/end timestamps (`KaraokeWord.start` and `KaraokeWord.end`) delivered in the karaoke story payload.
  * **Speech Bubble Readout (Optional)**: Pop-up thought/speech bubble showing current spoken phrase or phonetic kata tip.
  * **Reactive Expressions**:
    * *Idle*: Attentive listening posture, natural blinking.
    * *Speaking*: Real-time mouth articulators matching audio rhythm; automatic mouth close during inter-word silences.
    * *Listening to Student*: Head cocked with hand-to-ear gesture when mic is recording in Sprechen mode.
    * *Celebrating*: Confetti burst, smiling, thumbs-up on ≥75% pronunciation score.
    * *Encouraging*: Gentle nodding gesture when student has chances remaining.

---

## 6. Mobile Standard Note Detail Screen
* **Route:** `/notes/:id` (when `note.isKaraoke === false`)
* **Structural Elements:**
  * Top App Bar with back navigation, note title, and share/favorite buttons.
  * Mode Switcher (if note has slide markup):
    * **Document Mode**: Formatted rich-text reader (headings, bullet points, blockquotes, code snippets).
    * **Slides Mode**: Swipeable horizontal page-view carousel formatted in 16:9 aspect ratio with slide counter indicators (`1 / 8`).
  * Subject & Topic metadata header.

---

## 7. Mobile Quizzes Screen
* **Route:** `/quizzes` (Bottom Tab 3)
* **Screen Purpose:** Browse, search, and launch quiz evaluations with dual Subject and Topic filtering.
* **Structural Hierarchy:**
  * **Top Search Bar**:
    * Search text field with search icon and clear button.
  * **Subject Filter Row**:
    * Horizontally scrollable chip row:
      * "All" chip.
      * Subject chips (e.g. "German", "Computer Science").
      * Selected subject highlighted in primary violet theme.
  * **Topic Filter Row (Dynamic)**:
    * Automatically appears beneath the subject row when a specific subject is selected.
    * Horizontally scrollable chip row:
      * **"All Topics"** chip (resets topic filter).
      * Individual topic chips (e.g. "Grammar", "Vocabulary", "A1 Basics").
      * Selected topic highlighted in cyan accent to visually distinguish topic tier from subject tier.
      * Tapping a topic dynamically filters the quiz list via `quizzesListProvider`.
  * **Quiz Cards List**:
    * Vertical scroll list with pull-to-refresh and pagination (6 per batch).
    * Each card displays:
      * Psychology quiz icon with gradient container.
      * Subject and Topic badges.
      * Difficulty pill indicator (`Easy` green, `Medium` amber, `Hard` red).
      * Quiz Title.
      * Short description snippet.
      * Metadata row: Question count (`10 questions`), Time limit (`15m` / `No limit`).
      * High score badge (if previously attempted).
      * Card tap action routes to Quiz Take Screen (`/quizzes/:id`).

---

## 8. Mobile Quiz Taking Screen
* **Route:** `/quizzes/:id`
* **Screen Purpose:** Focused, mobile-optimized quiz examination interface.
* **Structural Hierarchy:**
  * **App Bar / Progress Header**:
    * Back navigation button (with confirm-exit dialog to prevent accidental loss of progress).
    * Question counter (`Q 3 of 10`).
    * Linear progress bar showing completion percentage.
    * Countdown Timer chip (if quiz has time limit; pulses warning colors when time is low).
  * **Question Body Card**:
    * Question text prompt formatted with clear typography.
    * **Type 1: Multiple Choice Question (MCQ)**:
      * Vertical stack of selectable option cards with option letter indicator (`A`, `B`, `C`, `D`).
      * Selected option highlights with radio indicator.
    * **Type 2: Code Snippet MCQ**:
      * Scrollable horizontal/vertical code container with dark background and monospace font.
      * Selection options placed directly below the code block.
    * **Type 3: Match the Pairs (`MatchPairsWidget`)**:
      * Dual-column layout: Left terms column and Right definitions column.
      * Tap-to-select matching interaction (tap item on left, then tap matching target on right).
      * Color-coded pair badges displaying matched pairs.
      * "Reset Matches" button to clear current pairings.
  * **Bottom Navigation Bar**:
    * "Previous" button (disabled on first question).
    * "Next" button (advances to next question).
    * "Submit Quiz" button (visible on final question or via confirmation sheet; submits attempt to `/api/quizzes/:id/attempt`).

---

## 9. Mobile Quiz Review Screen
* **Route:** `/quizzes/:id/review`
* **Screen Purpose:** Post-assessment grading report and pedagogical review on mobile.
* **Structural Hierarchy:**
  * **Top App Bar**: Title ("Quiz Review"), back arrow returning to Quizzes list.
  * **Score Summary Banner**:
    * Circular percentage indicator (e.g. `85%`).
    * Score fraction (`Score: 8 / 10`).
    * Pass / Fail status banner (`Passed` with checkmark, or `Did Not Pass`).
    * Time spent and attempt date.
    * "Retake Quiz" primary action button.
  * **Question-by-Question Breakdown List**:
    * Sequential scroll view of all questions.
    * Question status header: "Question X" with green `Correct ✓` or red `Incorrect ✗` badge.
    * Original question prompt.
    * Student's submitted answer (highlighted in red if wrong, green if right).
    * Correct answer indicator (highlighted in green).
    * **Explanation Card**: Detailed explanation text outlining the learning reason for the answer.
    * For Match-the-Pairs: displays correct item pairings side-by-side against student submissions.

---

## 10. Mobile Videos Screen & Video Player
* **Route:** `/videos`
* **Structural Hierarchy:**
  * Search bar and horizontal tag filter chips.
  * Vertical list of Video Cards:
    * 16:9 YouTube thumbnail preview with play icon overlay.
    * Video duration badge.
    * Video title and author name.
    * View count badge and publication date.
    * Tapping card navigates to video player screen.
  * **Video Player Screen (`/videos/:id`)**:
    * Embedded in-app YouTube player (via `webview_flutter` / native player).
    * Fullscreen orientation toggle.
    * Title, description, and related videos list below player.

---

## 11. Mobile Flashcards Screen & Study Mode
* **Route:** `/flashcards`
* **Structural Hierarchy:**
  * Decks List: Cards showing deck title, subject badge, total cards count, and mastery progress bar.
* **Flashcard Study Screen (`/flashcards/:id`)**:
  * Top progress bar with card counter (`Card 4 of 20`) and mastery count.
  * **Center 3D Flip Card Widget**:
    * Tap gesture or swipe gesture flips card 180 degrees.
    * Front: Term, question, or vocabulary phrase.
    * Back: Definition, translation, usage notes.
  * **Bottom Action Buttons**:
    * "Still Learning" (thumbs down / red accent).
    * "Mastered" (thumbs up / green accent).
  * Completion modal with final score and restart option.

---

## 12. Mobile Activity History Screen
* **Route:** `/activity`
* **Screen Purpose:** Comprehensive personal analytics tracking active learning hours and activity frequency.
* **Structural Hierarchy:**
  * **App Bar**: "Study Activity History".
  * **Weekly Summary Card**:
    * Total active hours studied in the current week.
    * Daily average study time.
  * **Daily Study Hours Chart**:
    * Vertical bar chart showing hours per day (Monday through Sunday).
  * **Activity Category Distribution**:
    * Breakdown chips showing hours per domain: Notes Reading, Karaoke Sprechen, Quizzes, Flashcards.
  * **Activity Log List**:
    * Chronological list of completed activities with date, duration, score, and title.

---

## 13. Mobile Profile & Settings Screen
* **Route:** `/profile` (Bottom Tab 4)
* **Screen Purpose:** Manage user identity, app configuration, network endpoints, and account security.
* **Structural Hierarchy:**
  * **User Profile Header Card**:
    * Large user avatar with initial letter.
    * Full Name and Email address.
    * Role badge (`Student`, `Trainer`, `Admin`).
  * **Account Settings List**:
    * "Edit Profile": Opens dialog to update user display name.
    * "Change Password": Opens bottom sheet with current password, new password, and confirm password fields.
  * **Developer & Network Settings**:
    * **API Base URL Configuration**:
      * Displays active server endpoint (e.g. `https://dolphincoder.com/api`).
      * Tapping opens an editable modal dialog allowing students/developers to point the mobile app to a custom backend IP or local development server (`http://10.0.2.2:5000/api`).
  * **Application Info**: App version (`v1.0.0+2`), copyright notice.
  * **Logout Action**: Full-width button clearing secure token storage and navigating back to `/login`.

---

## 14. Gamified Coral Reef Archipelago & Interactive Lesson Session Screen
* **Route:** `/home` (Archipelago Map) and `/lesson/:nodeIndex` (Interactive Session Screen)
* **Screen Purpose:** Duolingo-style gamified language learning path with interactive multi-stage challenges, mascot reactions, and native audio streaming.
* **Archipelago Map Screen (`ArchipelagoMapScreen`)**:
  * **Top Status Bar**:
    * Language Flag selector (German flag).
    * Streak flame counter with daily status.
    * Oxygen gauge (`5/5`) showing remaining health for challenges.
    * Pearls wallet counter with gemstone icon.
  * **Unit Banner**: "Unit 1 • Coral Reef: Introductions & Daily Greetings" with chapter progress indicator.
  * **Zigzag Island Nodes**:
    * 3D tactile circular island buttons positioned in an alternating sinusoidal pattern.
    * Node types: `lesson`, `karaoke`, `speech`, `chest` (Treasure), `match`, `builder`, `boss` (Exam).
    * Statuses: `locked` (dimmed with padlock), `available` (vibrant with pulsating crown), `completed` (check icon with 1-3 earned stars).
    * Tapping a playable node routes to `/lesson/:nodeIndex` passing `PathNodeModel`.
* **Interactive Lesson Session Screen (`LessonSessionScreen`)**:
  * **Top Progress Bar**:
    * Close button `(X)` with exit confirmation.
    * Multi-stage linear progress bar advancing with each task.
    * Lives / Hearts indicator (`❤️ 5`).
  * **Stage 0: Word Match (`word_match` / `match_pairs`)**:
    * Dynamic vocabulary matching pairs loaded directly from lesson stage data (supports `target`/`native` and `german`/`english` schemas).
    * 2-column vocabulary matching tiles (Target language left, Native right) with tactile pairing and green success dissolution.
  * **Stage 1: Listen and Tap What You Hear (`listen_tap`)**:
    * **Animated Mascot (`AnimatedDolphinMascot`)**: Echo the Dolphin wearing headphones, pulsing when audio plays.
    * **Dual Audio Player Architecture**: Dedicated `_sentenceAudioPlayer` for listening comprehension and `_wordAudioPlayer` for tap-to-pronounce word chips, preventing audio state collisions.
    * **Native Audio Streaming**: Integrated `AudioPlayer` streaming high-quality audio directly from `/api/notes/audio/db/:id` (resolved via `dolphincoder.com`).
    * **Tactile Speaker Button**:
      * Plays/re-plays full sentence audio track (or authored `sentenceRange`) on tap.
      * Always maintains `volume_up_rounded` iconography to provide intuitive repeat listening without confusing pause toggles.
    * **Tap-to-Pronounce Word Chips**:
      * When learners tap any word token in the word bank (target words or distractors), the app resolves timestamps from `wordTimestamps` (supporting comma-separated audio files and custom `wordsAudioUrl`).
      * Uses pre-buffered audio and native in-memory seek with clean boundary clamping, ensuring full, uncut consonant pronunciation and smooth resonance.
    * **Interactive Assembly Box**: Selected word tokens assemble into the sentence box; tapping removes tokens back to the word bank.
    * **Word Bank**: Tappable word chips derived dynamically from `stages[listen_tap].tokens`.
    * **Tolerant Sequence Verification**: Punctuation-insensitive and whitespace-normalized verification.
    * **Feedback Bottom Sheet (`DuoFeedbackSheet`)**: Displays success or target sentence with "NEXT TASK →".
  * **Stage 2: Sentence Builder (`sentence_builder`)**:
    * English translation prompt bubble.
    * Word bank token selector with animated tile transitions.
    * Tolerant grammar verification against German target sentence.
  * **Stage 3: Sprechen Pronunciation (`sprechen`)**:
    * German target phrase with English parallel translation.
    * Large microphone button with animated ripple effect during active dictation.
    * Speech recognition simulation / speech evaluation feedback.
  * **Stage 4: Celebration & Rewards Screen**:
    * Animated celebratory mascot doing flips.
    * XP Reward, Accuracy %, and Pearls earned metric cards.
    * Confetti and audio chimes on lesson completion.
    * Saves node progress to `/api/gamification/complete-node` and returns to the Archipelago Map.
