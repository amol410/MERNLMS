import { useState, useEffect, useRef } from 'react';
import {
  X, Heart, Volume2, Sparkles, CheckCircle2, XCircle, ArrowRight,
  RotateCcw, Trophy, Award, Zap, HelpCircle, Check, Send, Mic, RefreshCw,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Native Web Audio Chimes ────────────────────────────────────────────────
function playChime(isCorrect) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (isCorrect) {
      // Major chord arpeggio
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
      });
    } else {
      // Soft error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(174.61, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (_) {}
}

// ─── Browser Text-to-Speech ────────────────────────────────────────────────
function speakText(text, lang = 'de') {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'de' ? 'de-DE' : (lang === 'hi' ? 'hi-IN' : 'en-US');
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
}

// ─── Speech Word Sanitization & Fuzzy Comparison Helpers ────────────────────
function cleanSpeechWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"«»„“]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isFuzzyWordMatch(w1, w2) {
  if (!w1 || !w2) return false;
  if (w1 === w2) return true;
  // German umlaut normalization (matching Flutter _isFuzzyMatch)
  const norm1 = w1.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  const norm2 = w2.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  if (norm1 === norm2) return true;
  if (Math.abs(norm1.length - norm2.length) <= 1) {
    let diff = 0;
    const minLen = Math.min(norm1.length, norm2.length);
    for (let i = 0; i < minLen; i++) {
      if (norm1[i] !== norm2[i]) diff++;
    }
    return diff <= 1;
  }
  return false;
}

