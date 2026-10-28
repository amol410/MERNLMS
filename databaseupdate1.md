# DolphinCoder Backend Implementation Guide: Daily Streaks, Ad Rewards & Economy Rebalance

**Document Version:** 1.1  
**Target:** Backend Agent / Engineering Team  
**Scope:** MySQL Database, Sequelize Models, Gamification Controller, API Routes  
**Status:** **COMPLETED & VERIFIED IN PRODUCTION** (Active in MySQL 8, Express Routes & Mobile Integration)  

---

## 1. Executive Summary & Goals

This document specifies the code changes and database status supporting the gamification update:
1. **Daily Lesson Streak Tracking:** Record every lesson completed by users in `user_activities` and accurately maintain `streak_count`, `longest_streak`, and `last_active_date` in the `users` table across daily timezones.
2. **Economy Rebalance (Prevent Currency Hyperinflation):** Default new-account pearls set to 10 (down from 100). Base lesson rewards set to 10 XP (max 12 XP with combo accuracy) and 0–1 pearls.
3. **Database-Persisted Ad Rewards (`POST /api/gamification/claim-ad-reward`):** Persist rewarded video ad claims for **+2 Oxygen Bubbles**, **+25 Pearls**, or **2X XP Bonus** directly into MySQL with daily server-side caps.

---

## 2. Production Status Verification

### 2.1 Users Table Schema Updates
Verified in `backend/models/User.js`:
- `pearls`: Default `10`
- `streakCount`: Default `1`, mapped to column `streak_count`
- `longestStreak`: Default `1`, mapped to column `longest_streak`
- `lastActiveDate`: Mapped to `last_active_date` (DATEONLY)
- `oxygen`: Default `5`, mapped to `oxygen`
- `lastOxygenRefill`: Timestamp of regeneration

### 2.2 UserActivity Schema Updates
Verified in `backend/models/UserActivity.js`:
- `activityType`: ENUM(`'quiz'`, `'note'`, `'flashcard'`, `'lesson'`)
- `activityDate`: DATEONLY
- `metadata`: JSON blob storing detailed lesson metrics and score breakdown.

### 2.3 Controller & Route Implementation
Verified in `backend/controllers/gamificationController.js` and `backend/routes/gamification.js`:
- Route: `POST /api/gamification/claim-ad-reward`
- Handled by `claimAdReward` controller method.
- Validates reward types (`'oxygen'`, `'pearls'`, `'xp_doubler'`), enforces daily limits (e.g., max 6 oxygen rewards/day, max 4 pearl rewards/day), and saves increments directly to the user record in MySQL.
- Automated tests in `backend/tests/gamification.test.js` verify reward claims and validation behavior.
