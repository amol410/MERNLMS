# DolphinCoder LMS — Features Reference

## Platform & Branding
- Rebranded from SpeedUpExam to **DolphinCoder** across navbar, dashboard, landing page, footer
- Landing page with animated background orbs, feature cards (fixed duplicate icon bug), stats section, CTA

---

## Authentication
- JWT-based login / register
- Google login support
- Role-based access: **student**, **trainer**, **admin**
- Profile update, password change
- Protected routes per role

---

## Admin Panel
- View all users with pagination
- Toggle user active/inactive
- Delete users
- Create / update trainer accounts

---

## Notes
- Rich text editor (Tiptap) with bold, italic, underline, headings, lists, code, blockquote, divider
- **DOCX upload** — converts Word file to HTML note automatically (mammoth)
- **HTML upload** — upload self-contained HTML+CSS+JS file, displayed as a **16:9 slide viewer** (PPT style)
  - Fullscreen toggle button (bottom-right), switches to "Exit Fullscreen" when active
- Note colors: default, blue, green, yellow, pink, purple
- Pin / unpin notes
- Tags with filter by tag
- Filter by color
- Search notes
- Note detail page with color accent border
- **Note cards** show bold title + thin color divider line only (no content preview — clean design)
- Staff-only edit/delete controls (students cannot see edit/delete buttons)
- `contentType` field: richtext / docx / html
- DB column added via `alter: true` migration (see fix.md to revert back to `force: false`)

---

## Videos
- Embed YouTube videos
- View count tracking
- Tags, description
- Search videos
- Owner-only edit/delete controls
- Staff can add, students can view

---

## Quizzes
- Multiple choice (MCQ) questions
- True / False questions
- **Code Snippet questions** (new type: `code-mcq`)
  - 4 syntax-highlighted code options in 2×2 grid
  - Language selector: Python, JavaScript, Java, SQL, C++, PHP
  - Component isolated in `src/components/quiz/CodeSnippetQuestion.jsx` (easy rollback)
- **Bulk upload via .docx** — format shown inline in the form, parses and creates quiz instantly
- **Public / Private toggle** — styled toggle button (purple = public, gray = private)
- **Delete quiz** button on edit page with confirmation alert
- Passing score, time limit, shuffle questions settings
- Auto-graded with instant feedback and explanations after submission
- Score percentage with circular progress ring on results page
- Detailed question review after submission
- Retake quiz option
- Staff see their own unpublished quizzes in the list
- Owner-only edit controls with loose equality ID comparison

---

## Quiz Taking Experience
- **Right sidebar** with question navigator (4-per-row grid, sticky)
  - Purple = current question
  - Green = answered
  - Orange = marked for review
  - Gray = not answered
- **Mark for Review** button on each question (orange flag, toggleable)
- Submit button in sidebar as well as bottom nav
- Previous / Next navigation
- Countdown timer (turns red under 60 seconds)
- Progress bar
- Confirm dialog if submitting with unanswered questions

---

## Flashcards
- Create decks with cards (front, back, hint)
- **Bulk upload via .docx** — format: DECK_NAME, DESCRIPTION, COLOR, Q:/A:/HINT: blocks
- **Public / Private toggle** — green styled toggle (same as quiz)
- **Delete deck** button on edit page with confirmation alert
- Deck colors: default, blue, green, yellow, pink, purple — rich multi-stop gradients
- Deck cards: large emoji, card count in header, decorative circles, bold title
- Study mode with flip animation
- Hint button on each card — **resets when navigating to next/prev card** (bug fixed)
- Self-rating: "Got It" (known) / "Still Learning" (unknown)
- Progress saved per student per deck
- Completion screen with mastery percentage and progress bar
- Owner-only edit controls

---

## Backend Architecture
- **Express.js** REST API
- **Sequelize ORM** with MySQL (Hostinger)
- `_id` virtual getter on all models for frontend compatibility
- `associations.js` centralizes all Sequelize `belongsTo` relationships
- `reshape()` helpers in each controller convert association aliases to match frontend expectations
- `trust proxy` set for rate limiter behind reverse proxy
- JWT authentication middleware using `findByPk`
- Multer memory storage for file uploads (notes, quiz, flashcard)
- Mammoth for DOCX → HTML conversion
- **highlight.js** for code syntax highlighting (frontend)
- Role-based authorization middleware

---

## Production (Hostinger)
- Node.js at `/opt/alt/alt-nodejs20/root/usr/bin/node`
- PM2 process manager via `ecosystem.config.js`
- `.env` created from `.env.example`
- Admin role fixed via `fixAdmin.js` utility script
- `seedAdmin.js` for seeding initial admin user

---

## Pending / To Do
- Revert `alter: true` back to `force: false` in `backend/config/database.js` after confirming notes DOCX/HTML upload works in production (see `fix.md`)
- Android app API — backend is already REST API ready, same endpoints usable with Bearer token auth
