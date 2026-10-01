# 🐬 Project Echo / LingoDolphin — Language Learning App Architecture & Screen Blueprint

> **Notice:** This document and all assets inside `planning/` are strictly isolated from the main LMS and mobile codebase. No existing files in `app/dolphincoder/`, `backend/`, or `frontend/` are modified.

---

## 1. 🛡️ Legal Independence & Differentiation Strategy

To guarantee **zero copyright, trademark, or trade-dress conflict** with Duolingo (or any other commercial language app), we follow strict clean-room design principles:

| Aspect | Duolingo (Avoid) | Our Application (Original & Distinct) |
| :--- | :--- | :--- |
| **Mascot** | Green Owl ("Duo") with geometric round eyes | **"Echo" the Polyglot Dolphin** — A lively, charismatic marine dolphin with expressive vector animations (waving fins, nodding, diving, wearing snorkel/glasses/graduation caps). |
| **Primary Theme** | Flat lime green (`#58CC02`) | **Electric Indigo, Ocean Cyan & Sunset Coral** (`#4F46E5`, `#06B6D4`, `#F43F5E`) with modern glassmorphic depth. |
| **Currencies & Economy** | Lingots / Gems / Hearts | **Ocean Pearls (XP)**, **Golden Shells (Coins)**, and **Oxygen Energy (`🫧 5/5`)**. |
| **Competitive Tiers** | Bronze/Silver/Gold/Diamond Leagues | **Ocean Currents & Oceanic Tiers** (Lagoon, Coral Reef, Open Ocean, Deep Trench, Atlantis). |
| **Learning Path Style** | Plain linear stepping stones | **Serpentine Nautical Island Archipelago**: Islands representing thematic units with stepping coral stones, sunken treasure chests, and boss challenge lighthouses. |
| **Tone of Voice** | Sarcastic/Passive-aggressive push notifications | **Enthusiastic, encouraging, empathetic mentor dolphin** who celebrates small wins. |

---

## 2. 🎨 Design System & Visual Language

* **Color Palette:**
  * **Primary Brand:** Ocean Blue (`#2563EB`) & Deep Indigo (`#1E1B4B`)
  * **Accent Cyan (Sync & Action):** Electric Cyan (`#06B6D4`)
  * **Success Green:** Emerald Mint (`#10B981`) with `#D1FAE5` surface
  * **Energy Coral / Mistake:** Warm Coral (`#F43F5E`) with `#FFE4E6` surface
  * **Streak Flame:** Solar Orange (`#F59E0B`)
  * **Surface Background:** Soft Slate Ivory (`#F8FAFC`) with elevated card white (`#FFFFFF`) and dark mode slate (`#0F172A`)
* **Tactile 3D Buttons (Modern Gamified Touch):**
  * Flat rounded rectangles with a **3px bottom border shadow** that physically depresses downward on tap (`Transform.translate(offset: Offset(0, 3))`).
* **Typography:**
  * Headers: **Plus Jakarta Sans (w800/w900)** with tight letter-spacing (`-0.5px`)
  * Body & Word Chips: **Outfit / Inter (w600/w700)** for ultra-crisp multilingual legibility.

---

## 3. 📱 Complete Numbered Screen Architecture (01 – 19)

Below is the complete, sequential numbered breakdown of all 19 screens in the application:

```
[ONBOARDING & SETUP]
  Screen 01: Splash Screen 1 — Logo Reveal & Marine Sound
  Screen 02: Splash Screen 2 — Mascot Introduction ("Meet Echo!")
  Screen 03: Splash Screen 3 — Gamification & Streak Value Proposition
  Screen 04: Language Selection Screen (Interactive Language Cards)
  Screen 05: Motivation & Purpose Screen ("Why are you learning?")
  Screen 06: Daily Commitment Pace Screen (Casual 5m to Intense 20m)
  Screen 07: Skill Level & Placement Choice (Beginner vs Placement Quiz)
  Screen 08: Account Creation & Guest Mode Screen

[CORE LEARNING PATH]
  Screen 09: Home Learning Archipelago (Serpentine Skill Path, Units, Chests)

[INTERACTIVE LESSON CHALLENGES]
  Screen 10: Lesson Challenge — Match the Pairs (Dual-Column Word Match)
  Screen 11: Lesson Challenge — Listening & Karaoke Sequence (Audio tap)
  Screen 12: Lesson Challenge — Sprechen Speech & Character Lip-Sync
  Screen 13: Lesson Challenge — Sentence Builder (Scrambled Word Tiles)
  Screen 14: Lesson Complete Celebration (XP, Pearls & Accuracy Score)

[RETENTION & GAMIFICATION]
  Screen 15: Streak Flame & Calendar Milestone Screen
  Screen 16: Oceanic Leagues & Leaderboard (Weekly Rankings)
  Screen 17: Daily Quests & Sunken Treasure Chests
  Screen 18: Pearl & Coral Reef Shop (Oxygen Refills, Outfits, Freeze)
  Screen 19: User Profile, Badges & Fluency Statistics
```

