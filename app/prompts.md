# DolphinCoder LMS — AI Screen Prompts

> Copy-paste each prompt into an AI tool (Cursor, Claude, Gemini, etc.) to generate the Flutter screen.  
> Each prompt is self-contained with all design specs, colors, and API context needed.

---

## Global Context (include with every prompt if needed)

```
App: DolphinCoder LMS — Flutter (Android + iOS)
Theme: Dark. Background #0A0F1E, Surface #111827, Primary #6366F1, Accent #A855F7
Font: Plus Jakarta Sans (headings), Inter (body) via google_fonts
State: Riverpod (flutter_riverpod)
Navigation: go_router
HTTP: Dio client with Bearer token auth
Card style: Glassmorphic dark cards, border: Colors.white.withOpacity(0.08), radius 16
Button style: Gradient indigo #6366F1 → violet #A855F7, radius 12, height 52
Input style: Dark fill #1A2235, border #FFFFFF20, radius 12, label above field
```

---

## SCREEN 1 — Splash Screen

```
Create a Flutter SplashScreen widget for the DolphinCoder LMS app.

Design requirements:
- Full-screen dark gradient background: Color(0xFF0A0F1E) to Color(0xFF0F172A) (vertical)
- Center-aligned content:
  - A dolphin wave SVG/icon (use Icons.waves as placeholder, color #6366F1, size 64)
  - Below icon: Text "DolphinCoder" in Plus Jakarta Sans, 32sp, FontWeight.bold, white
  - Below name: Text "Learning Management System" in Inter, 13sp, Color(0xFF9CA3AF)
  - Below subtitle: animated pulsing indigo glow circle behind the icon (use Transform.scale with AnimationController, scale 1.0 to 1.15, duration 1500ms, repeat reverse)
- Bottom: circular progress indicator (color #6366F1, strokeWidth 2)
- After 2 seconds: read JWT token from flutter_secure_storage
  - If token exists → navigate to /home using go_router
  - If no token → navigate to /login

Use StatefulWidget with SingleTickerProviderStateMixin.
Import flutter_secure_storage and go_router.
```

---

## SCREEN 2 — Onboarding Screen

```
Create a Flutter OnboardingScreen widget for the DolphinCoder LMS app.

Design requirements:
- Full-screen dark background Color(0xFF0A0F1E)
- PageView with 3 slides, PageController
- Each slide is centered column:
  - Large emoji/icon in a rounded square (80x80, gradient bg indigo→violet, radius 24)
  - Slide 1: icon 📚, title "Learn Smarter", subtitle "Access notes, videos and study material curated by expert trainers — anytime, anywhere."
  - Slide 2: icon 🧠, title "Test Your Knowledge", subtitle "Take auto-graded quizzes with instant feedback, explanations, and score tracking."
  - Slide 3: icon 🃏, title "Master with Flashcards", subtitle "Flip through interactive flashcards, rate yourself, and track your mastery progress."
  - Title: Plus Jakarta Sans 26sp Bold white
  - Subtitle: Inter 15sp Color(0xFF9CA3AF) centered, padding horizontal 40

- Bottom section (fixed):
  - Page indicator dots (active: indigo #6366F1 width 24, inactive: #374151 width 8, height 8, radius 4, animated with AnimatedContainer)
  - Row: "Skip" TextButton (gray) on left, "Next" gradient button on right
  - On last slide: "Next" becomes "Get Started" → navigates to /login using go_router

- Smooth PageView animation: cubic easing, 400ms
- Use StatefulWidget, track currentPage state
```

---

## SCREEN 3 — Login Screen

```
Create a Flutter LoginScreen widget for the DolphinCoder LMS app.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- SafeArea, SingleChildScrollView
- Top section (30% height): 
  - Centered dolphin wave icon (Icons.waves, size 48, color #6366F1) with indigo glow
  - "Welcome Back" in Plus Jakarta Sans 28sp Bold white
  - "Sign in to continue learning" in Inter 14sp Color(0xFF9CA3AF)

- Glassmorphic card below (margin 20, padding 24, radius 20, bg Color(0xFF111827), border Color(0xFFFFFFFF, 0.08)):
  - "Email" label (Inter 13sp Color(0xFF9CA3AF)), TextFormField:
    - Fill color Color(0xFF1A2235), border radius 12, hint "you@example.com"
    - Prefix icon Icons.email_outlined (color #6366F1)
    - keyboardType EmailAddress
  - SizedBox 16
  - "Password" label, TextFormField:
    - obscureText toggle (suffix icon eye/eye-off)
    - Fill color Color(0xFF1A2235), prefix icon Icons.lock_outline (color #6366F1)
  - SizedBox 8
  - Right-aligned "Forgot Password?" TextButton (color #6366F1, Inter 13sp) — no action for now
  - SizedBox 24
  - Full-width gradient button: LinearGradient(#6366F1 → #A855F7), height 52, radius 12
    - Text "Login" Plus Jakarta Sans 16sp Bold white
    - Shows CircularProgressIndicator (white, size 20) while loading
  - SizedBox 16
  - Center: "Don't have an account?" Inter 14sp gray + "Register" TextButton (color #6366F1)

API call (POST /api/auth/login):
- Body: { email, password }
- On success: save token to flutter_secure_storage key "auth_token", save user JSON to shared_preferences key "user_data", navigate to /home
- On 401: show SnackBar "Invalid credentials" (red background)
- On network error: show SnackBar "Connection failed" (red background)

Use Form + GlobalKey<FormState> for validation.
Use Riverpod StateNotifierProvider for auth state.
```

