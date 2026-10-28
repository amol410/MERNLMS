# DolphinCoder LMS — Backend API & Database Service 🐬

The production-grade REST API and database engine powering [dolphincoder.com](https://dolphincoder.com) and the LingoDolphy mobile application. Built with **Node.js 20 LTS**, **Express 4.18**, **Sequelize 6.35**, and **MySQL 8.0**.

---

## 🌟 Architecture & Core Capabilities

### 1. Dual Deployment Serving (Single-Server Topology)
- **REST API (`/api/*`)**: Serves authentication, curriculum lessons, gamification, quizzes, notes, flashcards, activity tracking, and administrative operations.
- **Static React SPA Delivery**: Express statically serves the production-compiled frontend bundle from `backend/dist` with dynamic single-level SEO injection (`/slug` handled via `utils/seoHelper.js` and `models/Page.js`).
- **Crawler & Verification Endpoints**:
  - `/app-ads.txt`: Direct AdMob crawler verification (`google.com, pub-6038618318911032, DIRECT, f08c47fec0942fa0`).
  - `/sitemap.xml`: Dynamic XML sitemap generator with automated database-backed published page indexing.
  - `/robots.txt`: Search bot directives and AI crawler controls.
  - `/{INDEXNOW_KEY}.txt`: Search engine instant crawling verification.

### 2. Database Architecture & Sequelize 6 ORM (MySQL 8)
- **14 Production Models**:
  1. `User`: Role-based authentication (`student`, `trainer`, `admin`), streak tracking, oxygen energy (`🫧 5/5`), pearls economy (`💎 10`), and language course preferences.
  2. `Note`: Tiptap rich-text documents, DOCX imports, and Karaōke lesson alignment metadata.
  3. `KaraokeAudio`: Direct database storage (`LONGBLOB`) for MP3 audio buffers with HTTP 206 Partial Content byte-range streaming.
  4. `Quiz`: Timed and untimed assessments supporting MCQ, True/False, Code-MCQ, and **Match the Pairs (`match_pairs`)**.
  5. `Question`: Relational question items tied to quizzes with randomized matching pairs derangement.
  6. `Flashcard`: Interactive 3D flip card decks with mastery score tracking.
  7. `Video`: YouTube video embeds, tagging, and view counters.
  8. `Subject`: Relational academic taxonomies.
  9. `Topic`: Fine-grained sub-taxonomies tied to subjects.
  10. `UserActivity`: Engagement tracking with client-timezone date normalization (`DATEONLY`), supporting `quiz`, `note`, `flashcard`, and `lesson` activities.
  11. `Page`: Dynamic CMS content with custom slugs, SEO meta tags, and OpenGraph descriptors.
  12. `Island`: Curriculum progression chapters (Sections 1, 2, 3).
  13. `IslandNode`: Individual curriculum lesson checkpoints on the 3D sinusoidal archipelago map.
  14. `LessonStage`: Granular interactive drill configurations across 8 stage types.
  15. `UserNodeProgress`: Partitioned user progression indexed uniquely by `(user_id, course_id, node_index)` to prevent cross-language overwrites.
- **MongoDB-to-Sequelize Compatibility**: Every model provides a virtual `_id` getter returning `id` for seamless client compatibility across React and Flutter.
- **Connection Pooling**: Robust connection pool configured in `config/database.js` (`max: 20`, `min: 5`, `acquire: 30000ms`, `idle: 10000ms`).

### 3. Duolingo-Grade Gamification & In-Game Economy
- **Decoupled JIT Map Loading**: `GET /api/gamification/path` returns lightweight node summaries (~35 KB vs 28.5 MB payload, 82ms response). Full stage content is fetched JIT on node tap via `GET /api/gamification/lesson/:id`.
- **Oxygen Energy Mechanics**: 5 maximum oxygen bubbles; regenerates 1 bubble every 30 minutes. Refills instantly upon completing lessons with $\ge 90\%$ accuracy or via rewarded ad claims.
- **Ad Reward Claim API (`POST /api/gamification/claim-ad-reward`)**: Persists rewarded ad views directly into MySQL with server-side validation and daily caps:
  - `oxygen`: Refills +2 Oxygen (capped at 6 claims/day).
  - `pearls`: Awards +25 Pearls (capped at 4 claims/day).
  - `xp_doubler`: Activates a 15-minute 2X XP bonus window.
- **Timezone-Safe Daily Streaks**: Streak logic evaluates learner local calendar days via `utils/dateHelper.js`, preventing UTC day rollover resets for international learners.

### 4. Interactive Binary Audio Streaming (HTTP 206)
- **Zero Media Loss on Ephemeral Disks**: Audio MP3 files are stored directly in MySQL (`karaoke_audios` table) as `LONGBLOB`.
- **Byte-Range Seeking**: `GET /api/notes/audio/db/:id` handles `Range: bytes=start-end` headers with status 206 Partial Content, enabling instantaneous scrubbing in mobile `audioplayers` and web `<audio>`.

---

## 🛠️ Quick Start & Local Development

### Prerequisites
- Node.js 20 LTS or higher
- MySQL 8.0+ running locally or remotely

### Environment Setup
Create `.env` in `backend/`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MySQL Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dolphincoder_lms
DB_USER=root
DB_PASSWORD=your_password

# Authentication & Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d
BCRYPT_ROUNDS=10

# Dynamic SEO & IndexNow
SITE_URL=https://dolphincoder.com
INDEXNOW_KEY=f08c47fec0942fa0
```

### Installation & Execution
```bash
cd backend
npm install

# Start development server with auto-reload (port 5000)
npm run dev

# Start production server
npm start

# Seed default administrator account
npm run seed
```

---

## 🧪 Automated Testing & Benchmarking

The backend includes a comprehensive Jest and Supertest automated test suite and live latency benchmarking tools:

```bash
# Run unit & integration tests (runs in-band with automated SQLite test fallback)
npm test

# Run live Hostinger VPS latency benchmark test suite (30s timeout)
npm run test:live

# Execute standalone Hostinger latency benchmark script
node scripts/benchmark_hostinger.js
```

### Test Suites Overview:
- `tests/auth.test.js`: Registration, login, JWT validation, role enforcement, duplicate prevention.
- `tests/curriculum.test.js`: Course tracks (`de_en_a1`, `en_hi_a1`), unit hierarchy, JIT lesson payloads.
- `tests/gamification.test.js`: Oxygen replenishment, streak progression, pearls economy, and ad reward claims.
- `tests/lesson_mechanics.test.js`: Derangement of match-pairs, pronunciation score validation, stage configurations.
- `tests/hostinger_live.test.js`: Live network latency, SSL termination verification, HTTP 206 audio streaming benchmarks.

---

## 📂 Directory Layout

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
├── tests/                        # Automated Jest & Supertest test suite
├── utils/
│   ├── dateHelper.js             # Timezone-safe date conversion & streak aggregation
│   └── seoHelper.js              # XML sitemap, robots.txt & OpenGraph tag injection
├── ecosystem.config.js           # PM2 cluster configuration for zero-downtime production
├── package.json                  # Dependencies, test scripts & metadata
└── server.js                     # Express app setup, crawler routes & HTTP bootstrap
```
