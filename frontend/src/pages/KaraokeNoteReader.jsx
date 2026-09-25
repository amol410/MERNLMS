import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import demoStory from '../data/demoKaraokeStory.json';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, ChevronLeft,
  Music, Sparkles, BookOpen, Clock, Eye, EyeOff, Upload,
  FileText, Download, Sliders, Link2,
  Mic, MicOff, Check, CheckCircle2, Headphones, RefreshCw, XCircle, ChevronRight, Award
} from 'lucide-react';
import clsx from 'clsx';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { downloadKaraokeTemplate, normalizeKaraokeJson } from '../utils/downloadKaraokeTemplate';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Native Web Audio Chimes & German Pronunciation Evaluation Helpers ──────

function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord arpeggio
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
    });
  } catch (e) {}
}

function playRetrySound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, ctx.currentTime);
    osc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function cleanGermanWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»„“]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isFuzzyGermanMatch(w1, w2) {
  if (w1 === w2) return true;
  if (Math.abs(w1.length - w2.length) <= 1) {
    let diff = 0;
    const minLen = Math.min(w1.length, w2.length);
    for (let i = 0; i < minLen; i++) {
      if (w1[i] !== w2[i]) diff++;
    }
    return diff <= 1;
  }
  return false;
}

function evaluatePronunciation(targetText, spokenText) {
  const targetWords = cleanGermanWords(targetText);
  const spokenWords = cleanGermanWords(spokenText);

  if (targetWords.length === 0) return { accuracy: 100, isMatch: true, wordStatus: [] };
  if (spokenWords.length === 0) return { accuracy: 0, isMatch: false, wordStatus: [] };

  let matchCount = 0;
  const wordStatus = targetWords.map((tWord) => {
    const isMatched = spokenWords.some(sWord => isFuzzyGermanMatch(tWord, sWord));
    if (isMatched) matchCount++;
    return { word: tWord, matched: isMatched };
  });

  const accuracy = Math.round((matchCount / targetWords.length) * 100);
  const isMatch = accuracy >= 75;

  return {
    accuracy,
    isMatch,
    wordStatus,
    targetWords,
    spokenWords,
  };
}

// Safely normalize vocabulary definitions whether they are strings or { word, meaning, type } objects
function getVocabItemInfo(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    return { meaning: val, type: null };
  }
  if (typeof val === 'object') {
    return {
      meaning: val.meaning || val.translation || val.definition || val.def || val.word || '',
      type: val.type || null,
    };
  }
  return { meaning: String(val), type: null };
}

// Ensure relative audio paths route through the API streaming endpoint on shared hosting
function resolveAudioUrl(url) {
  if (!url || typeof url !== 'string') return '/audio/demo_german_story.mp3';
  const trimmed = url.trim();
  if (!trimmed) return '/audio/demo_german_story.mp3';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (clean.startsWith('/uploads/audio/')) {
    const filename = clean.replace('/uploads/audio/', '');
    return `/api/notes/audio/${filename}`;
  }
  return clean;
}

