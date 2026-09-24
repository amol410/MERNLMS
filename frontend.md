# frontend.md — Agent Context for the React Web App

> **Purpose:** This file is onboarding context for coding agents (and humans) working in
> `frontend/`. It documents what exists, how it is wired, which conventions to follow,
> which parts are logically broken, and where the best improvement opportunities are.
> Nothing in this file changes code — it is analysis only. Verified against the source on 2026-08-29.
>
> **Rules of engagement for agents:**
> 1. Read "Architecture & conventions" before writing any component — the codebase has
>    strong existing patterns (see §4) and new code is expected to match them.
> 2. The bug list in §5 is verified with `file:line` references. If your task touches one
>    of those files, you are probably expected to fix the listed issue.
> 3. The app is a **student-facing LMS with a shared trainer/admin surface**. Do not add
>    server calls that assume a role the route does not guard.

---

## 1. What this is

**DolphinCoder LMS web client** (formerly branded *SpeedUpExam* — stale branding still
appears in a few places, see §5.6). A React 18 SPA covering three roles:

| Role | Capabilities in the web UI |
|---|---|
| `student` | Browse/search notes, videos, quizzes, flashcards, subjects; take quizzes; study flashcard decks |
| `trainer` | Everything students can do **plus** create/edit/delete their own notes, videos, quizzes, flashcard decks |
| `admin` | Users & trainers management (`/admin`), sees all management nav items |

Stack: **React 18 + Vite 5 + React Router 6 + Tailwind CSS 3 + Tiptap (rich text) +
Axios + Lucide icons**. No state-management library — state is AuthContext + local
component state + fetch-on-mount per page. No test suite, no linter config, no TypeScript.

## 2. Run & build

```bash
cd frontend
npm install
npm run dev        # Vite dev server on :5173, proxies /api → http://localhost:5000
npm run build      # outputs to ../backend/dist  (NOT frontend/dist!)
npm run preview
```

- **The build output directory is `../backend/dist`** (`vite.config.js`:12). The Express
  server serves that folder statically and catches all non-`/api` routes for SPA routing.
  Never "fix" the outDir back to `frontend/dist` — the co-located deploy is intentional
  (see `latest.md` for the deployment history).
- Dev proxy config lives in `vite.config.js`; if the backend port changes, update it there.
- No `.env` usage in the frontend — the dev proxy means the client always calls `/api`
  relative paths. Keep it that way.

## 3. Directory map

```
frontend/
├── vite.config.js              # outDir ../backend/dist, /api proxy
├── tailwind.config.js          # dolphin/ocean color palettes, container config
├── index.html
└── src/
    ├── main.jsx                # BrowserRouter + AuthProvider + App
    ├── App.jsx                 # ALL routes live here; Layout hides Navbar on /take
    ├── styles/index.css        # Tailwind layers + component classes (.glass-card, .btn-*, ...)
    ├── api/axios.js            # axios instance, baseURL '/api', 401 interceptor
    ├── contexts/AuthContext.jsx# login/logout/register/updateProfile/changePassword, localStorage user
    ├── components/
    │   ├── Layout.jsx          # Navbar + Outlet + Footer; Navbar hidden on quiz-taking routes
    │   ├── Navbar.jsx          # role-aware links; admin gets Admin link
    │   ├── ProtectedRoute.jsx  # wraps role-gated routes (children-only variant for staff pages)
    │   ├── Footer.jsx
    │   ├── ConfirmModal.jsx
    │   ├── Pagination.jsx      # exists but most pages do NOT use it (see §5.2)
    │   └── quiz/CodeSnippetQuestion.jsx   # code-MCQ renderer with highlight.js — currently isolated
    ├── pages/
    │   ├── Landing.jsx  Login.jsx  Register.jsx  Profile.jsx
    │   ├── Dashboard.jsx               # role-aware stat cards + quick links
    │   ├── NotesPage.jsx  NoteEditorPage.jsx  NoteDetailPage.jsx
    │   ├── VideosPage.jsx  VideoFormPage.jsx  VideoDetailPage.jsx
    │   ├── QuizzesPage.jsx  QuizFormPage.jsx  QuizTakePage.jsx
    │   ├── StudyPage.jsx               # flashcard study session (has a critical bug, §5.1)
    │   ├── FlashcardsPage.jsx  FlashcardFormPage.jsx
    │   ├── SubjectsPage.jsx            # subject + JSON-embedded topics management (staff)
    │   └── admin/AdminPage.jsx         # users list, create trainer, toggle active, delete
    └── utils/downloadTemplateDoc.js    # generates .doc templates for quiz/note/flashcard bulk upload
```

