# DolphinCoder LMS — Screen Design & Theme Guide

This document describes how every screen should look and feel for the native Android Kotlin app. Use these prompts when building each screen with Jetpack Compose.

---

## Global Theme

### Color Palette (Dark Theme Only)
```
Background:       #0A0E1A  (deep navy black)
Surface:          #111827  (dark card surface)
Surface2:         #1C2333  (slightly lighter surface for inputs/chips)
Border:           #1E2D3D  (subtle border)
Primary:          #6C63FF  (vibrant indigo-purple)
PrimaryLight:     #A78BFA  (lighter purple for text on dark)
Accent:           #06B6D4  (cyan accent)
Success:          #10B981  (emerald green)
Warning:          #F59E0B  (amber)
Error:            #EF4444  (red)
TextPrimary:      #F1F5F9  (near white)
TextSecondary:    #94A3B8  (slate muted)
TextMuted:        #475569  (very muted)
```

### Gradients
- Primary gradient: `#6C63FF → #9C63FF` (top-left to bottom-right)
- Card hover/selected: primary with 12% opacity background
- Flashcard deck gradients (6 presets): indigo, blue, green, amber, rose, purple

### Typography
- **Display / Headings**: Plus Jakarta Sans (Bold, SemiBold)
- **Body / Labels**: Inter (Regular, Medium, SemiBold)
- Import via Google Fonts Compose library or downloadable fonts XML

### Shapes
- Cards: 16dp rounded corners
- Chips/Badges: 20dp (pill shape)
- Buttons: 12dp rounded corners
- Input fields: 12dp rounded corners
- Bottom sheets: 20dp top corners only

### Elevation & Shadows
- Cards: subtle shadow with primary color tint at 6% opacity, 20dp blur
- Bottom nav: no elevation, just a top border line in Surface2 color

---

## Screen-by-Screen Design Guide

---

### 1. Splash Screen

**Goal:** Create an instant strong brand impression.

Design:
- Full screen background: `#0A0E1A`
- Center: DolphinCoder dolphin logo (SVG/vector drawable)
- Below logo: "DolphinCoder" text in Plus Jakarta Sans Bold 28sp, white
- Below text: "Learn · Practice · Master" subtitle in Inter Regular 14sp, TextSecondary
- Animation sequence:
  1. Logo fades in + scales from 0.7 to 1.0 (spring animation, 600ms)
  2. Text slides up and fades in (400ms delay)
  3. Subtitle fades in (600ms delay)
  4. After 2.5s total: navigate to Onboarding or Home
- Background: subtle animated gradient orbs behind the logo (very low opacity)
- Everything must be perfectly centered vertically and horizontally

---

### 2. Onboarding Screen

**Goal:** Briefly introduce the app in 3 slides before login.

Design:
- Full dark background
- HorizontalPager with 3 slides
- Each slide:
  - Large emoji or Lottie animation (top 45% of screen)
  - Bold heading (Plus Jakarta Sans 26sp) centered
  - Subtitle (Inter 15sp, TextSecondary) centered, 2-3 lines max
  - 32dp horizontal padding
- Bottom area (fixed, not scrolled):
  - Dot indicators (3 dots, active = Primary filled, inactive = Surface2)
  - "Next" gradient button (full width minus 32dp padding)
  - On last slide: button changes to "Get Started"
  - "Skip" text button (top-right corner) navigates straight to Login

Slide content:
1. 📚 "Everything You Need to Learn" / "Quizzes, notes, flashcards, and videos — all in one place."
2. 🧠 "Practice Makes Perfect" / "Take timed quizzes, review answers, and track your progress."
3. 🚀 "Study Smarter" / "Flip flashcards, watch videos, and read notes crafted by experts."

---

### 3. Login Screen

**Goal:** Clean, modern login with no visual clutter.

Design:
- Full dark background with very subtle gradient orbs (top-right and bottom-left)
- Top: DolphinCoder logo + name (smaller version, centered)
- Below: "Welcome back 👋" heading (Plus Jakarta Sans SemiBold 24sp)
- Subheading: "Sign in to your account" (Inter 14sp, TextSecondary)
- Form fields (vertical stack, 16dp gap):
  - Email field: leading email icon, hint "Enter your email"
  - Password field: leading lock icon, trailing eye toggle icon
  - Custom field style: Surface2 background, Primary border when focused, 12dp corners
- "Forgot Password?" link aligned right (Inter 13sp, PrimaryLight)
- Primary gradient "Sign In" button (full width, 52dp height)
- Divider: "—— or ——" in TextMuted
- "Continue with Google" outlined button (Google logo + text)
- Footer: "Don't have an account? Register" with Register as PrimaryLight tappable text

---

### 4. Register Screen

