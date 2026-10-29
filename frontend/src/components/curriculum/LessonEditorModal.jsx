import { useState, useEffect, useRef } from 'react';
import {
  X, Check, Plus, Trash2, Headphones, Mic, Sparkles, Layers,
  Volume2, Music, Link2, BookOpen, AlertCircle, Eye, EyeOff, Upload, Loader2, FileCode, Download,
  MessageSquare, Type, HelpCircle, CheckCircle2, Radio, Image as ImageIcon,
  ArrowUp, ArrowDown, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function LessonEditorModal({
  isOpen,
  onClose,
  lessonId,
  initialData,
  onSuccess,
  currentLanguage = 'de',
  currentNative = 'en',
  currentLevel = 'A1',
  currentUnit = 1,
}) {
  const [loading, setLoading] = useState(false);
  const [notesList, setNotesList] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [nodeType, setNodeType] = useState('lesson');
  const [xpReward, setXpReward] = useState(15);
  const [pearlsReward, setPearlsReward] = useState(5);
  const [isLive, setIsLive] = useState(false); // CRITICAL: default false
  const [sourceNoteId, setSourceNoteId] = useState('');

  // Audio Upload & Player State (Direct to MySQL karaoke_audios)
  const [listenAudioUrl, setListenAudioUrl] = useState('');
  const [uploadingListenAudio, setUploadingListenAudio] = useState(false);
  const listenAudioInputRef = useRef(null);

  const [karaokeAudioUrl, setKaraokeAudioUrl] = useState('');
  const [uploadingKaraokeAudio, setUploadingKaraokeAudio] = useState(false);
  const karaokeAudioInputRef = useRef(null);

  // Listen & Tap — Word-Level Timestamps JSON (.json with per-word start/end for tap-to-pronounce)
  const [listenWordTimestamps, setListenWordTimestamps] = useState(null);
  const [listenTimestampsFileName, setListenTimestampsFileName] = useState('');
  const listenTimestampsInputRef = useRef(null);

  // Dedicated Word Bank Audio (Optional for separate comma-separated words track)
  const [listenWordsAudioUrl, setListenWordsAudioUrl] = useState('');
  const [uploadingListenWordsAudio, setUploadingListenWordsAudio] = useState(false);
  const listenWordsAudioInputRef = useRef(null);
  const [listenSentenceRange, setListenSentenceRange] = useState(null);

  // Karaoke Alignment JSON state (.json with sentence/word timestamps)
  const [karaokeJsonData, setKaraokeJsonData] = useState(null);
  const [karaokeJsonFileName, setKaraokeJsonFileName] = useState('');
  const karaokeJsonInputRef = useRef(null);

  // Word Match Pairs JSON upload ref
  const wordMatchInputRef = useRef(null);

  // Helper: Resolve relative audio URLs through backend streaming endpoint
  const resolveAudioUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    const clean = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return clean;
  };

  // Helper: Upload audio directly to MySQL karaoke_audios via existing /notes/upload-audio
  const handleAudioFileUpload = async (file, setUrlState, setLoadingState) => {
    if (!file) return;
    setLoadingState(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await api.post('/notes/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.audioUrl) {
        setUrlState(res.data.audioUrl);
        toast.success(`Audio uploaded to database: ${file.name}`);
      } else {
        toast.error('Failed to get audio URL from server');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload audio file');
    } finally {
      setLoadingState(false);
    }
  };

  // Helper: Read and parse Karaoke Alignment JSON file
  const handleKaraokeJsonSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKaraokeJsonFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result);
        setKaraokeJsonData(raw);

        // Auto-extract sentences and text
        if (raw.sentences && Array.isArray(raw.sentences)) {
          const story = raw.sentences.map(s => s.text || '').filter(Boolean).join('\n');
          if (story) setKaraokeStory(story);

          const trans = raw.sentences.map(s => s.translation || '').filter(Boolean).join('\n');
          if (trans) setKaraokeTranslation(trans);
        } else if (raw.storyText) {
          setKaraokeStory(raw.storyText);
          if (raw.translationText) setKaraokeTranslation(raw.translationText);
        }

        // Auto-extract audioUrl if present in JSON
        if (raw.audioUrl && !karaokeAudioUrl) {
          setKaraokeAudioUrl(raw.audioUrl);
        }

        // Auto-populate title if empty
        if (raw.title && !title) {
          setTitle(raw.title);
        }

        toast.success(`Karaoke JSON parsed: ${raw.sentences ? raw.sentences.length : 1} sentences ready!`);
      } catch (err) {
        toast.error(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Helper: Handle Listen & Tap word timestamps JSON file upload
  const handleListenTimestampsSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setListenTimestampsFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result);
        if (raw.words && Array.isArray(raw.words)) {
          setListenWordTimestamps(raw.words);
          if (raw.wordsAudioUrl) {
            setListenWordsAudioUrl(raw.wordsAudioUrl);
          } else if (raw.audioUrl && !listenAudioUrl) {
            setListenAudioUrl(raw.audioUrl);
          }
          if (raw.sentenceRange) {
            setListenSentenceRange(raw.sentenceRange);
          }
          toast.success(`Word timestamps loaded: ${raw.words.length} words`);
        } else if (Array.isArray(raw)) {
          setListenWordTimestamps(raw);
          toast.success(`Word timestamps loaded: ${raw.length} words`);
        } else {
          toast.error('Invalid format — expected { "words": [{ "word", "start", "end" }] }');
        }
      } catch (err) {
        toast.error(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Helper: Download word timestamps template JSON
  const downloadListenTimestampsTemplate = () => {
    const targetWords = listenTarget
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(Boolean);
    const distractorWords = listenDistractors
      .split(/[,;\s]+/)
      .map(w => w.trim())
      .filter(Boolean);
    const allUniqueWords = Array.from(new Set([...targetWords, ...distractorWords]));

    const template = {
      _comment: 'Word-level timestamps for Listen & Tap. Includes target sentence words and distractor words. Each word maps to its start and end time (in seconds).',
      audioUrl: listenAudioUrl || '/api/notes/audio/db/YOUR_ID',
      wordsAudioUrl: listenWordsAudioUrl || '',
      sentenceRange: {
        start: 0.0,
        end: parseFloat((targetWords.length * 0.6).toFixed(2)),
      },
      words: allUniqueWords.length > 0
        ? allUniqueWords.map((w, i) => ({
            word: w,
            start: parseFloat((i * 0.8).toFixed(2)),
            end: parseFloat(((i * 0.8) + 0.6).toFixed(2)),
          }))
        : [
            { word: 'Guten', start: 0.0, end: 0.60 },
            { word: 'Tag', start: 0.80, end: 1.40 },
            { word: 'ich', start: 1.60, end: 2.00 },
            { word: 'bin', start: 2.20, end: 2.60 },
            { word: 'Anna', start: 2.80, end: 3.40 },
            { word: 'Milch', start: 3.60, end: 4.20 },
            { word: 'Kaffee', start: 4.40, end: 5.00 },
          ],
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listen_tap_word_timestamps_template.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Template downloaded with ${allUniqueWords.length} words (including distractors)!`);
  };

  // Helper: Read and parse Word Match Pairs JSON file
  const handleWordMatchJsonSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result);
        let list = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw.pairs && Array.isArray(raw.pairs)) {
          list = raw.pairs;
        } else if (raw.words && Array.isArray(raw.words)) {
          list = raw.words;
        }

        const normalized = list.map(item => ({
          target: String(item.target || item.german || item.word || '').trim(),
          native: String(item.native || item.english || item.translation || '').trim(),
        })).filter(p => p.target && p.native);

        if (normalized.length === 0) {
          toast.error('No valid word pairs found. Format: { "pairs": [{ "target": "...", "native": "..." }] }');
          return;
        }

        setWordPairs(normalized);
        toast.success(`Loaded ${normalized.length} word pairs from JSON!`);
      } catch (err) {
        toast.error(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    // Reset file input so user can re-upload same file if needed
    e.target.value = '';
  };

  // Helper: Download Word Match pairs template JSON
  const downloadWordMatchTemplate = () => {
    const validPairs = wordPairs.filter(p => p.target.trim() && p.native.trim());
    const template = {
      _comment: 'Word pairs for Stage 1: Match the Word Pairs in lesson challenges.',
      pairs: validPairs.length > 0
        ? validPairs
        : [
            { target: 'Guten Tag', native: 'Hello' },
            { target: 'Danke', native: 'Thank you' },
            { target: 'Bitte', native: 'Please' },
            { target: 'Tschüss', native: 'Bye' },
          ],
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word_match_pairs_template.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Word pairs template downloaded!');
  };

  // Helper: Read and parse Sprechen Lip-Sync Karaoke JSON file
  const handleSprechenKaraokeSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSprechenKaraokeFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target.result);
        if (raw.words && Array.isArray(raw.words)) {
          setSprechenKaraokeData(raw);
          if (raw.audioUrl && !sprechenAudioUrl) {
            setSprechenAudioUrl(raw.audioUrl);
          }
          toast.success(`Sprechen karaoke timing loaded: ${raw.words.length} words`);
        } else if (Array.isArray(raw)) {
          setSprechenKaraokeData({ words: raw });
          toast.success(`Sprechen karaoke timing loaded: ${raw.length} words`);
        } else if (raw.sentences && Array.isArray(raw.sentences) && raw.sentences[0]?.words) {
          setSprechenKaraokeData({ words: raw.sentences[0].words });
          if (raw.audioUrl && !sprechenAudioUrl) {
            setSprechenAudioUrl(raw.audioUrl);
          }
          toast.success(`Sprechen karaoke timing loaded: ${raw.sentences[0].words.length} words`);
        } else {
          toast.error('Invalid format — expected { "words": [{ "word", "start", "end" }] }');
        }
      } catch (err) {
        toast.error(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Helper: Download Sprechen Lip-Sync template JSON
  const downloadSprechenTemplate = () => {
    const promptWords = (sprechenPrompt || '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(Boolean);

    const template = {
      _comment: 'Word-level timing for Stage: Sprechen Lip-Sync. Words illuminate in real-time as reference audio plays.',
      audioUrl: sprechenAudioUrl || '/api/notes/audio/db/YOUR_ID',
      words: promptWords.length > 0
        ? promptWords.map((w, i) => ({
            word: w,
            start: parseFloat((i * 0.5).toFixed(2)),
            end: parseFloat(((i * 0.5) + 0.45).toFixed(2)),
          }))
        : [
            { word: 'Guten', start: 0.0, end: 0.45 },
            { word: 'Tag!', start: 0.45, end: 0.95 },
            { word: 'Wie', start: 1.10, end: 1.35 },
            { word: 'geht', start: 1.35, end: 1.65 },
            { word: 'es', start: 1.65, end: 1.85 },
            { word: 'dir?', start: 1.85, end: 2.30 },
          ],
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sprechen_lipsync_template.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Sprechen template downloaded with ${promptWords.length || 6} words!`);
  };

  // Default stage sequence and metadata
  const ALL_STAGE_KEYS = [
    'word_match',
    'listen_tap',
    'picture_select',
    'cloze_test',
    'sentence_builder',
    'type_word',
    'dialogue_bubble',
    'listen_select',
    'sprechen',
    'karaoke',
  ];

  const STAGE_META = {
    word_match: {
      label: 'Match the Word Pairs',
      icon: '🧩',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
    },
    listen_tap: {
      label: 'Listen & Tap (Echo)',
      icon: '🎧',
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30',
    },
    picture_select: {
      label: 'Picture Vocabulary Cards',
      icon: '🖼️',
      color: 'from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30',
    },
    cloze_test: {
      label: 'Fill-in-the-Blank (Cloze)',
      icon: '📝',
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30',
    },
    sentence_builder: {
      label: 'Sentence Builder',
      icon: '✍️',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
    },
    type_word: {
      label: 'Spelling Entry',
      icon: '⌨️',
      color: 'from-violet-500/20 to-fuchsia-500/20 text-violet-300 border-violet-500/30',
    },
    dialogue_bubble: {
      label: 'Dialogue Messenger',
      icon: '💬',
      color: 'from-cyan-500/20 to-sky-500/20 text-cyan-300 border-cyan-500/30',
    },
    listen_select: {
      label: 'Listen & Select MCQ',
      icon: '🔊',
      color: 'from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30',
    },
    sprechen: {
      label: 'Sprechen Voice & Lip-Sync',
      icon: '🎙️',
      color: 'from-red-500/20 to-rose-500/20 text-red-300 border-red-500/30',
    },
    karaoke: {
      label: 'Karaoke Synced Story',
      icon: '🎵',
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/30',
    },
  };

  // Modular Challenge Stage Toggles (All 10 interactive stage formats)
  const [enableWordMatch, setEnableWordMatch] = useState(true);
  const [enableListenTap, setEnableListenTap] = useState(true);
  const [enablePictureSelect, setEnablePictureSelect] = useState(false);
  const [enableClozeTest, setEnableClozeTest] = useState(false);
  const [enableSentenceBuilder, setEnableSentenceBuilder] = useState(true);
  const [enableTypeWord, setEnableTypeWord] = useState(false);
  const [enableDialogueBubble, setEnableDialogueBubble] = useState(false);
  const [enableListenSelect, setEnableListenSelect] = useState(false);
  const [enableSprechen, setEnableSprechen] = useState(true);
  const [enableKaraoke, setEnableKaraoke] = useState(false);

  // Dynamic Challenge Solving Sequence (Controlled Reordering)
  const [stageOrder, setStageOrder] = useState([...ALL_STAGE_KEYS]);

  const moveStageUp = (stageKey) => {
    setStageOrder(prev => {
      const idx = prev.indexOf(stageKey);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  const moveStageDown = (stageKey) => {
    setStageOrder(prev => {
      const idx = prev.indexOf(stageKey);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      return next;
    });
  };

  // Enabled stage mapping & active learner sequence
  const stageEnabledMap = {
    word_match: enableWordMatch,
    listen_tap: enableListenTap,
    picture_select: enablePictureSelect,
    cloze_test: enableClozeTest,
    sentence_builder: enableSentenceBuilder,
    type_word: enableTypeWord,
    dialogue_bubble: enableDialogueBubble,
    listen_select: enableListenSelect,
    sprechen: enableSprechen,
    karaoke: enableKaraoke,
  };

  const activeStages = stageOrder.filter(key => stageEnabledMap[key]);

  // Stage 1: Word Match Pairs
  const [wordPairs, setWordPairs] = useState([]);

  // Stage: Picture Vocabulary Cards (WebP auto-compressed)
  const [picturePrompt, setPicturePrompt] = useState('Choose the correct picture');
  const [pictureTargetWord, setPictureTargetWord] = useState('');
  const [pictureTranslation, setPictureTranslation] = useState('');
  const [pictureOptions, setPictureOptions] = useState([
    { id: 'opt_1', text: '', imageUrl: '', isCorrect: true, savingsInfo: '' },
    { id: 'opt_2', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
    { id: 'opt_3', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
    { id: 'opt_4', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
  ]);
  const [uploadingPictureIdx, setUploadingPictureIdx] = useState(null);

  const handleUploadOptionImage = async (index, file) => {
    if (!file) return;
    setUploadingPictureIdx(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/curriculum/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success && res.data.url) {
        setPictureOptions(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            imageUrl: res.data.url,
            savingsInfo: res.data.message || `WebP (${Math.round((res.data.compressedSizeBytes || 0) / 1024)} KB)`
          };
          return next;
        });
        toast.success(res.data.message || 'Image optimized to WebP!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingPictureIdx(null);
    }
  };

  // Stage 2: Listen & Tap
  const [listenTarget, setListenTarget] = useState('');
  const [listenDistractors, setListenDistractors] = useState('');

  // Stage 3: Cloze Test (Fill-in-the-Blank with instant audio)
  const [clozePrompt, setClozePrompt] = useState('');
  const [clozeTranslation, setClozeTranslation] = useState('');
  const [clozeBlank, setClozeBlank] = useState('');
  const [clozeOptions, setClozeOptions] = useState(['', '', '']);
  const [clozeAudioUrl, setClozeAudioUrl] = useState('');

  // Stage 4: Sentence Builder (Syntax Puzzle)
  const [builderPrompt, setBuilderPrompt] = useState('');
  const [builderTarget, setBuilderTarget] = useState('');
  const [builderDistractors, setBuilderDistractors] = useState('');

  // Stage 5: Type Word (German Spelling Entry with Umlaut Toolbar)
  const [typePrompt, setTypePrompt] = useState('');
  const [typeTarget, setTypeTarget] = useState('');
  const [typeTranslation, setTypeTranslation] = useState('');
  const [typeHint, setTypeHint] = useState('');
  const [typeAudioUrl, setTypeAudioUrl] = useState('');

  // Stage 6: Dialogue Bubble (Chat Messenger Flow)
  const [dialoguePartnerName, setDialoguePartnerName] = useState('Anna');
  const [dialoguePartnerAvatar, setDialoguePartnerAvatar] = useState('dolphina');
  const [dialoguePartnerMessage, setDialoguePartnerMessage] = useState('');
  const [dialogueTranslation, setDialogueTranslation] = useState('');
  const [dialogueOptions, setDialogueOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ]);
  const [dialogueAudioUrl, setDialogueAudioUrl] = useState('');

  // Stage 7: Listen & Select (Audio Comprehension with 1.0x & 0.75x turtle)
  const [listenSelectSentence, setListenSelectSentence] = useState('');
  const [listenSelectQuestion, setListenSelectQuestion] = useState('');
  const [listenSelectOptions, setListenSelectOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [listenSelectAudioUrl, setListenSelectAudioUrl] = useState('');

  // Stage 8: Sprechen Voice & Lip-Sync Karaoke
  const [sprechenPrompt, setSprechenPrompt] = useState('');
  const [sprechenTranslation, setSprechenTranslation] = useState('');
  const [sprechenAccuracy, setSprechenAccuracy] = useState(75);
  const [sprechenAudioUrl, setSprechenAudioUrl] = useState('');
  const [uploadingSprechenAudio, setUploadingSprechenAudio] = useState(false);
  const sprechenAudioInputRef = useRef(null);
  const [sprechenKaraokeData, setSprechenKaraokeData] = useState(null);
  const [sprechenKaraokeFileName, setSprechenKaraokeFileName] = useState('');
  const sprechenKaraokeInputRef = useRef(null);

  // Stage 9: Karaoke Story
  const [karaokeStory, setKaraokeStory] = useState('');
  const [karaokeTranslation, setKaraokeTranslation] = useState('');

  // Helper methods for Cloze Test options
  const addClozeOption = () => setClozeOptions(prev => [...prev, '']);
  const updateClozeOption = (idx, val) => setClozeOptions(prev => prev.map((o, i) => i === idx ? val : o));
  const removeClozeOption = (idx) => setClozeOptions(prev => prev.filter((_, i) => i !== idx));
  const insertClozeBlankToken = () => {
    setClozePrompt(prev => {
      const p = prev || '';
      return p.includes('_______') ? p : `${p.trim()} _______`;
    });
  };

  // Helper method for Umlaut quick-tap
  const insertUmlaut = (char) => {
    setTypeTarget(prev => (prev || '') + char);
  };

  // Helper methods for Dialogue Bubble options
  const addDialogueOption = () => setDialogueOptions(prev => [...prev, { text: '', isCorrect: false }]);
  const updateDialogueOptionText = (idx, text) => setDialogueOptions(prev => prev.map((o, i) => i === idx ? { ...o, text } : o));
  const setCorrectDialogueOption = (idx) => setDialogueOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  const removeDialogueOption = (idx) => setDialogueOptions(prev => prev.filter((_, i) => i !== idx));

  // Helper methods for Listen & Select options
  const addListenSelectOption = () => setListenSelectOptions(prev => [...prev, { text: '', isCorrect: false }]);
  const updateListenSelectOptionText = (idx, text) => setListenSelectOptions(prev => prev.map((o, i) => i === idx ? { ...o, text } : o));
  const setCorrectListenSelectOption = (idx) => setListenSelectOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  const removeListenSelectOption = (idx) => setListenSelectOptions(prev => prev.filter((_, i) => i !== idx));

  // Fetch available notes for 1-click import
  useEffect(() => {
    if (isOpen) {
      setLoadingNotes(true);
      api.get('/notes?limit=50')
        .then(res => {
          setNotesList(res.data.notes || []);
        })
        .catch(() => {})
        .finally(() => setLoadingNotes(false));
    }
  }, [isOpen]);

  // Populate data when editing an existing lesson
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title || '');
      setSubtitle(initialData.subtitle || '');
      setNodeType(initialData.nodeType || 'lesson');
      setXpReward(initialData.xpReward || 15);
      setPearlsReward(initialData.pearlsReward || 5);
      setIsLive(Boolean(initialData.isLive));
      setSourceNoteId(initialData.sourceNoteId || '');

      let stages = [];
      if (Array.isArray(initialData.stages)) {
        stages = initialData.stages;
      } else if (typeof initialData.stages === 'string' && initialData.stages.trim()) {
        try {
          stages = JSON.parse(initialData.stages);
        } catch (_) {
          stages = [];
        }
      }

      const matchStage = stages.find(s => s.type === 'word_match' || s.type === 'match_pairs');
      const listenStage = stages.find(s => s.type === 'listen_tap');
      const pictureStage = stages.find(s => s.type === 'picture_select' || s.type === 'picture_cards');
      const clozeStage = stages.find(s => s.type === 'cloze_test' || s.type === 'cloze');
      const builderStage = stages.find(s => s.type === 'sentence_builder');
      const typeStage = stages.find(s => s.type === 'type_word' || s.type === 'type_input');
      const dialogueStage = stages.find(s => s.type === 'dialogue_bubble' || s.type === 'dialogue');
      const listenSelectStage = stages.find(s => s.type === 'listen_select' || s.type === 'listen_comprehension');
      const sprechenStage = stages.find(s => s.type === 'sprechen');
      const karaokeStage = stages.find(s => s.type === 'karaoke');

      // Detect and preserve custom stage solving order from saved stages
      const stageTypeMap = {
        'match_pairs': 'word_match',
        'word_match': 'word_match',
        'listen_tap': 'listen_tap',
        'picture_select': 'picture_select',
        'picture_cards': 'picture_select',
        'cloze_test': 'cloze_test',
        'cloze': 'cloze_test',
        'sentence_builder': 'sentence_builder',
        'type_word': 'type_word',
        'type_input': 'type_word',
        'dialogue_bubble': 'dialogue_bubble',
        'dialogue': 'dialogue_bubble',
        'listen_select': 'listen_select',
        'listen_comprehension': 'listen_select',
        'sprechen': 'sprechen',
        'karaoke': 'karaoke',
      };

      const detectedOrder = [];
      stages.forEach(s => {
        const normKey = stageTypeMap[s.type];
        if (normKey && !detectedOrder.includes(normKey)) {
          detectedOrder.push(normKey);
        }
      });
      ALL_STAGE_KEYS.forEach(key => {
        if (!detectedOrder.includes(key)) {
          detectedOrder.push(key);
        }
      });
      setStageOrder(detectedOrder);

      // Stage 1: Word Match
      setEnableWordMatch(Boolean(matchStage));
      if (matchStage?.pairs && Array.isArray(matchStage.pairs) && matchStage.pairs.length > 0) {
        setWordPairs(matchStage.pairs.map(p => ({
          target: p.target || p.german || p.word || '',
          native: p.native || p.english || p.translation || '',
        })));
      } else {
        setWordPairs([]);
      }

      // Stage 2: Listen & Tap
      setEnableListenTap(Boolean(listenStage));
      if (listenStage) {
        setListenTarget(listenStage.targetSentence || '');
        setListenAudioUrl(listenStage.audioUrl || '');
        setListenWordsAudioUrl(listenStage.wordsAudioUrl || '');
        setListenSentenceRange(listenStage.sentenceRange || null);
        if (listenStage.wordTimestamps) {
          if (Array.isArray(listenStage.wordTimestamps)) {
            setListenWordTimestamps(listenStage.wordTimestamps);
          } else if (listenStage.wordTimestamps.words) {
            setListenWordTimestamps(listenStage.wordTimestamps.words);
            if (listenStage.wordTimestamps.wordsAudioUrl && !listenStage.wordsAudioUrl) {
              setListenWordsAudioUrl(listenStage.wordTimestamps.wordsAudioUrl);
            }
            if (listenStage.wordTimestamps.sentenceRange && !listenStage.sentenceRange) {
              setListenSentenceRange(listenStage.wordTimestamps.sentenceRange);
            }
          }
          setListenTimestampsFileName('Attached Word Timestamps');
        } else {
          setListenWordTimestamps(null);
          setListenTimestampsFileName('');
        }
        // Distractor tokens
        if (listenStage.tokens && listenStage.targetSentence) {
          const targetTokens = new Set(listenStage.targetSentence
            .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
            .split(/\s+/)
            .filter(Boolean)
            .map(w => w.toLowerCase()));
          const distractors = listenStage.tokens
            .filter(t => !targetTokens.has(t.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '').toLowerCase()))
            .join(', ');
          setListenDistractors(distractors);
        } else {
          setListenDistractors('');
        }
      } else {
        setListenTarget('');
        setListenDistractors('');
        setListenAudioUrl('');
        setListenWordsAudioUrl('');
        setListenSentenceRange(null);
        setListenWordTimestamps(null);
        setListenTimestampsFileName('');
      }

      // Stage: Picture Vocabulary Cards
      setEnablePictureSelect(Boolean(pictureStage));
      if (pictureStage) {
        setPicturePrompt(pictureStage.prompt || 'Choose the correct picture');
        setPictureTargetWord(pictureStage.targetWord || pictureStage.target || '');
        setPictureTranslation(pictureStage.translation || '');
        if (Array.isArray(pictureStage.options) && pictureStage.options.length > 0) {
          setPictureOptions(pictureStage.options.map((opt, i) => ({
            id: opt.id || `opt_${i + 1}`,
            text: opt.text || opt.word || '',
            imageUrl: opt.imageUrl || opt.image || '',
            isCorrect: Boolean(opt.isCorrect),
            savingsInfo: '',
          })));
        } else {
          setPictureOptions([
            { id: 'opt_1', text: '', imageUrl: '', isCorrect: true, savingsInfo: '' },
            { id: 'opt_2', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
            { id: 'opt_3', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
            { id: 'opt_4', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
          ]);
        }
      } else {
        setPicturePrompt('Choose the correct picture');
        setPictureTargetWord('');
        setPictureTranslation('');
        setPictureOptions([
          { id: 'opt_1', text: '', imageUrl: '', isCorrect: true, savingsInfo: '' },
          { id: 'opt_2', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
          { id: 'opt_3', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
          { id: 'opt_4', text: '', imageUrl: '', isCorrect: false, savingsInfo: '' },
        ]);
      }

      // Stage 3: Cloze Test
      setEnableClozeTest(Boolean(clozeStage));
      if (clozeStage) {
        setClozePrompt(clozeStage.prompt || clozeStage.sentence || '');
        setClozeTranslation(clozeStage.translation || '');
        setClozeBlank(clozeStage.blank || clozeStage.target || clozeStage.correctOption || clozeStage.correctAnswer || '');
        if (Array.isArray(clozeStage.options) && clozeStage.options.length > 0) {
          setClozeOptions(clozeStage.options.map(o => (typeof o === 'string' ? o : (o.text || ''))));
        } else {
          setClozeOptions(['', '', '']);
        }
        setClozeAudioUrl(clozeStage.audioUrl || '');
      } else {
        setClozePrompt('');
        setClozeTranslation('');
        setClozeBlank('');
        setClozeOptions(['', '', '']);
        setClozeAudioUrl('');
      }

      // Stage 4: Sentence Builder
      setEnableSentenceBuilder(Boolean(builderStage));
      if (builderStage) {
        setBuilderPrompt(builderStage.prompt ? builderStage.prompt.replace(/^Translate:\s*"?|"?$/gi, '') : '');
        setBuilderTarget(builderStage.targetSentence || '');
        if (builderStage.tokens && builderStage.targetSentence) {
          const targetTokens = new Set(builderStage.targetSentence
            .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
            .split(/\s+/)
            .filter(Boolean)
            .map(w => w.toLowerCase()));
          const distractors = builderStage.tokens
            .filter(t => !targetTokens.has(t.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '').toLowerCase()))
            .join(', ');
          setBuilderDistractors(distractors);
        } else {
          setBuilderDistractors('');
        }
      } else {
        setBuilderPrompt('');
        setBuilderTarget('');
        setBuilderDistractors('');
      }

      // Stage 5: Type Word
      setEnableTypeWord(Boolean(typeStage));
      if (typeStage) {
        setTypePrompt(typeStage.prompt || typeStage.sentence || '');
        setTypeTarget(typeStage.target || typeStage.targetWord || typeStage.word || typeStage.correctAnswer || '');
        setTypeTranslation(typeStage.translation || typeStage.nativeMeaning || '');
        setTypeHint(typeStage.hint || '');
        setTypeAudioUrl(typeStage.audioUrl || '');
      } else {
        setTypePrompt('');
        setTypeTarget('');
        setTypeTranslation('');
        setTypeHint('');
        setTypeAudioUrl('');
      }

      // Stage 6: Dialogue Bubble
      setEnableDialogueBubble(Boolean(dialogueStage));
      if (dialogueStage) {
        setDialoguePartnerName(dialogueStage.partnerName || dialogueStage.speaker || 'Anna');
        setDialoguePartnerAvatar(dialogueStage.partnerAvatar || 'dolphina');
        setDialoguePartnerMessage(dialogueStage.partnerMessage || dialogueStage.prompt || dialogueStage.message || '');
        setDialogueTranslation(dialogueStage.translation || '');
        if (Array.isArray(dialogueStage.options) && dialogueStage.options.length > 0) {
          const correct = (dialogueStage.correctOption || dialogueStage.correctAnswer || '').toString().trim();
          setDialogueOptions(dialogueStage.options.map((opt, i) => {
            if (typeof opt === 'object' && opt !== null) {
              return { text: opt.text || '', isCorrect: opt.isCorrect !== undefined ? Boolean(opt.isCorrect) : (i === 0) };
            }
            const txt = String(opt);
            return { text: txt, isCorrect: correct ? txt.toLowerCase() === correct.toLowerCase() : (i === 0) };
          }));
        } else {
          setDialogueOptions([
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
          ]);
        }
        setDialogueAudioUrl(dialogueStage.audioUrl || '');
      } else {
        setDialoguePartnerName('Anna');
        setDialoguePartnerAvatar('dolphina');
        setDialoguePartnerMessage('');
        setDialogueTranslation('');
        setDialogueOptions([
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ]);
        setDialogueAudioUrl('');
      }

      // Stage 7: Listen & Select
      setEnableListenSelect(Boolean(listenSelectStage));
      if (listenSelectStage) {
        setListenSelectSentence(listenSelectStage.spokenGerman || listenSelectStage.sentence || listenSelectStage.targetSentence || '');
        setListenSelectQuestion(listenSelectStage.question || listenSelectStage.prompt || '');
        if (Array.isArray(listenSelectStage.options) && listenSelectStage.options.length > 0) {
          const correct = (listenSelectStage.correctOption || listenSelectStage.correctAnswer || '').toString().trim();
          setListenSelectOptions(listenSelectStage.options.map((opt, i) => {
            if (typeof opt === 'object' && opt !== null) {
              return { text: opt.text || '', isCorrect: opt.isCorrect !== undefined ? Boolean(opt.isCorrect) : (i === 0) };
            }
            const txt = String(opt);
            return { text: txt, isCorrect: correct ? txt.toLowerCase() === correct.toLowerCase() : (i === 0) };
          }));
        } else {
          setListenSelectOptions([
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ]);
        }
        setListenSelectAudioUrl(listenSelectStage.audioUrl || '');
      } else {
        setListenSelectSentence('');
        setListenSelectQuestion('');
        setListenSelectOptions([
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]);
        setListenSelectAudioUrl('');
      }

      // Stage 8: Sprechen
      setEnableSprechen(Boolean(sprechenStage));
      if (sprechenStage) {
        setSprechenPrompt(sprechenStage.prompt || '');
        setSprechenTranslation(sprechenStage.translation || '');
        setSprechenAccuracy(sprechenStage.minAccuracy || 75);
        setSprechenAudioUrl(sprechenStage.audioUrl || '');
        if (sprechenStage.karaokeData) {
          const skd = typeof sprechenStage.karaokeData === 'string' ? JSON.parse(sprechenStage.karaokeData) : sprechenStage.karaokeData;
          setSprechenKaraokeData(skd);
          setSprechenKaraokeFileName('Attached Karaoke Timing');
        } else {
          setSprechenKaraokeData(null);
          setSprechenKaraokeFileName('');
        }
      } else {
        setSprechenPrompt('');
        setSprechenTranslation('');
        setSprechenAccuracy(75);
        setSprechenAudioUrl('');
        setSprechenKaraokeData(null);
        setSprechenKaraokeFileName('');
      }

      // Stage 9: Karaoke
      setEnableKaraoke(Boolean(karaokeStage) || initialData.nodeType === 'karaoke');
      if (karaokeStage) {
        setKaraokeStory(karaokeStage.storyText || '');
        setKaraokeTranslation(karaokeStage.translationText || '');
        setKaraokeAudioUrl(karaokeStage.audioUrl || '');
      } else {
        setKaraokeStory('');
        setKaraokeTranslation('');
        setKaraokeAudioUrl('');
      }

      if (initialData.karaokeData) {
        const kd = typeof initialData.karaokeData === 'string' ? JSON.parse(initialData.karaokeData) : initialData.karaokeData;
        setKaraokeJsonData(kd);
        setKaraokeJsonFileName('Attached Alignment JSON');
      } else if (karaokeStage?.karaokeData) {
        setKaraokeJsonData(karaokeStage.karaokeData);
        setKaraokeJsonFileName('Attached Alignment JSON');
      } else {
        setKaraokeJsonData(null);
        setKaraokeJsonFileName('');
      }
    } else {
      // New lesson defaults — clean, empty slate ready for input
      setTitle('');
      setSubtitle('');
      setNodeType('lesson');
      setXpReward(15);
      setPearlsReward(5);
      setIsLive(false); // DEFAULT OFF
      setSourceNoteId('');

      setListenAudioUrl('');
      setListenWordsAudioUrl('');
      setListenSentenceRange(null);
      setListenWordTimestamps(null);
      setListenTimestampsFileName('');

      setSprechenAudioUrl('');
      setSprechenKaraokeData(null);
      setSprechenKaraokeFileName('');

      setKaraokeAudioUrl('');
      setKaraokeJsonData(null);
      setKaraokeJsonFileName('');

      setEnableWordMatch(true);
      setWordPairs([]);

      setEnableListenTap(true);
      setListenTarget('');
      setListenDistractors('');

      setEnableSentenceBuilder(true);
      setBuilderPrompt('');
      setBuilderTarget('');
      setBuilderDistractors('');

      setEnableSprechen(true);
      setSprechenPrompt('');
      setSprechenTranslation('');
      setSprechenAccuracy(75);

      setEnableClozeTest(false);
      setClozePrompt('');
      setClozeTranslation('');
      setClozeBlank('');
      setClozeOptions(['', '', '']);
      setClozeAudioUrl('');

      setEnableTypeWord(false);
      setTypePrompt('');
      setTypeTarget('');
      setTypeTranslation('');
      setTypeHint('');
      setTypeAudioUrl('');

      setEnableDialogueBubble(false);
      setDialoguePartnerName('Anna');
      setDialoguePartnerAvatar('dolphina');
      setDialoguePartnerMessage('');
      setDialogueTranslation('');
      setDialogueOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ]);
      setDialogueAudioUrl('');

      setEnableListenSelect(false);
      setListenSelectSentence('');
      setListenSelectQuestion('');
      setListenSelectOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      setListenSelectAudioUrl('');

      setEnableKaraoke(false);
      setKaraokeStory('');
      setKaraokeTranslation('');

      // Reset stage sequence order to default
      setStageOrder([...ALL_STAGE_KEYS]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Import from existing Note
  const handleImportNote = (noteId) => {
    setSourceNoteId(noteId);
    if (!noteId) return;

    const note = notesList.find(n => String(n.id) === String(noteId) || String(n._id) === String(noteId));
    if (!note) return;

    setTitle(note.title || title);
    if (note.audioUrl) {
      if (note.isKaraoke || note.karaokeData) {
        setKaraokeAudioUrl(note.audioUrl);
      } else {
        setListenAudioUrl(note.audioUrl);
      }
    }

    // If note has karaokeData, import sentences and vocabulary
    if (note.karaokeData) {
      const kd = typeof note.karaokeData === 'string' ? JSON.parse(note.karaokeData) : note.karaokeData;
      if (kd.sentences && kd.sentences.length > 0) {
        const firstSentence = kd.sentences[0];
        setListenTarget(firstSentence.text || listenTarget);
        setBuilderTarget(firstSentence.text || builderTarget);
        setSprechenPrompt(firstSentence.text || sprechenPrompt);
        if (firstSentence.translation) {
          setBuilderPrompt(firstSentence.translation);
          setSprechenTranslation(firstSentence.translation);
        }
      }
      if (kd.vocabMap) {
        const pairs = Object.entries(kd.vocabMap).slice(0, 6).map(([k, v]) => ({
          target: k,
          native: typeof v === 'object' ? (v.meaning || k) : String(v),
        }));
        if (pairs.length > 0) setWordPairs(pairs);
      }
      setKaraokeJsonData(kd);
      setKaraokeJsonFileName(`Imported from Note: ${note.title}`);
      setEnableKaraoke(true);
      setKaraokeStory(note.content?.slice(0, 500) || '');
    }
    toast.success(`Imported content from note: "${note.title}"`);
  };

  // Add / Remove Word Match pairs
  const addWordPair = () => {
    setWordPairs(prev => [...prev, { target: '', native: '' }]);
  };
  const updateWordPair = (index, field, value) => {
    setWordPairs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };
  const removeWordPair = (index) => {
    setWordPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    setLoading(true);

    // Stage builder dictionary for assembling modular stages in chosen sequence
    const buildStageByKey = (key) => {
      switch (key) {
        case 'word_match': {
          if (!enableWordMatch) return null;
          const validPairs = wordPairs.filter(p => p.target.trim() && p.native.trim());
          if (validPairs.length === 0) return null;
          return {
            type: 'word_match',
            title: 'Match the word pairs',
            pairs: validPairs,
          };
        }

        case 'listen_tap': {
          if (!enableListenTap || !listenTarget.trim()) return null;
          const targetTokens = listenTarget
            .replace(/[.,/#!$%^&*;:{}=\-_'~`()?"'«»]/g, '')
            .split(/\s+/)
            .filter(Boolean);
          const extraTokens = listenDistractors
            .split(/[,;\s]+/)
            .map(s => s.trim())
            .filter(Boolean);
          const allTokens = [...targetTokens, ...extraTokens];

          return {
            type: 'listen_tap',
            title: 'Listen and tap what you hear',
            targetSentence: listenTarget.trim(),
            tokens: allTokens,
            audioUrl: listenAudioUrl.trim() || null,
            wordsAudioUrl: listenWordsAudioUrl.trim() || null,
            sentenceRange: listenSentenceRange || null,
            wordTimestamps: listenWordTimestamps || null,
          };
        }

        case 'picture_select': {
          if (!enablePictureSelect) return null;
          const validOptions = pictureOptions
            .filter(o => o.text.trim() || o.imageUrl.trim())
            .map(o => ({
              id: o.id,
              text: o.text.trim(),
              imageUrl: o.imageUrl.trim(),
              isCorrect: Boolean(o.isCorrect),
            }));

          if (validOptions.length === 0) return null;
          return {
            type: 'picture_select',
            title: 'Picture Vocabulary Selection',
            prompt: picturePrompt.trim() || 'Choose the correct picture',
            targetWord: pictureTargetWord.trim(),
            translation: pictureTranslation.trim(),
            options: validOptions,
          };
        }

        case 'cloze_test': {
          if (!enableClozeTest || !clozePrompt.trim()) return null;
          const validOptions = clozeOptions.map(o => o.trim()).filter(Boolean);
          return {
            type: 'cloze_test',
            title: 'Fill in the blank',
            prompt: clozePrompt.trim(),
            sentence: clozePrompt.trim(),
            translation: clozeTranslation.trim(),
            blank: clozeBlank.trim(),
            target: clozeBlank.trim(),
            correctOption: clozeBlank.trim(),
            correctAnswer: clozeBlank.trim(),
            options: validOptions.length > 0 ? validOptions : [clozeBlank.trim()],
            audioUrl: clozeAudioUrl.trim() || null,
          };
        }

        case 'sentence_builder': {
          if (!enableSentenceBuilder || !builderTarget.trim()) return null;
          const targetTokens = builderTarget
            .replace(/[.,/#!$%^&*;:{}=\-_'~`()?"'«»]/g, '')
            .split(/\s+/)
            .filter(Boolean);
          const extraTokens = builderDistractors
            .split(/[,;\s]+/)
            .map(s => s.trim())
            .filter(Boolean);
          const allTokens = [...targetTokens, ...extraTokens];

          return {
            type: 'sentence_builder',
            title: 'Construct the German sentence',
            prompt: `Translate: "${builderPrompt.trim()}"`,
            targetSentence: builderTarget.trim(),
            tokens: allTokens,
          };
        }

        case 'type_word': {
          if (!enableTypeWord || (!typeTarget.trim() && !typePrompt.trim())) return null;
          return {
            type: 'type_word',
            title: 'Type in German',
            prompt: typePrompt.trim(),
            target: typeTarget.trim(),
            targetWord: typeTarget.trim(),
            word: typeTarget.trim(),
            correctAnswer: typeTarget.trim(),
            translation: typeTranslation.trim(),
            nativeMeaning: typeTranslation.trim(),
            hint: typeHint.trim() || null,
            audioUrl: typeAudioUrl.trim() || null,
          };
        }

        case 'dialogue_bubble': {
          if (!enableDialogueBubble || !dialoguePartnerMessage.trim()) return null;
          const validDialogueOpts = dialogueOptions.filter(o => o.text && o.text.trim());
          const correctChoice = validDialogueOpts.find(o => o.isCorrect)?.text || validDialogueOpts[0]?.text || '';
          return {
            type: 'dialogue_bubble',
            title: 'Complete the Chat',
            partnerName: dialoguePartnerName.trim() || 'Anna',
            partnerAvatar: dialoguePartnerAvatar || 'dolphina',
            prompt: dialoguePartnerMessage.trim(),
            partnerMessage: dialoguePartnerMessage.trim(),
            translation: dialogueTranslation.trim(),
            options: validDialogueOpts.map(o => ({ text: o.text.trim(), isCorrect: Boolean(o.isCorrect) })),
            correctOption: correctChoice,
            correctAnswer: correctChoice,
            audioUrl: dialogueAudioUrl.trim() || null,
          };
        }

        case 'listen_select': {
          if (!enableListenSelect || !listenSelectSentence.trim()) return null;
          const validSelectOpts = listenSelectOptions.filter(o => o.text && o.text.trim());
          const correctSelectChoice = validSelectOpts.find(o => o.isCorrect)?.text || validSelectOpts[0]?.text || '';
          return {
            type: 'listen_select',
            title: 'Listen and choose the meaning',
            spokenGerman: listenSelectSentence.trim(),
            sentence: listenSelectSentence.trim(),
            targetSentence: listenSelectSentence.trim(),
            question: listenSelectQuestion.trim(),
            prompt: listenSelectQuestion.trim(),
            options: validSelectOpts.map(o => ({ text: o.text.trim(), isCorrect: Boolean(o.isCorrect) })),
            correctOption: correctSelectChoice,
            correctAnswer: correctSelectChoice,
            audioUrl: listenSelectAudioUrl.trim() || null,
          };
        }

        case 'sprechen': {
          if (!enableSprechen || !sprechenPrompt.trim()) return null;
          return {
            type: 'sprechen',
            title: 'Pronounce Auf Deutsch',
            prompt: sprechenPrompt.trim(),
            translation: sprechenTranslation.trim(),
            minAccuracy: parseInt(sprechenAccuracy, 10) || 75,
            audioUrl: sprechenAudioUrl.trim() || null,
            karaokeData: sprechenKaraokeData || null,
          };
        }

        case 'karaoke': {
          if (!enableKaraoke) return null;
          return {
            type: 'karaoke',
            title: 'Karaoke Synced Rhythm',
            storyText: karaokeStory.trim(),
            translationText: karaokeTranslation.trim(),
            audioUrl: karaokeAudioUrl.trim() || null,
            karaokeData: karaokeJsonData || null,
          };
        }

        default:
          return null;
      }
    };

    // Assemble modular stages strictly in the user's customized sequence order
    const stages = [];
    stageOrder.forEach(key => {
      const built = buildStageByKey(key);
      if (built) {
        stages.push(built);
      }
    });

    // Retain any unmanaged custom stages from initialData
    const managedTypes = new Set([
      'word_match', 'match_pairs',
      'listen_tap',
      'picture_select', 'picture_cards',
      'cloze_test', 'cloze',
      'sentence_builder',
      'type_word', 'type_input',
      'dialogue_bubble', 'dialogue',
      'listen_select', 'listen_comprehension',
      'sprechen',
      'karaoke'
    ]);
    const existingStages = Array.isArray(initialData?.stages) ? initialData.stages : [];
    const otherStages = existingStages.filter(s => !managedTypes.has(s.type));
    stages.push(...otherStages);

    const payload = {
      learningLanguage: currentLanguage,
      nativeLanguage: currentNative,
      level: currentLevel,
      unitNumber: currentUnit,
      title: title.trim(),
      subtitle: subtitle.trim(),
      nodeType,
      xpReward: parseInt(xpReward, 10) || 15,
      pearlsReward: parseInt(pearlsReward, 10) || 5,
      isLive: Boolean(isLive),
      audioUrl: null, // Strictly decoupled; stages maintain their own audio
      karaokeData: karaokeJsonData || null,
      sourceNoteId: sourceNoteId ? parseInt(sourceNoteId, 10) : null,
      stages,
    };

    try {
      if (initialData?.id || initialData?._id) {
        const id = initialData.id || initialData._id;
        await api.put(`/curriculum/lessons/${id}`, payload);
        toast.success(`Lesson "${title}" updated!`);
      } else {
        await api.post('/curriculum/lessons', payload);
        toast.success(`Lesson "${title}" created (Status: ${isLive ? 'LIVE 🟢' : 'DRAFT 🔒'})!`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Render unified stage header with Move Up / Move Down sequence controls
  const renderStageHeader = (stageKey, orderIndex, title, icon, isEnabled, setIsEnabled, extraRight) => {
    const activeIdx = activeStages.indexOf(stageKey);
    const activeNumber = activeIdx !== -1 ? activeIdx + 1 : null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Reordering Controls (Move Up / Down) */}
          <div className="flex items-center gap-0.5 bg-black/50 border border-white/10 rounded-xl p-0.5 shadow-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveStageUp(stageKey);
              }}
              disabled={orderIndex === 0}
              className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Move earlier in solving order (↑)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveStageDown(stageKey);
              }}
              disabled={orderIndex === stageOrder.length - 1}
              className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Move later in solving order (↓)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Checkbox and Title */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={e => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
            />
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <span>{icon}</span> {title}
            </span>
          </label>

          {/* Active sequence position badge */}
          {isEnabled ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Solving Step #{activeNumber} of {activeStages.length}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-800/80 text-gray-500 border border-white/5">
              Skipped (Disabled)
            </span>
          )}
        </div>

        {/* Extra Action Buttons on Right */}
        {extraRight && (
          <div className="flex items-center gap-2 flex-wrap">
            {extraRight}
          </div>
        )}
      </div>
    );
  };

  // Helper: Render modular challenge stage card according to sequence position
  const renderStageCard = (stageKey, orderIndex) => {
    switch (stageKey) {
      case 'word_match':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableWordMatch ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('word_match', orderIndex, 'Stage: Match the Word Pairs', '🧩', enableWordMatch, setEnableWordMatch, (
                enableWordMatch && (
                  <>
                    <button
                      type="button"
                      onClick={downloadWordMatchTemplate}
                      className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:border-cyan-400"
                      title="Download JSON template for word match pairs"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => wordMatchInputRef.current?.click()}
                      className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:border-cyan-400"
                      title="Upload JSON file with word pairs"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Upload JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={addWordPair}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Pair
                    </button>
                    <input
                      ref={wordMatchInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleWordMatchJsonSelect}
                    />
                  </>
                )
              ))}
              {enableWordMatch && (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 px-1">
                    <span className="col-span-5">Target Language ({currentLanguage.toUpperCase()})</span>
                    <span className="col-span-6">Native Translation ({currentNative.toUpperCase()})</span>
                    <span className="col-span-1"></span>
                  </div>
                  {wordPairs.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={p.target}
                        onChange={e => updateWordPair(idx, 'target', e.target.value)}
                        placeholder="e.g. Guten Tag"
                        className="input-field col-span-5 text-xs py-1.5"
                      />
                      <input
                        type="text"
                        value={p.native}
                        onChange={e => updateWordPair(idx, 'native', e.target.value)}
                        placeholder="e.g. Hello"
                        className="input-field col-span-6 text-xs py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => removeWordPair(idx)}
                        disabled={wordPairs.length <= 1}
                        className="col-span-1 p-1 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        );

      case 'listen_tap':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableListenTap ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('listen_tap', orderIndex, 'Stage: Listen and Tap What You Hear (Echo with Headphones)', '🎧', enableListenTap, setEnableListenTap, null)}
              {enableListenTap && (
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Target German Audio Sentence
                    </label>
                    <input
                      type="text"
                      value={listenTarget}
                      onChange={e => setListenTarget(e.target.value)}
                      placeholder="e.g. Guten Tag, ich bin Anna"
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Distractor Words (Comma separated, to challenge the learner)
                    </label>
                    <input
                      type="text"
                      value={listenDistractors}
                      onChange={e => setListenDistractors(e.target.value)}
                      placeholder="e.g. Kaffee, Brot, Nacht"
                      className="input-field text-xs"
                    />
                  </div>

                  {/* Stage B Dedicated Audio Voice Track Upload */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                        Stage Audio Voice Track (.mp3, .wav, .m4a)
                      </span>
                      {listenAudioUrl && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Audio Attached
                        </span>
                      )}
                    </label>

                    <div className="space-y-2">
                      <div
                        onClick={() => listenAudioInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center p-3.5 border-2 border-dashed rounded-xl transition-all cursor-pointer group ${
                          listenAudioUrl
                            ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'border-white/15 hover:border-cyan-500/50 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          ref={listenAudioInputRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioFileUpload(file, setListenAudioUrl, setUploadingListenAudio);
                          }}
                        />
                        {uploadingListenAudio ? (
                          <div className="flex items-center gap-2 py-1 text-cyan-400 text-xs font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading voice track to database...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors mb-1" />
                            <span className="text-xs text-gray-300 font-medium text-center">
                              {listenAudioUrl ? 'Click to replace audio file' : 'Click to select audio file (.mp3, .wav, .m4a)'}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-0.5">
                              Learners listen to this voice clip and tap the corresponding words
                            </span>
                          </>
                        )}
                      </div>

                      {listenAudioUrl && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-white/10">
                          <audio controls src={resolveAudioUrl(listenAudioUrl)} className="w-full sm:flex-1 h-8" />
                          <button
                            type="button"
                            onClick={() => setListenAudioUrl('')}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove audio"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Link2 className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={listenAudioUrl}
                          onChange={e => setListenAudioUrl(e.target.value)}
                          placeholder="Or paste audio URL (/api/notes/audio/db/... or https://...)"
                          className="input-field text-xs py-1 font-mono text-[11px] flex-1 bg-black/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Words Bank Dedicated Audio Voice Track Upload (Optional) */}
                  <div className="pt-2 border-t border-white/5">
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        Words Bank Audio Track (Optional — Comma-Separated Words & Distractors)
                      </span>
                      {listenWordsAudioUrl && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Words Audio Attached
                        </span>
                      )}
                    </label>

                    <div className="space-y-2">
                      <div
                        onClick={() => listenWordsAudioInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl transition-all cursor-pointer group ${
                          listenWordsAudioUrl
                            ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'border-white/15 hover:border-amber-500/50 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          ref={listenWordsAudioInputRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioFileUpload(file, setListenWordsAudioUrl, setUploadingListenWordsAudio);
                          }}
                        />
                        {uploadingListenWordsAudio ? (
                          <div className="flex items-center gap-2 py-1 text-amber-400 text-xs font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading words voice track...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-amber-400 transition-colors mb-1" />
                            <span className="text-xs text-gray-300 font-medium text-center">
                              {listenWordsAudioUrl ? 'Click to replace words audio file' : 'Click to select separate words audio file (.mp3, .wav, .m4a)'}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-0.5">
                              If omitted, tap-to-pronounce will slice from the Stage Audio Track above
                            </span>
                          </>
                        )}
                      </div>

                      {listenWordsAudioUrl && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-white/10">
                          <audio controls src={resolveAudioUrl(listenWordsAudioUrl)} className="w-full sm:flex-1 h-8" />
                          <button
                            type="button"
                            onClick={() => setListenWordsAudioUrl('')}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove words audio"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Link2 className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={listenWordsAudioUrl}
                          onChange={e => setListenWordsAudioUrl(e.target.value)}
                          placeholder="Or paste words audio URL (/api/notes/audio/db/... or https://...)"
                          className="input-field text-xs py-1 font-mono text-[11px] flex-1 bg-black/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Word-Level Timestamps JSON Upload (for tap-to-pronounce) */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-violet-500/20 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-bold text-white">
                          Word-Level Timestamps (.json) — Tap to Pronounce
                        </span>
                        {listenWordTimestamps && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {listenWordTimestamps.length} words loaded
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={downloadListenTimestampsTemplate}
                          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:border-violet-400"
                          title="Download a pre-filled template JSON with your current target sentence words"
                        >
                          <Download className="w-3.5 h-3.5 text-violet-400" />
                          <span>Download Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => listenTimestampsInputRef.current?.click()}
                          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:border-cyan-400"
                        >
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{listenWordTimestamps ? 'Replace JSON' : 'Upload Timestamps JSON'}</span>
                        </button>
                        {listenWordTimestamps && (
                          <button
                            type="button"
                            onClick={() => {
                              setListenWordTimestamps(null);
                              setListenTimestampsFileName('');
                            }}
                            className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                            title="Clear timestamps"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-snug">
                      Upload a JSON with per-word <code className="text-violet-300 bg-violet-500/10 px-1 rounded">start</code> and <code className="text-violet-300 bg-violet-500/10 px-1 rounded">end</code> timestamps (seconds). When learners tap a word token, the app seeks to that word&apos;s audio segment and plays it.
                    </p>

                    {listenTimestampsFileName && (
                      <div className="text-[11px] text-violet-300 flex items-center gap-1.5 pt-0.5 font-mono">
                        <span>📄 {listenTimestampsFileName}</span>
                      </div>
                    )}

                    {listenWordTimestamps && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {listenWordTimestamps.slice(0, 8).map((w, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-200 border border-violet-500/20 font-mono">
                            {w.word} <span className="text-gray-500">{w.start}s–{w.end}s</span>
                          </span>
                        ))}
                        {listenWordTimestamps.length > 8 && (
                          <span className="text-[10px] text-gray-500">+{listenWordTimestamps.length - 8} more</span>
                        )}
                      </div>
                    )}

                    <input
                      ref={listenTimestampsInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleListenTimestampsSelect}
                    />
                  </div>
                </div>
              )}
          </div>
        );

      case 'picture_select':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enablePictureSelect ? 'bg-white/5 border-white/15 shadow-lg' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('picture_select', orderIndex, 'Stage: Picture Vocabulary Cards (WebP Pipeline)', '🖼️', enablePictureSelect, setEnablePictureSelect, (
                enablePictureSelect && (
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    ⚡ Auto-Compressed WebP (&lt;20 KB)
                  </span>
                )
              ))}
              {enablePictureSelect && (
                <div className="space-y-4 mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="text-xs font-semibold text-gray-300 block mb-1">
                        Challenge Prompt
                      </label>
                      <input
                        type="text"
                        value={picturePrompt}
                        onChange={e => setPicturePrompt(e.target.value)}
                        placeholder='e.g. Choose the correct picture'
                        className="input-field text-xs py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">
                        Target Word ({currentLanguage.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={pictureTargetWord}
                        onChange={e => setPictureTargetWord(e.target.value)}
                        placeholder='e.g. der Apfel'
                        className="input-field text-xs py-2 font-medium text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">
                        English / Native Translation ({currentNative.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={pictureTranslation}
                        onChange={e => setPictureTranslation(e.target.value)}
                        placeholder='e.g. The apple'
                        className="input-field text-xs py-2"
                      />
                    </div>
                  </div>

                  {/* 4 Picture Option Cards Grid */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Picture Option Cards (Choose 1 correct answer &amp; upload images)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {pictureOptions.map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40'
                              : 'bg-black/30 border-white/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-gray-400">Card #{idx + 1}</span>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-emerald-400">
                                <input
                                  type="radio"
                                  name="picture_correct_choice"
                                  checked={Boolean(opt.isCorrect)}
                                  onChange={() => {
                                    setPictureOptions(prev => prev.map((o, i) => ({
                                      ...o,
                                      isCorrect: i === idx
                                    })));
                                  }}
                                  className="text-emerald-500 focus:ring-emerald-400"
                                />
                                {opt.isCorrect ? 'Correct Answer' : 'Mark Correct'}
                              </label>
                            </div>

                            {/* Image Preview / Upload Box */}
                            <div className="mb-2">
                              {opt.imageUrl ? (
                                <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 h-28 flex items-center justify-center">
                                  <img
                                    src={opt.imageUrl}
                                    alt={`Option ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPictureOptions(prev => {
                                        const next = [...prev];
                                        next[idx] = { ...next[idx], imageUrl: '', savingsInfo: '' };
                                        return next;
                                      });
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-500/80 text-white rounded-md transition-colors"
                                    title="Remove image"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="h-28 rounded-lg border-2 border-dashed border-white/15 hover:border-cyan-400/50 bg-white/[0.02] hover:bg-white/[0.04] flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center group">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingPictureIdx === idx}
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadOptionImage(idx, file);
                                    }}
                                  />
                                  {uploadingPictureIdx === idx ? (
                                    <div className="flex flex-col items-center gap-1 text-cyan-400">
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      <span className="text-[10px]">Optimizing to WebP...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 mb-1" />
                                      <span className="text-[11px] text-gray-300 font-medium">Upload Image</span>
                                      <span className="text-[9px] text-gray-500">Auto-compressed to WebP</span>
                                    </>
                                  )}
                                </label>
                              )}
                            </div>

                            {opt.savingsInfo && (
                              <div className="text-[10px] text-emerald-400 mb-2 truncate font-mono">
                                {opt.savingsInfo}
                              </div>
                            )}

                            {/* Word text */}
                            <input
                              type="text"
                              value={opt.text}
                              onChange={e => {
                                const val = e.target.value;
                                setPictureOptions(prev => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], text: val };
                                  return next;
                                });
                              }}
                              placeholder="Word label (e.g. Apfel)"
                              className="input-field text-xs py-1.5 w-full"
                            />
                          </div>

                          {/* Image URL text fallback */}
                          <div className="mt-2 pt-2 border-t border-white/5">
                            <input
                              type="text"
                              value={opt.imageUrl}
                              onChange={e => {
                                const val = e.target.value;
                                setPictureOptions(prev => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], imageUrl: val };
                                  return next;
                                });
                              }}
                              placeholder="Or paste /uploads/... URL"
                              className="input-field text-[10px] py-1 font-mono w-full bg-black/40 text-gray-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      case 'cloze_test':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableClozeTest ? 'bg-white/5 border-white/15 shadow-lg' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('cloze_test', orderIndex, 'Stage: Sentence Fill-in-the-Blank (Cloze Test)', '📝', enableClozeTest, setEnableClozeTest, (
                enableClozeTest && (
                  <span className="text-[10px] text-cyan-400 uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    Instant Audio & Gap Challenge
                  </span>
                )
              ))}
              {enableClozeTest && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-400">
                          German Sentence with Gap (use <code className="text-cyan-400">_______</code>)
                        </label>
                        <button
                          type="button"
                          onClick={insertClozeBlankToken}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer font-mono"
                        >
                          + Insert Blank
                        </button>
                      </div>
                      <input
                        type="text"
                        value={clozePrompt}
                        onChange={e => setClozePrompt(e.target.value)}
                        placeholder="e.g. Guten Tag, wie _______ es Ihnen?"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        English Translation Context
                      </label>
                      <input
                        type="text"
                        value={clozeTranslation}
                        onChange={e => setClozeTranslation(e.target.value)}
                        placeholder="e.g. Hello, how are you?"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-emerald-400 font-semibold block mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Correct Missing Word (Answer)
                      </label>
                      <input
                        type="text"
                        value={clozeBlank}
                        onChange={e => setClozeBlank(e.target.value)}
                        placeholder="e.g. geht"
                        className="input-field border-emerald-500/40 bg-emerald-950/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Optional Audio Clip URL (Uses TTS if blank)
                      </label>
                      <input
                        type="text"
                        value={clozeAudioUrl}
                        onChange={e => setClozeAudioUrl(e.target.value)}
                        placeholder="/api/notes/audio/... or empty for auto TTS"
                        className="input-field text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Multiple Choice Options Bank */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-300">
                        Multiple-Choice Tap Options
                      </label>
                      <button
                        type="button"
                        onClick={addClozeOption}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {clozeOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/10">
                          <input
                            type="text"
                            value={opt}
                            onChange={e => updateClozeOption(oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="input-field py-1 text-xs border-0 bg-transparent flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeClozeOption(oIdx)}
                            className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      case 'sentence_builder':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableSentenceBuilder ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('sentence_builder', orderIndex, 'Stage: Construct German Sentence (Syntax Builder)', '✍️', enableSentenceBuilder, setEnableSentenceBuilder, null)}
              {enableSentenceBuilder && (
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      English Prompt (To Translate)
                    </label>
                    <input
                      type="text"
                      value={builderPrompt}
                      onChange={e => setBuilderPrompt(e.target.value)}
                      placeholder="e.g. Good morning, how are you?"
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Correct Target German Sentence
                    </label>
                    <input
                      type="text"
                      value={builderTarget}
                      onChange={e => setBuilderTarget(e.target.value)}
                      placeholder="e.g. Guten Morgen, wie geht es dir?"
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Distractor Tiles (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={builderDistractors}
                      onChange={e => setBuilderDistractors(e.target.value)}
                      placeholder="e.g. schlafe, Kalt, schön"
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              )}
          </div>
        );

      case 'type_word':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableTypeWord ? 'bg-white/5 border-white/15 shadow-lg' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('type_word', orderIndex, 'Stage: German Spelling Entry (Type Word & Umlaut Toolbar)', '⌨️', enableTypeWord, setEnableTypeWord, (
                enableTypeWord && (
                  <span className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    Spelling & Umlaut Precision
                  </span>
                )
              ))}
              {enableTypeWord && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Instruction Prompt
                      </label>
                      <input
                        type="text"
                        value={typePrompt}
                        onChange={e => setTypePrompt(e.target.value)}
                        placeholder="e.g. Type the German word for 'Goodbye':"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        English Meaning / Definition
                      </label>
                      <input
                        type="text"
                        value={typeTranslation}
                        onChange={e => setTypeTranslation(e.target.value)}
                        placeholder="e.g. Goodbye (casual)"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Target German Word (Learner must type this)
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-medium mr-1">Quick Umlaut:</span>
                        {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü', 'ẞ'].map(ch => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => insertUmlaut(ch)}
                            className="px-2 py-0.5 text-xs font-bold rounded-md bg-white/10 hover:bg-cyan-500 hover:text-white text-gray-200 transition-colors border border-white/10 cursor-pointer shadow-sm"
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={typeTarget}
                      onChange={e => setTypeTarget(e.target.value)}
                      placeholder="e.g. Tschüss or Österreich"
                      className="input-field border-emerald-500/40 bg-emerald-950/20 text-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Optional Hint
                      </label>
                      <input
                        type="text"
                        value={typeHint}
                        onChange={e => setTypeHint(e.target.value)}
                        placeholder="e.g. Starts with 'T' and ends with double 's'"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Optional Audio URL
                      </label>
                      <input
                        type="text"
                        value={typeAudioUrl}
                        onChange={e => setTypeAudioUrl(e.target.value)}
                        placeholder="/api/notes/audio/... or empty"
                        className="input-field text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      case 'dialogue_bubble':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableDialogueBubble ? 'bg-white/5 border-white/15 shadow-lg' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('dialogue_bubble', orderIndex, 'Stage: Dialogue Bubble (Chat Messenger Flow)', '💬', enableDialogueBubble, setEnableDialogueBubble, (
                enableDialogueBubble && (
                  <span className="text-[10px] text-purple-400 uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    Interactive Chat
                  </span>
                )
              ))}
              {enableDialogueBubble && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Partner Name
                      </label>
                      <input
                        type="text"
                        value={dialoguePartnerName}
                        onChange={e => setDialoguePartnerName(e.target.value)}
                        placeholder="e.g. Anna, Florian, Kellner"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Partner Avatar
                      </label>
                      <select
                        value={dialoguePartnerAvatar}
                        onChange={e => setDialoguePartnerAvatar(e.target.value)}
                        className="input-field bg-slate-800"
                      >
                        <option value="dolphina">🐬 Dolphina (Female Avatar)</option>
                        <option value="dolphino">🐬 Dolphino (Male Avatar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Optional Audio Track URL
                      </label>
                      <input
                        type="text"
                        value={dialogueAudioUrl}
                        onChange={e => setDialogueAudioUrl(e.target.value)}
                        placeholder="/api/notes/audio/... or empty"
                        className="input-field text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Partner Speech Bubble (German Message)
                      </label>
                      <textarea
                        rows={2}
                        value={dialoguePartnerMessage}
                        onChange={e => setDialoguePartnerMessage(e.target.value)}
                        placeholder="e.g. Hallo! Ich bin Anna."
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        English Translation (Shown in Messenger)
                      </label>
                      <textarea
                        rows={2}
                        value={dialogueTranslation}
                        onChange={e => setDialogueTranslation(e.target.value)}
                        placeholder="e.g. Hello! I am Anna."
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Multiple Choice User Replies */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                        Learner Reply Options (Select radio for the correct answer)
                      </label>
                      <button
                        type="button"
                        onClick={addDialogueOption}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Reply Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {dialogueOptions.map((opt, dIdx) => (
                        <div
                          key={dIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                              : 'bg-slate-900/60 border-white/10'
                          }`}
                        >
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-300 shrink-0">
                            <input
                              type="radio"
                              name="dialogue_correct_radio"
                              checked={Boolean(opt.isCorrect)}
                              onChange={() => setCorrectDialogueOption(dIdx)}
                              className="w-4 h-4 text-emerald-500 focus:ring-emerald-400"
                            />
                            <span className={opt.isCorrect ? 'text-emerald-400' : 'text-gray-400'}>
                              {opt.isCorrect ? 'Correct ✅' : 'Distractor'}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={e => updateDialogueOptionText(dIdx, e.target.value)}
                            placeholder={`Reply choice ${dIdx + 1} Auf Deutsch`}
                            className="input-field py-1 text-xs flex-1 bg-transparent border-0 focus:ring-0"
                          />

                          <button
                            type="button"
                            onClick={() => removeDialogueOption(dIdx)}
                            className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      case 'listen_select':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableListenSelect ? 'bg-white/5 border-white/15 shadow-lg' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('listen_select', orderIndex, 'Stage: Listen & Select (Audio Comprehension Challenge)', '👂', enableListenSelect, setEnableListenSelect, (
                enableListenSelect && (
                  <span className="text-[10px] text-cyan-300 uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    🐢 0.75x Turtle & 1.0x Normal Audio
                  </span>
                )
              ))}
              {enableListenSelect && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Spoken German Phrase / Sentence (Spoken to learner)
                      </label>
                      <input
                        type="text"
                        value={listenSelectSentence}
                        onChange={e => setListenSelectSentence(e.target.value)}
                        placeholder="e.g. Guten Morgen! Wie geht es dir?"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Comprehension Question in English
                      </label>
                      <input
                        type="text"
                        value={listenSelectQuestion}
                        onChange={e => setListenSelectQuestion(e.target.value)}
                        placeholder="e.g. What does the speaker ask?"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Optional Audio URL (If left blank, mobile app will use high-quality German TTS)
                    </label>
                    <input
                      type="text"
                      value={listenSelectAudioUrl}
                      onChange={e => setListenSelectAudioUrl(e.target.value)}
                      placeholder="/api/notes/audio/... or empty"
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  {/* Multiple Choice Comprehension Options */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                        Comprehension Choices (Select radio for correct answer)
                      </label>
                      <button
                        type="button"
                        onClick={addListenSelectOption}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Choice
                      </button>
                    </div>

                    <div className="space-y-2">
                      {listenSelectOptions.map((opt, sIdx) => (
                        <div
                          key={sIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                              : 'bg-slate-900/60 border-white/10'
                          }`}
                        >
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-300 shrink-0">
                            <input
                              type="radio"
                              name="listen_select_correct_radio"
                              checked={Boolean(opt.isCorrect)}
                              onChange={() => setCorrectListenSelectOption(sIdx)}
                              className="w-4 h-4 text-emerald-500 focus:ring-emerald-400"
                            />
                            <span className={opt.isCorrect ? 'text-emerald-400' : 'text-gray-400'}>
                              {opt.isCorrect ? 'Correct ✅' : 'Distractor'}
                            </span>
                          </label>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={e => updateListenSelectOptionText(sIdx, e.target.value)}
                            placeholder={`Choice ${sIdx + 1} (English meaning)`}
                            className="input-field py-1 text-xs flex-1 bg-transparent border-0 focus:ring-0"
                          />

                          <button
                            type="button"
                            onClick={() => removeListenSelectOption(sIdx)}
                            className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      case 'sprechen':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableSprechen ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('sprechen', orderIndex, 'Stage: Sprechen Lip-Sync (Voice Pronunciation)', '🎙️', enableSprechen, setEnableSprechen, null)}
              {enableSprechen && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400 block mb-1">
                        Spoken German Prompt (Learner must speak aloud)
                      </label>
                      <input
                        type="text"
                        value={sprechenPrompt}
                        onChange={e => setSprechenPrompt(e.target.value)}
                        placeholder="e.g. Guten Tag! Wie geht es dir?"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">
                        Minimum Match Accuracy: {sprechenAccuracy}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={sprechenAccuracy}
                        onChange={e => setSprechenAccuracy(e.target.value)}
                        className="w-full mt-2 accent-cyan-400"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-400 block mb-1">
                        English Meaning / Translation
                      </label>
                      <input
                        type="text"
                        value={sprechenTranslation}
                        onChange={e => setSprechenTranslation(e.target.value)}
                        placeholder="e.g. Hello! How are you?"
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  {/* Reference Voice Track (Auto-Plays Once on Stage 3 with 1s Delay) */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                        Teacher Reference Audio Track (.mp3, .wav, .m4a)
                      </span>
                      {sprechenAudioUrl && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Audio Attached
                        </span>
                      )}
                    </label>

                    <div className="space-y-2">
                      <div
                        onClick={() => sprechenAudioInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center p-3.5 border-2 border-dashed rounded-xl transition-all cursor-pointer group ${
                          sprechenAudioUrl
                            ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'border-white/15 hover:border-cyan-500/50 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          ref={sprechenAudioInputRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioFileUpload(file, setSprechenAudioUrl, setUploadingSprechenAudio);
                          }}
                        />
                        {uploadingSprechenAudio ? (
                          <div className="flex items-center gap-2 py-1 text-cyan-400 text-xs font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading voice track to database...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors mb-1" />
                            <span className="text-xs text-gray-300 font-medium text-center">
                              {sprechenAudioUrl ? 'Click to replace audio file' : 'Click to select reference audio file (.mp3, .wav, .m4a)'}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-0.5 text-center">
                              Echo plays this once (1s after screen entry) with lip-sync highlighting. No replay button is displayed.
                            </span>
                          </>
                        )}
                      </div>

                      {sprechenAudioUrl && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-white/10">
                          <audio controls src={resolveAudioUrl(sprechenAudioUrl)} className="w-full sm:flex-1 h-8" />
                          <button
                            type="button"
                            onClick={() => setSprechenAudioUrl('')}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove audio"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      )}

                      <input
                        type="text"
                        value={sprechenAudioUrl}
                        onChange={e => setSprechenAudioUrl(e.target.value)}
                        placeholder="Direct audio URL: /api/notes/audio/db/... or https://..."
                        className="input-field text-[11px] py-1.5 font-mono text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Karaoke Lip-Sync Word Timestamps JSON */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-bold text-white">
                          Lip-Sync Word Timestamps (.json) — Real-Time Highlighting
                        </span>
                        {sprechenKaraokeData?.words && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {sprechenKaraokeData.words.length} words loaded
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={downloadSprechenTemplate}
                          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:border-violet-400"
                          title="Download pre-filled JSON template with prompt words"
                        >
                          <Download className="w-3.5 h-3.5 text-violet-400" />
                          <span>Download Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => sprechenKaraokeInputRef.current?.click()}
                          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:border-cyan-400"
                        >
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{sprechenKaraokeData ? 'Replace JSON' : 'Upload Timing JSON'}</span>
                        </button>
                        {sprechenKaraokeData && (
                          <button
                            type="button"
                            onClick={() => {
                              setSprechenKaraokeData(null);
                              setSprechenKaraokeFileName('');
                            }}
                            className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                            title="Clear karaoke timing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-snug">
                      Upload word-level <code className="text-violet-300 bg-violet-500/10 px-1 rounded">start</code> and <code className="text-violet-300 bg-violet-500/10 px-1 rounded">end</code> timestamps (seconds). Words illuminate in sync inside Echo&apos;s speech bubble during the one-time audio demonstration.
                    </p>

                    <input
                      ref={sprechenKaraokeInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleSprechenKaraokeSelect}
                    />

                    {/* Word timing preview pills */}
                    {sprechenKaraokeData?.words && Array.isArray(sprechenKaraokeData.words) && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-violet-500/20 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-violet-300 font-medium">
                          <span>Karaoke Timing Sequence ({sprechenKaraokeData.words.length} words):</span>
                          {sprechenKaraokeFileName && (
                            <span className="text-gray-400 truncate max-w-[200px]">{sprechenKaraokeFileName}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                          {sprechenKaraokeData.words.map((w, idx) => (
                            <div
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-200 text-[11px] flex items-center gap-1 font-mono"
                            >
                              <span className="font-sans font-bold text-white">{w.word || w.clean}</span>
                              <span className="text-gray-400 text-[10px]">
                                ({typeof w.start === 'number' ? w.start.toFixed(2) : w.start}s - {typeof w.end === 'number' ? w.end.toFixed(2) : w.end}s)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        );

      case 'karaoke':
        return (
          <div className={`p-4 rounded-2xl border transition-all ${
            enableKaraoke ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
          }`}>
            {renderStageHeader('karaoke', orderIndex, 'Stage: Audio Karaoke Synced Story', '🎵', enableKaraoke, setEnableKaraoke, null)}
              {enableKaraoke && (
                <div className="space-y-3 mt-2">
                  {/* Karaoke Alignment JSON Upload Option */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-cyan-500/20 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">
                          Word-Level Karaoke Alignment (.json)
                        </span>
                        {karaokeJsonData && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> JSON Loaded {karaokeJsonData.sentences ? `(${karaokeJsonData.sentences.length} sentences)` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => karaokeJsonInputRef.current?.click()}
                          className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:border-cyan-400"
                        >
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{karaokeJsonData ? 'Replace JSON' : 'Upload Alignment JSON (.json)'}</span>
                        </button>
                        {karaokeJsonData && (
                          <button
                            type="button"
                            onClick={() => {
                              setKaraokeJsonData(null);
                              setKaraokeJsonFileName('');
                            }}
                            className="text-xs text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                            title="Clear JSON"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-snug">
                      Upload your syllable/word-aligned JSON file with timestamps. It automatically populates sentences, parallel translation, and rhythm sync!
                    </p>

                    {karaokeJsonFileName && (
                      <div className="text-[11px] text-cyan-300 flex items-center gap-1.5 pt-0.5 font-mono">
                        <span>📄 {karaokeJsonFileName}</span>
                      </div>
                    )}

                    <input
                      ref={karaokeJsonInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleKaraokeJsonSelect}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      German Story Sentences
                    </label>
                    <textarea
                      rows={3}
                      value={karaokeStory}
                      onChange={e => setKaraokeStory(e.target.value)}
                      placeholder="Guten Morgen Deutschland. Ein neuer Tag beginnt mit Musik und Freude."
                      className="input-field text-xs leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      English Parallel Translation
                    </label>
                    <textarea
                      rows={2}
                      value={karaokeTranslation}
                      onChange={e => setKaraokeTranslation(e.target.value)}
                      placeholder="Good morning Germany. A new day begins with music and joy."
                      className="input-field text-xs leading-relaxed"
                    />
                  </div>

                  {/* Stage E Dedicated Karaoke Audio Track Upload */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-cyan-400" />
                        Karaoke Story Audio Track (.mp3, .wav, .m4a)
                      </span>
                      {karaokeAudioUrl && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Audio Attached
                        </span>
                      )}
                    </label>

                    <div className="space-y-2">
                      <div
                        onClick={() => karaokeAudioInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center p-3.5 border-2 border-dashed rounded-xl transition-all cursor-pointer group ${
                          karaokeAudioUrl
                            ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                            : 'border-white/15 hover:border-cyan-500/50 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          ref={karaokeAudioInputRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioFileUpload(file, setKaraokeAudioUrl, setUploadingKaraokeAudio);
                          }}
                        />
                        {uploadingKaraokeAudio ? (
                          <div className="flex items-center gap-2 py-1 text-cyan-400 text-xs font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading karaoke story audio to database...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors mb-1" />
                            <span className="text-xs text-gray-300 font-medium text-center">
                              {karaokeAudioUrl ? 'Click to replace story audio' : 'Click to select audio file (.mp3, .wav, .m4a)'}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-0.5">
                              Synchronized story reading audio streamed in real-time
                            </span>
                          </>
                        )}
                      </div>

                      {karaokeAudioUrl && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-white/10">
                          <audio controls src={resolveAudioUrl(karaokeAudioUrl)} className="w-full sm:flex-1 h-8" />
                          <button
                            type="button"
                            onClick={() => setKaraokeAudioUrl('')}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove audio"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Link2 className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={karaokeAudioUrl}
                          onChange={e => setKaraokeAudioUrl(e.target.value)}
                          placeholder="Or paste audio URL (/api/notes/audio/db/... or https://...)"
                          className="input-field text-xs py-1 font-mono text-[11px] flex-1 bg-black/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header with Title and LIVE Toggle */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center shadow-lg shadow-dolphin-900/40">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialData ? `Edit Lesson: ${initialData.title}` : 'Create New Lesson'}
              </h2>
              <p className="text-xs text-gray-400">
                {currentLevel} • Unit {currentUnit} • Modular Interactive Learning Tasks
              </p>
            </div>
          </div>

          {/* Top Right: Live Toggle & Close Button */}
          <div className="flex items-center gap-4">
            {/* Live Toggle Pill */}
            <button
              type="button"
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isLive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isLive ? 'LIVE (Visible to Learners)' : 'DRAFT (Not Live)'}</span>
            </button>

            <button onClick={onClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: General Lesson Metadata */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 1. Lesson Overview
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Basics & Greetings"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Node Type
                </label>
                <select
                  value={nodeType}
                  onChange={e => setNodeType(e.target.value)}
                  className="input-field bg-slate-800"
                >
                  <option value="lesson">🏝️ Interactive Lesson</option>
                  <option value="karaoke">🎵 Audio Karaoke Rhythm</option>
                  <option value="speech">🎙️ Sprechen Lip-Sync</option>
                  <option value="chest">💎 Treasure Chest</option>
                  <option value="match">🧩 Word Matching</option>
                  <option value="quiz">🏆 Checkpoint Exam</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Subtitle / Learning Objective
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="e.g. Essential German greetings & daily etiquette"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  XP Reward
                </label>
                <input
                  type="number"
                  value={xpReward}
                  onChange={e => setXpReward(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Pearls Reward
                </label>
                <input
                  type="number"
                  value={pearlsReward}
                  onChange={e => setPearlsReward(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Import from Note Dropdown */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" /> Link From Notes
                </label>
                <select
                  value={sourceNoteId}
                  onChange={e => handleImportNote(e.target.value)}
                  className="input-field text-xs bg-slate-800"
                >
                  <option value="">-- None / Custom --</option>
                  {notesList.map(n => (
                    <option key={n.id || n._id} value={n.id || n._id}>
                      {n.title} {n.isKaraoke ? '🎵' : '📝'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Modular Challenge Stages Selection & Reordering */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 2. Modular Challenge Stages & Solving Sequence
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Reorder stages with ↑ / ↓ buttons. Students solve active stages on the phone in this exact sequence.
                </p>
              </div>
              <span className="text-xs text-gray-500">
                Unchecked stages are skipped on the learner&apos;s phone
              </span>
            </div>

            {/* Active Sequence Flow Preview Bar */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-cyan-500/20 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Learner Step Sequence ({activeStages.length} Active {activeStages.length === 1 ? 'Stage' : 'Stages'})
                </span>
                {activeStages.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    Runs 1 ➔ {activeStages.length} on mobile
                  </span>
                )}
              </div>
              {activeStages.length === 0 ? (
                <div className="text-xs text-amber-300/80 italic py-1">
                  ⚠️ No stages currently enabled. Check at least one stage below to include in this lesson.
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {activeStages.map((key, idx) => {
                    const meta = STAGE_META[key];
                    return (
                      <div key={key} className="flex items-center gap-1.5 flex-shrink-0">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border bg-gradient-to-r ${meta?.color || 'bg-white/5 text-white border-white/10'}`}>
                          <span className="w-4 h-4 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <span>{meta?.icon}</span>
                          <span>{meta?.label}</span>
                        </div>
                        {idx < activeStages.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-cyan-400/60 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamically Ordered Stage Cards */}
            <div className="space-y-4">
              {stageOrder.map((stageKey, orderIndex) => (
                <div key={stageKey}>
                  {renderStageCard(stageKey, orderIndex)}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-gray-400">
                Saving as: <strong className={isLive ? 'text-emerald-300' : 'text-amber-300'}>{isLive ? 'LIVE' : 'DRAFT'}</strong>
              </span>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {loading ? 'Saving Lesson...' : (initialData ? 'Save Changes' : 'Create Lesson 🚀')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