export default function KaraokeNoteReader({ noteId, noteData, onAudioUpdated }) {
  const navigate = useNavigate();
  const [localStory, setLocalStory] = useState(null);
  const story = localStory || noteData || demoStory;

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonImportRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(parseFloat(story.duration) || 42.35);

  // Default to 0.75 pace if note is configured for Sprechen, otherwise 1.0
  const defaultIsSprechen = Boolean(
    story.isSprechen || 
    story.karaokeData?.isSprechen || 
    (typeof story.karaokeData === 'string' && story.karaokeData.includes('"isSprechen":true'))
  );
  const [isSprechenMode, setIsSprechenMode] = useState(defaultIsSprechen);
  const [playbackRate, setPlaybackRate] = useState(() => (defaultIsSprechen ? 0.75 : 1.0));
  const [timingOffset, setTimingOffset] = useState(0); // Offset in seconds (-2.0 to +2.0)
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [hoveredVocab, setHoveredVocab] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(() => resolveAudioUrl(story.audioUrl));
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [importingJson, setImportingJson] = useState(false);

  // ─── Sprechen Interactive Speaking State ─────────────────────────────────────
  const [sprechenSentenceIndex, setSprechenSentenceIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speechResult, setSpeechResult] = useState(null);
  const [sentenceChances, setSentenceChances] = useState({});
  const [sentencePassed, setSentencePassed] = useState({});

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentSpokenTextRef = useRef('');
  const isSubmittingRef = useRef(false);
  const activeSpeechTargetRef = useRef({ text: '', index: -1 });
  const lastPausedSentenceRef = useRef(-1);
  const isSprechenModeRef = useRef(isSprechenMode);
  const isPlayingRef = useRef(isPlaying);
  const activeSentenceIndexRef = useRef(-1);
  const sentencesRef = useRef([]);
  const timingOffsetRef = useRef(timingOffset);

  useEffect(() => {
    isSprechenModeRef.current = isSprechenMode;
  }, [isSprechenMode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    timingOffsetRef.current = timingOffset;
  }, [timingOffset]);

  useEffect(() => {
    if (audioRef.current && defaultIsSprechen) {
      audioRef.current.playbackRate = 0.75;
    }
  }, [defaultIsSprechen]);

  // ─── Dedicated Karaoke Listening & Practice Tracking ────────────────────────
  const listeningSecsRef = useRef(0);
  const playStartRef = useRef(null);
  const activeTabStartRef = useRef(Date.now());
  const engagementSecsRef = useRef(0);
  const hasTrackedRef = useRef(false);

  const handleAudioPlay = () => {
    setIsPlaying(true);
    setAudioError(false);
    if (playStartRef.current === null) {
      playStartRef.current = Date.now();
    }
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
    if (playStartRef.current !== null) {
      listeningSecsRef.current += Math.round((Date.now() - playStartRef.current) / 1000);
      playStartRef.current = null;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (playStartRef.current !== null) {
      listeningSecsRef.current += Math.round((Date.now() - playStartRef.current) / 1000);
      playStartRef.current = null;
    }
  };

  useEffect(() => {
    activeTabStartRef.current = Date.now();

    const onVisibility = () => {
      if (document.hidden) {
        if (activeTabStartRef.current !== null) {
          engagementSecsRef.current += Math.round((Date.now() - activeTabStartRef.current) / 1000);
          activeTabStartRef.current = null;
        }
        if (playStartRef.current !== null) {
          listeningSecsRef.current += Math.round((Date.now() - playStartRef.current) / 1000);
          playStartRef.current = null;
        }
      } else {
        activeTabStartRef.current = Date.now();
        if (audioRef.current && !audioRef.current.paused) {
          playStartRef.current = Date.now();
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    const sendTracking = () => {
      if (hasTrackedRef.current) return;

      if (playStartRef.current !== null) {
        listeningSecsRef.current += Math.round((Date.now() - playStartRef.current) / 1000);
        playStartRef.current = null;
      }
      if (activeTabStartRef.current !== null) {
        engagementSecsRef.current += Math.round((Date.now() - activeTabStartRef.current) / 1000);
        activeTabStartRef.current = null;
      }

      const lSecs = listeningSecsRef.current;
      const eSecs = engagementSecsRef.current;
      const effectiveSecs = Math.max(lSecs, eSecs);

      // Only save if practiced or listened for at least 15 seconds
      if (effectiveSecs < 15) return;
      hasTrackedRef.current = true;

      const trackTargetId = noteId || 'demo';
      const payload = {
        engagementSecs: effectiveSecs,
        listeningSecs: lSecs,
        isKaraoke: true,
      };

      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const base = import.meta.env.VITE_API_BASE_URL || '/api';
      const beaconSent = navigator.sendBeacon
        ? navigator.sendBeacon(`${base}/notes/${trackTargetId}/track`, blob)
        : false;

      if (!beaconSent) {
        api.post(`/notes/${trackTargetId}/track`, payload).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', sendTracking);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', sendTracking);
      sendTracking();
    };
  }, [noteId]);

  const activeSentenceRef = useRef(null);
  const autoScrollEnabled = useRef(true);

  useEffect(() => {
    const resolved = resolveAudioUrl(story.audioUrl);
    setCurrentAudioUrl(resolved);
    setAudioError(false);
  }, [story.audioUrl]);

  const sentences = Array.isArray(story.sentences) ? story.sentences : [];
  const allWords = (Array.isArray(story.words) && story.words.length > 0)
    ? story.words
    : (sentences.flatMap(s => s?.words || []) || []);

  const displaySubject = (typeof story.subject === 'object' ? story.subject?.name : story.subject) || 'German';
  const displayTopic = (typeof story.topic === 'object' ? story.topic?.name : story.topic) || 'Reading Practice';

  // Apply real-time timing offset
  const effectiveTime = Math.max(currentTime + timingOffset, 0);

  // Determine active sentence and active word based on effectiveTime
  const activeSentenceIndex = sentences.findIndex(
    s => effectiveTime >= s.start && effectiveTime <= s.end + 0.3
  );

  useEffect(() => {
    activeSentenceIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  useEffect(() => {
    sentencesRef.current = sentences;
  }, [sentences]);

  const activeWord = allWords.find(
    w => effectiveTime >= w.start && effectiveTime <= w.end
  );

  // Auto-scroll to active sentence
  useEffect(() => {
    if (activeSentenceRef.current && autoScrollEnabled.current && isPlaying) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSentenceIndex, isPlaying]);

  // Audio time update handler
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    // Auto-pause at the end of sentence when in Sprechen (Speaking Practice) Mode
    if (isSprechenModeRef.current && isPlayingRef.current) {
      const effTime = Math.max(time + (timingOffsetRef.current || 0), 0);
      const sList = sentencesRef.current;
      const currIdx = activeSentenceIndexRef.current >= 0
        ? activeSentenceIndexRef.current
        : sList.findIndex(s => effTime >= s.start && effTime < s.end);

      if (currIdx >= 0 && sList[currIdx]) {
        const sentence = sList[currIdx];
        if (effTime >= sentence.end) {
          if (lastPausedSentenceRef.current !== currIdx) {
            lastPausedSentenceRef.current = currIdx;
            audioRef.current.pause();
            handleAudioPause();
            setSprechenSentenceIndex(currIdx);
          }
        }
      }
    }
  }, []);

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
      setAudioError(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      handleAudioPause();
    } else {
      audioRef.current.play().then(() => {
        handleAudioPlay();
      }).catch(err => {
        console.error('Audio play error:', err);
        setAudioError(true);
      });
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const jumpToWord = (wordStartTime) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = wordStartTime;
    setCurrentTime(wordStartTime);
    if (!isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setAudioError(false);
      }).catch(() => {
        setAudioError(true);
      });
    }
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Speech recognition cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const cleanupListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleAutoSubmit = () => {
    if (isSubmittingRef.current) return;
    const spoken = currentSpokenTextRef.current.trim();
    if (!spoken) return;

    isSubmittingRef.current = true;
    cleanupListening();

    const { text, index } = activeSpeechTargetRef.current;
    if (index >= 0) {
      evaluateSentenceSpoken(text, spoken, index);
    }
  };

  const handleManualSubmit = (targetSentenceText, sIdx) => {
    if (isSubmittingRef.current) return;
    const spoken = currentSpokenTextRef.current.trim();
    if (!spoken) {
      toast('Please speak first before submitting!', { icon: '🎙️' });
      return;
    }

    isSubmittingRef.current = true;
    cleanupListening();

    evaluateSentenceSpoken(targetSentenceText, spoken, sIdx);
  };

  const stopListening = () => {
    cleanupListening();
    toast('Voice recognition stopped.', { icon: '⏹️' });
  };

  const startListening = (targetSentenceText, sIdx) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    cleanupListening();

    isSubmittingRef.current = false;
    currentSpokenTextRef.current = '';
    activeSpeechTargetRef.current = { text: targetSentenceText, index: sIdx };

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE'; // Native German language recognition
    recognition.interimResults = true;
    recognition.continuous = true; // Continuous listening prevents premature pause cutoffs
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setSpokenText('');
    setSpeechResult(null);

    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(() => {
        // Auto-submit after 3 seconds of continuous silence
        handleAutoSubmit();
      }, 3000);
    };

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const spoken = (final + interim).trim();
      currentSpokenTextRef.current = spoken;
      setSpokenText(spoken);

      // Reset the 3-second silence timer whenever speech is captured
      if (spoken.length > 0) {
        resetSilenceTimer();
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition status:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission was denied. Please allow microphone access in your browser.');
        cleanupListening();
      } else if (event.error === 'no-speech') {
        // No speech detected yet; let user continue speaking
      }
    };

    recognition.onend = () => {
      // If recognition ended unexpectedly but speech was detected, auto-submit
      if (!isSubmittingRef.current && currentSpokenTextRef.current.trim()) {
        handleAutoSubmit();
      } else if (!isSubmittingRef.current) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const evaluateSentenceSpoken = (targetText, spoken, sIdx) => {
    const result = evaluatePronunciation(targetText, spoken);
    setSpeechResult(result);

    const currentChances = sentenceChances[sIdx] !== undefined ? sentenceChances[sIdx] : 3;

    if (result.isMatch) {
      playCelebrationSound();
      setSentencePassed(prev => ({ ...prev, [sIdx]: true }));
      toast.success('Ausgezeichnet! Great pronunciation! 🎉');

      setTimeout(() => {
        if (sIdx + 1 < sentences.length) {
          playSentence(sIdx + 1);
        }
      }, 1600);
    } else {
      playRetrySound();
      const newChances = currentChances - 1;
      setSentenceChances(prev => ({ ...prev, [sIdx]: newChances }));

      if (newChances <= 0) {
        toast.error('3 attempts completed. Let\'s move forward or listen again!', { duration: 3000 });
      } else {
        toast.error(`Not quite right (${result.accuracy}%). ${newChances} chance${newChances === 1 ? '' : 's'} remaining!`);
      }
    }
  };

  const playSentence = (sIdx) => {
    if (!audioRef.current || !sentences[sIdx]) return;
    cleanupListening();
    const targetSentence = sentences[sIdx];
    lastPausedSentenceRef.current = -1;
    audioRef.current.currentTime = targetSentence.start;
    setCurrentTime(targetSentence.start);
    setSprechenSentenceIndex(null);
    setSpeechResult(null);
    setSpokenText('');
    audioRef.current.play().then(() => {
      handleAudioPlay();
    }).catch(() => {
      setAudioError(true);
    });
  };

  const handleRestartSentencePractice = (sIdx) => {
    cleanupListening();
    setSentenceChances(prev => ({ ...prev, [sIdx]: 3 }));
    setSentencePassed(prev => ({ ...prev, [sIdx]: false }));
    setSpeechResult(null);
    setSpokenText('');
    playSentence(sIdx);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setAudioError(false);
      }).catch(() => {
        setAudioError(true);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Upload or replace audio on this note directly
  const handleUploadAudio = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      if (noteId) {
        formData.append('noteId', noteId);
      }
      const res = await api.post('/notes/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data?.audioUrl;
      if (newUrl) {
        const resolved = resolveAudioUrl(newUrl);
        const updatedStory = {
          ...story,
          audioUrl: newUrl,
        };
        if (noteId) {
          await api.put(`/notes/${noteId}`, {
            audioUrl: newUrl,
            karaokeData: updatedStory,
          });
        }
        setLocalStory(updatedStory);
        setCurrentAudioUrl(resolved);
        setAudioError(false);
        if (onAudioUpdated) onAudioUpdated(newUrl);
        toast.success('Audio file permanently saved in database!');
        if (audioRef.current) {
          audioRef.current.src = resolved;
          audioRef.current.load();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload audio file');
    } finally {
      setUploadingAudio(false);
    }
  };

  // Directly link any external or cloud-hosted audio URL (e.g. S3, Cloudinary, Drive)
  const handleLinkAudioUrl = async () => {
    const currentInput = (currentAudioUrl && !currentAudioUrl.includes('demo_german_story')) ? currentAudioUrl : '';
    const input = window.prompt(
      'Enter audio stream URL (MP3/WAV/AAC/OGG from Cloudinary, S3, or direct link):',
      currentInput
    );
    if (!input || !input.trim()) return;
    const cleanUrl = input.trim();
    const resolved = resolveAudioUrl(cleanUrl);
    const updatedStory = {
      ...story,
      audioUrl: cleanUrl,
    };
    if (noteId) {
      try {
        await api.put(`/notes/${noteId}`, {
          audioUrl: cleanUrl,
          karaokeData: updatedStory,
        });
      } catch (err) {
        console.error(err);
      }
    }
    setLocalStory(updatedStory);
    setCurrentAudioUrl(resolved);
    setAudioError(false);
    if (onAudioUpdated) onAudioUpdated(cleanUrl);
    toast.success('Audio URL linked and saved successfully!');
    if (audioRef.current) {
      audioRef.current.src = resolved;
      audioRef.current.load();
    }
  };

  // Switch to the built-in German demo audio
  const handleUseDemoAudio = async () => {
    const demoAudio = '/audio/demo_german_story.mp3';
    const updatedStory = {
      ...story,
      audioUrl: demoAudio,
    };
    if (noteId) {
      try {
        await api.put(`/notes/${noteId}`, {
          audioUrl: demoAudio,
          karaokeData: updatedStory,
        });
      } catch (e) {
        console.error(e);
      }
    }
    setLocalStory(updatedStory);
    setCurrentAudioUrl(demoAudio);
    setAudioError(false);
    if (onAudioUpdated) onAudioUpdated(demoAudio);
    toast.success('Switched to built-in German demo audio!');
    if (audioRef.current) {
      audioRef.current.src = demoAudio;
      audioRef.current.load();
    }
  };

  // Import JSON Alignment directly onto this note WITHOUT wiping out attached audio
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportingJson(true);
        const raw = JSON.parse(event.target.result);

        // Retain existing audio URL so alignment updates NEVER wipe out the audio!
        const existingAudio = currentAudioUrl || story.audioUrl || noteData?.audioUrl || null;
        const normalized = normalizeKaraokeJson(raw, existingAudio);
        if (!normalized.audioUrl && existingAudio) {
          normalized.audioUrl = existingAudio;
        }

        if (noteId) {
          const updatePayload = {
            karaokeData: normalized,
            title: normalized.title || story.title,
            content: normalized.sentences.map(s => s.text).join('\n\n'),
          };
          if (normalized.audioUrl) {
            updatePayload.audioUrl = normalized.audioUrl;
          }
          await api.put(`/notes/${noteId}`, updatePayload);
        }

        setLocalStory(normalized);
        if (normalized.audioUrl) {
          const resolved = resolveAudioUrl(normalized.audioUrl);
          setCurrentAudioUrl(resolved);
          if (onAudioUpdated) onAudioUpdated(normalized.audioUrl);
        }
        if (normalized.duration) {
          setDuration(normalized.duration);
        }
        setAudioError(false);
        toast.success(`✅ Alignment updated: ${normalized.sentences.length} sentences synchronized! Audio preserved.`);
      } catch (err) {
        toast.error(`JSON Import failed: ${err.message}`);
      } finally {
        setImportingJson(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Hidden File Input for Audio Replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleUploadAudio}
      />

      {/* Hidden File Input for JSON Alignment Import */}
      <input
        ref={jsonImportRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportJson}
      />

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentAudioUrl || '/audio/demo_german_story.mp3'}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
        onError={() => setAudioError(true)}
        preload="auto"
      />

      {/* Breadcrumb Navigation & Top Action Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          to="/notes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors group px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Notes
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Import JSON Alignment Button */}
          {noteId && (
            <button
              onClick={() => jsonImportRef.current?.click()}
              disabled={importingJson}
              className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-dolphin-400"
              title="Upload JSON alignment file for exact word synchronization"
            >
              <FileText className="w-3.5 h-3.5 text-dolphin-400" />
              <span>{importingJson ? 'Importing...' : 'Import Sync JSON'}</span>
            </button>
          )}

          {/* Download Template Button */}
          <button
            onClick={downloadKaraokeTemplate}
            className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer border border-white/5"
            title="Download JSON template file"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">JSON Template</span>
          </button>

          {/* Replace Audio Button */}
          {noteId && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAudio}
              className="text-xs text-dolphin-400 hover:text-dolphin-300 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Change audio file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingAudio ? 'Uploading...' : 'Replace Audio'}</span>
            </button>
          )}

          {/* Link Audio URL Button */}
          {noteId && (
            <button
              onClick={handleLinkAudioUrl}
              className="text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Link external audio URL (Cloudinary, S3, or direct stream)"
            >
              <Link2 className="w-3.5 h-3.5 text-ocean-400" />
              <span>Link URL</span>
            </button>
          )}

          {/* Mode Selector: Listening vs Sprechen (Speaking Practice) */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsSprechenMode(false);
                setSprechenSentenceIndex(null);
                setSpeechResult(null);
                setSpokenText('');
              }}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                !isSprechenMode
                  ? 'bg-dolphin-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              )}
              title="Continuous audio listening mode"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Listening</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSprechenMode(true);
                handleSpeedChange(0.75); // auto-set to 0.75 pace
              }}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                isSprechenMode
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-900/40'
                  : 'text-gray-400 hover:text-pink-300'
              )}
              title="Practice speaking after each sentence (auto-pauses at 0.75x)"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Sprechen Practice</span>
            </button>
          </div>

          {/* Toggle Translations Button */}
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className={clsx(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
              showTranslations
                ? 'bg-dolphin-500/20 text-dolphin-300 border-dolphin-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            )}
            title="Toggle English sentence translations"
          >
            {showTranslations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Translations {showTranslations ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Audio Unavailable Banner with Quick Fix Options */}
      {audioError && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-3">
            <VolumeX className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 text-sm">Audio stream unavailable</p>
              <p className="text-gray-300 mt-0.5">
                The audio source could not be played. You can attach an MP3 file directly, link a cloud URL, or switch to the built-in German demo audio.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAudio}
              className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingAudio ? 'Uploading...' : 'Upload MP3'}</span>
            </button>
            <button
              onClick={handleLinkAudioUrl}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
              title="Link direct audio URL"
            >
              <Link2 className="w-3.5 h-3.5 text-ocean-400" />
              <span>Link URL</span>
            </button>
            <button
              onClick={handleUseDemoAudio}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
            >
              <Music className="w-3.5 h-3.5 text-dolphin-400" />
              <span>Use Demo Audio</span>
            </button>
          </div>
        </div>
      )}

      {/* Story Header */}
      <div className="glass-card p-6 mb-6 border border-white/10 bg-gradient-to-r from-dolphin-600/10 via-ocean-600/10 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white shadow-xl shadow-dolphin-900/40 flex-shrink-0 mt-0.5">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-dolphin-500 text-white px-2.5 py-0.5 rounded-full shadow-md">
                  🎵 Karaoke Note
                </span>
                {displaySubject && (
                  <span className="badge badge-purple text-xs px-2.5 py-0.5">{displaySubject}</span>
                )}
                {displayTopic && (
                  <span className="badge badge-blue text-xs px-2.5 py-0.5">{displayTopic}</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{story.title}</h1>
              {story.englishTitle && (
                <p className="text-gray-400 text-sm italic mt-0.5">{story.englishTitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/5 px-3 py-2 rounded-xl border border-white/5 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-dolphin-400" />
            <span>Duration: {formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Glass Audio Controller Bar */}
      <div className="sticky top-20 z-40 mb-8 glass-card p-4 sm:p-5 border border-dolphin-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3">
          {/* Timeline slider and times */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-dolphin-300 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-dolphin-400"
              />
            </div>
            <span className="text-xs font-mono text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Play/Pause & Restart */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className={clsx(
                  'w-11 h-11 rounded-full flex items-center justify-center text-white transition-all shadow-lg cursor-pointer',
                  isPlaying
                    ? 'bg-gradient-to-r from-dolphin-500 to-ocean-500 shadow-dolphin-500/50 scale-105 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                )}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Timing Calibration Offset Adjuster */}
            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 text-xs text-gray-400">
              <Sliders className="w-3.5 h-3.5 text-dolphin-400" />
              <span className="text-[10px] text-gray-400 uppercase font-bold hidden sm:inline">Sync Offset:</span>
              <button
                type="button"
                onClick={() => setTimingOffset(prev => Math.round((prev - 0.25) * 100) / 100)}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 font-mono text-[11px] cursor-pointer"
                title="Highlight words earlier (-0.25s)"
              >
                -0.25s
              </button>
              <span className={clsx('font-mono font-bold px-1 text-[11px]', timingOffset !== 0 ? 'text-amber-400' : 'text-gray-300')}>
                {timingOffset > 0 ? `+${timingOffset}s` : `${timingOffset}s`}
              </span>
              <button
                type="button"
                onClick={() => setTimingOffset(prev => Math.round((prev + 0.25) * 100) / 100)}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 font-mono text-[11px] cursor-pointer"
                title="Highlight words later (+0.25s)"
              >
                +0.25s
              </button>
              {timingOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setTimingOffset(0)}
                  className="text-[10px] text-gray-500 hover:text-amber-300 ml-0.5 underline cursor-pointer"
                  title="Reset offset to 0s"
                >
                  reset
                </button>
              )}
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {[0.75, 1.0, 1.25].map(rate => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    playbackRate === rate
                      ? 'bg-dolphin-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Karaoke Reading Text Container */}
      <div className="glass-card p-6 sm:p-10 border border-white/10 space-y-6">
        {sentences.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-dolphin-400" />
            <p className="text-sm">No sentences found in this karaoke note.</p>
          </div>
        ) : (
          sentences.map((sentence, sIdx) => {
            const isSentenceActive = sIdx === activeSentenceIndex;

            return (
              <div
                key={sIdx}
                ref={isSentenceActive ? activeSentenceRef : null}
                className={clsx(
                  'p-4 sm:p-5 rounded-2xl transition-all duration-300 relative',
                  isSentenceActive
                    ? 'bg-dolphin-500/10 border border-dolphin-500/30 shadow-lg shadow-dolphin-950/40 scale-[1.01]'
                    : 'hover:bg-white/[0.02] border border-transparent'
                )}
              >
                {/* Spoken sentence index badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    isSentenceActive
                      ? 'bg-dolphin-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  )}>
                    {sIdx + 1}
                  </span>
                  {isSentenceActive && (
                    <span className="text-[11px] font-semibold text-dolphin-400 animate-pulse">
                      Currently Reading...
                    </span>
                  )}
                </div>

                {/* Words with Live Karaoke Highlighting */}
                <p className="text-lg sm:text-xl md:text-2xl leading-relaxed sm:leading-loose text-gray-300 font-medium">
                  {(sentence.words || []).map((w, wIdx) => {
                    const isWordActive =
                      activeWord &&
                      activeWord.sentenceIndex === sIdx &&
                      activeWord.start === w.start;

                    const isWordPast = effectiveTime > w.end;
                    const rawVocab = story.vocab?.[w.clean];
                    const vocabInfo = getVocabItemInfo(rawVocab);

                    return (
                      <span
                        key={wIdx}
                        onClick={() => jumpToWord(w.start)}
                        onMouseEnter={() => {
                          if (vocabInfo) {
                            setHoveredVocab({
                              word: w.clean,
                              meaning: vocabInfo.meaning,
                              type: vocabInfo.type,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredVocab(null)}
                        className={clsx(
                          'inline-block px-1.5 py-0.5 rounded-lg mx-0.5 transition-all duration-150 cursor-pointer select-none relative group',
                          isWordActive
                            ? 'bg-gradient-to-r from-dolphin-500 to-ocean-500 text-white font-extrabold scale-110 shadow-lg shadow-dolphin-500/50 z-20'
                            : isWordPast
                            ? 'text-white'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                        )}
                        title={vocabInfo ? `Click to listen • Meaning: ${vocabInfo.meaning}${vocabInfo.type ? ` (${vocabInfo.type})` : ''}` : 'Click to listen from here'}
                      >
                        {w.word}

                        {/* Small subtle dot if word has vocabulary tooltip */}
                        {vocabInfo && !isWordActive && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full opacity-60" />
                        )}
                      </span>
                    );
                  })}
                </p>

                {/* English Sentence Translation (preserved below German sentence) */}
                {showTranslations && sentence.translation && (
                  <p className="mt-2.5 text-xs sm:text-sm text-gray-400 italic pl-7 border-l-2 border-dolphin-500/30">
                    {sentence.translation}
                  </p>
                )}

                {/* Sprechen (Speaking Practice) Interactive Panel */}
                {isSprechenMode && (
                  <div className="mt-3.5 pt-3 border-t border-white/5">
                    {sprechenSentenceIndex === sIdx ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-pink-950/40 via-purple-950/25 to-black/60 border border-pink-500/30 shadow-2xl backdrop-blur-md animate-fade-in">
                        {/* Status bar: Chances left & Ausgezeichnet badge */}
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/10 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                              <Mic className="w-4 h-4 text-pink-400" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Sprechen (Speaking Practice)
                            </span>
                            {Boolean(sentencePassed[sIdx]) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ausgezeichnet!
                              </span>
                            )}
                          </div>

                          {/* 3 Chances Indicator */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">Chances:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map(cIdx => {
                                const chancesLeft = sentenceChances[sIdx] !== undefined ? sentenceChances[sIdx] : 3;
                                const isAvailable = cIdx <= chancesLeft;
                                return (
                                  <div
                                    key={cIdx}
                                    className={clsx(
                                      'w-2.5 h-2.5 rounded-full transition-all',
                                      isAvailable
                                        ? 'bg-pink-400 shadow-sm shadow-pink-400/50'
                                        : 'bg-white/15'
                                    )}
                                    title={`Chance ${cIdx} of 3`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              ({(sentenceChances[sIdx] !== undefined ? sentenceChances[sIdx] : 3)} left)
                            </span>
                          </div>
                        </div>

                        {/* Pronunciation Target Words with Highlighted Feedback */}
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-1.5 font-medium">Pronounce this German sentence:</p>
                          <div className="text-base sm:text-lg font-bold text-white flex flex-wrap gap-1.5 items-center">
                            {speechResult?.wordStatus ? (
                              speechResult.wordStatus.map((ws, i) => (
                                <span
                                  key={i}
                                  className={clsx(
                                    'px-2 py-0.5 rounded-lg text-sm sm:text-base transition-all font-semibold',
                                    ws.matched
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 line-through decoration-amber-400/60'
                                  )}
                                >
                                  {ws.word}
                                </span>
                              ))
                            ) : (
                              <span className="text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                {sentence.text}
                              </span>
                            )}
                          </div>

                          {/* Live Speech or Recorded Feedback */}
                          {(spokenText || isListening) && (
                            <div className="mt-2.5 text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-gray-400 font-medium">You said: </span>
                                {spokenText ? (
                                  <span className="italic font-semibold text-pink-200">"{spokenText}"</span>
                                ) : (
                                  <span className="text-pink-300/70 italic flex items-center gap-1.5 animate-pulse">
                                    Listening... speak now in German
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isListening && (
                                  <span className="text-[11px] font-medium text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    Submits in 3s silence or click Done
                                  </span>
                                )}
                                {speechResult && !isListening && (
                                  <span className={clsx(
                                    'font-bold px-2 py-0.5 rounded-full text-xs border',
                                    speechResult.isMatch
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  )}>
                                    {speechResult.accuracy}% Accuracy
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sprechen Action Buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Speak / Done Speaking / Cancel Controls */}
                          {!Boolean(sentencePassed[sIdx]) && ((sentenceChances[sIdx] !== undefined ? sentenceChances[sIdx] : 3) > 0) && (
                            <>
                              {!isListening ? (
                                <button
                                  type="button"
                                  onClick={() => startListening(sentence.text, sIdx)}
                                  className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/30 hover:scale-105"
                                >
                                  <Mic className="w-4 h-4" />
                                  <span>Click to Speak (Auf Deutsch)</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleManualSubmit(sentence.text, sIdx)}
                                    className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30 hover:scale-105 animate-pulse"
                                    title="Click to immediately submit and evaluate without waiting for 3 seconds of silence"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Done Speaking (Check Now ✓)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={stopListening}
                                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Cancel listening"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Cancel</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* Listen Again at 0.75x speed */}
                          <button
                            type="button"
                            onClick={() => playSentence(sIdx)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Listen to native audio for this sentence again"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-dolphin-400" />
                            <span>Listen Again (0.75x)</span>
                          </button>

                          {/* Practice Again button (Resets chances) */}
                          <button
                            type="button"
                            onClick={() => handleRestartSentencePractice(sIdx)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Reset chances and practice speaking again"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
                            <span>Practice Again</span>
                          </button>

                          {/* Next Sentence button */}
                          {sIdx + 1 < sentences.length && (
                            <button
                              type="button"
                              onClick={() => playSentence(sIdx + 1)}
                              className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold bg-dolphin-500/20 hover:bg-dolphin-500/30 text-dolphin-300 border border-dolphin-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Next Sentence</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Compact button when card is not the active speaking challenge */
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSprechenSentenceIndex(sIdx);
                            setSpeechResult(null);
                            setSpokenText('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 transition-all cursor-pointer group"
                        >
                          <Mic className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-pink-400" />
                          <span>Practice Speaking this Sentence</span>
                        </button>
                        {Boolean(sentencePassed[sIdx]) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ausgezeichnet (Passed)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Vocabulary Tooltip (Bottom Bar) */}
      {hoveredVocab && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-5 py-2.5 border border-amber-500/40 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up bg-gray-950/90">
          <span className="text-sm font-bold text-amber-300">{hoveredVocab.word}:</span>
          <span className="text-sm font-medium text-white">{hoveredVocab.meaning}</span>
          {hoveredVocab.type && (
            <span className="text-[10px] uppercase font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {hoveredVocab.type}
            </span>
          )}
        </div>
      )}

      {/* Bottom Vocabulary List Card */}
      {story.vocab && typeof story.vocab === 'object' && Object.keys(story.vocab).length > 0 && (
        <div className="mt-8 glass-card p-6 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-dolphin-400" />
            Story Vocabulary & Key Phrases
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {Object.entries(story.vocab).map(([de, val]) => {
              const info = getVocabItemInfo(val);
              if (!info) return null;
              return (
                <div key={de} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-dolphin-300 truncate">{de}</span>
                    {info.type && (
                      <span className="text-[9px] uppercase tracking-wider text-dolphin-400/80 bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0 font-medium">
                        {info.type}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 block mt-0.5 break-words">{info.meaning}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