Design:
- Same layout/style as Login screen
- Fields: Full Name, Email, Password, Confirm Password
- "Already have an account? Sign In" footer

---

### 5. Dashboard (Home)

**Goal:** Rich, informative home screen that rewards the user for opening the app.

Design:
- Top: Custom top bar (no default AppBar)
  - Left: "Good morning, [Name] 👋" (Inter SemiBold 16sp) + "Welcome back" (TextSecondary 13sp)
  - Right: Avatar circle (initials, gradient background, 40dp)
- Section: "Your Progress" (SemiBold heading)
  - 2×2 grid of stat cards:
    - Each card: gradient icon background (40×40, 14dp corners), large number (Plus Jakarta Sans Bold 28sp), label (Inter 12sp TextSecondary)
    - Cards: Quizzes Taken (brain icon, indigo), Pass Rate (check icon, green), Notes (book icon, cyan), Decks (cards icon, amber)
- Section: "Continue Learning" (recent quiz attempts, last 3)
  - Horizontal scroll list
  - Each attempt card: quiz title (2 lines), score badge (green/red), date, "Retake" button
  - If no attempts: motivational empty state "No quizzes taken yet. Start your first one!"
- Section: "Quick Actions"
  - 3 horizontal cards with icons: Start Quiz, Browse Notes, Study Cards
  - Each: gradient icon, bold label, arrow icon
- Pull-to-refresh on entire screen (SwipeRefresh)

---

### 6. Quizzes List Screen

Design:
- AppBar: "Quizzes" title, no back arrow (tab destination)
- Search field below AppBar: Surface2 background, search icon, clear icon when typed
- Horizontal filter chips (lazy row):
  - "All" chip + one chip per subject
  - Active chip: Primary background, white text
  - Inactive chip: Surface2 background, TextSecondary text
  - Pill shape (20dp corners)
- Quiz cards (vertical list, 12dp gap):
  - GlassCard style (Surface background, Border stroke, 16dp corners)
  - Row: purple brain icon container (44×44) | Subject + Topic badges (Wrap) | Difficulty chip (Easy=green, Medium=amber, Hard=red)
  - Title (Plus Jakarta Sans SemiBold 16sp, max 2 lines)
  - Description (Inter 13sp, TextSecondary, max 2 lines, ellipsis)
  - Bottom meta row: question count · pass score · time limit (if > 0)
  - "Take Quiz" primary gradient full-width button (44dp height)
- Shimmer loading (skeleton cards)
- Empty state with 🧠 emoji if no results

---

### 7. Quiz Detail Screen

Design:
- AppBar: back arrow, quiz title (ellipsis), transparent background
- Content (single scroll):
  - Subject + Topic badges at top
  - Quiz title (Plus Jakarta Sans Bold 22sp)
  - Description (Inter 14sp, TextSecondary)
  - Info grid (2 columns of 2 rows):
    - Questions count (icon + number)
    - Time limit (icon + "No limit" or "Xm")
    - Pass score (icon + "X%")
    - Shuffle (icon + "Yes/No")
    - Each cell: Surface card, icon in Primary color, value SemiBold white, label TextMuted
  - "Previous Attempts" section (if any):
    - Heading SemiBold 16sp
    - Up to 2 attempt badges: `Attempt 1 : 20% ✓` — green/red pill badge
  - "Start Quiz" primary gradient full-width button (56dp height, prominent)
  - Generous bottom padding

---

### 8. Quiz Take Screen

Design:
- No bottom navigation (immersive, full screen)
- SafeArea respected (status bar + nav bar)
- Top bar:
  - Close (X) icon button → navigate back to detail
  - Quiz title (Inter 14sp, ellipsis) in center
  - Circular timer (if time limit > 0): percent_indicator style, green normal, red under 60s
- Below top bar:
  - Linear progress bar (Primary color, Surface2 track, 4dp height)
  - "Q1 of 20" label (Inter 12sp, TextMuted)
- Question area (scrollable, Expanded):
  - Question card: Surface background, Border stroke, 16dp corners, 20dp padding
    - "Q1" badge (Primary pill, small)
    - Question text (Plus Jakarta Sans Medium 16sp)
  - 16dp gap
  - Option tiles (A/B/C/D): 10dp gap between each
    - Unselected: Surface background, Border stroke
    - Selected: Primary 12% background, Primary border (1.5dp)
    - Each: letter badge (30×30, 8dp corners) + option text (Inter 14sp)
    - Animated color transition (200ms)
  - "Mark for Review" text button with flag icon (amber when marked)
- Bottom bar (fixed):
  - "← Prev" outlined button (Expanded)
  - Grid icon button (navigator, Surface2 background)
  - "Next →" / "Submit" button (Expanded, gradient on last question)
  - 12dp top border separator

---

### 9. Question Navigator (Bottom Sheet)