---

### Detailed Screen Specifications

#### 🔹 Screen 01: `01_splash_intro.dart`
* **Purpose:** Initial app boot, smooth branding entrance.
* **Visual Hierarchy:**
  * Deep ocean gradient background (`#0F172A` to `#1E3A8A`).
  * Floating subtle water bubbles rising upward (staggered animation).
  * Glowing central Logo: Dolphin leaping over a speech bubble.
  * App Name: **"LingoDolphin"** in bold white typography with a cyan subtitle: *"Learn languages naturally"*.
* **Transition:** Auto-advances after 2.2 seconds with a smooth scale-out transition.

#### 🔹 Screen 02: `02_onboarding_welcome.dart`
* **Purpose:** Introduce the animated mascot and core mission.
* **Visual Hierarchy:**
  * Top progress dots: `[● ○ ○]`.
  * Center: Animated Mascot **Echo** waving its fin with a big cheerful smile.
  * Speech Bubble from Echo: *"Hi! I'm Echo. I'll help you speak your dream language in just 5 minutes a day!"*
  * Big tactile action button at bottom: **"GET STARTED"** (Cyan `#06B6D4`).
  * Secondary text button: *"I ALREADY HAVE AN ACCOUNT"*.

#### 🔹 Screen 03: `03_onboarding_gamification.dart`
* **Purpose:** Hook the user on fun gamification and habit building.
* **Visual Hierarchy:**
  * Top progress dots: `[○ ● ○]`.
  * Mascot holding a golden trophy with sparkling particles.
  * Three floating perk cards:
    * ⚡ **Bite-sized Lessons:** Short, interactive 3-minute games.
    * 🔥 **Stay Motivated:** Build your streak and rise through weekly Oceanic Leagues.
    * 🗣️ **Real Pronunciation:** Practice speaking with instant audio feedback.
  * Primary Button: **"CONTINUE"**.

#### 🔹 Screen 04: `04_language_selection.dart`
* **Purpose:** Let the user pick what language they want to learn.
* **Visual Hierarchy:**
  * Header: *"What would you like to learn?"*
  * Responsive 2-column grid of language cards:
    * 🇩🇪 **German** — 240k learners
    * 🇪🇸 **Spanish** — 510k learners
    * 🇫🇷 **French** — 380k learners
    * 🇯🇵 **Japanese** — 290k learners
    * 🇮🇹 **Italian** — 170k learners
    * 🇬🇧 **English** — 620k learners
  * Each card has native flag emoji, native language name, learner count, and bouncy tap feedback.

#### 🔹 Screen 05: `05_goal_motivation.dart`
* **Purpose:** Personalize curriculum and build commitment.
* **Visual Hierarchy:**
  * Echo the mascot with a student backpack asking: *"Why are you learning?"*
  * Single-select option list:
    * ✈️ **Travel & Exploration**
    * 💼 **Career & Professional Growth**
    * 🧠 **Brain Workout & Focus**
    * 🎓 **School & Exams**
    * 💬 **Connect with Friends & Family**
  * Bottom Button: **"CONTINUE"** (activates once an option is selected).

#### 🔹 Screen 06: `06_daily_pace_target.dart`
* **Purpose:** Set achievable daily micro-commitments.
* **Visual Hierarchy:**
  * Header: *"Choose your daily target"*.
  * Subtitle: *"You can change this anytime."*
  * 4 Commitment Cards:
    * 🐢 **Casual** — 5 min / day (10 XP)
    * 🐬 **Regular** — 10 min / day (20 XP) *(Recommended badge)*
    * 🚀 **Serious** — 15 min / day (30 XP)
    * ⚡ **Intense** — 20 min / day (50 XP)
  * Bottom Button: **"SET GOAL"**.

#### 🔹 Screen 07: `07_proficiency_placement.dart`
* **Purpose:** Avoid boring experienced learners or overwhelming beginners.
* **Visual Hierarchy:**
  * Header: *"What's your current level?"*
  * Option 1: **"I'm brand new to German"** (Start from Unit 1 Basics with zero pressure).
  * Option 2: **"I already know some German"** (Take a quick 2-minute diagnostic check to unlock advanced levels).

