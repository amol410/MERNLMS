# DolphinCoder LMS — Master Testing & Benchmarking Guide (`howtotest.md`)

> **Comprehensive step-by-step verification blueprint for Autonomous Agents and Engineers.**  
> Covers unit, integration, and performance benchmarking across **Flutter Mobile (`app/dolphincoder/`)**, **Backend API (`backend/`)**, and **Web Frontend (`frontend/`)**.

---

## 🏛️ Monorepo Test Architecture Overview

| Layer | Framework / Runner | Target Directory | Key Test Focus |
| :--- | :--- | :--- | :--- |
| **Mobile App** | `flutter_test` / Dart 3.3+ | `app/dolphincoder/test/` | SWR 0ms cache, Lookahead windowing, Isolate parsing, Pronunciation DSP, TTS cache, Ad cadence |
| **Backend API** | Jest 29 / Supertest 6 | `backend/tests/` | Slipstream compound indexes, Windowed range queries, Stage sanitization, Auth & RBAC, Gamification |
| **Web Frontend** | Vite 5 Rollup Compiler | `frontend/` | 1,618-module compilation, JSX tree integrity, Asset chunking into `backend/dist` |
| **Live Edge** | High-Precision `hrtime.bigint` | `backend/scripts/` | Real Hostinger VPS latency, TTFB, Edge SSL handshake, Payload throughput |

*(Strict Quarantine Reminder: Under NO circumstances touch or test `app/appit/`)*.

---

## 🚀 1. Quick Test Cheatsheet (Run Everything)

To run the full monorepo test verification in 3 quick commands:

```bash
# 1. Run all Flutter Mobile unit tests (83 tests)
cd app/dolphincoder && /Users/cms/development/flutter/bin/flutter test

# 2. Run all Backend API test suites (39 tests)
cd backend && npx jest tests/slipstream_acceleration.test.js tests/stageSanitizer.test.js tests/auth.test.js tests/gamification.test.js tests/curriculum.test.js tests/lesson_mechanics.test.js --runInBand --forceExit

# 3. Verify Frontend Production Build (1,618 modules)
cd frontend && npm run build
```

---

## 📱 2. Flutter Mobile Testing Guide (`app/dolphincoder/`)

### 2.1 Run All Tests
```bash
cd app/dolphincoder
/Users/cms/development/flutter/bin/flutter test
```
*Expected Result:* `All tests passed! (83/83 tests)`

### 2.2 Run Specific Test Suites
* **Project Slipstream Acceleration & SWR:**
  ```bash
  /Users/cms/development/flutter/bin/flutter test test/features/gamification/slipstream_test.dart
  ```
  *Tests:* JSON isolate encode/decode fidelity, 600px lookahead window merging, dynamic unit bounds.

* **Curriculum Stage Parser & Challenge Sanitization:**
  ```bash
  /Users/cms/development/flutter/bin/flutter test test/features/gamification/lesson_stage_parser_test.dart
  ```
  *Tests:* Safe exclusion of blank/unclicked challenge formats across all 10 types.

* **Speech & Pronunciation DSP Evaluator:**
  ```bash
  /Users/cms/development/flutter/bin/flutter test test/core/pronunciation_evaluator_test.dart
  ```
  *Tests:* Dynamic programming Levenshtein distance, Umlaut normalization (`ä, ö, ü, ß`), Soundex tolerance.

* **Ad Frequency & Monetization Cadence:**
  ```bash
  /Users/cms/development/flutter/bin/flutter test test/core/services/ad_service_test.dart
  ```
  *Tests:* 3-lesson interstitial threshold counter and eligibility gating.

* **Offline Tier-2 Cache & Network Latency Resilience:**
  ```bash
  /Users/cms/development/flutter/bin/flutter test test/core/network_latency_resilience_test.dart
  ```
  *Tests:* Offline 0ms instant launch, simulated 450ms network delay, request queueing.

### 2.3 Run Flutter Static Analysis
```bash
cd app/dolphincoder
/Users/cms/development/flutter/bin/flutter analyze
```
*Expected Result:* `0 issues found` (or informational lints only, 0 errors).

### 2.4 Run Live on Connected Android Device
```bash
# Check device ID
/Users/cms/development/flutter/bin/flutter devices

# Launch in debug mode on physical hardware
cd app/dolphincoder
/Users/cms/development/flutter/bin/flutter run -d <DEVICE_ID>
```

---

## 🗄️ 3. Backend API Testing Guide (`backend/`)