Design:
- Bottom sheet, dark Surface background, 20dp top corners
- Header row: "Question Navigator" SemiBold + close icon button
- Scrollable grid area (max 45% screen height):
  - 7 columns of 40×40 number boxes, 6dp spacing
  - Colors: Surface2 (unanswered), Primary (current), Success (answered), Warning (review)
  - 8dp rounded corners on each box
- Legend row (centered): color dot + label for each state
- "Submit Quiz" primary gradient full-width button (pinned at bottom)

---

### 10. Quiz Result Screen

Design:
- AppBar: "Quiz Results" title, no back button (replaced by bottom buttons)
- Scrollable content:
  - Score hero card (GlassCard):
    - Circular progress ring (70dp radius, 10dp line width, green/red)
    - Percentage text inside ring (Plus Jakarta Sans Bold 28sp)
    - "🎉 PASSED" or "✗ FAILED" badge (pill, green/red tint)
    - "X / Y points" below badge
  - Stats row (4 cards): Correct ✓, Wrong ✗, Skipped —, Time ⏱
    - Each: icon (18sp) + value (Inter Bold 14sp) + label (Inter 10sp TextMuted)
    - Expanded equally in a Row
  - "Review Answers" heading
  - Question review list:
    - Each item: Surface card, colored left border (4dp) — green=correct, red=wrong, muted=skipped
    - Q badge + status icon (top row)
    - Full question text
    - Divider
    - Your answer row (icon + colored text)
    - Correct answer row (always shown if wrong/skipped)
    - Explanation box (amber left border, lightbulb icon)
  - "Retake Quiz" gradient button
  - "Back to Quizzes" outlined button

---

### 11. Notes List Screen