---

## SCREEN 4 — Register Screen

```
Create a Flutter RegisterScreen widget for the DolphinCoder LMS app.

Design requirements:
- Same background and top section style as LoginScreen but:
  - Icon: Icons.person_add_outlined
  - Title: "Create Account"
  - Subtitle: "Join DolphinCoder and start learning"

- Glassmorphic card with fields:
  - "Full Name" field — prefix icon Icons.person_outline, hint "Your full name"
    - Validator: required, min 2 chars
  - "Email" field — same as login
    - Validator: required, valid email format
  - "Password" field — same as login, with obscureText toggle
    - Validator: required, min 6 chars
  - Password strength bar below password field:
    - 3-segment row (weak=red, medium=yellow, strong=green)
    - Updates live as user types
    - Labels: "Weak" / "Medium" / "Strong"
  - SizedBox 24
  - Full-width gradient "Create Account" button (same gradient as login)
  - SizedBox 16
  - "Already have an account?" + "Login" TextButton → go_router.go('/login')

API call (POST /api/auth/register):
- Body: { name, email, password }
- On 201: save token + user, navigate to /home
- On error (e.g. email exists): show SnackBar with server message

Use same Form + Riverpod auth provider pattern as Login.
```

---

## SCREEN 5 — Dashboard Screen

```
Create a Flutter DashboardScreen widget for the DolphinCoder LMS app.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- CustomScrollView with SliverAppBar + SliverList

SliverAppBar (pinned: false, floating: true, expandedHeight 120):
- Background gradient: Color(0xFF0A0F1E) to Color(0xFF111827)
- Flexible space: 
  - "Good morning, {name} 👋" Plus Jakarta Sans 22sp Bold white (greet based on hour)
  - "Ready to learn today?" Inter 14sp Color(0xFF9CA3AF)
  - Right: CircleAvatar with initials (initials from name, bg gradient indigo/violet)

Body:
1. Stats Row (4 mini glass cards in a Row, horizontally scrollable):
   Each card: icon + count + label
   - 📝 Notes (color blue accent)
   - 🎬 Videos (color orange accent)  
   - 🧠 Quizzes (color purple accent)
   - 🃏 Flashcards (color green accent)
   Card style: bg Color(0xFF111827), border, radius 12, padding 12, width 80
   (Fetch counts from respective API GET requests)

2. Section "📚 Recent Notes" — horizontal ListView:
   - Compact note cards (width 200, height 110)
   - Color left border (note.color), bold title, subject badge
   - Tappable → go('/notes/:id')
   - "View All" TextButton → go('/notes')

3. Section "🧠 Featured Quiz" — single quiz card:
   - Full width glass card
   - Brain gradient icon + quiz title + subject + topic badges
   - Question count + pass score row
   - "Take Quiz" gradient button
   - Fetch: GET /api/quizzes?limit=1&page=1

4. Section "🎬 Latest Video" — single video card:
   - YouTube thumbnail (cached_network_image from https://img.youtube.com/vi/{videoId}/hqdefault.jpg)
   - Play icon overlay
   - Title + view count
   - Tappable → go('/videos/:id')

5. Section "🃏 Flashcard Decks" — horizontal ListView:
   - Deck cards (width 160, height 100)
   - Gradient bg by deck color, deck name, card count
   - Tappable → go('/flashcards')

Padding: horizontal 16, vertical 8 between sections.
Section headers: Plus Jakarta Sans 18sp SemiBold white + "View All" gray TextButton row.

API calls (use Riverpod FutureProvider.family or multiple providers):
- GET /api/notes?limit=5
- GET /api/quizzes?limit=1
- GET /api/videos?limit=1
- GET /api/flashcards?limit=4
```

---

## SCREEN 6 — Notes Screen

```
Create a Flutter NotesScreen widget for the DolphinCoder LMS app.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Notes" Plus Jakarta Sans 20sp white, no elevation, bg transparent

Top section:
- Search bar: dark rounded input (bg Color(0xFF111827), border, radius 12)
  - Prefix: Icons.search (gray), suffix: clear X button
  - Debounce 400ms → triggers API call with q= param
- Subject filter: horizontal scrollable chip list
  - "All" chip (always first) + one chip per subject from GET /api/subjects
  - Selected chip: bg #6366F1, white text
  - Unselected: bg Color(0xFF1A2235), gray text
  - On select subject → show topic sub-chips in a second row (animated height expansion)
- Topic chips (second row, shows when subject selected):
  - Same chip style, smaller, accent color #A855F7 when selected

Content:
- RefreshIndicator wrapping GridView.builder (crossAxisCount 2, gap 12)
- Note cards (each card):
  - bg Color(0xFF111827), radius 16, border Colors.white.withOpacity(0.08)
  - Left border 3px thick colored by note.color:
    - default→#4B5563, blue→#3B82F6, green→#10B981, yellow→#F59E0B, pink→#EC4899, purple→#A855F7
  - Pin icon (Icons.push_pin, yellow fill) if isPinned, top-right
  - Title: Plus Jakarta Sans 14sp SemiBold white, max 2 lines
  - Thin divider line (same color as left border)
  - Subject badge (if subject): purple pill, small text
  - Date: Inter 11sp Color(0xFF4B5563), bottom-right

- Loading: shimmer grid (same layout)
- Empty: centered icon 📝 + "No notes found" + description

Pagination: load more on scroll to bottom (append to list).
API: GET /api/notes?q=&subject=&topic=&page=&limit=12

Tap note card → go('/notes/:id').
```

