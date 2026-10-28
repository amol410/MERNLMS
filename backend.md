# backend.md — Agent Context for the Express API & Database Service

> **Purpose:** Comprehensive onboarding context for coding agents and engineers working in `backend/`.
> Documents architecture, data models, audio streaming pipelines, activity analytics, routing conventions,
> gamification engines, crawler routes, automated tests, and verified system characteristics.
> Verified against active source on 2026-10-28.
>
> **Rules of engagement for agents:**
> 1. This backend uses **MySQL 8 + Sequelize 6**, NOT MongoDB / Mongoose.
> 2. Every model exposes a virtual `_id` alongside the primary integer `id` for client compatibility. Always preserve this pattern in new models.
> 3. Audio files for Karaoke notes and lesson reference audio are stored directly in MySQL (`karaoke_audios` table as `LONGBLOB`) and streamed via HTTP 206 Partial Content. Do NOT save uploaded media solely to local disk.
> 4. Activity timestamps and daily groupings MUST account for client local timezones via `utils/dateHelper.js`. Never assume pure server UTC dates for client study days.
> 5. Automated test suites (`backend/tests/`) must be run via `npm test` before committing any API changes.

---

## 1. What This Is

**DolphinCoder LMS REST API** — Express 4 + Sequelize 6 + MySQL 8.
Serves all `/api/*` REST endpoints, crawler verification endpoints, and serves the built React SPA from `backend/dist`.

- **User Roles**: `student`, `trainer`, `admin`.
- **Core Domains**:
  - `auth`: Registration, JWT authentication, user profile, password updates.
  - `gamification`: 3D sinusoidal Archipelago path (`GET /api/gamification/path`), JIT on-demand lesson payloads (`GET /api/gamification/lesson/:id`), daily streak tracking, oxygen regeneration (30 min / bubble, max 5), pearls economy, and database-backed ad reward claims (`POST /api/gamification/claim-ad-reward`).
  - `curriculum`: Hierarchical Section $\to$ Unit $\to$ Lesson administration studio with 8 interactive stage configs.
  - `notes`: Rich text notes (Tiptap), DOCX upload, HTML slide decks, and **Interactive Karaoke Notes** with audio streaming.
  - `videos`: YouTube video embeddings, tag filtering, view count increments.
  - `quizzes`: MCQ, True/False, Code-MCQ, **Match the Pairs (`match_pairs`)**, timer tracking, attempt grading, test review (`/quizzes/:id/review`).
  - `flashcards`: Decks, 3D flip card study, progress tracking, DOCX bulk upload.
  - `activity`: User study engagement tracking, today's performance counts, weekly performance history with localized day categorization and daily study hours.
  - `subjects`: Relational Subject and Topic hierarchy across curriculum.
  - `pages`: Dynamic CMS pages with custom slugs, OpenGraph metadata, and instant IndexNow search engine indexing.
  - `admin`: User activation toggle, trainer creation, user management.
  - `crawlers`: `/app-ads.txt` (Google AdMob crawler verification), `/sitemap.xml`, `/robots.txt`.

---

## 2. Run, Test & Deploy

```bash
cd backend
npm install
npm run dev        # nodemon, port 5000 (server.js uses process.env.PORT || 5000)
npm start          # node server.js
npm test           # runs Jest & Supertest test suite in-band
npm run test:live  # runs Hostinger VPS live latency test suite
```

- **Database Configuration**: Loaded via `dotenv.config()`. Required `.env` keys:
  `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRE`, `BCRYPT_ROUNDS`, `PORT`, `NODE_ENV`, `CLIENT_URL`, `SITE_URL`, `INDEXNOW_KEY`.
- **Single Process Architecture**: Frontend builds directly into `backend/dist`. Express serves `backend/dist` statically with an SPA catch-all (`*`) for non-`/api` requests.
- **Production Process Manager**: Managed by PM2 via `ecosystem.config.js`.

---

## 3. Complete Directory Map