#### 🔹 Screen 08: `08_auth_signup_prompt.dart`
* **Purpose:** Low-friction registration with guest fallback.
* **Visual Hierarchy:**
  * Mascot holding a profile badge: *"Save your progress so you never lose your streak!"*
  * Social Sign-in buttons: **Continue with Google**, **Continue with Apple**.
  * Email / Password input fields.
  * Subtle bottom bypass button: **"LATER (CONTINUE AS GUEST)"**.

#### 🔹 Screen 09: `09_home_learning_path.dart`
* **Purpose:** The main dashboard of the entire app — gamified serpentine archipelago path.
* **Visual Hierarchy:**
  * **Top Status Bar:**
    * Flag switcher: 🇩🇪 German
    * Streak Flame: `🔥 7`
    * Oxygen Energy: `🫧 5/5`
    * Pearl Balance: `💎 420`
  * **Unit Banner:** *"Unit 1: Introductions & Daily Greetings"* (with progress bar).
  * **Serpentine Stepping Stones (Path):**
    * Completed nodes: Gold star badges ⭐
    * Active current node: Bouncing, glowing with pulse ring and mascot standing on it 🐬
    * Locked nodes: Grey with subtle lock padlock 🔒
    * Bonus nodes: Sunken treasure chests and lightning review nodes.
  * **Bottom Navigation Bar:**
    * 🏠 Path (Home)
    * 🏆 Leagues (Leaderboards)
    * 🎯 Quests
    * 🛒 Shop
    * 👤 Profile

#### 🔹 Screen 10: `10_lesson_word_match.dart`
* **Purpose:** Rapid-fire vocabulary pairing challenge.
* **Visual Hierarchy:**
  * Top: Linear lesson progress bar + Close button + Oxygen count.
  * Prompt: *"Match the word pairs"*.
  * Two columns of tactile word tiles:
    * Left (German): *Guten Tag*, *Danke*, *Bitte*, *Auf Wiedersehen*
    * Right (English, shuffled): *Thank you*, *Goodbye*, *Hello*, *Please*
  * Tap mechanics: Tapping left selects cyan tile; tapping right matches with a pleasant chime sound, turns both green, and dissolves them.

#### 🔹 Screen 11: `11_lesson_listening_karaoke.dart`
* **Purpose:** Auditory comprehension with word sequence reassembly.
* **Visual Hierarchy:**
  * Speaker tile with replay button.
  * Mascot in listening pose.
  * Target sentence slot (blank dotted lines).
  * Scrambled clickable word bank below.
  * Audio plays $\rightarrow$ Student taps word tokens in the exact order heard.

#### 🔹 Screen 12: `12_lesson_sprechen_speech.dart`
* **Purpose:** Spoken pronunciation mastery with lip-sync character.
* **Visual Hierarchy:**
  * Top progress bar & chances (`❤️ 3`).
  * Combined headline: *"Speak this sentence"* + Audio replay button.
  * Prominent German sentence card with word-by-word active highlight.
  * Animated Mascot (Echo) with real-time mouth movement.
  * English translation below in subtle small font.
  * Large **`🎙️ TAP TO SPEAK`** button with active speech wave and direct cancel (`✕`) control.
  * Bottom Duolingo green (`CONTINUE`) sheet on match.

#### 🔹 Screen 13: `13_lesson_sentence_builder.dart`
* **Purpose:** Sentence structure, grammar syntax, and word ordering.
* **Visual Hierarchy:**
  * English prompt card: *"The coffee is very hot."*
  * Assembly canvas area.
  * Bank of German word tiles: `[Der] [Kaffee] [ist] [sehr] [heiß] [kalt] [Wasser]`.
  * Bottom check button: **"CHECK ANSWER"**.

#### 🔹 Screen 14: `14_lesson_complete_celebration.dart`
* **Purpose:** Dopamine release, reward delivery, and motivation loop.
* **Visual Hierarchy:**
  * Mascot jumping with fireworks and confetti animation.
  * Big bold headline: **"LESSON COMPLETE!"**
  * 3 Performance Metric Cards:
    * ⚡ **Total XP:** `+15 XP`
    * 🎯 **Accuracy:** `94%`
    * ⏱️ **Time:** `1m 45s`
  * Giant bright green **"CONTINUE"** button.