---

## SCREEN 7 — Note Detail Screen

```
Create a Flutter NoteDetailScreen widget for the DolphinCoder LMS app.

Takes noteId as route param. Fetches GET /api/notes/:id.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- Custom SliverAppBar with colored accent top bar:
  - expandedHeight 160
  - Flexible space background: vertical gradient from note.color accent to background
    - Colors by contentType and color field
  - Title appears in collapsed state: note title, white, Plus Jakarta Sans
  - Back button (white)

Body (CustomScrollView):
- Top metadata section (glass card):
  - Title: Plus Jakarta Sans 22sp Bold white
  - Subject badge (purple pill) + Topic badge (blue pill) if present
  - Tags: row of gray badge chips
  - Date: "Updated {timeago}" Inter 12sp gray
  - Content type indicator: "Rich Text" / "Word Document" / "HTML Slide"

- Content section:
  - If contentType == 'richtext' or 'docx':
    - flutter_html widget rendering note.content (full HTML)
    - Custom HtmlStyle: white text, code blocks dark bg #1A2235, links indigo
  - If contentType == 'html':
    - WebViewWidget in a 16:9 AspectRatio container
    - Full-screen button (Icons.fullscreen) bottom-right overlay
    - On fullscreen tap: push a new route with WebView filling entire screen

- Error state: centered retry button
- Loading state: shimmer skeleton

flutter_html styling:
- body text: white, Inter 15sp
- h1-h3: Plus Jakarta Sans, white
- code: monospace, bg Color(0xFF1A2235), color #10B981
- blockquote: left border #6366F1, italic gray
```

---

## SCREEN 8 — Videos Screen

```
Create a Flutter VideosScreen widget for the DolphinCoder LMS app.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Videos" white, transparent bg

Top: search bar (same style as NotesScreen)

Content: GridView.builder (crossAxisCount 2, childAspectRatio 0.85, gap 12)

Each video card (VideoCard widget):
- bg Color(0xFF111827), radius 16, clipBehavior Clip.antiAlias
- Thumbnail: CachedNetworkImage from URL:
  https://img.youtube.com/vi/{youtubeVideoId}/hqdefault.jpg
  - Aspect ratio 16:9
  - Overlay: centered play button (Icons.play_circle_filled, white, size 40, opacity 0.9)
  - Gradient overlay at bottom (transparent → black 0.6)
- Below thumbnail: padding 10
  - Title: Plus Jakarta Sans 13sp SemiBold white, max 2 lines
  - Row: eye icon + view count (gray 11sp) + spacer + clock icon + duration or date

- Loading shimmer: same layout with shimmer effect
- Empty: "🎬 No videos found"

Pagination: infinite scroll.
API: GET /api/videos?q=&page=&limit=12

Tap → go('/videos/:id').
```

---

## SCREEN 9 — Video Detail Screen

```
Create a Flutter VideoDetailScreen widget for the DolphinCoder LMS app.

Takes videoId as route param. Fetches GET /api/videos/:id.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- NO AppBar — custom back button overlay on top-left of player

Layout (Column, no scroll for player, scroll for rest):
1. YouTube Player (top):
   - YoutubePlayerBuilder wrapping YoutubePlayer
   - 16:9 aspect ratio
   - autoPlay: true
   - showVideoProgressIndicator: true (color #6366F1)
   - On player ready: update view count optimistically

2. Below player (SingleChildScrollView):
   - Padding 16
   - Title: Plus Jakarta Sans 20sp SemiBold white
   - Row: eye icon + view count (gray) + spacer + calendar icon + date (gray)
   - Divider (Color(0xFF1A2235))
   - Subject + Topic badges (if present)
   - Tags chips row
   - Divider
   - "Description" label Plus Jakarta Sans 14sp SemiBold gray
   - Description text Inter 14sp Color(0xFF9CA3AF)

Back button: positioned top-left, circular bg black 0.5, Icons.arrow_back white.
When player is fullscreen: hide back button.

API: GET /api/videos/:id
Note: this endpoint increments view count automatically.
```

---

## SCREEN 10 — Quizzes Screen