```
backend/
├── config/
│   └── database.js               # Sequelize instance, connection pooling & dialect configuration
├── controllers/
│   ├── activityController.js     # Engagement stats, localized day aggregation, dashboard counts
│   ├── adminController.js        # User role toggles, trainer creation, user management
│   ├── authController.js         # JWT auth, user profile, registration, password updates
│   ├── curriculumController.js   # Hierarchical course/unit/lesson curriculum API
│   ├── flashcardController.js    # Flashcard decks, flip-card study, DOCX bulk parser
│   ├── gamificationController.js # Archipelago map, JIT lessons, streaks, oxygen & ad rewards
│   ├── noteController.js         # Tiptap notes, DOCX ingestion, HTTP 206 binary audio streaming
│   ├── pageController.js         # CMS page creation, editing, publishing, dynamic slugs
│   ├── quizController.js         # Assessments, question matching, timer evaluation, review
│   ├── subjectController.js      # Relational Subject and Topic taxonomies
│   └── videoController.js        # Video management, YouTube embedding, view counts
├── data/                         # Seed data & curriculum blueprints
├── dist/                         # Compiled production React frontend bundle (served statically)
├── middleware/
│   ├── auth.js                   # JWT token extraction, authentication & RBAC guards
│   ├── errorHandler.js           # Centralized exception handling, Sequelize error normalization
│   └── upload.js                 # Multer disk/memory storage for uploads
├── models/
│   ├── associations.js           # Relational mappings, 1-to-many, many-to-many, cascade rules
│   ├── Island.js                 # Curriculum progression chapters
│   ├── IslandNode.js             # Archipelago path nodes
│   ├── KaraokeAudio.js           # Binary LONGBLOB audio storage in MySQL
│   ├── LessonStage.js            # Interactive drill configuration per node
│   ├── Note.js                   # Rich-text notes and karaoke alignments
│   ├── Page.js                   # CMS public pages with SEO descriptors
│   ├── Question.js               # Quiz questions & match pairs
│   ├── Quiz.js                   # Timed tests & assessment records
│   ├── QuizAttempt.js            # User exam attempts & itemized scores
│   ├── Subject.js                # Academic subjects
│   ├── Topic.js                  # Academic topics
│   ├── User.js                   # Learner, trainer, and admin accounts
│   ├── UserActivity.js           # Engagement logs with DATEONLY calendar grouping
│   └── UserNodeProgress.js       # User course progression indexed by (user_id, course_id, node_index)
├── routes/                       # Express route registries
├── scripts/
│   └── benchmark_hostinger.js    # Automated network & API latency benchmarking tool
├── tests/
│   ├── auth.test.js              # Auth & JWT integration tests
│   ├── curriculum.test.js        # Curriculum hierarchy & JIT tests
│   ├── gamification.test.js      # Streaks, oxygen & ad reward tests
│   ├── hostinger_live.test.js    # Live VPS latency benchmark suite
│   ├── lesson_mechanics.test.js  # Derangement & pronunciation scoring tests
│   └── setup.js                  # Jest environment test harness
├── utils/
│   ├── dateHelper.js             # Timezone-safe date conversion & streak aggregation
│   └── seoHelper.js              # XML sitemap, robots.txt & OpenGraph tag injection
├── ecosystem.config.js           # PM2 cluster configuration for zero-downtime production
├── package.json                  # Dependencies, test scripts & metadata
└── server.js                     # Express app setup, crawler routes & HTTP bootstrap
```

---

## 4. Key Models & Schema Specifications

### `User` (`users` table)
- `id` (INT PK auto-increment), `name`, `email` (unique), `password` (bcrypt hashed), `role` (`student`, `trainer`, `admin`), `avatar`, `bio`, `isActive`.
- **Gamification Columns**:
  - `streakCount` (`streak_count`, INT default 1): Current active daily streak.
  - `longestStreak` (`longest_streak`, INT default 1): Record streak achieved.
  - `lastActiveDate` (`last_active_date`, DATEONLY): Client timezone normalized date of last activity.
  - `dailyTargetXp` (`daily_target_xp`, INT default 20): Target study XP per day.
  - `targetLanguage` (`target_language`, STRING(10) default 'de'): Learning language code (`de`, `en`).
  - `nativeLanguage` (`native_language`, STRING(10) default 'en'): Native instruction code (`en`, `hi`, `mr`).
  - `currentLevel` (`current_level`, STRING(10) default 'A1'): Proficiency stage.
  - `pearls` (`pearls`, INT default 10): In-game currency balance.
  - `oxygen` (`oxygen`, INT default 5): Energy gauge (capped at 5).
  - `lastOxygenRefill` (`last_oxygen_refill`, DATE): Timestamp of last regeneration cycle.
  - `totalXp` (`total_xp`, INT default 0): Lifetime accumulated experience points.
  - `currentLeague` (`current_league`, STRING(50) default 'Coral Reef'): Weekly league tier.

### `UserNodeProgress` (`user_node_progress` table)
- `id` (INT PK auto-increment).
- `userId` (`user_id`, INT): References `User.id`.
- `courseId` (`course_id`, STRING(32) default 'de_en_a1'): Multi-course partition identifier (`de_en_a1`, `en_hi_a1`, `en_mr_a1`).
- `nodeIndex` (`node_index`, INT): Index of the island node.
- `status` (ENUM `'locked'`, `'available'`, `'completed'`).
- `stars` (INT 0–3).
- `scorePct` (INT 0–100).
- **Compound Unique Index**: `['user_id', 'course_id', 'node_index']` — strictly prevents progress in one language from overwriting another.

### `UserActivity` (`user_activities` table)
- `id` (INT PK auto-increment), `userId`, `activityType` (ENUM `'quiz'`, `'note'`, `'flashcard'`, `'lesson'`), `resourceId`, `resourceTitle`, `subjectName`, `topicName`.
- `metadata` (LONGTEXT JSON): Stores type-specific metrics (e.g. `attemptCount`, `percentage`, `engagementSecs`, `comboBonus`).
- `activityDate` (DATEONLY): Client local date resolved via `dateHelper.getLocalDateOnly(new Date(), clientTzOffset)`.

### `KaraokeAudio` (`karaoke_audios` table)
- `id` (INT PK auto-increment), `noteId` (INT FK to Note), `fileName` (STRING), `mimeType` (STRING default `'audio/mpeg'`), `fileSize` (BIGINT).
- `audioData` (LONGBLOB): Binary MP3 payload up to 64MB.

---

## 5. Automated Testing & Verification Commands

```bash
# Run all unit/integration tests
npm test

# Run Hostinger VPS live latency benchmark
npm run test:live

# Run standalone benchmark script with detailed metric percentiles (p50, p90, p99)
node scripts/benchmark_hostinger.js
```
