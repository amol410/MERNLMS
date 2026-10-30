# DolphinCoder — APK R8 Optimization & Ad-Disabling Change Tracker

> **Purpose:** This document tracks every single file and configuration modified to enable R8 code shrinking and disable ads for APK mobile testing.  
> If you want to completely reverse these changes and restore the exact previous configuration, follow the **Reversal Instructions** at the bottom of this document.

---

## 📋 Modified Files Summary

| # | File Path | Type | What Was Changed |
| :- | :--- | :---: | :--- |
| 1 | `app/dolphincoder/lib/core/services/ad_service.dart` | Modified | `static const bool adsEnabled = false;` (disables all AdMob init, rewarded ads, and interstitials) |
| 2 | `app/dolphincoder/android/app/build.gradle.kts` | Modified | Set `isMinifyEnabled = true`, `isShrinkResources = true`, and linked `proguard-rules.pro` |
| 3 | `app/dolphincoder/android/app/proguard-rules.pro` | Created | Added strict keep rules for Speech-to-Text reflection, Audio Manager, Bluetooth SCO, and Flutter engine |

---

## 🔍 Detailed File Diffs

### 1. `app/dolphincoder/lib/core/services/ad_service.dart`
```diff
--- a/app/dolphincoder/lib/core/services/ad_service.dart
+++ b/app/dolphincoder/lib/core/services/ad_service.dart
@@ -14,1 +14,1 @@
-  static const bool adsEnabled = true;
+  static const bool adsEnabled = false;
```
* **Effect:** When `adsEnabled = false`, `MobileAds.instance.initialize()` is skipped, rewarded ads bypass Google AdMob and instantly award bubbles/rewards, and interstitial ads are silenced.

---

### 2. `app/dolphincoder/android/app/build.gradle.kts`
```diff
--- a/app/dolphincoder/android/app/build.gradle.kts
+++ b/app/dolphincoder/android/app/build.gradle.kts
@@ -52,2 +52,6 @@
-            isMinifyEnabled = false
-            isShrinkResources = false
+            isMinifyEnabled = true
+            isShrinkResources = true
+            proguardFiles(
+                getDefaultProguardFile("proguard-android-optimize.txt"),
+                "proguard-rules.pro"
+            )
```
* **Effect:** Activates Google's R8 optimizer during release APK packaging, stripping thousands of unused SDK classes and removing unreferenced XML/resources.

---

### 3. `app/dolphincoder/android/app/proguard-rules.pro` (NEW FILE)
* **Effect:** Protects mission-critical hardware and reflection bridges from being removed or renamed:
  - **Speech Recognition Engine**: Keeps `com.csdcorp.speech_to_text.**` and preserves the private field `speechRecognizer` that `MainActivity.kt` uses via reflection.
  - **Bluetooth Audio Router**: Keeps `android.media.**` (`AudioManager`, `AudioDeviceInfo`, `becomingNoisyReceiver`, `AudioFocus`).
  - **Text-to-Speech & SoundPool**: Keeps `com.tundralabs.fluttertts.**` and `xyz.luan.audioplayers.**`.
  - **Native Platform Channels**: Keeps `com.dolphincoder.lms.**` and `io.flutter.**`.
  - **AndroidX WorkManager & Room Database**: Keeps `androidx.work.**` and `RoomDatabase` reflection implementations required for Android background workers.
  - **Play Core & GMS**: Suppresses split-install and AdMob compile warnings (`-dontwarn com.google.android.play.core.**`, `-dontwarn com.google.android.gms.**`).

---

## ⏪ How to Reverse Everything in One Command

If this test APK has any issue on your mobile device, run this single terminal command to instantly discard all optimization changes and return to the stable version:

```bash
git checkout -- app/dolphincoder/lib/core/services/ad_service.dart app/dolphincoder/android/app/build.gradle.kts && rm -f app/dolphincoder/android/app/proguard-rules.pro
```

*(Or ask your AI assistant: "Please reverse the APK optimization changes using REVERSE_APK_CHANGES.md".)*