```
Create a Flutter QuizzesScreen widget for the DolphinCoder LMS app.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Quizzes" white

Top:
- Search bar (same style)
- Subject filter chips row (same style as NotesScreen)
- Topic sub-chips row (animated, appears on subject select)

Content: ListView.builder (NOT grid — quiz cards need more space)

Each quiz card (QuizCard widget):
- Glass card bg Color(0xFF111827), radius 16, border, padding 16, margin bottom 12
- Header row:
  - Left: gradient circle icon (indigo→violet, size 44, radius 14) with Icons.psychology_outlined white
  - Right: difficulty badge:
    - ≤5 questions: "Easy" green badge
    - ≤15: "Medium" yellow badge
    - >15: "Hard" red badge
  - Time badge (if timeLimit > 0): yellow, Icons.timer_outlined + "{N}m"

- Subject badge (purple) + Topic badge (blue) row (if present)
- Title: Plus Jakarta Sans 17sp SemiBold white
- Description: Inter 13sp Color(0xFF9CA3AF), max 2 lines

- Stats row: 
  - Icons.quiz_outlined + "{count} questions" gray
  - Icons.check_circle_outline + "Pass: {passingScore}%" gray
  - (spacing with dots separator)

- "Take Quiz" gradient button (full width, height 44)

Loading: shimmer list items.
Empty: 🧠 "No quizzes found".
Pagination: load more on scroll.

API: GET /api/quizzes?q=&subject=&topic=&page=&limit=12

Tap "Take Quiz" → go('/quizzes/:id').
```

---

## SCREEN 11 — Quiz Detail Screen

```
Create a Flutter QuizDetailScreen widget for the DolphinCoder LMS app.

Takes quizId as route param. Fetches:
- GET /api/quizzes/:id (quiz info)
- GET /api/quizzes/:id/attempts (my past attempts)

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: quiz title (truncated), white, transparent

Content (SingleChildScrollView, padding 16):

1. Hero card (glass card, padding 20):
   - Gradient icon (large, 60x60)
   - Title Plus Jakarta Sans 24sp Bold white
   - Description Inter 15sp gray (if present)
   - Subject + Topic badges

2. Info grid (2x2, 4 glass mini-cards):
   - 📝 Questions: count
   - ⏱ Time Limit: "{N} minutes" or "No limit"
   - 🎯 Pass Score: "{N}%"
   - 🔄 Shuffle: "Yes" / "No"
   Each mini-card: icon (colored), value Plus Jakarta Sans 18sp Bold, label Inter 12sp gray

3. "My Attempts" section (if attempts exist):
   - Title "Previous Attempts" 16sp SemiBold
   - List of attempt chips: attempt # + score% + pass/fail badge
   - Max 3 shown, "View All" link

4. Rules section (ExpansionTile):
   - "Quiz Rules" with arrow
   - Inside: bullet list (read all questions, timer starts on begin, auto-submit on timer end)

5. Large "Start Quiz" gradient button (height 56, full width)
   + below it: small gray text "You can retake this quiz anytime"

Tap "Start Quiz" → go('/quizzes/:id/take').
```

---

## SCREEN 12 — Quiz Take Screen

```
Create a Flutter QuizTakeScreen widget for the DolphinCoder LMS app.

This is a FULL SCREEN experience — NO bottom navigation bar, NO standard AppBar.
Takes quizId as route param. Uses the quiz data passed from QuizDetailScreen (or re-fetches).

State (using Riverpod StateNotifier):
- currentQuestionIndex: int
- selectedAnswers: Map<int, int> (questionId → selectedIndex)
- markedForReview: Set<int>
- secondsRemaining: int (from quiz.timeLimit * 60)
- isSubmitting: bool

Layout (Stack):

LAYER 1 — Background: Color(0xFF0A0F1E)

LAYER 2 — Top bar (SafeArea, padding 16):
- Row: [X close button] [Quiz title truncated, Inter 14sp white] [Timer]
- Timer widget:
  - Circular countdown (use percent_indicator CircularPercentIndicator)
  - Color: #10B981 when > 60s, #EF4444 when ≤ 60s
  - Center text: "MM:SS" Plus Jakarta Sans 14sp Bold
  - Radius 28, lineWidth 3
- Progress bar below title: LinearProgressIndicator (value: currentIndex/total, color #6366F1, bg Color(0xFF1A2235))
- "Q{current} of {total}" text Inter 12sp gray

LAYER 3 — Question area (Expanded, padding horizontal 16):
- Question card (glass card, padding 20):
  - Question number badge "Q{n}" (purple small pill)
  - Question text: Plus Jakarta Sans 17sp Medium white
  - If type == 'code-mcq': 
    - Code block with syntax highlight (flutter_highlight, theme 'atom-one-dark')
    - Language label badge (Python/JS/etc)

- Options list (4 items):
  Each option card:
  - Glass card, radius 12, padding 14, margin bottom 10
  - Left: option letter circle (A/B/C/D) in gray bg
  - Right: option text Inter 15sp white
  - When SELECTED: border color #6366F1, bg Color(0xFF6366F1, 0.15), letter circle indigo
  - Tap → update selectedAnswers state

- Below options: "Mark for Review" TextButton:
  - Icon: Icons.flag_outlined (orange if marked, gray if not)
  - Text: "Marked for Review" / "Mark for Review"
  - Tap toggles markedForReview set

LAYER 4 — Bottom bar (padding 16):
- Row: [Prev button] [spacer] [Question Navigator button] [spacer] [Next button]
- Prev: outlined gray button, disabled on first question
- Next: gradient button, on last question becomes "Submit"
- Question Navigator: floating icon button (grid icon)
  → opens ModalBottomSheet with question navigator

Question Navigator Bottom Sheet:
- Title "Question Navigator" + close button
- Wrap of numbered boxes (40x40 each, radius 8, gap 8):
  - Gray: not answered
  - Indigo #6366F1: current question
  - Green #10B981: answered
  - Orange #F59E0B: marked for review
- Tap any box → jump to that question
- Bottom of sheet: "Submit Quiz" gradient button

On Submit:
- If any questions unanswered → AlertDialog "You have {N} unanswered questions. Submit anyway?" with Cancel/Submit
- POST /api/quizzes/:id/attempt with body { answers: [{questionId, selectedIndex}], timeTaken: seconds }
- Navigate to /quizzes/:id/result passing result data

Auto-submit when timer reaches 0.
```

