# backend.md — Agent Context for the Express API

> **Purpose:** Onboarding context for coding agents (and humans) working in `backend/`.
> Documents what exists, how it is wired, which conventions to follow, which parts are
> logically broken, and the improvement backlog. Analysis only — no code was changed.
> Verified against the source on 2026-08-29.
>
> **Rules of engagement for agents:**
> 1. This is **MySQL + Sequelize**, not MongoDB. Several repo docs (`latest.md`,
>    `DEPLOYMENT.md`, parts of `README.md`) still describe the Mongoose era and are stale —
>    trust the code and this file over those docs.
> 2. Every model exposes a virtual `_id` alongside the real integer `id` for
>    frontend/Mongo compatibility. Preserve that convention in new models.
> 3. `sequelize.sync({ alter: true })` is a **known temporary crutch** (documented in
>    `fix.md`). Do not add new migrations that depend on it, and do not replicate it.

---

## 1. What this is

**DolphinCoder LMS REST API** (formerly *SpeedUpExam*) — Express 4 + Sequelize 6 + MySQL,
JWT auth, serving both `/api/*` and the built React SPA from `backend/dist`.

Roles: `student`, `trainer`, `admin`. Feature domains: auth, notes, videos (YouTube
embeds), quizzes (+ attempts + docx bulk upload), flashcards (+ progress + docx bulk
upload), subjects/topics, admin user management.

## 2. Run & deploy

```bash
cd backend
npm install
npm run dev        # nodemon, port 5000 (server.js uses process.env.PORT || 5000)
npm start          # node server.js
node seedAdmin.js  # creates the hard-coded admin user (see §5.9 — creds are committed)
```

- Config via `.env` (template: `.env.example` — **it contains real production
  credentials, see §5.9**). Required vars: `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`,
  `JWT_SECRET`, `PORT`, `NODE_ENV`, `CLIENT_URL`.
- Production runs under PM2 (`ecosystem.config.js`) in **cluster mode with
  `instances: 'max'`** — combined with `sync({ alter: true })` this risks concurrent DDL
  on boot (§5.8).
- `npm run build` is not a thing here; the frontend builds into `backend/dist`
  (`frontend/vite.config.js` sets `outDir: '../backend/dist'`), and `server.js` serves it
  statically with an SPA catch-all for non-`/api` GETs. That wiring is correct — don't
  "fix" it.

## 3. Directory map

```
backend/
├── server.js                  # express app, helmet/cors/rate-limit, routes, static serve
├── config/database.js         # Sequelize instance (pool max 5) + connectDB() w/ sync({alter:true})
├── middleware/
│   ├── auth.js                # protect (findByPk, strips password), authorize(...roles)
│   ├── errorHandler.js        # notFound + generic handler + DEAD Mongoose handlers (§5.7)
│   └── upload.js              # multer for note/docx uploads
├── models/                    # all Sequelize; see §4.1 for the shared idioms
│   ├── User.js                # bcrypt beforeCreate/beforeUpdate, getSignedJwtToken()
│   ├── Note.js                # contentType ENUM('richtext','docx','html'), color ENUM
│   ├── Video.js               # youtubeVideoId, viewCount, isPublic
│   ├── Quiz.js                # questions JSON TEXT, beforeSave totalPoints, attemptLimit
│   ├── QuizAttempt.js         # student+quiz, answers JSON, score/maxScore/percentage/passed
│   ├── Flashcard.js           # cards JSON TEXT, beforeSave cardCount
│   ├── FlashcardProgress.js   # unique (student, flashcard)
│   └── Subject.js             # topics JSON TEXT (each topic {_id, name, description})
├── models/associations.js     # belongsTo aliases (ownerUser, subject, addedByUser, ...)
├── controllers/               # authController, noteController, videoController,
│                              # quizController, flashcardController, adminController,
│                              # subjectController
├── routes/                    # auth.js, notes.js, videos.js, quizzes.js, flashcards.js,
│                              # subjects.js, admin.js
├── utils/extractYouTubeId.js  # watch/youtu.be/embed/shorts → 11-char id
├── middleware/upload.js       # multer
├── seedAdmin.js / fixAdmin.js # one-off admin bootstrap scripts (hard-coded creds)
├── ecosystem.config.js        # PM2 cluster config
└── .env.example               # ⚠ contains REAL production credentials (§5.9)
```