## 4. Architecture & conventions (follow these)

- **Routing:** every route is declared in `src/App.jsx`. Guarded routes are wrapped in
  `<ProtectedRoute>` (auth) — staff pages additionally check `user.role` inside
  `ProtectedRoute`'s `roles` prop. When adding a page: declare the route in `App.jsx`,
  add the nav link in `Navbar.jsx` (and `Dashboard.jsx` quick links if appropriate).
- **API calls:** use the shared instance from `src/api/axios.js` (`import api from '../api/axios'`).
  It prefixes `/api`, attaches the JWT from `localStorage.token`, and redirects to `/login`
  on 401. Do not create a second axios instance.
- **Auth state:** `AuthContext` stores `{ user, token }` in localStorage keys `user` and
  `token`. Login/register/updateProfile/changePassword all go through the context's
  methods. `user.role` is the source of truth for UI gating.
- **Styling:** Tailwind utility classes + the semantic component classes defined in
  `src/styles/index.css`: `.glass-card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`,
  `.input-field`, `.badge-*`, `.gradient-border`, plus ProseMirror editor styles and the
  `.flip-card` CSS used by StudyPage. Prefer these over re-inventing per-page styles.
  Colors come from the `dolphin` / `ocean` palettes in `tailwind.config.js`.
- **Rich text:** notes use Tiptap (`@tiptap/react`). The editor is in `NoteEditorPage.jsx`;
  the produced HTML is stored in `note.content` with `contentType: 'richtext'`.
- **Rendering user HTML:** richtext/docx notes render via `dangerouslySetInnerHTML` on
  NoteDetailPage; `html` contentType notes render inside a sandboxed iframe
  (`sandbox="allow-scripts"`, 16:9, fullscreen button). Keep the iframe for html slides —
  it is the safer path.
- **Quiz taking:** QuizTakePage persists timer state in `sessionStorage` under
  `quiz_{quizId}_{attemptId}_state` so a refresh doesn't reset the countdown. It also
  guards `beforeunload` and intercepts `popstate` while an attempt is active.
  Preserve this behavior when touching the page.
- **Data listing pattern:** every list page calls `api.get('/x?page=&limit=&q=')`,
  reads `res.data.data.<plural>` and `res.data.total/totalPages`, renders cards in a grid,
  and has a search input + create button (staff only). Limit is per-page fixed
  (notes 50, quizzes 24, videos ~12) and there are **no pagination controls** — see §5.2.
- **Bulk upload:** quiz and flashcard forms accept `.docx`/`.doc` files parsed by the
  backend, with an inline format description and a downloadable template generated by
  `src/utils/downloadTemplateDoc.js`.

## 5. Verified bugs & logical issues

### 5.1 CRITICAL — Flashcard study progress is stored under a nonexistent key
`src/pages/StudyPage.jsx` keys per-card ratings by `card._id`, but flashcard **cards are
plain JSON objects `{ front, back, hint }` with no `_id`** (backend
`backend/controllers/flashcardController.js:220` builds cards without ids; only the deck
row has an id). Consequences, all verified:
- Every rating lands on the same `"undefined"` key → `cardResults` collapses to at most
  one entry; the "mastered" counter caps at 1.
- `POST /flashcards/:id/progress` is only called after rating the **last** card, and saves
  `{ cardId: undefined, ... }` — the progress API receives garbage.
- `GET /flashcards/:id/progress` is never fetched at all, so no prior progress ever shows.
**Fix direction:** either assign stable ids to cards at creation/bulk-upload time on the
backend, or key results by card index and store `{ index: rating }` maps.

### 5.2 List pages have no working pagination
`Pagination.jsx` exists but `QuizzesPage` (limit 24), `VideosPage`, `FlashcardsPage`, and
`SubjectsPage` render only the first page with no next/prev. `NotesPage` fetches limit 50
with no pagination either. Users cannot reach content beyond page 1. Trivially fixable by
wiring the existing component.

### 5.3 401 interceptor breaks failed login
`src/api/axios.js` redirects via `window.location.href = '/login'` on **any** 401,
including the login request itself. A wrong password therefore hard-reloads the page and
the error toast set by `Login.jsx` is lost — the user just sees a blank login form.
Fix: exempt the request URL that triggered the 401 when it is `/auth/login` (or handle
login errors without the interceptor).

### 5.4 Note editor breaks on docx/html notes
`NoteEditorPage.jsx` claims *"Leave file empty to keep existing content"*, but on save it
always POSTs `/notes/upload` when the note is not richtext — with no file selected the
backend answers 400 and the save fails. Additionally, switching an `html` note to the
richtext editor overwrites `contentType` with whatever the (empty) editor produces, a
data-loss path. Fix: only call upload when a new file is chosen; keep the original
`content`/`contentType` otherwise; warn before switching content types.