---

## SCREEN 13 — Quiz Results Screen

```
Create a Flutter QuizResultScreen widget for the DolphinCoder LMS app.

Receives quiz result data from QuizTakeScreen (or from route extra).
Data: { score, maxScore, percentage, passed, answers: [...], timeTaken }

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Quiz Results" white, no back button (use popUntil pattern)

Content (SingleChildScrollView, padding 16):

1. Score hero section (glass card, padding 24, center-aligned):
   - Animated CircularPercentIndicator:
     - radius 70, lineWidth 10
     - percent: result.percentage / 100
     - Color: #10B981 if passed, #EF4444 if failed
     - Animation: true, animationDuration 1200ms
     - Center: "{percentage}%" Plus Jakarta Sans 32sp Bold (color = ring color)
   - Below ring: PASSED badge (green) or FAILED badge (red), large pill
   - "{score} / {maxScore} points" Inter 15sp gray
   
2. Stats row (glass cards, 4-column Row):
   - Correct count (green)
   - Wrong count (red)
   - Skipped count (gray)
   - Time MM:SS (blue)
   Each: icon + value (16sp Bold) + label (11sp gray)

3. "Question Review" section:
   - Title "Review Answers" 18sp SemiBold
   - ListView (shrinkWrap, physics NeverScrollable) of question review cards:
     Each card:
     - Left border 3px: green if correct, red if wrong, gray if skipped
     - "Q{n}: {question text}" Plus Jakarta Sans 14sp white, max 3 lines
     - "Your answer: {option text}" Inter 13sp (green if correct, red if wrong)
     - If wrong: "Correct answer: {option text}" Inter 13sp green
     - If explanation: ExpansionTile "Explanation" → Inter 13sp gray text

4. Action buttons row:
   - "Retake Quiz" gradient button → go('/quizzes/:id/take') replacing stack
   - "Back to Quizzes" outlined button → go('/quizzes')

Show confetti lottie animation overlay when passed.
```

---

## SCREEN 14 — Flashcards Screen

```
Create a Flutter FlashcardsScreen widget for the DolphinCoder LMS app.

API: GET /api/flashcards (returns decks: own + public).

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Flashcards" white

Content: GridView.builder (crossAxisCount 2, childAspectRatio 0.9, gap 12)

Each deck card (DeckCard widget):
- Full card gradient background based on deck.color:
  - default: [Color(0xFF1A2235), Color(0xFF111827)]
  - blue:    [Color(0xFF1E3A5F), Color(0xFF1E40AF)]
  - green:   [Color(0xFF064E3B), Color(0xFF065F46)]
  - yellow:  [Color(0xFF78350F), Color(0xFF92400E)]
  - pink:    [Color(0xFF831843), Color(0xFF9D174D)]
  - purple:  [Color(0xFF4C1D95), Color(0xFF6D28D9)]
- Radius 20, clipBehavior Clip.antiAlias
- Decorative circles (2 large circles, top-right, white opacity 0.05)
- Padding 16

Inside card:
- Top row: card count badge (white/20 bg, white text "{N} cards") + lock icon if !isPublic
- Center: Icons.style in large rounded bg (white/10, radius 14, size 48) white
- Bottom: deck name Plus Jakarta Sans 15sp Bold white
- "Study →" Inter 13sp Color(0xFFD1D5DB)

Loading: shimmer grid.
Empty: "🃏 No flashcard decks yet."
Pull-to-refresh.

Tap → go('/flashcards/:id/study').
```

---

## SCREEN 15 — Study Screen (Flashcard Study Mode)