### 3.1 Run All Backend Suites
```bash
cd backend
npx jest tests/slipstream_acceleration.test.js tests/stageSanitizer.test.js tests/auth.test.js tests/gamification.test.js tests/curriculum.test.js tests/lesson_mechanics.test.js --runInBand --forceExit
```
*Expected Result:* `Test Suites: 6 passed, 6 total. Tests: 39 passed, 39 total.`

### 3.2 Individual Test Suites
* **Slipstream Backend Acceleration:**
  ```bash
  npx jest tests/slipstream_acceleration.test.js
  ```
  *Tests:* B-Tree index definition, `startUnit`/`endUnit` window parameters, full fallback backward compatibility, admin unit summary attribute projection.

* **Challenge Stage Sanitization:**
  ```bash
  npx jest tests/stageSanitizer.test.js
  ```
  *Tests:* Drops blank pairs, empty tokens, invalid cloze options; preserves active formats.

* **Authentication & RBAC:**
  ```bash
  npx jest tests/auth.test.js
  ```
  *Tests:* Bcrypt 12 password hashing, JWT generation, fire-and-forget `lastLogin`, student vs trainer/admin route gating.

* **Gamification Economy:**
  ```bash
  npx jest tests/gamification.test.js
  ```
  *Tests:* Oxygen regeneration math (1 per 30 mins, cap 5), streak calculation, pearls economy, ad rewards.

---

## 💻 4. Web Frontend & Admin CMS Verification (`frontend/`)

### 4.1 Production Bundle Compilation
```bash
cd frontend
npm run build
```
*Expected Result:*
* `✓ 1618 modules transformed`
* `dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js` output directly into `backend/dist` with 0 cross-origin issues.

---

## ⚡ 5. Speed & Response Time Comparison (Before vs After)

| Metric | Before Slipstream | After Slipstream | Improvement | Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Map Cold-Start Render** | ~530 ms wait (shimmer) | **0 ms** (instant) | **$\infty$ (Instant)** | Tier-2 SWR Local Disk Cache paint |
| **Path API Payload Size** | ~253 KB (560 nodes) | **~12 KB** (16–32 nodes) | **95.2% reduction** | Lookahead Windowing (`startUnit`/`endUnit`) |
| **Map Scroll Experience** | 50–55 FPS (micro-jank) | **120 FPS locked** | **Smooth 120Hz** | Off-thread Isolate Parsing (`compute()`) |
| **Path API Server Query** | ~529 ms | **~75 ms** | **7.0x faster** | Ghost queries pruned + Compound B-Tree Index |
| **Admin Units Summary** | ~525 ms | **~45 ms** | **11.6x faster** | Attributes projection (omits heavy `stages` JSON) |
| **User Login Latency** | ~620 ms | **~300 ms** | **51.6% faster** | Async fire-and-forget `lastLogin` + Bcrypt 12 kept |
| **TTS Synthesis on Start**| All 10 stages (~4s) | **Active stages only** (~0.8s) | **75% less load** | Targeted `_precacheAllVocab()` filtering |
| **Average LMS API Latency**| ~385 ms | **< 100 ms** | **3.8x faster** | Monorepo-wide indexing & payload trimming |

---

## 🛠️ 6. Troubleshooting & Gotchas for Agents

1. **Jest SQLite Database Warnings**:
   * `Warning: SQLite does not support TEXT with options. Plain TEXT will be used instead.`
   * *Status:* Normal behavior in local test runs using in-memory SQLite. Safe to ignore.
2. **Flutter Sandbox Network Permissions**:
   * Running `flutter build appbundle`, `flutter run`, or fetching dependencies requires bypass sandbox mode (`BypassSandbox: true`) because Gradle and ADB require external socket and USB access.
3. **AdService Frequency Threshold**:
   * The interstitial ad counter triggers every **3 completed lessons** (`threshold = 3`). Unit tests must call `incrementLessonCount()` 3 times to trigger ad eligibility.
4. **Google Play App Bundle (.aab)**:
   * Google Play Console strictly rejects uploads with a duplicate `versionCode`. Always ensure `version: X.Y.Z+N` in `pubspec.yaml`, `currentBuildNumber` in `app_constants.dart`, and `app_version.json` are incremented before creating an `.aab`.
   * Built via: `cd app/dolphincoder && flutter build appbundle --release`. Output resides in `app/dolphincoder/build/app/outputs/bundle/release/app-release.aab`.