Design:
- AppBar: "Notes" title
- Search bar + subject filter chips (same style as Quiz list)
- Topic chips below subject chips (secondary accent color, animated slide-in)
- 2-column grid (0.85 aspect ratio):
  - Each note card: Surface background, Border, 16dp corners
    - 3dp colored left border strip (note's color)
    - Pin icon (amber, top-right, only if pinned)
    - Title (Plus Jakarta Sans SemiBold 13sp, max 3 lines, white)
    - Thin divider (note color at 30% opacity)
    - Subject badge (if has subject)
    - Spacer
    - Date (Inter 10sp, TextMuted, bottom-right)

---

### 12. Note Detail Screen

Design:
- AppBar: back arrow, note title (ellipsis), transparent
- Below AppBar: subject badge + date row
- Colored top accent strip (note's color, 3dp height, full width)
- Content area:
  - `richtext`: render HTML via `AndroidView` with `WebView`, dark background CSS injected
  - `html`: WebView with fullscreen toggle button (bottom-right FAB)
  - `docx`: same as richtext
- WebView CSS injection: `body { background: #0A0E1A; color: #F1F5F9; font-family: Inter, sans-serif; padding: 16px; }`

---

### 13. Flashcard Deck List

Design:
- AppBar: "Flashcards" title
- 2-column grid (0.9 aspect ratio):
  - Each deck card: gradient background (deck's color theme), 20dp corners
    - Decorative semi-transparent circles (top-right area)
    - "X cards" badge (white 15% background, top-left)
    - Lock icon (top-right, if private)
    - Style icon (white box, bottom area)
    - Deck name (Plus Jakarta Sans Bold 14sp, white, max 2 lines)
    - "Study →" (Inter 12sp, white 70%)
  - Gradient presets: indigo, blue, emerald, amber, rose, purple

---

### 14. Flashcard Study Screen

Design:
- No bottom navigation (immersive)
- Top bar: close button, deck name (ellipsis), "X / Y" counter
- Linear progress bar (slim, 3dp)
- Card area (Expanded):
  - Centered 3D flip card (graphicsLayer rotationY)
  - **Front card**: Surface background, Border, 20dp corners, shadow with primary tint
    - "Tap to flip 👆" hint (top-right, TextMuted 11sp)
    - Question text centered (Plus Jakarta Sans SemiBold 20sp, max 6 lines ellipsis)
  - **Back card**: Primary 15% → Accent 15% gradient, Primary border
    - "ANSWER" label (Inter SemiBold 10sp, TextMuted, letterSpacing 1.2)
    - Answer text centered (Plus Jakarta Sans Medium 18sp, max 5 lines ellipsis)
    - Hint text if shown (italic, Inter 13sp, max 3 lines)
- "Show Hint" text button with lightbulb icon (amber) — only on front face when hint exists
- Bottom controls:
  - "← Prev" | "Next →" / "Finish" row
  - When flipped: "✗ Still Learning" (red outlined) | "✓ Got It!" (green filled) row

**Completion screen:**
- Confetti animation (Lottie)
- "🎉" large emoji
- "Complete!" heading
- Circular progress ring (mastery %)
- "X / Y cards mastered"
- "Study Again" gradient button + "Back to Decks" outlined button

---

### 15. Videos List Screen

Design:
- AppBar: "Videos" title
- Search bar
- 2-column grid (0.85 aspect ratio):
  - Each video card: Surface background, Border, 16dp corners, `clipToBounds`
  - Top: `Expanded` thumbnail image (Coil), gradient overlay (transparent → black 60%), centered play button (40sp white icon)
  - Bottom: 10dp padding, title (Plus Jakarta Sans SemiBold 12sp, max 2 lines), view count row (eye icon 11sp + count)

---

### 16. Video Player Screen

Design:
- AppBar: back arrow, video title (ellipsis), transparent
- Media3 `PlayerView` (16:9 aspect ratio, black background)
  - Built-in controls (play/pause, seek bar, fullscreen)
  - Fullscreen locks to landscape
- Below player:
  - Video title (Plus Jakarta Sans SemiBold 18sp)
  - View count + tag chips
  - Description (Inter 14sp, TextSecondary, expandable)

---

### 17. Profile Screen

Design:
- AppBar: "Profile" title + settings icon (top-right)
- Avatar: 104dp circle with primary gradient background, user initials (Plus Jakarta Sans Bold 36sp, white)
- Drop shadow on avatar (primary at 40% opacity)
- Name (Plus Jakarta Sans Bold 22sp, white)
- Email (Inter 14sp, TextSecondary)
- Role badge (pill, color by role: admin=amber, trainer=cyan, student=muted)
- Stats card (GlassCard):
  - 3 sections separated by vertical dividers: Quizzes | Passed | Decks
  - Each: bold number (20sp) + label (12sp TextMuted)
- Menu card (GlassCard, zero internal padding):
  - Each item: icon (Primary) | label (Inter Medium 15sp) | chevron-right
  - Divider (Surface2, 1dp) between items
  - Logout item: icon + label in Error color

---

### 18. Settings Screen

Design:
- AppBar: "Settings" with back arrow
- Sections with headers:
  - **Appearance**: Theme selector (System/Light/Dark) — but since app is dark-only for now, show "Dark Mode: Always On" as a non-tappable row with a check
  - **Notifications**: Toggle row (placeholder, not functional yet)
  - **Account**: App version row, Privacy Policy link, Data Deletion link
- List items: Surface card style, icon + label + value/toggle/arrow

---

## Shared Components

### GlassCard
- Surface background + Border stroke + 16dp corners + optional subtle shadow
- Used everywhere for content cards

### GradientButton
- LinearGradient (Primary → PrimaryVariant) fill
- White text (Inter SemiBold 15sp)
- 12dp corners, 52dp default height
- Loading state: show CircularProgressIndicator inside

### SubjectBadge / TopicBadge
- SubjectBadge: Primary 15% background + Primary 30% border, PrimaryLight text
- TopicBadge: Blue 15% background + Blue 30% border, light blue text
- Pill shape, Inter SemiBold 11sp, horizontal 10dp + vertical 4dp padding

### ShimmerLoader
- Shimmer effect using Compose `InfiniteRepeatableAnimation` on a gradient
- Skeleton shapes matching the real content cards

### EmptyState
- Centered: large emoji (40sp) + bold title (18sp) + subtitle (14sp, TextSecondary)
- Optional action button below

### SearchBar
- Surface2 fill, Border stroke, 12dp corners
- Search icon (leading) + hint text + clear icon (trailing, when text exists)
- No underline (use `BasicTextField` with custom decoration)

---

## Animation Standards

- **Screen transitions**: Fade + slide (200ms ease) using Navigation Compose `AnimatedNavHost`
- **Card press**: scale to 0.97 (100ms) — use `indication` or `pointerInput`
- **Chip selection**: AnimatedContainer color (200ms)
- **Option tiles in quiz**: `animateColorAsState` (150ms)
- **Flashcard flip**: `animateFloatAsState` targeting 180° rotationY (400ms spring)
- **Score ring**: animated stroke (1200ms ease-out)
- **Shimmer**: `InfiniteRepeatableAnimation` brush sweep left-to-right

---

## Design Principles

1. **Dark first** — All screens are dark by default. Never use white backgrounds.
2. **No harsh borders** — Use subtle Surface2 / Border colors only
3. **Consistent spacing** — 8dp base unit, 16dp page padding, 12dp card gaps
4. **Thumb-friendly** — Primary actions are large (48dp+), bottom-aligned
5. **No information overload** — Max 2 lines for descriptions, use ellipsis
6. **Color has meaning** — Green=success, Red=error, Amber=warning, Primary=active/selected
7. **Animations are subtle** — Fast (150-400ms), ease-based, never jarring