#### 🔹 Screen 15: `15_streak_flame_milestone.dart`
* **Purpose:** Habit reinforcement and churn prevention.
* **Visual Hierarchy:**
  * Animated roaring campfire flame with day counter: **`🔥 8 DAYS`**.
  * 7-day weekly calendar checkmark tracker (Mon–Sun).
  * Encouragement: *"You're 2.3x more likely to become fluent with an 8-day streak!"*
  * Action button: **"KEEP ROLLING"**.

#### 🔹 Screen 16: `16_leaderboard_leagues.dart`
* **Purpose:** Social proof and competitive drive.
* **Visual Hierarchy:**
  * League header banner: **"Coral Reef League"** (Top 10 promote, bottom 5 demote).
  * Countdown timer: `⏱️ 2d 14h left`.
  * Top 3 podium display (1st Gold, 2nd Silver, 3rd Bronze).
  * Ranked scrollable list with avatar, username, and weekly XP total.
  * Sticky user row at bottom highlighting the student's current position.

#### 🔹 Screen 17: `17_quests_achievements.dart`
* **Purpose:** Daily milestones and long-term goal collection.
* **Visual Hierarchy:**
  * Monthly Badge Quest: *"Echo's October Voyage — Earn 30/40 Quest Badges"*.
  * Daily Quests list:
    * 🎯 Earn 50 XP (`35/50`) $\rightarrow$ Reward: 10 Pearls
    * 🎙️ Score 90%+ on 1 Speaking Lesson (`0/1`) $\rightarrow$ Reward: 15 Pearls
    * ⚡ Complete 3 Lessons without mistakes (`2/3`) $\rightarrow$ Reward: Chest
  * Claim button turns gold when completed.

#### 🔹 Screen 18: `18_shop_inventory.dart`
* **Purpose:** Virtual currency utility and customization.
* **Visual Hierarchy:**
  * Top balance: `💎 520 Pearls`.
  * Section 1: **Power-Ups**:
    * ❄️ **Streak Freeze:** Miss a day without losing your streak (200 Pearls).
    * 🫧 **Oxygen Refill:** Restore full energy immediately (100 Pearls).
  * Section 2: **Mascot Outfits (Fun Cosmetics)**:
    * 🤿 Snorkel & Scuba Goggles (Free unlock)
    * 🎩 Gentleman Top Hat & Bowtie (400 Pearls)
    * 👑 Golden Atlantis Crown (1,000 Pearls)

#### 🔹 Screen 19: `19_user_profile_stats.dart`
* **Purpose:** Identity, learning progress overview, and social sharing.
* **Visual Hierarchy:**
  * Avatar with customizable mascot outfit.
  * Username, join date, country flag.
  * Stats Grid:
    * 🔥 Day Streak: `8`
    * ⚡ Total XP: `3,420`
    * 🏆 Current League: `Coral Reef`
    * 📚 Words Learned: `248`
  * Achievements Showcase (Badges collection).
  * Friend invite button: *"Invite friends for 3 days of unlimited Oxygen"*.

---

## 4. 📂 Directory Structure in `planning/`

```
planning/
├── PLAN.md                                      <-- (This master plan document)
├── screens/
│   ├── 01_splash_intro.dart
│   ├── 02_onboarding_welcome.dart
│   ├── 03_onboarding_gamification.dart
│   ├── 04_language_selection.dart
│   ├── 05_goal_motivation.dart
│   ├── 06_daily_pace_target.dart
│   ├── 07_proficiency_placement.dart
│   ├── 08_auth_signup_prompt.dart
│   ├── 09_home_learning_path.dart
│   ├── 10_lesson_word_match.dart
│   ├── 11_lesson_listening_karaoke.dart
│   ├── 12_lesson_sprechen_speech.dart
│   ├── 13_lesson_sentence_builder.dart
│   ├── 14_lesson_complete_celebration.dart
│   ├── 15_streak_flame_milestone.dart
│   ├── 16_leaderboard_leagues.dart
│   ├── 17_quests_achievements.dart
│   ├── 18_shop_inventory.dart
│   └── 19_user_profile_stats.dart
└── widgets/
    ├── animated_dolphin_mascot.dart             <-- (Vector Mascot with customizable hats/animations)
    ├── tactile_game_button.dart                 <-- (3D spring button)
    ├── ocean_status_bar.dart                    <-- (Oxygen, Pearls, Streak header)
    └── duolingo_feedback_sheet.dart             <-- (Green celebration / Red retry sheet)
```

---

## 5. Next Steps
1. Create the `planning/` directory and standalone screen components.
2. Build each screen in sequential order with full UI fidelity and character animations.
3. Build an interactive Screen Navigator so you can flip through Screen 01 to 19 seamlessly on any phone or browser.