## 4. Architecture & conventions (follow these)

### 4.1 Model idioms (copy these exactly)
- Every model starts with `id` (integer PK) **plus a virtual `_id`**:
  ```js
  _id: { type: DataTypes.VIRTUAL, get() { return this.id; } },
  ```
  The React app and the Flutter app both read `_id`. Any new model must do the same.
- JSON-shaped data is stored in **TEXT columns** with a tolerant getter/setter pair:
  ```js
  get() { try { return JSON.parse(this.getDataValue('x')); } catch(e) { return []; } },
  set(val) { this.setDataValue('x', JSON.stringify(Array.isArray(val) ? val : [])); }
  ```
  Used by `tags`, `questions`, `cards`, `cardResults`, `topics`. Follow this pattern for
  any new nested data; do not introduce new JSON columns without the try/catch.
- Derived counters are recomputed in `beforeSave` hooks (`Quiz.totalPoints`,
  `Flashcard.cardCount`).
- `User` has `beforeCreate`/`beforeUpdate` bcrypt hooks and `getSignedJwtToken()`.
  Password is excluded via `defaultScope`-style `attributes` exclusions in queries.

### 4.2 Associations
`models/associations.js` declares `belongsTo` relations with aliases
(`ownerUser`, `subject`, `addedByUser`, `createdByUser`, `student`, `quiz`) and is
imported once at boot. FK columns are plain INTEGERs — **there are NO database-level
foreign-key constraints**. Referential integrity is the controllers' job; deleting a user
or subject does not cascade (§5.6). Any query that needs creator/subject names must
explicitly `include:` with the right alias, and controllers `reshape()` the row
(`ownerUser → owner`) before responding — keep the reshaped response shape stable, the
clients depend on it.

### 4.3 Controller conventions
- Response envelope: `res.json({ success: true, data: ... })` (or a domain key such as
  `{ quizzes, total, totalPages }`) and errors via `next(err)` reaching
  `errorHandler.js`, or direct `res.status(4xx).json({ success: false, message })`.
- List endpoints accept `page`, `limit`, `q`, and domain filters; staff see their own
  records, students see public/all records (exact split per controller, see §6 route table).
- Validation is **minimal and manual** — there is no express-validator/Joi. When adding
  endpoints, validate types/lengths explicitly (see §5.5 for what happens when this is
  skipped).
- Rate limiting: global 400 req/15min, auth routes 100 req/15min (`server.js`).

### 4.4 Route guard matrix (as actually wired)

| Domain | List/GET detail | Create/Update/Delete |
|---|---|---|
| `/auth` | `/me` requires JWT | register/login public; profile/password JWT |
| `/notes` | `router.use(protect)` — all note routes require JWT | staff (trainer/admin) only |
| `/videos` | **public — no `protect` on GETs** (see §5.2) | staff only |
| `/quizzes` | list + GET detail are JWT-protected | staff only; attempts are student actions |
| `/flashcards` | `router.use(protect)` | staff only; progress is student action |
| `/subjects` | GETs public | staff only |
| `/admin` | admin only | admin only |

## 5. Verified bugs & logical issues

### 5.1 Deactivated users keep full access
`middleware/auth.js` `protect` does `User.findByPk(decoded.id)` and never checks
`isActive`. The admin "toggle user active" feature therefore doesn't actually block
anyone until their 7-day JWT expires. Fix: `if (!user || !user.isActive) return 401`.
(Also add `/auth/me` revalidation on the clients to make it effective immediately.)

### 5.2 Private videos are publicly viewable
`routes/videos.js` mounts GET routes without `protect`, and `videoController.getVideoById`
never checks `isPublic`. Anyone with the id (or the list response, which also isn't
auth-gated) can view "private" videos, and `viewCount` is inflated by read-modify-write
(`video.viewCount += 1; await video.save()`) instead of
`video.increment('viewCount')` — a lost-update race under concurrency.
Fix: decide the intended audience; at minimum gate detail on `isPublic || owner`.

