# Phone Diagnostic & Configuration Log

Device: **Realme RMX3471** (Android 14, API 34)  
Serial: `fe4c1736`  
Date: 2026-10-27  

---

### Step 1: Device Detection & Connection Check
- **Action**: Ran `adb devices`
- **Result**: Device `fe4c1736` detected in authorized `device` state.

---

### Step 2: System Setting Diagnosis
- **Action**: Checked Android secure settings for speech recognition and voice interaction:
  - `voice_recognition_service`:
    `com.google.android.tts/com.google.android.apps.speech.tts.googletts.service.GoogleTTSRecognitionService`
  - **Issue Identified**: The system's default speech recognition service was pointed to the Google TTS (Text-to-Speech) engine rather than the Google Voice Search ASR (Automated Speech Recognition) engine (`com.google.android.googlequicksearchbox`).
  - When apps call Android's default `SpeechRecognizer.createSpeechRecognizer(context)`, Android routes to TTS, which cannot capture user voice, causing silent timeout / `error_speech_timeout` (Error 6) or `error_no_match` (Error 7).

---

### Step 3: Navigation to Default Apps Settings
- **Action**: Launched `android.settings.MANAGE_DEFAULT_APPS_SETTINGS` via ADB:
  ```bash
  adb shell am start -a android.settings.MANAGE_DEFAULT_APPS_SETTINGS
  ```
- **Screen Opened**: `DefaultAppListActivity` (Default apps screen).

---

### Step 4: Opened "Digital assistant app"
- **Action**: Located "Digital assistant app" list item at coordinates `[0, 1083][1080, 1301]`.
- **Command**: `adb shell input tap 540 1192`
- **Current Screen**: Digital assistant app settings (`com.android.settings`).
- **Detected Items**:
  - `Default digital assistant app` (currently displays summary: "Google")
  - `Use text from screen` (On)
  - `Use screenshot` (On)
  - `Flash screen` (Off)

---

### Step 5: Tapped "Default digital assistant app"
- **Action**: Tapped `(540, 407)` to inspect the assistant radio choices.
- **Choices on Screen**:
  1. `None`
  2. `ChatGPT`
  3. `Claude`
  4. `Google` (Radio button is **already checked** `checked: true`)
- **Key Discovery**: Even though the UI displays `Google` as checked for the assistant role, the low-level Android secure setting `voice_recognition_service` was stuck on `com.google.android.tts/.../GoogleTTSRecognitionService` (Speech Services by Google TTS).

---

### Step 6: Investigated Android Recognition Services & Missing Language Models
- **Action**: Queried all active `android.speech.RecognitionService` implementations on the device via `pm query-services`.
- **Finding**:
  1. Primary active service bound to `voice_recognition_service`: `com.google.android.tts/com.google.android.apps.speech.tts.googletts.service.GoogleTTSRecognitionService` (Speech Services by Google).
  2. Inspected Speech Services offline language packs via `com.google.android.libraries.speech.modelmanager.languagepack.settings.AddLanguagesActivity`.
  3. **Root Cause Discovered**: Under "Your languages", **ZERO** language packs were installed! Neither `Deutsch (Deutschland)` nor `English (US)` was present on the device.
  4. Without local acoustic models, any voice recognition request sent to Speech Services failed or timed out when network latency was present.

---

### Step 7: Downloaded Offline Speech Models onto Device
- **Actions**:
  1. Tapped `Deutsch (Deutschland)` -> Confirmed download dialog (`65 MB [v3002]`).
  2. Installed `Deutsch (Deutschland)` (146 MB local model).
  3. Tapped `English (US)` -> Confirmed download dialog.
  4. Installed `English (US)` (79 MB local model).
- **Result**: Both German and English on-device speech models are now cached and ready in `com.google.android.tts`.

---

### Step 8: Verification of Offline Language Models
- Verified in `AddLanguagesActivity` that both language models appear under `Your languages`:
  - `Deutsch (Deutschland) | 146 MB [v3002]`
  - `English (US) | 79 MB [v3006]`

---

### Step 9: Launched DolphinCoder (v1.2.10)
- **Action**: Ran `adb shell am start -n com.dolphincoder.lms/.MainActivity`
- **Result**: App opened to Home screen (`German A1 - Unit 9: Master German W-questions`).
- **Target Exercise Ready**: `Pronunciation & Speech (Foundation)` is ready to test speech recognition with the freshly installed German offline speech models.