```
Create a Flutter StudyScreen widget for the DolphinCoder LMS app.

FULL SCREEN — no bottom nav, no standard AppBar.
Takes deckId route param.
Fetches:
- GET /api/flashcards/:id (deck + cards)
- GET /api/flashcards/:id/progress (existing progress)

State (Riverpod StateNotifier):
- cards: List (order preserved)
- currentIndex: int
- isFlipped: bool (reset to false on navigation)
- showHint: bool (reset to false on navigation)
- cardResults: Map<cardId, String> ('known' or 'unknown')
- isComplete: bool

Layout (Stack):

TOP BAR (SafeArea, padding 16):
- Row: [X close → pop] [Deck name, truncated, white] ["{current+1} / {total}" gray]
- Linear progress bar (indigo, bg dark, height 3)

MAIN AREA (Expanded, Center):
- GestureDetector(onTap: toggle flip) wrapping AnimatedSwitcher:
  - FRONT face (glass card, 320w, 220h, radius 20):
    - "Tap to flip 👆" Inter 11sp gray, top-right
    - Card front text Plus Jakarta Sans 20sp SemiBold white, centered with padding
  - BACK face (gradient bg indigo/violet opacity 0.2, border #6366F1):
    - "Answer" Inter 11sp gray uppercase, top-left
    - Card back text Plus Jakarta Sans 18sp white, centered
    - If showHint == true: "💡 {hint text}" Inter 14sp Color(0xFFD1D5DB) italic, below answer

- Flip animation: 3D effect using Transform with front/back child switching at 90° mark

HINT BUTTON (Padding below card):
- Only show if current card has hint AND isFlipped == false
- TextButton.icon(Icons.lightbulb_outline, "Show Hint") — yellow color
- On tap: showHint = true

BOTTOM SECTION (Padding 16):
Row 1 (navigation):
- [← Prev outline button] [spacer] [Next → gradient button or "Finish"]
- Tap prev/next: change index, reset isFlipped and showHint

Row 2 (rating, only visible when isFlipped == true):
- Row with gap 12:
  - "✗ Still Learning" — red outlined button, full flex 1
  - "✓ Got It!" — green gradient button, full flex 1
- On tap either: record result, auto-advance to next (or complete)

COMPLETION SCREEN (when isComplete == true):
- Replace body with centered Column:
  - Lottie confetti animation
  - "🎉 Complete!" Plus Jakarta Sans 28sp Bold white
  - CircularPercentIndicator showing mastery %
  - "{known} / {total} cards mastered" Inter 15sp gray
  - "Study Again" gradient button (restart)
  - "Back to Decks" outlined button → pop

On pop: POST /api/flashcards/:id/progress { cardResults, masteredCount: known count }
```

---

## SCREEN 16 — Profile Screen

```
Create a Flutter ProfileScreen widget for the DolphinCoder LMS app.

API: uses auth state from Riverpod (already fetched).

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Profile" white, transparent, action: IconButton settings → go('/settings')

Content (SingleChildScrollView, padding 16):

1. Avatar section (center, padding vertical 24):
   - CircleAvatar (radius 52):
     - If user.avatar: CachedNetworkImage
     - Else: gradient bg indigo→violet + initials text (first letters of name) 22sp Bold white
   - SizedBox 16
   - Name: Plus Jakarta Sans 22sp Bold white
   - Email: Inter 14sp Color(0xFF9CA3AF)
   - SizedBox 8
   - Role badge pill:
     - admin: orange bg/border
     - trainer: blue bg/border
     - student: gray bg/border

2. Stats row (glass card, Row with 3 equal sections + dividers):
   - "Quizzes" + count (use 0 placeholder)
   - "Passed" + count
   - "Decks" + count
   Each: value Plus Jakarta Sans 20sp Bold white, label Inter 12sp gray, center-aligned

3. Menu glass card (ListTiles with InkWell):
   Items with Icons.chevron_right trailing:
   - Icons.edit_outlined "Edit Profile" indigo → go('/profile/edit')
   - Icons.lock_outline "Change Password" indigo → go('/profile/password')
   - Icons.video_library_outlined "Videos" indigo → go('/videos')
   - Icons.settings_outlined "Settings" indigo → go('/settings')
   - Divider Color(0xFF1A2235)
   - Icons.logout "Logout" RED color → AlertDialog confirm → clear storage → go('/login')

4. Version footer:
   - "DolphinCoder v1.0.0" Inter 12sp Color(0xFF374151) centered, padding top 24
```

---

## SCREEN 17 — Edit Profile Screen

```
Create a Flutter EditProfileScreen widget for the DolphinCoder LMS app.

API: PUT /api/auth/profile { name, bio }.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Edit Profile" white + "Save" TextButton action (indigo, calls save on tap)

Content (SingleChildScrollView, padding 20):

1. Avatar section (center, padding bottom 24):
   - CircleAvatar (radius 52) with current avatar or initials
   - Below: TextButton "Change Photo" (indigo) — taps ImagePicker (future enhancement, no API for now)

2. Form (glass card, padding 20):
   - "Full Name" AppTextField, pre-filled with user.name, validator min 2 chars
   - SizedBox 16
   - "Bio" AppTextField, pre-filled with user.bio, maxLines 4, maxLength 200, no validator

3. Bottom gradient "Save Changes" button (height 52)

Save logic:
- PUT /api/auth/profile { name: nameController.text, bio: bioController.text }
- On success: update Riverpod auth state with new user, SnackBar "Profile updated!", pop
- On error: SnackBar with server error message

Use Riverpod ref.read(authProvider.notifier).updateProfile(...).
```

---

## SCREEN 18 — Change Password Screen