### 5.3 Quiz search overwrites the visibility filter (data leak)
In `quizController.getQuizzes`, the base query builds `where: { [Op.or]: [owner-is-me,
isPublic/isPublished] }`; when a `q` search param is present, the code does
`where[Op.or] = [{ title: { [Op.like]: ... } }, { description: { [Op.like]: ... } }]`,
**replacing** the visibility clause. Result: students searching see *unpublished* quizzes
of any owner; staff searching lose sight of their own drafts.
Fix: merge with `Op.and` (visibility `AND` search) instead of reassigning `Op.or`.

### 5.4 Quiz attempt grading trusts the client
`quizController.submitAttempt`:
- Reads `startedAt` and `timeTakenSecs` from the request body — the server-side time
  limit is **not enforced**; a client can spend unlimited time and report `timeTakenSecs: 0`.
- Never re-checks `isPublished` on submit.
- Accepts the `answers` array unvalidated (missing `questionId`, non-integer
  `chosenIndex`, duplicate entries all pass through).
- The attempt-limit check is a read-then-create (TOCTOU) — two concurrent submits can
  exceed `attemptLimit`.
- Grading matches `answers.questionId` against the index-based `_id` assigned at quiz
  creation (`questions.map((q,i) => ({ _id: i, ...q }))`). If a quiz's questions are ever
  edited after attempts exist, old attempt references shift meaning.
Fix direction: server records `startedAt` when an attempt resource is created, enforces
the limit server-side, validates answer shape, and wraps the attempt-count check + create
in a transaction.

### 5.5 Unvalidated JSON access paths
- `noteController`: `JSON.parse(req.body.tags)` is unguarded — a client posting malformed
  `tags` triggers a 500.
- `subjectController`: topic mutation paths call `t._id.toString()`; a legacy topic
  without `_id` (created before ids were added) throws and 500s.
Fix: validate/normalize inputs; default missing ids to `Date.now().toString()` like
`Subject` creation does.

### 5.6 No cascade deletes
`adminController.deleteUser` and subject deletion hard-delete the row only. Notes,
videos, quizzes, attempts, flashcards, and progress referencing the deleted user/subject
are orphaned. Fix: cascade delete owned content (or soft-delete users) inside a
transaction.

### 5.7 Dead Mongoose error handlers
`middleware/errorHandler.js` still handles `err.name === 'CastError'`, Mongo duplicate-key
`code === 11000`, and Mongoose `ValidationError`. None can occur post-MySQL. They're
harmless but misleading — replace with Sequelize equivalents (`Sequelize.UniqueConstraintError`,
`Sequelize.ValidationError`) when touched.

### 5.8 Boot-time risks
- `config/database.js` `connectDB()` runs `sequelize.sync({ alter: true })` — in
  production this performs schema DDL on every boot. `fix.md` documents the intended
  end-state: revert to plain `sync()` (or migrate) once the schema is stable.
  With PM2 `instances: 'max'`, multiple workers issue concurrent DDL on deploy.
- `server.js` does not `await connectDB()` before listening and does not
  `process.exit(1)` when the DB is unreachable — the API can boot into a broken state
  silently (startup log even uses `console.error` instead of the logger).
- `notFound` 404 handler is registered **only in dev** — production unknown routes fall
  through to the SPA catch-all, which is intended for GET but also swallows API typos.

### 5.9 Committed secrets (security debt)
- `.env.example` contains **real production** DB credentials and JWT secret
  (`DB_USER=u437576467_lmsuser`, a real password, `JWT_SECRET=dolphinCoderLMS2026...`).
  Replace with placeholders, rotate the leaked secret and password, and add `.env.example`
  to a secrets review.
- `seedAdmin.js` / `fixAdmin.js` hard-code admin credentials
  (`admin@speedupexam.com` / `Admin@SpeedUp2024!`) — stale branding *and* a committed
  credential. Make them read env vars and rotate the password.

### 5.10 Smaller issues
- `authController.register` hard-codes `role: 'student'` regardless of the requested
  role — intentional guard, but document it; trainer creation goes through
  `adminController.createTrainer`.
- No server-side validation of email format or password strength on register
  (`changePassword` also relies on the client).
- `utils/extractYouTubeId.js` misses `m.youtube.com` and `music.youtube.com` host forms.
- `QuizAttempt` percentage/passed are computed server-side (good), but `answers` snapshot
  stores `correctIndex`/`explanation` per answer — verify review endpoints only expose
  them to the attempt's owner.

## 6. Feature inventory & logical-correctness verdicts