### 5.5 Quiz visibility bug lives in the backend, surfaced here
When a student searches quizzes, the backend's search branch overwrites the
visibility filter, so unpublished quizzes leak into student search results, and staff
drafts disappear when staff search. Details and `file:line` in `backend.md` §5.3 —
fix it server-side; do not paper over it in the client.

### 5.6 Stale branding and fake numbers
- `src/pages/Register.jsx` subtitle: *"Join SpeedUpExam as a student"*.
- `src/utils/downloadTemplateDoc.js` footer: *'SpeedUpExam LMS'* as creator.
- `src/pages/Landing.jsx` hardcodes marketing stats (10K+ students, 4.9 rating, etc.)
  that are not backed by data. Either fetch real counts (`/subjects`, list endpoints have
  totals) or label them as aspirational.

### 5.7 Smaller issues
- `AuthContext` never revalidates the stored user with `/auth/me` on load — a user whose
  account was deactivated (or whose role changed) keeps their old UI until the 7-day JWT
  expires (and the backend's `protect` middleware doesn't check `isActive` either — see
  `backend.md` §5.1).
- `NotesPage` color filter is **client-side only** — it filters the ≤50 notes already
  fetched, not the database; combined with no pagination it silently hides matching notes.
- Staff see edit/delete buttons on *all* notes in `NotesPage` but the server 403s for
  notes they don't own — should be hidden based on `note.owner` vs `user.id`.
- `QuizFormPage` has **no UI field for `attemptLimit`**, although the model, backend, and
  grading logic all support it — the feature is unreachable from the web UI.
- Code-MCQ questions render only via `CodeSnippetQuestion.jsx`, which is not wired into
  the quiz-taking flow (documented as an intentional rollback); bulk upload cannot
  produce code questions.
- `NoteDetailPage` renders richtext/docx HTML with `dangerouslySetInnerHTML` — trainer
  content is trusted today, but there is no sanitization anywhere in the pipeline.

## 6. Gotchas for coding agents

1. **Never change `vite.config.js` outDir** — deploys break.
2. The Navbar is deliberately hidden on quiz-taking routes (`App.jsx` checks
   `pathname.includes('/take')`); don't "fix" the missing navbar on those pages.
3. `_id` vs `id`: the backend emits both (Sequelize models expose a virtual `_id`).
   Recent code uses `_id`; if you see `undefined` ids in older pages, check which field
   the API actually returned.
4. `subject` on notes/quizzes/videos is a **populated object** (`subject.name`) via
   Sequelize `include`, not an id — filter params, however, take the id.
5. Quiz questions arrive with `correctIndex` and `explanation` **stripped** for
   non-owner students (`getQuizById`). Never assume those fields exist on the client
   before an attempt is submitted; the review data comes from the attempt response.
6. Timer state must survive refresh (sessionStorage contract described in §4).
   If you refactor QuizTakePage, keep the same key format or migrate it.
7. There is no toast system beyond inline alerts — follow the existing inline
   error/success pattern per page.
8. Deleted content is **hard-deleted** with no cascade; UI should not assume related
   content exists (e.g. a quiz's subject may be gone).

## 7. Improvement backlog (prioritized)

**P0 — correctness**
1. Fix flashcard progress keying (§5.1) — include backend card-id decision.
2. Fix docx/html note editing (§5.4).
3. Fix 401-on-login reload (§5.3).

**P1 — completeness**
4. Wire `Pagination.jsx` into all list pages; make NotesPage color filter a query param.
5. Add `attemptLimit` UI to QuizFormPage; wire `CodeSnippetQuestion` into QuizTakePage.
6. Hide staff action buttons on content the staff member doesn't own.
7. Revalidate auth on app load with `/auth/me` (pair with backend `isActive` fix).

**P2 — polish**
8. Replace stale SpeedUpExam branding; make Landing stats real or clearly decorative.
9. Sanitize richtext HTML (e.g. DOMPurify) before `dangerouslySetInnerHTML`.
10. Introduce a toast system and optimistic updates for delete/edit actions.
11. Add ESLint + Prettier; the codebase currently has neither.

---

*Cross-references: backend contract and its own bugs → `backend.md`; mobile client →
`android.md`. Repo-level history and deploy notes live in `README.md`, `latest.md`,
`fix.md`, `DEPLOYMENT.md` — note that `latest.md` and `DEPLOYMENT.md` still describe the
old MongoDB era and are stale where they contradict this file.*