```
Create a Flutter ChangePasswordScreen widget for the DolphinCoder LMS app.

API: PUT /api/auth/password { currentPassword, newPassword }.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Change Password" white

Content (SingleChildScrollView, padding 20):

Glass card (padding 20) wrapping:
- "Current Password" AppTextField:
  - obscureText: true, toggle suffix eye icon
  - prefix: Icons.lock_outline indigo
  - validator: required

- SizedBox 16

- "New Password" AppTextField:
  - obscureText: true, toggle suffix eye icon
  - prefix: Icons.lock_reset_outlined indigo
  - validator: min 6 chars
  - Below field: password strength bar (3 segments, same as Register screen)

- SizedBox 16

- "Confirm Password" AppTextField:
  - obscureText: true, toggle suffix eye icon  
  - prefix: Icons.check_circle_outline indigo
  - validator: must match new password field

SizedBox 24
Full-width gradient "Update Password" button (height 52)
- Shows loading spinner while API call in progress

Logic:
- PUT /api/auth/password { currentPassword, newPassword }
- On success: SnackBar "Password updated successfully!" + pop
- On 400: SnackBar "Current password is incorrect"
- On network error: SnackBar "Connection failed"
```

---

## SCREEN 19 — Settings Screen

```
Create a Flutter SettingsScreen widget for the DolphinCoder LMS app.

Design requirements:
- Scaffold background Color(0xFF0A0F1E)
- AppBar: "Settings" white

Content (ListView, padding 16):

Section header style: Inter 12sp Color(0xFF6366F1) uppercase, padding left 4, margin bottom 8

SECTION "General" (glass card):
- SwitchListTile "Push Notifications":
  - value: false, enabled: false (grayed out), subtitle: "Coming soon"
  - activeColor: Color(0xFF6366F1)
- Divider
- ListTile "Language" trailing: Text("English", Color(0xFF9CA3AF))

SECTION "Developer" (glass card):
- ListTile "API Base URL":
  - subtitle: current URL from shared_preferences (default: https://api.dolphincoder.com/api)
  - trailing: Icons.edit_outlined gray
  - onTap: showDialog with TextFormField to edit URL, Save button
  - On save: write to shared_preferences 'api_base_url' + SnackBar "Restart app to apply"

SECTION "Cache" (glass card):
- ListTile:
  - leading: Icons.delete_sweep_outlined Color(0xFFEF4444)
  - title: "Clear Cache" (red text)
  - onTap: showDialog confirm → clear imageCache + SnackBar "Cache cleared"

SECTION "About" (glass card):
- ListTile "App Version" trailing: "1.0.0"
- Divider
- ListTile "Rate App" Icons.star_outline Color(0xFFF59E0B):
  - onTap: launchUrl to placeholder store URL
- ListTile "Privacy Policy":
  - onTap: launchUrl
- ListTile "Terms of Service":
  - onTap: launchUrl
```

---

## SHARED — GlassCard Widget

```
Create a Flutter GlassCard reusable widget for the DolphinCoder LMS app.

```dart
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final EdgeInsets? margin;
  final double radius;
  final Color? color;
  final Color? borderColor;
  final bool hasShadow;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.radius = 16,
    this.color,
    this.borderColor,
    this.hasShadow = true,
    this.onTap,
  });
}
```

Implementation:
- color defaults to Color(0xFF111827)
- borderColor defaults to Colors.white.withOpacity(0.08)
- boxShadow: [BoxShadow(color: Color(0xFF6366F1).withOpacity(0.04), blurRadius: 20, offset: Offset(0,4))] if hasShadow
- Wrap child in Material(color: transparent) → InkWell(onTap, borderRadius, child: Padding)
- Outer Container: decoration BoxDecoration(color, borderRadius circular(radius), border all 1px borderColor, boxShadow)
```

---

## SHARED — GradientButton Widget

```
Create a Flutter GradientButton reusable widget for the DolphinCoder LMS app.

```dart
class GradientButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final double? width;
  final double height;
  final IconData? icon;
  final Gradient? gradient;
}
```

Implementation:
- Default gradient: LinearGradient(colors: [Color(0xFF6366F1), Color(0xFFA855F7)], begin: Alignment.centerLeft, end: Alignment.centerRight)
- boxShadow: [BoxShadow(color: Color(0xFF6366F1).withOpacity(0.4), blurRadius: 16, offset: Offset(0,4))] when enabled
- Press animation: scale 0.97 on tap (use StatefulWidget with GestureDetector onTapDown/Up + AnimatedScale)
- Disabled state: opacity 0.5, no shadow, no scale
- Loading: white CircularProgressIndicator size 20, strokeWidth 2
- Text: Plus Jakarta Sans 15sp FontWeight.w600 white
- Icon: optional, size 18, white, leading the text with SizedBox(6) gap
```

---

## SHARED — AppTextField Widget

```
Create a Flutter AppTextField reusable widget for the DolphinCoder LMS app.

```dart
class AppTextField extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final int maxLines;
  final int? maxLength;
  final bool enabled;
  final void Function(String)? onChanged;
}
```

Styling:
- Label: Text(label, Inter 13sp, Color(0xFF9CA3AF)) + SizedBox(height 6)
- TextFormField fillColor: Color(0xFF1A2235)
- All border states: OutlineInputBorder(radius 12)
  - enabled: Color(0xFF374151) width 1
  - focused: Color(0xFF6366F1) width 1.5
  - error: Color(0xFFEF4444) width 1
  - disabled: Color(0xFF1F2937) width 1
- prefixIcon: Icon(color: Color(0xFF6366F1), size 20)
- errorStyle: Inter 12sp Color(0xFFEF4444)
- contentPadding: symmetric(horizontal 16, vertical 16)
```