export default function LingoLessonModal({ node, targetLanguage = 'de', onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // Active Stage State
  const [status, setStatus] = useState('idle'); // 'idle' | 'correct' | 'wrong'
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [correctAnswerText, setCorrectAnswerText] = useState('');

  // Stage specific state:
  // Word match
  const [leftWords, setLeftWords] = useState([]);
  const [rightWords, setRightWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [solvedWordIds, setSolvedWordIds] = useState(new Set());
  const [wrongWordIds, setWrongWordIds] = useState(new Set());

  // Listen tap / Sentence builder
  const [placedTokens, setPlacedTokens] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);

  // Cloze / MCQ / Dialogue
  const [selectedOption, setSelectedOption] = useState(null);

  // Type word
  const [typedInput, setTypedInput] = useState('');

  // Sprechen
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speechAccuracy, setSpeechAccuracy] = useState(0);
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  // Stop speech recognition and clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  // Fetch full stage details JIT
  useEffect(() => {
    let isMounted = true;
    async function loadStages() {
      try {
        setLoading(true);
        const res = await api.get(`/gamification/lesson/${node.id || node.sourceId}`);
        if (isMounted && res.data?.lesson?.stages?.length > 0) {
          setStages(res.data.lesson.stages);
          initStage(res.data.lesson.stages[0]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('JIT stages fetch failed, using fallback challenges', err);
      }

      // Offline / default stages fallback
      if (isMounted) {
        const fallbacks = [
          {
            type: 'word_match',
            title: 'Match the word pairs',
            pairs: [
              { target: targetLanguage === 'de' ? 'Hallo' : 'Hello', native: 'Hello / नमस्ते' },
              { target: targetLanguage === 'de' ? 'Danke' : 'Thank you', native: 'Thank you / धन्यवाद' },
              { target: targetLanguage === 'de' ? 'Bitte' : 'Please', native: 'Please / कृपया' },
              { target: targetLanguage === 'de' ? 'Guten Morgen' : 'Good Morning', native: 'Good Morning / शुभ प्रभात' },
            ]
          },
          {
            type: 'sentence_builder',
            title: targetLanguage === 'de' ? 'Construct the German sentence' : 'Construct the sentence',
            prompt: targetLanguage === 'de' ? 'Translate: "Hello, how are you?"' : 'Translate: "Hallo, wie geht es dir?"',
            targetSentence: targetLanguage === 'de' ? 'Hallo, wie geht es dir?' : 'Hello, how are you?',
            tokens: targetLanguage === 'de' ? ['Hallo,', 'wie', 'geht', 'es', 'dir?', 'Danke', 'gut'] : ['Hello,', 'how', 'are', 'you?', 'fine', 'today']
          },
          {
            type: 'cloze_test',
            title: 'Fill in the blank',
            sentence: targetLanguage === 'de' ? 'Ich _____ aus Berlin.' : 'I _____ from Mumbai.',
            options: targetLanguage === 'de' ? ['komme', 'kommst', 'wohnen'] : ['come', 'comes', 'coming'],
            correctOption: targetLanguage === 'de' ? 'komme' : 'come'
          }
        ];
        setStages(fallbacks);
        initStage(fallbacks[0]);
        setLoading(false);
      }
    }
    loadStages();
    return () => { isMounted = false; };
  }, [node]);

  // Stage Initializer
  function initStage(stage) {
    if (!stage) return;
    setStatus('idle');
    setFeedbackMessage('');
    setCorrectAnswerText('');
    setSelectedOption(null);
    setTypedInput('');
    setSpokenTranscript('');
    setSpeechAccuracy(0);
    setWrongWordIds(new Set());
    setIsListening(false);
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    if (stage.type === 'word_match' && Array.isArray(stage.pairs)) {
      const targets = [];
      const natives = [];
      stage.pairs.forEach((p, idx) => {
        const targetText = (p.target || p.german || p.word || '').trim();
        const nativeText = (p.native || p.english || p.translation || '').trim();
        if (targetText && nativeText) {
          targets.push({ id: `t_${idx}`, pairId: idx, text: targetText, isTarget: true });
          natives.push({ id: `n_${idx}`, pairId: idx, text: nativeText, isTarget: false });
        }
      });
      // Shuffle each column independently
      setLeftWords([...targets].sort(() => Math.random() - 0.5));
      setRightWords([...natives].sort(() => Math.random() - 0.5));
      setSelectedWord(null);
      setSolvedWordIds(new Set());
      setWrongWordIds(new Set());
    } else if (stage.type === 'listen_tap' || stage.type === 'sentence_builder') {
      const tokens = Array.isArray(stage.tokens) ? [...stage.tokens] : (stage.targetSentence?.split(' ') || []);
      setPlacedTokens([]);
      setAvailableTokens(tokens.map((t, i) => ({ id: `${t}_${i}`, text: t })));
      if (stage.type === 'listen_tap' && stage.targetSentence) {
        setTimeout(() => speakText(stage.targetSentence, targetLanguage), 400);
      }
    } else if (stage.type === 'dialogue_bubble' || stage.type === 'listen_select') {
      const speechPrompt = stage.partnerMessage || stage.targetSentence || stage.sentence;
      if (speechPrompt) {
        setTimeout(() => speakText(speechPrompt, targetLanguage), 400);
      }
    }
  }

  // Handle Word Match Selection
  function handleWordClick(item) {
    if (solvedWordIds.has(item.id) || status !== 'idle') return;

    if (item.isTarget) {
      speakText(item.text, targetLanguage);
    }

    if (!selectedWord) {
      setSelectedWord(item);
      return;
    }

    if (selectedWord.id === item.id) {
      setSelectedWord(null);
      return;
    }

    // If clicking another word in the same column, simply switch selection
    if (selectedWord.isTarget === item.isTarget) {
      setSelectedWord(item);
      return;
    }

    // Tapping across columns (one target, one native): evaluate match!
    if (selectedWord.pairId === item.pairId) {
      playChime(true);
      const nextSolved = new Set(solvedWordIds);
      nextSolved.add(selectedWord.id);
      nextSolved.add(item.id);
      setSolvedWordIds(nextSolved);
      setSelectedWord(null);
      setWrongWordIds(new Set());

      // Check if all pairs solved
      const totalCount = leftWords.length + rightWords.length;
      if (nextSolved.size === totalCount && totalCount > 0) {
        setStatus('correct');
        setFeedbackMessage('Fantastic! All pairs matched perfectly.');
      }
    } else {
      playChime(false);
      const mismatches = new Set([selectedWord.id, item.id]);
      setWrongWordIds(mismatches);
      setSelectedWord(null);
      setTimeout(() => {
        setWrongWordIds(new Set());
      }, 700);
    }
  }

  // Handle Token placement
  function handleAddToken(token) {
    if (status !== 'idle') return;
    speakText(token.text, targetLanguage);
    setPlacedTokens(prev => [...prev, token]);
    setAvailableTokens(prev => prev.filter(t => t.id !== token.id));
  }

  function handleRemoveToken(token) {
    if (status !== 'idle') return;
    setPlacedTokens(prev => prev.filter(t => t.id !== token.id));
    setAvailableTokens(prev => [...prev, token]);
  }

  // Handle Speech Recognition for Sprechen Stage
  function toggleSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
      return;
    }

    // Always reset status, feedback messages, and spoken transcript when starting a new attempt
    setStatus('idle');
    setFeedbackMessage('');
    setCorrectAnswerText('');
    setSpokenTranscript('');
    setSpeechAccuracy(0);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = targetLanguage === 'de' ? 'de-DE' : (targetLanguage === 'hi' ? 'hi-IN' : 'en-US');
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSpokenTranscript(transcript);

        // Evaluate pronunciation against prompt
        const currentStage = stages[currentStageIdx];
        const prompt = currentStage?.prompt || '';
        const promptWords = cleanSpeechWords(prompt);
        const spokenWords = cleanSpeechWords(transcript);
        const matchedCount = promptWords.filter(pw => spokenWords.some(sw => isFuzzyWordMatch(pw, sw))).length;
        const accuracyPct = promptWords.length > 0 ? Math.round((matchedCount / promptWords.length) * 100) : 0;
        setSpeechAccuracy(accuracyPct);

        // Auto-complete ONLY when the complete phrase is pronounced
        const isFullPhrase = promptWords.length <= 4
          ? matchedCount === promptWords.length
          : accuracyPct >= 80;

        if (promptWords.length > 0 && isFullPhrase) {
          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              try { recognitionRef.current.stop(); } catch (_) {}
            }
            setIsListening(false);
            playChime(true);
            setStatus('correct');
            setFeedbackMessage('Wunderbar! Great pronunciation.');
          }, 500);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access was denied. Please allow microphone permissions in your browser.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      toast.error('Could not activate microphone.');
    }
  }

  // Submit Answer
  function handleCheckAnswer() {
    if (status !== 'idle') return;
    const currentStage = stages[currentStageIdx];
    let isCorrect = false;
    let expected = '';

    if (currentStage.type === 'word_match') {
      const totalCount = leftWords.length + rightWords.length;
      isCorrect = totalCount > 0 && solvedWordIds.size === totalCount;
    } else if (currentStage.type === 'listen_tap' || currentStage.type === 'sentence_builder') {
      const built = placedTokens.map(t => t.text).join(' ').trim().toLowerCase();
      expected = (currentStage.targetSentence || '').trim().toLowerCase();
      // Allow minor punctuation differences
      const cleanBuilt = built.replace(/[.,!?]/g, '');
      const cleanExpected = expected.replace(/[.,!?]/g, '');
      isCorrect = cleanBuilt === cleanExpected;
    } else if (currentStage.type === 'cloze_test') {
      expected = currentStage.correctOption || currentStage.correctAnswer || currentStage.blank || '';
      isCorrect = selectedOption?.toLowerCase().trim() === expected.toLowerCase().trim();
    } else if (currentStage.type === 'type_word') {
      expected = currentStage.target || currentStage.targetWord || currentStage.word || currentStage.correctAnswer || '';
      isCorrect = typedInput.trim().toLowerCase() === expected.trim().toLowerCase();
    } else if (currentStage.type === 'dialogue_bubble' || currentStage.type === 'listen_select') {
      if (typeof selectedOption === 'object' && selectedOption !== null) {
        isCorrect = selectedOption.isCorrect === true;
        const correctOpt = currentStage.options?.find(o => o.isCorrect);
        expected = correctOpt ? correctOpt.text : '';
      } else {
        expected = currentStage.correctAnswer || '';
        isCorrect = selectedOption === expected;
      }
    } else if (currentStage.type === 'sprechen') {
      const prompt = currentStage.prompt || '';
      const promptWords = cleanSpeechWords(prompt);
      const spokenWords = cleanSpeechWords(spokenTranscript);
      const matchedCount = promptWords.filter(pw => spokenWords.some(sw => isFuzzyWordMatch(pw, sw))).length;
      const accuracyPct = promptWords.length > 0 ? Math.round((matchedCount / promptWords.length) * 100) : 0;

      const isFullPhrase = promptWords.length <= 4
        ? matchedCount === promptWords.length
        : accuracyPct >= 80;

      if (spokenTranscript && isFullPhrase) {
        isCorrect = true;
      } else {
        isCorrect = false;
        expected = prompt;
      }
    }

    if (isCorrect) {
      playChime(true);
      setStatus('correct');
      setFeedbackMessage(currentStage.type === 'sprechen' ? 'Wunderbar! Great pronunciation.' : 'Excellent job! You nailed it.');
    } else {
      playChime(false);
      setStatus('wrong');
      setHearts(h => Math.max(0, h - 1));
      if (currentStage.type === 'sprechen') {
        setFeedbackMessage(spokenTranscript ? 'Incomplete pronunciation. Speak the full phrase.' : 'Tap "Pronounce Aloud" and speak into your mic.');
      } else {
        setFeedbackMessage('Not quite correct.');
      }
      setCorrectAnswerText(expected || 'Check punctuation or correct spelling.');
    }
  }

  // Next Stage or Finish
  async function handleContinue() {
    if (currentStageIdx + 1 < stages.length) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      initStage(stages[nextIdx]);
    } else {
      // Completed all stages!
      setIsCompleted(true);
      playChime(true);
      try {
        setSavingProgress(true);
        const res = await api.post('/gamification/complete-node', {
          nodeIndex: node.index ?? 0,
          stars: 3,
          scorePct: 100,
          xpEarned: node.xpReward || 15,
          pearlsEarned: node.pearlsReward || 5,
        });
        if (onComplete) onComplete(node, res.data);
      } catch (err) {
        console.error('Error recording completion:', err);
        // Fallback optimistic unlock even if API errors
        if (onComplete) onComplete(node);
      } finally {
        setSavingProgress(false);
      }
    }
  }

  const currentStage = stages[currentStageIdx];
  const progressPct = stages.length > 0 ? ((currentStageIdx) / stages.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#131F24] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#16242B]">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress Bar */}
          <div className="flex-1 mx-6">
            <div className="h-3.5 bg-[#202F36] rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Hearts counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
            <Heart className="w-4 h-4 fill-current text-red-500" />
            <span>{hearts}</span>
          </div>
        </div>

        {/* Lesson Body Content */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-center">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
              <p className="text-white font-bold text-lg">Preparing Challenge...</p>
              <p className="text-gray-400 text-sm">Loading interactive exercises</p>
            </div>
          ) : isCompleted ? (
            /* Celebration Victory View with 3 Animated Stars */
            <div className="py-10 flex flex-col items-center justify-center text-center animate-scale-up">
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3].map(starNum => (
                  <div
                    key={starNum}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/30 animate-bounce"
                    style={{ animationDelay: `${starNum * 150}ms` }}
                  >
                    ⭐
                  </div>
                ))}
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Lesson Completed!</h2>
              <p className="text-gray-400 text-base mb-8 max-w-sm">
                Incredible work! You conquered this stepping stone and expanded your language skills.
              </p>

              {/* Reward stats */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center">
                  <Zap className="w-6 h-6 text-cyan-400 mb-1" />
                  <span className="text-2xl font-black text-white">+{node.xpReward || 15}</span>
                  <span className="text-xs text-cyan-300/80 font-bold">XP EARNED</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center">
                  <Award className="w-6 h-6 text-amber-400 mb-1" />
                  <span className="text-2xl font-black text-white">+{node.pearlsReward || 5}</span>
                  <span className="text-xs text-amber-300/80 font-bold">PEARLS</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onComplete) onComplete(node);
                  onClose();
                }}
                disabled={savingProgress}
                className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {savingProgress ? 'Saving...' : 'Continue Learning'}
              </button>
            </div>
          ) : currentStage ? (
            <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
              {/* Stage Title */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                  {currentStage.title || 'Complete the Challenge'}
                </h3>
                {currentStage.prompt && currentStage.type !== 'sentence_builder' && (
                  <p className="text-gray-400 text-sm font-medium">{currentStage.prompt}</p>
                )}
              </div>

              {/* 1. WORD MATCH STAGE */}
              {currentStage.type === 'word_match' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column: Target Language */}
                  <div className="flex flex-col gap-3">
                    {leftWords.map(item => {
                      const isSelected = selectedWord?.id === item.id;
                      const isSolved = solvedWordIds.has(item.id);
                      const isWrong = wrongWordIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleWordClick(item)}
                          disabled={isSolved}
                          className={clsx(
                            'p-4 rounded-2xl font-bold text-base border-2 border-b-4 transition-all duration-200 text-center flex items-center justify-center min-h-[64px]',
                            isSolved
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-60'
                              : isWrong
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse scale-95 shadow-lg shadow-rose-500/20'
                                : isSelected
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 scale-105 shadow-lg shadow-cyan-500/20'
                                  : 'bg-[#1E2B31] border-[#2C3E47] text-white hover:border-cyan-500/40 active:border-b-2 active:translate-y-0.5'
                          )}
                        >
                          {item.text}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Native Language */}
                  <div className="flex flex-col gap-3">
                    {rightWords.map(item => {
                      const isSelected = selectedWord?.id === item.id;
                      const isSolved = solvedWordIds.has(item.id);
                      const isWrong = wrongWordIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleWordClick(item)}
                          disabled={isSolved}
                          className={clsx(
                            'p-4 rounded-2xl font-bold text-base border-2 border-b-4 transition-all duration-200 text-center flex items-center justify-center min-h-[64px]',
                            isSolved
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-60'
                              : isWrong
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse scale-95 shadow-lg shadow-rose-500/20'
                                : isSelected
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 scale-105 shadow-lg shadow-cyan-500/20'
                                  : 'bg-[#1E2B31] border-[#2C3E47] text-white hover:border-cyan-500/40 active:border-b-2 active:translate-y-0.5'
                          )}
                        >
                          {item.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. LISTEN TAP & SENTENCE BUILDER */}
              {(currentStage.type === 'listen_tap' || currentStage.type === 'sentence_builder') && (
                <div className="flex flex-col gap-5">
                  {/* English Prompt Card for Sentence Builder */}
                  {currentStage.type === 'sentence_builder' && (
                    <div className="w-full p-4 rounded-2xl bg-[#1E2B31] border border-cyan-500/30 shadow-lg flex items-center gap-3.5 animate-fade-in text-left">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider block mb-0.5">
                          {targetLanguage === 'de' ? 'Translate to German' : 'Translate to Target Language'}
                        </span>
                        <p className="text-lg font-bold text-white">
                          {(() => {
                            let p = currentStage.prompt || '';
                            if (!p || p === 'Translate into target language:' || p === 'Construct the sentence' || p === 'Construct the German sentence') {
                              if (currentStage.translation) return `"${currentStage.translation}"`;
                              if (currentStage.targetSentence === 'Hallo, wie geht es dir?') return '"Hello, how are you?"';
                              if (currentStage.targetSentence === 'Guten Morgen, wie geht es dir?') return '"Good morning, how are you?"';
                              if (currentStage.targetSentence === 'Guten Tag, ich bin Anna') return '"Good day, I am Anna"';
                              return `"${currentStage.targetSentence}"`;
                            }
                            return p;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audio Card for Listen Tap */}
                  {currentStage.type === 'listen_tap' && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1E2B31] border border-white/5 animate-fade-in text-left">
                      <button
                        onClick={() => speakText(currentStage.targetSentence, targetLanguage)}
                        className="w-14 h-14 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                      >
                        <Volume2 className="w-7 h-7" />
                      </button>
                      <div>
                        <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider block mb-0.5">
                          Listening Comprehension
                        </span>
                        <p className="text-white font-bold text-sm">
                          Tap the speaker to listen, then arrange the words in order
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Assembled Tokens Line */}
                  <div className="min-h-[76px] p-4 rounded-2xl bg-[#1A262C] border-2 border-dashed border-[#2F414B] flex flex-wrap gap-2 items-center">
                    {placedTokens.length === 0 ? (
                      <span className="text-gray-500 text-sm italic">Tap word bubbles below to build sentence</span>
                    ) : (
                      placedTokens.map(token => (
                        <button
                          key={token.id}
                          onClick={() => handleRemoveToken(token)}
                          className="px-4 py-2.5 rounded-xl bg-cyan-500/20 border-2 border-b-4 border-cyan-400 text-cyan-200 font-bold text-base shadow hover:scale-105 active:scale-95 transition-all"
                        >
                          {token.text}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Available Token Bank */}
                  <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                    {availableTokens.map(token => (
                      <button
                        key={token.id}
                        onClick={() => handleAddToken(token)}
                        className="px-4 py-2.5 rounded-xl bg-[#202F36] border-2 border-b-4 border-[#2C3E47] active:border-b-2 active:translate-y-0.5 text-white font-bold text-base shadow hover:border-cyan-400 hover:text-cyan-200 transition-all"
                      >
                        {token.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CLOZE TEST */}
              {currentStage.type === 'cloze_test' && (
                <div className="flex flex-col gap-6">
                  <div className="p-6 rounded-2xl bg-[#1A262C] border border-white/5 text-center shadow-md">
                    <p className="text-2xl font-bold text-white mb-2">{currentStage.sentence}</p>
                    {currentStage.translation && (
                      <p className="text-sm text-gray-400 italic">{currentStage.translation}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {currentStage.options?.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isChosen = selectedOption === opt;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedOption(opt)}
                          className={clsx(
                            'p-4 rounded-2xl font-bold text-base border-2 border-b-4 transition-all flex items-center justify-between group active:border-b-2 active:translate-y-0.5',
                            isChosen
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20'
                              : 'bg-[#1E2B31] border-[#2C3E47] text-white hover:border-cyan-500/40 hover:bg-[#25363F]'
                          )}
                        >
                          <span className={clsx(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-colors",
                            isChosen ? "bg-cyan-400 text-slate-900" : "bg-[#2A3D47] text-gray-400 group-hover:text-white"
                          )}>
                            {letter}
                          </span>
                          <span className="flex-1 text-center font-bold text-lg">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. TYPE WORD */}
              {currentStage.type === 'type_word' && (
                <div className="flex flex-col gap-4">
                  <div className="p-5 rounded-2xl bg-[#1A262C] border border-white/5 text-center shadow-md">
                    <p className="text-2xl font-bold text-white mb-2">
                      {currentStage.prompt || currentStage.sentence || 'Fill in the missing word'}
                    </p>
                    {currentStage.translation && (
                      <p className="text-sm text-gray-400 italic">{currentStage.translation}</p>
                    )}
                    {currentStage.hint && (
                      <p className="text-xs text-cyan-400/80 mt-1 font-semibold">Hint: {currentStage.hint}</p>
                    )}
                  </div>

                  <input
                    type="text"
                    value={typedInput}
                    onChange={e => setTypedInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && typedInput.trim() && status === 'idle') {
                        handleCheckAnswer();
                      }
                    }}
                    autoFocus
                    placeholder="Type the German word..."
                    className="w-full p-4 rounded-2xl bg-[#1A262C] border-2 border-[#2C3E47] focus:border-cyan-400 text-white font-bold text-xl outline-none transition-all text-center tracking-wide shadow-inner"
                  />

                  {/* German Umlaut Quick Buttons */}
                  {targetLanguage === 'de' && (
                    <div className="flex justify-center gap-2 pt-1">
                      {['ä', 'ö', 'ü', 'ß'].map(char => (
                        <button
                          key={char}
                          onClick={() => setTypedInput(prev => prev + char)}
                          className="w-12 h-12 rounded-xl bg-[#202F36] border-2 border-b-4 border-[#2C3E47] active:border-b-2 active:translate-y-0.5 text-white font-bold text-lg hover:border-cyan-400 hover:text-cyan-200 transition-all"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. DIALOGUE BUBBLE & LISTEN SELECT */}
              {(currentStage.type === 'dialogue_bubble' || currentStage.type === 'listen_select') && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    {/* Dolphin Character Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20 flex-shrink-0 border border-white/20">
                      🐬
                    </div>
                    {/* Comic Speech Bubble */}
                    <div className="flex-1 p-5 rounded-3xl rounded-tl-sm bg-[#1A262C] border border-white/10 relative shadow-md text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                          {currentStage.partnerName || currentStage.speaker || (currentStage.type === 'listen_select' ? 'Listening Comprehension' : 'Florian')}
                        </span>
                        <button
                          onClick={() => speakText(currentStage.partnerMessage || currentStage.sentence || currentStage.question, targetLanguage)}
                          className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                          title="Listen again"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {currentStage.partnerMessage || currentStage.sentence || currentStage.question}
                      </p>
                      {currentStage.translation && (
                        <p className="text-xs text-gray-400 mt-1 italic">{currentStage.translation}</p>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-2.5">
                    {currentStage.options?.map((opt, i) => {
                      const optText = typeof opt === 'object' ? opt.text : opt;
                      const isChosen = selectedOption === opt;
                      const letter = String.fromCharCode(65 + i);
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedOption(opt)}
                          className={clsx(
                            'p-4 rounded-2xl font-bold text-left border-2 border-b-4 transition-all flex items-center justify-between group active:border-b-2 active:translate-y-0.5',
                            isChosen
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20'
                              : 'bg-[#1E2B31] border-[#2C3E47] text-white hover:border-cyan-500/40 hover:bg-[#25363F]'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={clsx(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-colors",
                              isChosen ? "bg-cyan-400 text-slate-900" : "bg-[#2A3D47] text-gray-400 group-hover:text-white"
                            )}>
                              {letter}
                            </span>
                            <span className="text-base">{optText}</span>
                          </div>
                          {isChosen && <Check className="w-5 h-5 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. SPRECHEN (SPEECH PRACTICE) */}
              {currentStage.type === 'sprechen' && (
                <div className="flex flex-col items-center text-center gap-6 py-4">
                  {/* German prompt with real-time word match highlighting */}
                  <div className="p-6 rounded-3xl bg-[#1A262C] border border-white/10 w-full">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                      {(currentStage.prompt || '').split(' ').map((word, wIdx) => {
                        const cleanW = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"«»„“]/g, '').trim();
                        const spokenWords = cleanSpeechWords(spokenTranscript);
                        const isWordHeard = spokenWords.some(sw => isFuzzyWordMatch(cleanW, sw));
                        return (
                          <span
                            key={wIdx}
                            className={clsx(
                              'text-2xl sm:text-3xl font-black px-2 py-0.5 rounded-xl transition-all duration-300',
                              isWordHeard
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                : 'text-white'
                            )}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                    {currentStage.translation && (
                      <p className="text-sm text-gray-400 italic">{currentStage.translation}</p>
                    )}
                  </div>

                  {/* Audio Controls: Listen & Pronounce Aloud (Microphone) */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => speakText(currentStage.prompt, targetLanguage)}
                      className="px-5 py-3 rounded-2xl bg-[#202F36] border border-white/10 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition-colors"
                      title="Listen to native pronunciation"
                    >
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                      Listen
                    </button>

                    <button
                      onClick={toggleSpeechRecognition}
                      className={clsx(
                        'px-6 py-3 rounded-2xl text-white font-bold flex items-center gap-2.5 transition-all shadow-lg',
                        isListening
                          ? 'bg-rose-500 shadow-rose-500/40 animate-pulse scale-105'
                          : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/30 hover:scale-105'
                      )}
                    >
                      <Mic className={clsx('w-5 h-5', isListening && 'animate-bounce')} />
                      <span>{isListening ? 'Listening... Speak Now' : 'Pronounce Aloud'}</span>
                    </button>
                  </div>

                  {/* Real-time speech transcript feedback with live accuracy score */}
                  {spokenTranscript && (
                    <div className="w-full max-w-md p-4 rounded-2xl bg-[#202F36] border border-cyan-500/20 text-center animate-fade-in shadow-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">We Heard:</span>
                        <span className={clsx(
                          "text-xs font-black px-2.5 py-0.5 rounded-full border",
                          speechAccuracy >= 75
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        )}>
                          {speechAccuracy}% Accuracy
                        </span>
                      </div>
                      <p className="text-base font-semibold text-cyan-300">"{spokenTranscript}"</p>
                      {!isListening && status === 'idle' && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-xs">
                          {(() => {
                            const promptWords = cleanSpeechWords(currentStage.prompt);
                            const isFull = promptWords.length <= 4 ? speechAccuracy === 100 : speechAccuracy >= 80;
                            return isFull ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Complete sentence heard! Click Check to continue.
                              </span>
                            ) : (
                              <span className="text-amber-400 font-medium">
                                ⚠️ Heard {speechAccuracy}%. Tap &ldquo;Pronounce Aloud&rdquo; to complete or click Check.
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {isListening && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Speak clearly into your microphone in German...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Bottom Verification & Feedback Drawer */}
        {!isCompleted && !loading && (
          <div
            className={clsx(
              'p-6 border-t transition-all duration-300',
              status === 'correct'
                ? 'bg-emerald-950/90 border-emerald-500/40'
                : status === 'wrong'
                  ? 'bg-rose-950/90 border-rose-500/40'
                  : 'bg-[#16242B] border-white/10'
            )}
          >
            <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
              {status === 'idle' ? (
                <>
                  <div className="text-gray-400 text-xs sm:text-sm font-medium">
                    {currentStage?.type === 'sprechen' ? 'Pronounce the full phrase aloud, then click Check' : 'Select or assemble your answer above'}
                  </div>
                  <button
                    onClick={handleCheckAnswer}
                    className="px-8 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-base shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 active:translate-y-0.5 transition-all"
                  >
                    Check
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {status === 'correct' ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white">
                        <XCircle className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className={clsx('font-black text-base', status === 'correct' ? 'text-emerald-300' : 'text-rose-300')}>
                        {feedbackMessage}
                      </p>
                      {correctAnswerText && (
                        <p className="text-xs text-rose-200/80 font-medium mt-0.5">
                          Correct: <span className="font-bold underline">{correctAnswerText}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {status === 'wrong' && currentStage?.type === 'sprechen' && (
                      <button
                        onClick={() => {
                          setStatus('idle');
                          setFeedbackMessage('');
                          setTimeout(() => toggleSpeechRecognition(), 100);
                        }}
                        className="px-5 py-3.5 rounded-2xl bg-[#202F36] hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-all flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4 text-cyan-400" />
                        <span>Try Again</span>
                      </button>
                    )}
                    <button
                      onClick={handleContinue}
                      className={clsx(
                        'px-8 py-3.5 rounded-2xl text-white font-black text-base shadow-lg transition-all',
                        status === 'correct'
                          ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-900/40'
                          : 'bg-rose-500 hover:bg-rose-400 shadow-rose-900/40'
                      )}
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