| Feature | Status | Notes |
|---|---|---|
| Auth (register/login/me/profile/password) | ✅ sound | JWT 7d, bcrypt hooks, token rotation on password change. Register forces student role. |
| Subjects + JSON topics | ⚠ mostly sound | Topics embedded as JSON in one row; legacy topics without `_id` crash mutations (§5.5). |
| Notes (richtext/docx/html) | ✅ sound core | mammoth docx→HTML on upload; students see all notes, staff see own-only + all students'. `tags` parse can 500 (§5.5). |
| Videos (YouTube) | ⚠ leaks | GETs public incl. private videos (§5.2); viewCount race. |
| Quizzes + attempts | ⚠ leak + trust issues | Search overrides visibility (§5.3); grading trusts client timing (§5.4). Bulk docx upload parses TITLE/DESCRIPTION/PASSING_SCORE/TIME_LIMIT/TAGS, Q:, A)-D), ANSWER, TRUE_FALSE, EXPLANATION, POINTS — code-MCQ not supported in bulk. |
| Flashcards + progress | ⚠ contract mismatch | Backend cards have **no per-card ids** while both clients key progress by card id — the root cause of the StudyPage bug in `frontend.md` §5.1 and the Flutter equivalent. saveProgress trusts client `cardResults`/`masteredCount`; mastery = last-session overwrite semantics. |
| Admin (users/trainers) | ⚠ incomplete | toggleActive is cosmetic until §5.1 is fixed; no cascade delete (§5.6). |

## 7. Gotchas for coding agents

1. **MySQL, not Mongo.** Ignore Mongo-era docs; no ` ObjectId` anywhere — ids are integers
   exposed as `_id`.
2. Always `include` associations explicitly; there is no eager-loading by default.
   Use the exact aliases from `associations.js`.
3. Preserve the `{ success, ... }` envelope and reshaped fields (`owner`, `subject`,
   `createdBy`) — both clients parse these shapes defensively.
4. JSON-in-TEXT columns: never query them with SQL JSON operators; filter in JS after
   fetch (current pattern) or propose a proper migration first.
5. `sync({ alter: true })` will attempt to reconcile your model edits to the live schema
   on next boot. Test model changes against a disposable DB first, and remember prod runs
   PM2 cluster mode (§5.8).
6. Adding a model: register it in `config/database.js`'s model list (that's what makes
   `sync` create the table) and wire associations in `associations.js`.
7. Rate limits are aggressive by design (400/15min global); don't add polling endpoints
   without checking they fit.
8. Uploads go through `middleware/upload.js` (multer) — note docx parsing uses `mammoth`
   and only for `Note`; quiz/flashcard bulk upload parses the docx XML directly.

## 8. Improvement backlog (prioritized)

**P0 — security**
1. Enforce `isActive` in `protect` (§5.1); rotate the committed JWT secret + DB password;
   replace `.env.example` secrets with placeholders (§5.9); remove hard-coded admin creds.
2. Fix quiz search visibility leak (§5.3) and private-video exposure (§5.2).

**P1 — correctness**
3. Server-authoritative quiz timing + validated answers + transactional attempt limit (§5.4).
4. Give flashcard cards stable ids (unblocks both clients' progress tracking); validate
   `saveProgress` input; consider cumulative mastery semantics instead of last-session overwrite.
5. Guard `JSON.parse(tags)` and legacy topic ids (§5.5); add cascade/transactional deletes (§5.6).

**P2 — robustness / hygiene**
6. Replace dead Mongoose error handlers with Sequelize ones (§5.7); make boot fail fast
   when DB is unreachable; `await connectDB()` before `listen`.
7. End the `alter: true` era: move to `migrations` (or at minimum plain `sync`) and
   reduce PM2 to non-cluster until then (§5.8).
8. Introduce `express-validator` (or similar) for register/profile/quiz inputs.
9. Handle `m.youtube.com`/`music.youtube.com` in `extractYouTubeId`.
10. Structured logging (replace `console.*`), and register `notFound` for `/api/*` in
    production so API 404s return JSON.

---

*Cross-references: web client → `frontend.md`; mobile client → `android.md`.
`fix.md` documents the pending `alter:true` revert plan; `features.md` lists feature
history; treat `latest.md`/`DEPLOYMENT.md` as stale where they mention MongoDB.*