---

## SHARED — Bottom Navigation Shell

```
Create a Flutter AppShell widget for DolphinCoder LMS using go_router ShellRoute.

```dart
class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});
}
```

Design:
- Scaffold(
    backgroundColor: Color(0xFF0A0F1E),
    body: child,
    bottomNavigationBar: _buildBottomNav(context),
  )

Bottom nav container:
- Container with top border: Border(top: BorderSide(Color(0xFF1A2235), 1))
- bg: Color(0xFF0F172A)
- BottomNavigationBar:
  - backgroundColor: Colors.transparent
  - selectedItemColor: Color(0xFF6366F1)
  - unselectedItemColor: Color(0xFF4B5563)
  - selectedLabelStyle: Inter 11sp FontWeight.w600
  - unselectedLabelStyle: Inter 11sp
  - type: BottomNavigationBarType.fixed
  - elevation: 0
  - currentIndex: determined by GoRouterState location matching

5 items:
  BottomNavigationBarItem(icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home')
  BottomNavigationBarItem(icon: Icons.article_outlined, activeIcon: Icons.article, label: 'Notes')
  BottomNavigationBarItem(icon: Icons.psychology_outlined, activeIcon: Icons.psychology, label: 'Quizzes')
  BottomNavigationBarItem(icon: Icons.style_outlined, activeIcon: Icons.style, label: 'Flashcards')
  BottomNavigationBarItem(icon: Icons.person_outlined, activeIcon: Icons.person, label: 'Profile')

onTap: switch on index → context.go('/home'), go('/notes'), go('/quizzes'), go('/flashcards'), go('/profile')

Active index detection:
  final location = GoRouterState.of(context).matchedLocation;
  if (location.startsWith('/home')) return 0;
  if (location.startsWith('/notes')) return 1;
  if (location.startsWith('/quizzes')) return 2;
  if (location.startsWith('/flashcards')) return 3;
  if (location.startsWith('/profile')) return 4;
  return 0;
```

---

## CORE — Theme (app_theme.dart)

```
Create a Flutter app_theme.dart file for the DolphinCoder LMS app.

Create AppTheme class with static ThemeData get dark:

ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: Color(0xFF0A0F1E),
  colorScheme: ColorScheme.dark(
    primary: Color(0xFF6366F1),
    secondary: Color(0xFFA855F7),
    surface: Color(0xFF111827),
    background: Color(0xFF0A0F1E),
    error: Color(0xFFEF4444),
    onPrimary: Colors.white,
    onSurface: Color(0xFFF9FAFB),
    onBackground: Color(0xFFF9FAFB),
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: Colors.transparent,
    elevation: 0,
    titleTextStyle: Plus Jakarta Sans 20sp SemiBold white,
    iconTheme: IconThemeData(color: white),
    systemOverlayStyle: SystemUiOverlayStyle.light,
  ),
  textTheme: TextTheme(
    displayLarge: Plus Jakarta Sans 28sp Bold white,
    headlineMedium: Plus Jakarta Sans 22sp SemiBold white,
    titleLarge: Plus Jakarta Sans 18sp SemiBold white,
    titleMedium: Inter 16sp Medium white,
    bodyLarge: Inter 15sp Regular Color(0xFFF9FAFB),
    bodyMedium: Inter 14sp Regular Color(0xFF9CA3AF),
    labelLarge: Inter 13sp Medium white,
    labelSmall: Inter 11sp Medium Color(0xFF9CA3AF),
  ),
  cardTheme: CardTheme(
    color: Color(0xFF111827),
    elevation: 0,
    shape: RoundedRectangleBorder(radius circular 16, side BorderSide(Color(0xFF1F2937), 1)),
    margin: EdgeInsets.zero,
  ),
  dividerTheme: DividerThemeData(color: Color(0xFF1A2235), thickness: 1),
  snackBarTheme: SnackBarThemeData(
    backgroundColor: Color(0xFF1A2235),
    contentTextStyle: Inter 14sp white,
    shape: RoundedRectangleBorder(radius circular 12),
    behavior: SnackBarBehavior.floating,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true, fillColor: Color(0xFF1A2235),
    contentPadding: symmetric(h16, v16),
    border/enabledBorder/focusedBorder: OutlineInputBorder(radius 12, Color(0xFF374151)),
    focusedBorder: OutlineInputBorder(radius 12, Color(0xFF6366F1) 1.5w),
  ),
  chipTheme: ChipThemeData(
    backgroundColor: Color(0xFF1A2235),
    selectedColor: Color(0xFF6366F1),
    labelStyle: Inter 13sp,
    padding: symmetric(h8, v4),
    shape: RoundedRectangleBorder(radius circular 20),
  ),
)

Also define AppColors class with all color constants.
```
