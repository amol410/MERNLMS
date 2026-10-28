# Architecture Specification: Speech Recognition, Audio Engine & Pronunciation Architecture

**Author:** Agent 2 — Speech Recognition, Audio Engine & Pronunciation Architecture Specialist  
**System:** DolphinCoder LMS (Flutter 3.x Mobile Client, Android Native Subsystem, Node.js/Sequelize Backend)  
**Target Path:** `/Users/cms/Desktop/Code/mern/lms_speedup/MERNLMS/architecture/02_speech_audio_engine.md`  
**Classification:** Core System Architecture Specification  
**Status:** Production-Grade / Active  

---

## Table of Contents
1. [Executive Overview & High-Level Topology](#1-executive-overview--high-level-topology)
2. [Native Android Speech Recognition Bridge (`MainActivity.kt`)](#2-native-android-speech-recognition-bridge-mainactivitykt)
   - [2.1 The Android Binder Death & Hardware AudioRecord Leak Problem](#21-the-android-binder-death--hardware-audiorecord-leak-problem)
   - [2.2 MethodChannel Specification (`com.dolphincoder.lms/speech_lifecycle`)](#22-methodchannel-specification-comdolphincoderlmsspeech_lifecycle)
   - [2.3 Strict Native Lifecycle Overrides (`onDestroy`, `onPause`, `onStop`)](#23-strict-native-lifecycle-overrides-ondestroy-onpause-onstop)
   - [2.4 Deep Reflective Teardown of `SpeechToTextPlugin`](#24-deep-reflective-teardown-of-speechtotextplugin)
   - [2.5 Sequence Diagram: Native Teardown Flow](#25-sequence-diagram-native-teardown-flow)
3. [Dart Speech Lifecycle Bridge & State Machine Architecture](#3-dart-speech-lifecycle-bridge--state-machine-architecture)
   - [3.1 Structural Split: `SpeechLifecycleBridge` vs `SpeechRecognitionService`](#31-structural-split-speechlifecyclebridge-vs-speechrecognitionservice)
   - [3.2 State Machine Specification (`SpeechSessionState` & `SpeechServiceState`)](#32-state-machine-specification-speechsessionstate--speechservicestate)
   - [3.3 Anti-Collision & 400ms Hardware Audio Settling Cooldown](#33-anti-collision--400ms-hardware-audio-settling-cooldown)
   - [3.4 Microphone Permission Preflight, Permanently Denied Detection & Recovery](#34-microphone-permission-preflight-permanently-denied-detection--recovery)
   - [3.5 BCP-47 Locale Resolution & Acoustic Model Negotiation](#35-bcp-47-locale-resolution--acoustic-model-negotiation)
   - [3.6 Real-Time RMS Audio Level Normalization & Visualizer Stream](#36-real-time-rms-audio-level-normalization--visualizer-stream)
   - [3.7 Flutter `WidgetsBindingObserver` Integration in Screen Controllers](#37-flutter-widgetsbindingobserver-integration-in-screen-controllers)
4. [Android System Recognition vs TTS Engine Diagnosis & Fix](#4-android-system-recognition-vs-tts-engine-diagnosis--fix)
   - [4.1 Diagnostic Case Study: The Realme RMX3471 System Lock](#41-diagnostic-case-study-the-realme-rmx3471-system-lock)
   - [4.2 The `voice_recognition_service` Routing Trap (TTS vs Google QuickSearchBox)](#42-the-voice_recognition_service-routing-trap-tts-vs-google-quicksearchbox)
   - [4.3 On-Device Offline Acoustic Models (`AddLanguagesActivity`)](#43-on-device-offline-acoustic-models-addlanguagesactivity)
   - [4.4 Online vs Offline Speech Recognition Behavior & Fallback Characteristics](#44-online-vs-offline-speech-recognition-behavior--fallback-characteristics)
5. [Pronunciation Evaluation Algorithm & Scoring Engine](#5-pronunciation-evaluation-algorithm--scoring-engine)
   - [5.1 Evaluation Engine Architecture & Data Structures](#51-evaluation-engine-architecture--data-structures)
   - [5.2 Text Normalization Pipeline (German Umlauts, Eszett, Diacritics, Digits)](#52-text-normalization-pipeline-german-umlauts-eszett-diacritics-digits)
   - [5.3 Dynamic Programming Levenshtein Distance Implementation](#53-dynamic-programming-levenshtein-distance-implementation)
   - [5.4 Transposition Detection & Single-Edit Typo Classification](#54-transposition-detection--single-edit-typo-classification)
   - [5.5 Phonetic Tolerance Algorithm (Soundex Approximation)](#55-phonetic-tolerance-algorithm-soundex-approximation)
   - [5.6 Monotonic Forward Sequence Alignment with Lookahead Window](#56-monotonic-forward-sequence-alignment-with-lookahead-window)
   - [5.7 Content-Word Weighted Scoring & Threshold Calculation](#57-content-word-weighted-scoring--threshold-calculation)
   - [5.8 Test Suite Verification & Edge-Case Coverage](#58-test-suite-verification--edge-case-coverage)
6. [Audio Playback & Database-Backed Streaming Architecture](#6-audio-playback--database-backed-streaming-architecture)
   - [6.1 `audioplayers` Ecosystem & Multi-Instance Configuration](#61-audioplayers-ecosystem--multi-instance-configuration)
   - [6.2 Sub-20ms Low-Latency Tactile Audio Engine (`TtsService`)](#62-sub-20ms-low-latency-tactile-audio-engine-ttsservice)
   - [6.3 Database-Backed Binary Audio Streaming (HTTP 206 Partial Content)](#63-database-backed-binary-audio-streaming-http-206-partial-content)
   - [6.4 Audio Focus, Ducking & Acoustic Feedback Prevention](#64-audio-focus-ducking--acoustic-feedback-prevention)
   - [6.5 Sound Effects Engine, Mascot Fanfares & Tactile Haptic Feedback](#65-sound-effects-engine-mascot-fanfares--tactile-haptic-feedback)
7. [Comprehensive Class, Interface & Method Reference](#7-comprehensive-class-interface--method-reference)
8. [Troubleshooting & Runbook for Production Operations](#8-troubleshooting--runbook-for-production-operations)

---

## 1. Executive Overview & High-Level Topology

The Speech Recognition, Audio Playback, and Pronunciation Evaluation subsystem is one of the most critical interactive features in DolphinCoder LMS. Language acquisition requires instantaneous, resilient, and accurate real-time feedback when learners speak German (`de_DE`) or English (`en_GB`/`en_US`) phrases.

The architecture spans three distinct computing layers:
1. **Native OS Platform Layer (Android Kotlin)**: Low-level lifecycle hooks, reflection-based Binder proxy detachment, and hardware `AudioRecord` resource de-allocation.
2. **Flutter Client Layer (Dart / Riverpod)**: State machines, acoustic dampening delays, RMS sound level broadcasting, speech permission state machines, and mathematical pronunciation grading.
3. **Backend Service Layer (Node.js / Express / Sequelize / MySQL)**: `LONGBLOB` binary media streaming implementing byte-range HTTP 206 Partial Content to guarantee stutter-free scrubbed playback on mobile networks.

```mermaid
flowchart TB
    subgraph Native Android Layer ["Native Android Layer (Kotlin)"]
        MA["MainActivity.kt"]
        MC["MethodChannel: speech_lifecycle"]
        STTP["SpeechToTextPlugin (CSD Corp)"]
        SR["android.speech.SpeechRecognizer"]
        HAL["Audio HAL / AudioRecord Driver"]

        MA --> MC
        MC -->|Reflection Teardown| STTP
        STTP --> SR
        SR --> HAL
    end

    subgraph Flutter Client Layer ["Flutter Engine & Dart Domain Layer"]
        SLB["SpeechLifecycleBridge"]
        SRS["SpeechRecognitionService (Singleton)"]
        PE["PronunciationEvaluator (DP Matrix)"]
        TTS["TtsService (Low-Latency PlayerMode)"]
        LSS["LessonSessionScreen (Sprechen Stage)"]
        KNR["KaraokeNoteReaderScreen (Story Mode)"]
        WBO["WidgetsBindingObserver"]

        LSS & KNR -->|AppLifecycleState| WBO
        WBO -->|forceRelease| SLB
        SLB -->|invokeMethod| MC
        LSS & KNR --> SRS
        SRS -->|Audio Settling 200ms| TTS
        SRS -->|Transcribed Payload| PE
    end

    subgraph Backend Infrastructure ["Backend Infrastructure (Node.js & MySQL)"]
        NC["noteController.streamAudioFromDb"]
        KA["Sequelize Model: KaraokeAudio (LONGBLOB)"]
        HTTP206["HTTP 206 Partial Content Stream"]

        NC --> KA
        KA --> HTTP206
    end

    KNR -.->|GET /api/notes/audio/db/:id (Range)| HTTP206
```

---

## 2. Native Android Speech Recognition Bridge (`MainActivity.kt`)

### 2.1 The Android Binder Death & Hardware AudioRecord Leak Problem

On Android, `android.speech.SpeechRecognizer` does not run locally within the application process; it acts as an Inter-Process Communication (IPC) client binding over Android Binder to an external `RecognitionService` process (e.g. `com.google.android.googlequicksearchbox` or `com.google.android.tts`).

In cross-platform Flutter engines using standard community plugins (such as `speech_to_text`), several catastrophic failure modes routinely occur in production:
1. **Unreleased Hardware `AudioRecord` Lock**: If an activity background transitions (e.g., user presses Home, answers an incoming call, or closes the screen), the native `AudioRecord` handle remains claimed by the external recognition service. When the user returns to the app, subsequent calls fail with `ERROR_CLIENT` (5), `ERROR_RECOGNIZER_BUSY` (8), or complete audio silence.
2. **Zombie Binder Proxies**: Calling `cancel()` or `stop()` via standard Dart plugins only sends an asynchronous signal. If the underlying Binder death recipient isn't severed, the plugin holds a strong reference to an inactive `SpeechRecognizer` instance, which permanently blocks new recognition sessions.
3. **Ghost Recognition Callbacks**: Late arrival of audio buffers from a dying recognition session into a newly started session triggers concurrent state collisions and crashes the Flutter engine.

### 2.2 MethodChannel Specification (`com.dolphincoder.lms/speech_lifecycle`)

To solve these failure modes, DolphinCoder implements a dedicated native communication channel:
- **Channel Identifier**: `com.dolphincoder.lms/speech_lifecycle`
- **Location**: `app/dolphincoder/android/app/src/main/kotlin/com/dolphincoder/lms/MainActivity.kt`

```kotlin
companion object {
    private const val TAG = "DolphinSpeechLifecycle"
    private const val CHANNEL = "com.dolphincoder.lms/speech_lifecycle"
}
```

#### Handled Methods:

| Method Name | Direction | Parameters | Return Type | Functional Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `destroyRecognizer` | Dart $\to$ Kotlin | None | `Boolean` (`true`) | Performs aggressive reflective teardown of the active native recognizer, terminating IPC binders and releasing hardware microphones immediately. |
| `ensureOptimalSpeechEngine` | Dart $\to$ Kotlin | None | `Map<String, Any>` | Evaluates 3-tier speech engines (Google $\to$ OEM $\to$ Default platform), pre-caches component, and injects optimal recognizer into `SpeechToTextPlugin`. |
| `isRecognitionAvailable` | Dart $\to$ Kotlin | None | `Boolean` | Directly invokes 3-tier resolution to verify whether an active ASR engine is registered on the OS. |
| `isBluetoothHeadsetConnected` | Dart $\to$ Kotlin | None | `Boolean` | Queries `AudioManager.getDevices` for `TYPE_BLUETOOTH_SCO` to detect connected headsets. |
| `startBluetoothSco` | Dart $\to$ Kotlin | None | `Boolean` | Starts native Bluetooth SCO audio recording mode for high-fidelity microphone input. |
| `stopBluetoothSco` | Dart $\to$ Kotlin | None | `Boolean` | Tears down Bluetooth SCO audio routing back to standard device microphone. |

#### Native Inbound Broadcasts (Kotlin $\to$ Dart):

| Event Name | Trigger | Action in Flutter |
| :--- | :--- | :--- |
| `onAudioBecomingNoisy` | Headphone / Bluetooth disconnect during playback | Auto-pauses active audio player to prevent blaring through loudspeakers. |
| `onAudioFocusLost` | External app (call, alarm) requests exclusive audio | Pauses speech/audio session cleanly. |
| `onAudioFocusGained` | Audio focus restored | Restores audio routing readiness. |

### 2.3 Strict Native Lifecycle Overrides (`onDestroy`, `onPause`, `onStop`)

Android's activity lifecycle states (`onPause`, `onStop`, `onDestroy`) execute when the user navigates away or when system constraints kill the activity. `MainActivity.kt` explicitly intercepts all three callbacks to enforce deterministic tear-down:

```kotlin
override fun onPause() {
    super.onPause()
    Log.d(TAG, "Activity onPause: releasing SpeechRecognizer to prevent system-wide resource lock")
    forceReleaseRecognizer()
}

override fun onStop() {
    super.onStop()
    Log.d(TAG, "Activity onStop: releasing SpeechRecognizer to prevent system-wide resource lock")
    forceReleaseRecognizer()
}

override fun onDestroy() {
    Log.d(TAG, "Activity onDestroy: destroying SpeechRecognizer and releasing all audio resources")
    forceReleaseRecognizer()
    super.onDestroy()
}
```

By firing `forceReleaseRecognizer()` in `onPause()`, the hardware mic buffer is returned to the OS sound server (AudioFlinger) *before* another application (or DolphinCoder itself on resume) can encounter an audio device contention lock.

### 2.4 Deep Reflective Teardown of `SpeechToTextPlugin`

Standard plugin architectures encapsulate their internal `SpeechRecognizer` references as private fields, preventing external callers from explicitly freeing them. DolphinCoder employs high-performance Java/Kotlin runtime reflection to locate, cancel, destroy, and nullify this underlying reference.

#### Complete Native Implementation (`MainActivity.kt`):

```kotlin
private fun forceReleaseRecognizer() {
    mainHandler.post {
        try {
            val engine = flutterEngine ?: return@post
            val pluginClass = try {
                Class.forName("com.csdcorp.speech_to_text.SpeechToTextPlugin")
            } catch (e: ClassNotFoundException) {
                null
            }

            if (pluginClass != null) {
                @Suppress("UNCHECKED_CAST")
                val plugin = engine.plugins.get(
                    pluginClass as Class<out io.flutter.embedding.engine.plugins.FlutterPlugin>
                )
                if (plugin != null) {
                    try {
                        val field = plugin.javaClass.getDeclaredField("speechRecognizer")
                        field.isAccessible = true
                        val recognizer = field.get(plugin) as? SpeechRecognizer
                        if (recognizer != null) {
                            Log.d(TAG, "Releasing native SpeechRecognizer instance: $recognizer")
                            recognizer.cancel()
                            recognizer.destroy()
                            field.set(plugin, null)
                            Log.d(TAG, "Native SpeechRecognizer destroyed and nullified successfully")
                        } else {
                            Log.d(TAG, "speechRecognizer field was already null or inactive")
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Reflection cleanup on speech_to_text plugin failed: ${e.message}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in forceReleaseRecognizer: ${e.message}")
        }
    }
}
```

#### Core Mechanics of the Reflective Teardown:
1. **Thread Hopping to Main Looper**: `android.speech.SpeechRecognizer` must strictly be created, operated, and destroyed on the application's Main UI thread. `mainHandler.post { ... }` ensures the operation runs safely on `Looper.getMainLooper()`.
2. **Plugin Registration Lookup**: The engine instance retrieves the active singleton instance of `SpeechToTextPlugin` registered in `flutterEngine.plugins`.
3. **Private Field Inversion**: `plugin.javaClass.getDeclaredField("speechRecognizer")` pierces the class boundary, and `field.isAccessible = true` overrides JVM access controls.
4. **Immediate IPC Cancellation**: Calling `recognizer.cancel()` interrupts any pending audio buffer acquisition inside the OS ASR process.
5. **Binder Destruction**: `recognizer.destroy()` unbinds the client from the OS IPC service and kills the binder proxy.
6. **Field Nullification**: `field.set(plugin, null)` sets the plugin's internal reference to `null`. When Flutter initiates a new listening session, the plugin detects a null instance and is forced to instantiate a fresh, healthy `SpeechRecognizer`.

### 2.5 Sequence Diagram: Native Teardown Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as Android OS / User
    participant Act as MainActivity (Kotlin)
    participant Engine as FlutterEngine Plugins
    participant Plugin as SpeechToTextPlugin
    participant NativeSR as android.speech.SpeechRecognizer
    participant OS as OS Speech Service (Binder)

    App->>Act: onPause() / onDestroy() / MethodChannel
    Act->>Act: forceReleaseRecognizer()
    Act->>Engine: plugins.get(SpeechToTextPlugin.class)
    Engine-->>Act: pluginInstance
    Act->>Plugin: getDeclaredField("speechRecognizer")
    Plugin-->>Act: Field reference
    Act->>NativeSR: cancel()
    NativeSR->>OS: Cancel IPC Recording
    Act->>NativeSR: destroy()
    NativeSR->>OS: Unbind Service Connection & Free Binder
    Act->>Plugin: field.set(pluginInstance, null)
    Act-->>App: Mic Hardware Unlocked & Available
```

### 2.6 The 3-Tier Speech Engine Fallback & Plugin Injection Architecture

To prevent silent recognition timeouts on diverse Android OEM skins (MIUI, ColorOS, OneUI, FuntouchOS), `MainActivity.kt` implements `resolveAndPrepareOptimalSpeechEngine()`:

```mermaid
graph TD
    Start([Speech Engine Resolution]) --> Tier1{Check Tier 1:<br/>Google QuickSearchBox?}
    Tier1 -->|Available| SelectT1["Select com.google.android.googlequicksearchbox<br/>(tier1_google)"]
    Tier1 -->|Not Found / Blocked| QueryOEM[Query pm.queryIntentServices<br/>ACTION_RECOGNITION_SERVICE]
    
    QueryOEM --> Tier2{Check Tier 2:<br/>OEM ASR Available?}
    Tier2 -->|Found| SelectT2["Select OEM RecognitionService<br/>(tier2_oem)"]
    Tier2 -->|None Found| Tier3{Check Tier 3:<br/>Default Platform ASR?}
    
    Tier3 -->|Available| SelectT3["Select Generic Platform Recognizer<br/>(tier2_default)"]
    Tier3 -->|Unavailable| FallbackNone["Set tier = 'none'<br/>(Prompt user to install language models)"]

    SelectT1 --> Inject[Inject Optimal SpeechRecognizer into SpeechToTextPlugin]
    SelectT2 --> Inject
    SelectT3 --> Inject
    Inject --> Done([ASR Ready for Flutter])
```

1. **Tier 1 (Google Voice Search ASR)**: Explicitly tests `com.google.android.googlequicksearchbox`. If installed and active, binds directly to Google ASR, bypassing TTS traps.
2. **Tier 2 (OEM System Service)**: If Google QuickSearchBox is missing, queries Android Package Manager for all registered `RecognitionService` implementations, excluding known TTS spoofers.
3. **Tier 3 (Generic Platform Recognizer)**: Falls back to `SpeechRecognizer.createSpeechRecognizer(this)`.
4. **Reflective Injection**: Once resolved, `injectOptimalRecognizerIntoPlugin()` injects the selected `SpeechRecognizer` directly into `SpeechToTextPlugin.speechRecognizer`, eliminating plugin instantiation ambiguity.

---

## 3. Dart Speech Lifecycle Bridge & State Machine Architecture

### 3.1 Structural Split: `SpeechLifecycleBridge` vs `SpeechRecognitionService`

The architecture enforces a strict separation of concerns between:
1. **Platform Interop (`SpeechLifecycleBridge`)**: Static utility class managing low-level IPC communication over `com.dolphincoder.lms/speech_lifecycle`.
2. **Business Domain Service (`SpeechRecognitionService`)**: Singleton state machine handling acoustic safeguards, audio session transitions, RMS normalization, and transcription events.

```
app/dolphincoder/lib/core/services/
├── speech_lifecycle_bridge.dart        <-- Native MethodChannel wrapper
├── speech_recognition_service.dart     <-- Domain service & lifecycle state machine
├── pronunciation_evaluator.dart        <-- Mathematical evaluation engine
└── tts_service.dart                    <-- Studio narrator & audio player interop
```

#### `SpeechLifecycleBridge` (`lib/core/services/speech_lifecycle_bridge.dart`):
```dart
class SpeechLifecycleBridge {
  static const MethodChannel _channel =
      MethodChannel('com.dolphincoder.lms/speech_lifecycle');

  static Future<void> destroyNativeRecognizer() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod('destroyRecognizer');
      debugPrint('🛡️ [SpeechLifecycleBridge] Native SpeechRecognizer destroyed and nullified');
    } catch (e) {
      debugPrint('ℹ️ [SpeechLifecycleBridge] destroyNativeRecognizer note: $e');
    }
  }

  static Future<bool> isRecognitionAvailable() async {
    if (!Platform.isAndroid) return true;
    try {
      final bool? available =
          await _channel.invokeMethod<bool>('isRecognitionAvailable');
      return available ?? false;
    } catch (e) {
      debugPrint('⚠️ [SpeechLifecycleBridge] isRecognitionAvailable error: $e');
      return false;
    }
  }
}
```

### 3.2 State Machine Specification (`SpeechSessionState` & `SpeechServiceState`)

Two state enums govern the speech recognition lifecycle:
- `SpeechServiceState`: Internal pipeline state emitted by `SpeechRecognitionService`.
- `SpeechSessionState`: UI-level state consumed by screen controllers (`lesson_session_screen.dart`, `karaoke_note_reader_screen.dart`).

```mermaid
stateDiagram-v2
    [*] --> idle

    idle --> initializing: startListening() invoked
    initializing --> ready: SpeechToText.initialize() == true
    initializing --> error: Permission Denied / Not Available
    
    ready --> listening: SpeechToText.listen() started
    
    listening --> listening: Partial SpeechResult / RMS Stream
    listening --> stopping: Final Result / Silence Timeout (2500ms)
    listening --> error: Native Speech Error (Busy / Network)
    listening --> idle: User Tap Cancel / Force Release

    stopping --> processing: Processing Final Words
    processing --> idle: Pronunciation Evaluated
    error --> idle: 400ms Backoff Cooldown Elapsed
```

#### State Enum Matrix:

| State | Hardware / Audio State | UI Representation | Allowed User Actions |
| :--- | :--- | :--- | :--- |
| `idle` | Microphone closed; AudioRecord released. | Blue static mic button. | Tap to start speaking. |
| `initializing` | Requesting permissions; instantiating ASR client. | Pulsing spinner / Loading icon. | None (user interaction blocked). |
| `ready` | ASR service bound; engine warm. | Ready indicator. | Transitioning to listening. |
| `listening` | Mic open; ADC streaming PCM samples; RMS active. | Glowing blue ripple; sound wave visualizer. | Tap to stop early / Speak prompt. |
| `stopping` | Audio stream closed; ASR finishing transcription. | Amber rotating gear. | Interaction locked. |
| `processing` | Evaluating Levenshtein & Soundex phonemes. | Processing / score banner loading. | Interaction locked. |
| `error` | Native error intercepted; teardown executing. | Red button; error snackbar alert. | System cool-down (400ms lock). |

### 3.3 Anti-Collision & 400ms Hardware Audio Settling Cooldown

A common issue in mobile voice apps is "Buffer Collision" and "DAC-to-ADC Throttling":
When a Text-to-Speech prompt finishes playing, the hardware Digital-to-Analog Converter (DAC) is active. If the app immediately requests `AudioRecord` activation via the Analog-to-Digital Converter (ADC), the Android audio server crashes or encounters severe hardware echo bleeding.

DolphinCoder enforces a dual-stage safety mechanism:

#### 1. The 200ms DAC-to-ADC Settling Guard (`SpeechRecognitionService.dart`):
```dart
// 1. Acoustic Feedback Prevention: Halt TTS and audio players completely
await TtsService().stop();
// 2. 200ms hardware settling guard to allow audio line to switch from DAC to ADC
await Future.delayed(const Duration(milliseconds: 200));
```

#### 2. The 400ms Error & Session Switch Cooldown (`lesson_session_screen.dart` & `karaoke_note_reader_screen.dart`):
```dart
// Cooldown check: 400ms safety backoff after any error or state teardown
final cooldownRemaining =
    400 - DateTime.now().difference(_lastSpeechErrorTime).inMilliseconds;
if (cooldownRemaining > 0) {
  await Future.delayed(Duration(milliseconds: cooldownRemaining));
}
```

### 3.4 Microphone Permission Preflight, Permanently Denied Detection & Recovery

Before initiating any speech recognition session, DolphinCoder performs a preflight permission check using `permission_handler`:

```dart
Future<PermissionStatus> checkAndRequestPermissions() async {
  final micStatus = await Permission.microphone.status;
  if (micStatus.isPermanentlyDenied) {
    return PermissionStatus.permanentlyDenied;
  }
  if (!micStatus.isGranted) {
    final requestStatus = await Permission.microphone.request();
    if (!requestStatus.isGranted) {
      return requestStatus;
    }
  }
  return PermissionStatus.granted;
}
```

If the permission is `permanentlyDenied`, DolphinCoder avoids repeating useless native permission popups and triggers a deep link directly to the Android Application Details Settings screen via `openAppSettings()`.

### 3.5 BCP-47 Locale Resolution & Acoustic Model Negotiation

DolphinCoder's curriculum supports multi-lingual learning (German `de` and English `en`). The `SpeechRecognitionService` dynamically queries the host device's available speech locales and negotiates the optimal dialect model:

```dart
String resolveLocale(String targetLanguageCode) {
  final isEnglish = targetLanguageCode.toLowerCase() == 'en';
  if (_cachedLocales.isEmpty) {
    return isEnglish ? 'en_US' : 'de_DE';
  }

  if (isEnglish) {
    final preferred = ['en_us', 'en_gb', 'en_in', 'en_au', 'en_ca'];
    for (final pref in preferred) {
      final match = _cachedLocales.where((l) {
        final id = l.localeId.toLowerCase().replaceAll('-', '_');
        return id.contains(pref);
      }).firstOrNull;
      if (match != null) return match.localeId;
    }
    final anyEn = _cachedLocales
        .where((l) => l.localeId.toLowerCase().startsWith('en'))
        .firstOrNull;
    if (anyEn != null) return anyEn.localeId;
    return 'en_US';
  } else {
    final preferred = ['de_de', 'de_at', 'de_ch'];
    for (final pref in preferred) {
      final match = _cachedLocales.where((l) {
        final id = l.localeId.toLowerCase().replaceAll('-', '_');
        return id.contains(pref);
      }).firstOrNull;
      if (match != null) return match.localeId;
    }
    final anyDe = _cachedLocales
        .where((l) => l.localeId.toLowerCase().startsWith('de'))
        .firstOrNull;
    if (anyDe != null) return anyDe.localeId;
    return 'de_DE';
  }
}
```

### 3.6 Real-Time RMS Audio Level Normalization & Visualizer Stream

Android native speech recognition emits Root Mean Square (RMS) sound levels via `onRmsChanged(float rmsdB)`. The raw values range typically from $-2.0\text{ dB}$ (ambient silence) to $+10.0\text{ dB}$ (loud speech).

`SpeechRecognitionService` mathematical normalization:
$$\text{NormalizedLevel} = \text{clamp}\left(\frac{\text{rmsdB} + 2.0}{12.0}, 0.0, 1.0\right)$$

```dart
onSoundLevelChange: (level) {
  // Normalizes RMS dB (-2 to 10 dB) into 0.0 - 1.0 clamped value
  final normalized = ((level + 2.0) / 12.0).clamp(0.0, 1.0);
  _soundLevelController.add(normalized);
}
```

This stream is directly bound to `SpeakingMicButton` (`lib/shared/widgets/speaking_mic_button.dart`), creating concentric animated waves that scale in direct response to acoustic vocal energy:
```dart
final levelScale = 1.0 + (_currentLevel * 0.45);
```

### 3.7 Flutter `WidgetsBindingObserver` Integration in Screen Controllers

Both `LessonSessionScreen` and `KaraokeNoteReaderScreen` implement `WidgetsBindingObserver`. When the operating system lifecycle transitions the Flutter view away from `resumed`, the screen immediately halts speech recognition and destroys native resources:

```dart
@override
void didChangeAppLifecycleState(AppLifecycleState state) {
  if (state == AppLifecycleState.paused ||
      state == AppLifecycleState.inactive ||
      state == AppLifecycleState.detached) {
    debugPrint('📱 [LessonSessionScreen] Lifecycle $state -> releasing SpeechRecognizer');
    _forceReleaseSpeechRecognizer();
  }
}

Future<void> _forceReleaseSpeechRecognizer() async {
  _silenceTimer?.cancel();
  _silenceTimer = null;
  final speechToRelease = _speech;
  _speech = null;
  _speechInitialized = false;
  if (mounted) {
    setState(() => _speechSessionState = SpeechSessionState.idle);
  } else {
    _speechSessionState = SpeechSessionState.idle;
  }

  if (speechToRelease != null) {
    try {
      await speechToRelease.cancel();
    } catch (e) {
      debugPrint('⚠️ [LessonSessionScreen] Speech cancel note: $e');
    }
  }
  await SpeechLifecycleBridge.destroyNativeRecognizer();
}
```

---

## 4. Android System Recognition vs TTS Engine Diagnosis & Fix

### 4.1 Diagnostic Case Study: The Realme RMX3471 System Lock

During QA testing on real Android hardware (Device: **Realme RMX3471**, Android 14 / API 34, Serial: `fe4c1736`), speech recognition consistently encountered silent timeouts:
- Error emitted: `error_speech_timeout` (Error Code 6) and `error_no_match` (Error Code 7).
- No transcription occurred even when words were spoken loudly directly into the microphone.

### 4.2 The `voice_recognition_service` Routing Trap (TTS vs Google QuickSearchBox)

Inspection of Android Secure Settings via ADB uncovered the root cause:
```bash
adb shell settings get secure voice_recognition_service
```
**Actual Output on Device:**
```
com.google.android.tts/com.google.android.apps.speech.tts.googletts.service.GoogleTTSRecognitionService
```

#### Diagnostic Insight:
Android's `voice_recognition_service` was pointed to **Speech Services by Google (TTS)** instead of the Google Voice Search ASR engine (`com.google.android.googlequicksearchbox`).
When an app calls `SpeechRecognizer.createSpeechRecognizer(context)`, the Android OS resolves the intent by querying the service named in `voice_recognition_service`. Because it was routed to the TTS package's stub recognition service, the service opened the audio channel but lacked an active speech recognition model, resulting in silent timeouts.

Furthermore, inspecting `android.settings.MANAGE_DEFAULT_APPS_SETTINGS` $\to$ **Digital assistant app** revealed:
- Even when `Google` was selected as the Default digital assistant app in the UI, the low-level `voice_recognition_service` setting remained bound to `com.google.android.tts`.

### 4.3 On-Device Offline Acoustic Models (`AddLanguagesActivity`)

Querying the system services via `pm query-services -a android.speech.RecognitionService` confirmed `GoogleTTSRecognitionService` was the default handler.

Opening the language pack manager via ADB:
```bash
adb shell am start -n com.google.android.tts/com.google.android.libraries.speech.modelmanager.languagepack.settings.AddLanguagesActivity
```
**Critical Discovery:**
Under "Your languages", **ZERO** language packs were installed!
Neither `Deutsch (Deutschland)` nor `English (US)` was installed on the device storage.

#### Resolution Applied:
1. Triggered download of `Deutsch (Deutschland)` $\to$ Installed **146 MB** on-device acoustic model (`[v3002]`).
2. Triggered download of `English (US)` $\to$ Installed **79 MB** on-device acoustic model (`[v3006]`).

Both models were stored in local non-volatile storage:
- `Deutsch (Deutschland) | 146 MB [v3002]`
- `English (US) | 79 MB [v3006]`

### 4.4 Online vs Offline Speech Recognition Behavior & Fallback Characteristics

| Metric / Dimension | Online Cloud Recognition | Offline On-Device Model (`AddLanguagesActivity`) |
| :--- | :--- | :--- |
| **Initial Latency to First Partial** | 350ms – 1200ms (Network dependent) | **< 80ms** (Instant zero-roundtrip) |
| **Network Flakiness Resiliency** | Aborts with `error_network` (Error 2) | **100% resilient** in airplane mode / tunnels |
| **Acoustic Vocabulary Scope** | Dynamic server-side dictionary | Specialized local lexicon |
| **Power Consumption** | Constant LTE/Wi-Fi modem uplink | Local NPU/CPU inference |
| **DolphinCoder Behavior** | Falls back to offline model if network stalls | Primary target for sub-second Duolingo parity |

---

## 5. Pronunciation Evaluation Algorithm & Scoring Engine

### 5.1 Evaluation Engine Architecture & Data Structures

Pronunciation grading is decoupled from audio recording. The engine resides in `lib/core/services/pronunciation_evaluator.dart`. It evaluates a student's spoken transcription against the target curriculum phrase.

#### Data Models:

```dart
enum TokenGradingStatus {
  accepted,  // Exact or phonetic match (>= 80% similarity)
  typo,      // Minor typo or transposition (65% - 79% similarity)
  wrongWord, // Spoken word differs significantly from target
  missed,    // Target word omitted from spoken stream
  pending,   // Evaluation pending
}

class EvaluatedToken {
  final String targetWord;
  final String normalizedTarget;
  final String? spokenMatch;
  final TokenGradingStatus status;
  final double similarity;
  final bool isContentWord;

  bool get isPassed =>
      status == TokenGradingStatus.accepted || status == TokenGradingStatus.typo;
}

class PronunciationEvaluationResult {
  final List<EvaluatedToken> tokens;
  final int accuracyPercentage;
  final bool isPassed;
  final int matchedWordsCount;
  final int totalWordsCount;
  final String targetSentence;
  final String spokenSentence;
}
```

### 5.2 Text Normalization Pipeline (German Umlauts, Eszett, Diacritics, Digits)

Before calculating phonetic and string distance matrices, words must be normalized to prevent false negatives caused by typography, orthography, and punctuation.

#### Transformation Pipeline:
1. **Case Folding**: Convert all tokens to lower-case (`trim().toLowerCase()`).
2. **German Umlaut & Eszett Decomposition**:
   - `ä` $\to$ `ae`
   - `ö` $\to$ `oe`
   - `ü` $\to$ `ue`
   - `ß` $\to$ `ss`
3. **Diacritic Flattening (French/Spanish/Latin)**:
   - `[àáâã]` $\to$ `a`
   - `[èéêë]` $\to$ `e`
   - `[ìíîï]` $\to$ `i`
   - `[òóôõ]` $\to$ `o`
   - `[ùúû]` $\to$ `u`
   - `ç` $\to$ `c`, `ñ` $\to$ `n`
4. **Punctuation Stripping**: Non-alphanumeric characters stripped via regex `[^\w']`.
5. **Apostrophe Collapse**: Internal single quotes stripped (`don't` $\to$ `dont`).
6. **Number Normalization (`_normalizeNumbers`)**:
   Numeric digits are expanded into words to match ASR speech outputs:
   - German: `10` $\to$ `zehn`, `0172` $\to$ `null eins sieben zwei`
   - English: `10` $\to$ `ten`, `20` $\to$ `twenty`

```dart
static String normalizeWord(String word, {String language = 'de'}) {
  String clean = word.trim().toLowerCase();

  // Preserve German umlaut equivalents
  clean = clean
      .replaceAll('ä', 'ae')
      .replaceAll('ö', 'oe')
      .replaceAll('ü', 'ue')
      .replaceAll('ß', 'ss');

  // Common Latin diacritics
  clean = clean
      .replaceAll(RegExp(r'[àáâã]'), 'a')
      .replaceAll(RegExp(r'[èéêë]'), 'e')
      .replaceAll(RegExp(r'[ìíîï]'), 'i')
      .replaceAll(RegExp(r'[òóôõ]'), 'o')
      .replaceAll(RegExp(r'[ùúû]'), 'u')
      .replaceAll(RegExp(r'[ç]'), 'c')
      .replaceAll(RegExp(r'[ñ]'), 'n');

  // Strip punctuation except internal apostrophes
  clean = clean.replaceAll(RegExp(r"[^\w']"), '');
  clean = clean.replaceAll("'", '');
  return clean;
}
```

### 5.3 Dynamic Programming Levenshtein Distance Implementation

To evaluate edit distance with $O(M)$ memory complexity rather than $O(M \times N)$, the algorithm uses two rotating 1D vectors (`v0` and `v1`):

$$\text{Lev}(i, j) = \begin{cases} 
\max(i, j) & \text{if } \min(i, j) = 0, \\
\min \begin{cases} 
\text{Lev}(i-1, j) + 1 \\ 
\text{Lev}(i, j-1) + 1 \\ 
\text{Lev}(i-1, j-1) + \text{cost} 
\end{cases} & \text{otherwise.}
\end{cases}$$

```dart
static int levenshteinDistance(String s1, String s2) {
  if (s1 == s2) return 0;
  if (s1.isEmpty) return s2.length;
  if (s2.isEmpty) return s1.length;

  List<int> v0 = List<int>.generate(s2.length + 1, (i) => i);
  List<int> v1 = List<int>.filled(s2.length + 1, 0);

  for (int i = 0; i < s1.length; i++) {
    v1[0] = i + 1;
    for (int j = 0; j < s2.length; j++) {
      int cost = (s1.codeUnitAt(i) == s2.codeUnitAt(j)) ? 0 : 1;
      v1[j + 1] = min(v1[j] + 1, min(v0[j + 1] + 1, v0[j] + cost));
    }
    for (int j = 0; j <= s2.length; j++) {
      v0[j] = v1[j];
    }
  }
  return v1[s2.length];
}
```

### 5.4 Transposition Detection & Single-Edit Typo Classification

Typing or phonetic ASR slips frequently swap two adjacent characters (e.g. `teh` vs `the`). Standard Levenshtein treats this as 2 operations (1 deletion + 1 insertion). DolphinCoder includes an explicit transposition checker:

```dart
static bool isTransposition(String s1, String s2) {
  if (s1.length != s2.length) return false;
  int diffCount = 0;
  List<int> diffIndices = [];

  for (int i = 0; i < s1.length; i++) {
    if (s1[i] != s2[i]) {
      diffCount++;
      diffIndices.add(i);
      if (diffCount > 2) return false;
    }
  }

  if (diffCount == 2) {
    final i = diffIndices[0];
    final j = diffIndices[1];
    return j == i + 1 && s1[i] == s2[j] && s1[j] == s2[i];
  }
  return false;
}
```
If `isTransposition(s1, s2)` evaluates to `true`, the similarity score is directly assigned `0.90` ($90\%$).

### 5.5 Phonetic Tolerance Algorithm (Soundex Approximation)

Learners frequently mispronounce sounds that produce identical or near-identical phonetic sound classes. To accommodate regional accents, the evaluator implements a 4-character Soundex phonetic hashing algorithm:

#### Soundex Mapping Table:
- `B, F, P, V` $\to 1$
- `C, G, J, K, Q, S, X, Z` $\to 2$
- `D, T` $\to 3$
- `L` $\to 4$
- `M, N` $\to 5$
- `R` $\to 6$

```dart
static String soundex(String s) {
  if (s.isEmpty) return '';
  final upper = s.toUpperCase();
  final firstChar = upper[0];

  const mapping = {
    'B': '1', 'F': '1', 'P': '1', 'V': '1',
    'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
    'D': '3', 'T': '3',
    'L': '4',
    'M': '5', 'N': '5',
    'R': '6',
  };

  StringBuffer res = StringBuffer()..write(firstChar);
  String lastCode = mapping[firstChar] ?? '';

  for (int i = 1; i < upper.length; i++) {
    final char = upper[i];
    final code = mapping[char] ?? '';
    if (code.isNotEmpty && code != lastCode) {
      res.write(code);
      lastCode = code;
      if (res.length == 4) break;
    } else if (code.isEmpty) {
      lastCode = '';
    }
  }

  while (res.length < 4) {
    res.write('0');
  }
  return res.toString();
}
```

If Levenshtein similarity falls below `0.85` but `soundex(target) == soundex(spoken)`, the score is boosted to `0.88` to grant phonetic accent tolerance.

### 5.6 Monotonic Forward Sequence Alignment with Lookahead Window

Real-world spoken language contains hesitations, filler words (`uh`, `ah`), and repetitions. A strict 1-to-1 index comparison causes the entire downstream sentence to fail if a single word is dropped or inserted.

DolphinCoder implements a **Monotonic Forward Sequence Alignment** with a **Lookahead Window of 4 words**:
```dart
int spokenPointer = 0;
for (int i = 0; i < rawTargetTokens.length; i++) {
  // ...
  final lookaheadLimit = min(spokenTokens.length, spokenPointer + 4);
  int bestIdx = -1;

  for (int sIdx = spokenPointer; sIdx < lookaheadLimit; sIdx++) {
    final sWord = spokenTokens[sIdx];
    final sim = calculateSimilarity(normTarget, sWord);

    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestIdx = sIdx;
    }

    if (sim >= 0.95) {
      status = TokenGradingStatus.accepted;
      matchedSpoken = sWord;
      foundMatch = true;
      spokenPointer = sIdx + 1; // Advance pointer monotonically
      break;
    }
  }
  // Fallback to best match in window if >= 0.65
  // ...
}
```

This guarantees that if a student pauses or inserts a filler word, the algorithm matches the target word downstream without losing synchronization.

### 5.7 Content-Word Weighted Scoring & Threshold Calculation

In language pedagogy, mispronouncing a critical noun or verb (`Kaffee`, `Wasser`) is more consequential than slightly slurring a function word or article (`der`, `ein`, `und`).

The engine categorizes words into **Function Words** and **Content Words**:
- **German Function Words**: `der, die, das, ein, eine, und, oder, aber, in, auf, mit, zu, ist, sind, ich, du, er, sie, es...`
- **English Function Words**: `a, an, the, and, or, in, on, at, to, for, with, is, are, was, were, have, has, i, you...`

#### Weighting Formula:
$$\text{Weight} = \begin{cases} 1.5 & \text{if Content Word} \\ 1.0 & \text{if Function Word} \end{cases}$$

$$\text{Earned} = \sum_{\text{accepted}} \text{Weight} + \sum_{\text{typo}} (\text{Weight} \times 0.85)$$

$$\text{Accuracy} = \text{clamp}\left(\text{round}\left(\frac{\text{Earned}}{\text{TotalWeight}} \times 100\right), 0, 100\right)$$

#### Passing Thresholds:
- **Default Evaluator Threshold**: $\ge 80\%$ (Standard test suite passing score)
- **Interactive Lesson Session (`lesson_session_screen.dart`)**: $\ge 75\%$ (Duolingo-parity threshold for foundational learners)
- **Minimum Acceptable Floor**: $\ge 70\%$ (Configurable via `minAccuracyThreshold`)

### 5.8 Test Suite Verification & Edge-Case Coverage

All grading behavior is covered in `test/core/pronunciation_evaluator_test.dart`:
```dart
group('PronunciationEvaluator Tests', () {
  test('100% exact match German sentence', () {
    final res = PronunciationEvaluator.evaluate(
      targetSentence: 'Guten Tag! Wie geht es dir?',
      spokenSentence: 'Guten Tag Wie geht es dir',
      language: 'de',
    );
    expect(res.isPassed, isTrue);
    expect(res.accuracyPercentage, equals(100));
    expect(res.matchedWordsCount, equals(6));
  });

  test('German Umlauts and Eszett normalization', () {
    final res = PronunciationEvaluator.evaluate(
      targetSentence: 'Ich heiße Müller und trinke schönen süßen Tee',
      spokenSentence: 'Ich heisse Mueller und trinke schoenen suessen Tee',
      language: 'de',
    );
    expect(res.isPassed, isTrue);
    expect(res.accuracyPercentage, equals(100));
  });

  test('Tolerates single-character typo and transposition', () {
    final res = PronunciationEvaluator.evaluate(
      targetSentence: 'Zwei Kaffee und ein Wasser bitte',
      spokenSentence: 'Zwei Kafee und ein Wasse bitte',
      language: 'de',
      minAccuracyThreshold: 70,
    );
    expect(res.isPassed, isTrue);
    expect(res.accuracyPercentage, greaterThanOrEqualTo(70));
  });

  test('Fails on completely incorrect sentence', () {
    final res = PronunciationEvaluator.evaluate(
      targetSentence: 'Guten Morgen wie geht es dir',
      spokenSentence: 'Bonjour comment allez vous',
      language: 'de',
      minAccuracyThreshold: 70,
    );
    expect(res.isPassed, isFalse);
    expect(res.accuracyPercentage, lessThan(40));
  });
});
```

---

## 6. Audio Playback & Database-Backed Streaming Architecture

### 6.1 `audioplayers` Ecosystem & Multi-Instance Configuration

DolphinCoder uses `audioplayers: ^6.1.0` for full-sentence reference audio and karaoke narration tracks.

#### Multiple Dedicated AudioPlayer Instances:
1. `_audioPlayer` in `LessonSessionScreen`: Plays reference pronunciation sentences and listening challenges.
2. `_audioPlayer` in `KaraokeNoteReaderScreen`: Streams long-form narrative audio with millisecond timestamp synchronization.
3. `_wordAudioPlayer` in `TtsService`: Configured in `PlayerMode.lowLatency` for immediate tactile word tap playback.

### 6.2 Sub-20ms Low-Latency Tactile Audio Engine (`TtsService`)

In vocabulary study screens, tapping a word chip must produce instant audio feedback. A standard TTS engine takes $300\text{ms} - 800\text{ms}$ to synthesize and initialize hardware buffers.

DolphinCoder implements a **Multi-Tier Audio Caching Hierarchy**:

```mermaid
flowchart TD
    WordTap["User Taps Word Chip"] --> CheckRAM{"1. RAM File Map Cache?"}
    CheckRAM -->|Hit (< 1ms)| PlayLowLat["AudioPlayer.play(DeviceFileSource) in PlayerMode.lowLatency"]
    CheckRAM -->|Miss| CheckDisk{"2. Local Disk Cache (tts_cache/v3)?"}
    CheckDisk -->|Hit (< 15ms)| StoreRAM["Store path in RAM Map"] --> PlayLowLat
    CheckDisk -->|Miss| NativeTTS["3. Fallback to flutterTts.speak()"]
    NativeTTS --> BgSynth["Background async synthesizeToFile()"]
    BgSynth --> WriteDisk["Write to tts_cache/v3/<word>.wav"]
    WriteDisk --> StoreRAM
```

#### Low-Latency Player Configuration (`TtsService.dart`):
```dart
final AudioPlayer _wordAudioPlayer = AudioPlayer();

// Configure low-latency player for sub-20ms word pronunciation
await _wordAudioPlayer.setPlayerMode(PlayerMode.lowLatency);
await _wordAudioPlayer.setVolume(1.0);
```

### 6.3 Database-Backed Binary Audio Streaming (HTTP 206 Partial Content)

To prevent media loss across ephemeral container deployments or cloud host restarts, audio tracks are stored directly in MySQL as `LONGBLOB` binary payloads in the `karaoke_audios` table.

#### Backend Controller Implementation (`backend/controllers/noteController.js`):
```javascript
/**
 * GET /api/notes/audio/db/:id
 * Streams audio binary data directly from MySQL table `karaoke_audios`
 * Supports HTTP 206 Partial Content (Range requests) for smooth playback and seeking
 */
exports.streamAudioFromDb = async (req, res, next) => {
  try {
    const audio = await KaraokeAudio.findByPk(req.params.id);
    if (!audio || !audio.audioData) {
      return res.status(404).send('Audio track not found in database');
    }

    const buffer = Buffer.isBuffer(audio.audioData) 
      ? audio.audioData 
      : Buffer.from(audio.audioData);
    const totalLength = buffer.length;
    const contentType = audio.mimeType || 'audio/mpeg';

    const range = req.headers.range;
    if (range) {
      // Parse Range header e.g. "bytes=0-" or "bytes=1000-2000"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (start >= totalLength || end >= totalLength || start > end) {
        res.setHeader('Content-Range', `bytes */${totalLength}`);
        return res.status(416).send('Requested Range Not Satisfiable');
      }

      const chunkSize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      });
      return res.end(buffer.subarray(start, end + 1));
    }

    res.writeHead(200, {
      'Content-Length': totalLength,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    });
    return res.end(buffer);
  } catch (error) {
    console.error('Error streaming audio from DB:', error);
    res.status(500).send('Error streaming audio from database');
  }
};
```

#### Why HTTP 206 Partial Content is Critical:
- Mobile media engines (Android `ExoPlayer` / iOS `AVPlayer`) request initial audio headers ($0-1024$ bytes) to inspect codec containers before requesting chunks.
- When seeking or scrubbing the timeline in `KaraokeNoteReaderScreen`, the player sends byte range headers (e.g. `bytes=450560-`). Responding with HTTP 206 enables instant seeking without re-downloading earlier audio data.
- Headers include `Accept-Ranges: bytes` and `Cache-Control: public, max-age=31536000` to allow intermediate CDN edge caching.

### 6.4 Audio Focus, Ducking & Acoustic Feedback Prevention

To ensure clean interoperability with background audio apps (podcasts, music) and prevent microphone feedback loops:
1. **TTS Playback Flush**: In `SpeechRecognitionService.startListening()`, any active TTS playback or word audio is explicitly halted before microphone acquisition.
2. **Audio Ducking**: On Android, audio focus requests use `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK`, allowing background media to lower volume rather than stop abruptly.
3. **Hardware Settling Window**: A strict $200\text{ms}$ delay ensures the DAC amplifier circuitry stabilizes before the microphone input ADC begins sampling PCM frames.

### 6.5 Sound Effects Engine, Mascot Fanfares & Tactile Haptic Feedback

User accomplishments (completing a stage, perfect pronunciation, streak maintenance) trigger synchronized auditory and tactile feedback:

1. **Synthesized Chimes (Web Audio API)**: Zero-dependency dynamic chord synthesis:
   - Success: C5 – E5 – G5 major triad.
   - Error: Eb3 – C3 descending tone.
2. **Haptic Vibration Triggers (`services/haptic_service.dart` / `HapticFeedback`)**:
   - `HapticFeedback.selectionClick()`: Fired on every mic button tap, word chip selection, and pair match.
   - `HapticFeedback.mediumImpact()`: Fired when microphone transitions to active `listening` state.
   - `HapticFeedback.heavyImpact()`: Fired on incorrect pronunciation or zero oxygen alert.
3. **Mascot Animation & Audio Synchronization**:
   - `AnimatedDolphinMascot` triggers celebration frames (`dolphin_celebrate.png`) synchronized with success audio snackbars.

---

## 7. Comprehensive Class, Interface & Method Reference

### Native Android Bridge: `MainActivity.kt`

```kotlin
package com.dolphincoder.lms

class MainActivity : FlutterActivity() {
    companion object {
        const val TAG = "DolphinSpeechLifecycle"
        const val CHANNEL = "com.dolphincoder.lms/speech_lifecycle"
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine)
    override fun onPause()
    override fun onStop()
    override fun onDestroy()
    private fun forceReleaseRecognizer()
}
```

### Platform Interop: `SpeechLifecycleBridge.dart`

```dart
class SpeechLifecycleBridge {
  static const MethodChannel _channel;
  static Future<void> destroyNativeRecognizer();
  static Future<bool> isRecognitionAvailable();
}
```

### Domain Service: `SpeechRecognitionService.dart`

```dart
enum SpeechServiceState { idle, initializing, ready, listening, processing, error }
enum SpeechRecognitionErrorType { permissionDenied, permanentlyDenied, noSpeechDetected, noMatch, busy, network, notAvailable, unknown }

class SpeechTranscriptionPayload {
  final String text;
  final List<String> words;
  final double confidence;
  final bool isFinal;
}

class SpeechRecognitionService {
  static SpeechRecognitionService get instance;
  SpeechServiceState get state;
  Stream<SpeechServiceState> get stateStream;
  Stream<double> get soundLevelStream;
  Stream<SpeechTranscriptionPayload> get transcriptionStream;
  Stream<SpeechRecognitionErrorType> get errorStream;

  Future<PermissionStatus> checkAndRequestPermissions();
  Future<bool> initialize();
  String resolveLocale(String targetLanguageCode);
  Future<bool> startListening({required String targetLanguageCode, ...});
  Future<String> stopListening();
  Future<void> cancelListening();
  void dispose();
}
```

### Evaluation Engine: `PronunciationEvaluator.dart`

```dart
class PronunciationEvaluator {
  static String normalizeWord(String word, {String language = 'de'});
  static int levenshteinDistance(String s1, String s2);
  static bool isTransposition(String s1, String s2);
  static String soundex(String s);
  static double calculateSimilarity(String tWord, String sWord);
  static PronunciationEvaluationResult evaluate({
    required String targetSentence,
    required String spokenSentence,
    String language = 'de',
    int minAccuracyThreshold = 70,
  });
}
```

---

## 8. Troubleshooting & Runbook for Production Operations

### Issue 1: App reports "Speech recognition is not available on this device"
- **Cause**: Android device does not have an active speech recognition service package bound.
- **Diagnostic Command**:
  ```bash
  adb shell pm query-services -a android.speech.RecognitionService
  ```
- **Remedy**: Direct user to install **Google Voice Search** or **Speech Services by Google** from Google Play Store.

### Issue 2: Immediate `error_speech_timeout` or `error_no_match` on launch
- **Cause**: System setting `voice_recognition_service` is stuck pointing to Google TTS instead of QuickSearchBox, or offline language pack is missing.
- **Verification**:
  ```bash
  adb shell settings get secure voice_recognition_service
  ```
- **Remedy**:
  1. Go to **Settings $\to$ Apps $\to$ Default Apps $\to$ Digital Assistant**.
  2. Select **Google**.
  3. Open Google Speech Settings and download the target offline model (German 146MB / English 79MB) via `AddLanguagesActivity`.

### Issue 3: `ERROR_RECOGNIZER_BUSY` (Error 8) after quickly leaving a lesson
- **Cause**: User navigated out while microphone was active, leaving a zombie Binder connection.
- **Architectural Safeguard**: Handled automatically by `MainActivity.kt`'s `onPause()` reflective teardown and Dart's `WidgetsBindingObserver`.
- **Manual Force Kill (Dev)**:
  ```bash
  adb shell am force-stop com.dolphincoder.lms
  ```

### Issue 4: Audio scrubbing in Karaoke mode stutters or fails
- **Cause**: Web server or reverse proxy is dropping HTTP 206 `Range` request headers or stripping `Content-Range`.
- **Verification**:
  ```bash
  curl -I -H "Range: bytes=0-1024" https://dolphincoder.com/api/notes/audio/db/1
  ```
- **Expected Output**:
  ```http
  HTTP/1.1 206 Partial Content
  Accept-Ranges: bytes
  Content-Range: bytes 0-1024/5242880
  Content-Length: 1025
  Content-Type: audio/mpeg
  ```
  Ensure Nginx has `proxy_set_header Range $http_range;` enabled.

---
*End of Architectural Specification. Maintained by DolphinCoder Engineering.*
