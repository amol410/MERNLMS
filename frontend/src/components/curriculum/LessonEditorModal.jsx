import { useState, useEffect, useRef } from 'react';
import {
  X, Check, Plus, Trash2, Headphones, Mic, Sparkles, Layers,
  Volume2, Music, Link2, BookOpen, AlertCircle, Eye, EyeOff, Upload, Loader2, FileCode, Download
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
      .split(/\s+/)
      .filter(Boolean);
    const template = {
      _comment: 'Word-level timestamps for the Listen & Tap audio. Each word maps to its start/end time (in seconds) within the audio file.',
      audioUrl: listenAudioUrl || '/api/notes/audio/db/YOUR_ID',
      words: targetWords.length > 0
        ? targetWords.map((w, i) => ({
            word: w,
            start: parseFloat((i * 0.5).toFixed(2)),
            end: parseFloat(((i + 1) * 0.5).toFixed(2)),
          }))
        : [
            { word: 'Guten', start: 0.0, end: 0.45 },
            { word: 'Tag,', start: 0.45, end: 0.85 },
            { word: 'ich', start: 0.90, end: 1.05 },
            { word: 'bin', start: 1.05, end: 1.25 },
            { word: 'Anna', start: 1.25, end: 1.70 },
          ],
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listen_tap_word_timestamps_template.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded! Fill in the correct start/end times for each word.');
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

  // Modular Challenge Stage Toggles
  const [enableWordMatch, setEnableWordMatch] = useState(true);
  const [enableListenTap, setEnableListenTap] = useState(true);
  const [enableSentenceBuilder, setEnableSentenceBuilder] = useState(true);
  const [enableSprechen, setEnableSprechen] = useState(true);
  const [enableKaraoke, setEnableKaraoke] = useState(false);

  // Stage 1: Word Match Pairs
  const [wordPairs, setWordPairs] = useState([
    { target: 'Guten Tag', native: 'Hello' },
    { target: 'Danke', native: 'Thank you' },
    { target: 'Bitte', native: 'Please' },
    { target: 'Tschüss', native: 'Bye' },
  ]);

  // Stage 2: Listen & Tap
  const [listenTarget, setListenTarget] = useState('Guten Tag, ich bin Anna');
  const [listenDistractors, setListenDistractors] = useState('Kaffee, Milch');

  // Stage 3: Sentence Builder
  const [builderPrompt, setBuilderPrompt] = useState('Good morning, how are you?');
  const [builderTarget, setBuilderTarget] = useState('Guten Morgen, wie geht es dir?');
  const [builderDistractors, setBuilderDistractors] = useState('schlafe, Kalt, Brot');

  // Stage 4: Sprechen Voice
  const [sprechenPrompt, setSprechenPrompt] = useState('Guten Tag! Wie geht es dir?');
  const [sprechenTranslation, setSprechenTranslation] = useState('Hello! How are you?');
  const [sprechenAccuracy, setSprechenAccuracy] = useState(75);

  // Stage 5: Karaoke Story
  const [karaokeStory, setKaraokeStory] = useState('');
  const [karaokeTranslation, setKaraokeTranslation] = useState('');

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

      const stages = Array.isArray(initialData.stages) ? initialData.stages : [];
      const matchStage = stages.find(s => s.type === 'word_match' || s.type === 'match_pairs');
      const listenStage = stages.find(s => s.type === 'listen_tap');
      const builderStage = stages.find(s => s.type === 'sentence_builder');
      const sprechenStage = stages.find(s => s.type === 'sprechen');
      const karaokeStage = stages.find(s => s.type === 'karaoke');

      setEnableWordMatch(Boolean(matchStage));
      if (matchStage?.pairs && Array.isArray(matchStage.pairs) && matchStage.pairs.length > 0) {
        setWordPairs(matchStage.pairs.map(p => ({
          target: p.target || p.german || p.word || '',
          native: p.native || p.english || p.translation || '',
        })));
      }

      setEnableListenTap(Boolean(listenStage));
      if (listenStage?.targetSentence) setListenTarget(listenStage.targetSentence);
      setListenAudioUrl(listenStage?.audioUrl || '');
      if (listenStage?.wordTimestamps) {
        setListenWordTimestamps(listenStage.wordTimestamps);
        setListenTimestampsFileName('Attached Word Timestamps');
      } else {
        setListenWordTimestamps(null);
        setListenTimestampsFileName('');
      }
      // Restore distractor tokens
      if (listenStage?.tokens && listenStage?.targetSentence) {
        const targetTokens = new Set(listenStage.targetSentence
          .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
          .split(/\s+/)
          .filter(Boolean)
          .map(w => w.toLowerCase()));
        const distractors = listenStage.tokens
          .filter(t => !targetTokens.has(t.toLowerCase()))
          .join(', ');
        if (distractors) setListenDistractors(distractors);
      }

      setEnableSentenceBuilder(Boolean(builderStage));
      if (builderStage?.prompt) setBuilderPrompt(builderStage.prompt.replace(/^Translate:\s*"?|"?$/gi, ''));
      if (builderStage?.targetSentence) setBuilderTarget(builderStage.targetSentence);

      setEnableSprechen(Boolean(sprechenStage));
      if (sprechenStage?.prompt) setSprechenPrompt(sprechenStage.prompt);
      if (sprechenStage?.translation) setSprechenTranslation(sprechenStage.translation);
      if (sprechenStage?.minAccuracy) setSprechenAccuracy(sprechenStage.minAccuracy);

      setEnableKaraoke(Boolean(karaokeStage) || initialData.nodeType === 'karaoke');
      if (karaokeStage?.storyText) setKaraokeStory(karaokeStage.storyText);
      if (karaokeStage?.translationText) setKaraokeTranslation(karaokeStage.translationText);
      setKaraokeAudioUrl(karaokeStage?.audioUrl || '');

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
      // New lesson defaults
      setTitle('');
      setSubtitle('');
      setNodeType('lesson');
      setXpReward(15);
      setPearlsReward(5);
      setIsLive(false); // DEFAULT OFF
      setListenAudioUrl('');
      setListenWordTimestamps(null);
      setListenTimestampsFileName('');
      setKaraokeAudioUrl('');
      setKaraokeJsonData(null);
      setKaraokeJsonFileName('');
      setSourceNoteId('');
      setEnableWordMatch(true);
      setEnableListenTap(true);
      setEnableSentenceBuilder(true);
      setEnableSprechen(true);
      setEnableKaraoke(false);
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

    // Assemble modular stages based on toggles
    const stages = [];

    if (enableWordMatch) {
      const validPairs = wordPairs.filter(p => p.target.trim() && p.native.trim());
      if (validPairs.length > 0) {
        stages.push({
          type: 'word_match',
          title: 'Match the word pairs',
          pairs: validPairs,
        });
      }
    }

    if (enableListenTap && listenTarget.trim()) {
      const targetTokens = listenTarget
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
        .split(/\s+/)
        .filter(Boolean);
      const extraTokens = listenDistractors
        .split(/[,;\s]+/)
        .map(s => s.trim())
        .filter(Boolean);
      const allTokens = [...targetTokens, ...extraTokens];

      stages.push({
        type: 'listen_tap',
        title: 'Listen and tap what you hear',
        targetSentence: listenTarget.trim(),
        tokens: allTokens,
        audioUrl: listenAudioUrl.trim() || null,
        wordTimestamps: listenWordTimestamps || null,
      });
    }

    if (enableSentenceBuilder && builderTarget.trim()) {
      const targetTokens = builderTarget
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
        .split(/\s+/)
        .filter(Boolean);
      const extraTokens = builderDistractors
        .split(/[,;\s]+/)
        .map(s => s.trim())
        .filter(Boolean);
      const allTokens = [...targetTokens, ...extraTokens];

      stages.push({
        type: 'sentence_builder',
        title: 'Construct the German sentence',
        prompt: `Translate: "${builderPrompt.trim()}"`,
        targetSentence: builderTarget.trim(),
        tokens: allTokens,
      });
    }

    if (enableSprechen && sprechenPrompt.trim()) {
      stages.push({
        type: 'sprechen',
        title: 'Pronounce Auf Deutsch',
        prompt: sprechenPrompt.trim(),
        translation: sprechenTranslation.trim(),
        minAccuracy: parseInt(sprechenAccuracy, 10) || 75,
      });
    }

    if (enableKaraoke) {
      stages.push({
        type: 'karaoke',
        title: 'Karaoke Synced Rhythm',
        storyText: karaokeStory.trim(),
        translationText: karaokeTranslation.trim(),
        audioUrl: karaokeAudioUrl.trim() || null,
        karaokeData: karaokeJsonData || null,
      });
    }

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

          {/* Section 2: Modular Challenge Stages Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Layers className="w-4 h-4" /> 2. Modular Challenge Stages (Choose which to include)
              </h3>
              <span className="text-xs text-gray-500">
                Unchecked stages are skipped on the learner's phone
              </span>
            </div>

            {/* Stage A: Word Match Pairs */}
            <div className={`p-4 rounded-2xl border transition-all ${
              enableWordMatch ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableWordMatch}
                    onChange={e => setEnableWordMatch(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    🧩 Stage: Match the Word Pairs
                  </span>
                </label>
                {enableWordMatch && (
                  <div className="flex items-center gap-2">
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
                  </div>
                )}
              </div>

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

            {/* Stage B: Listen and Tap */}
            <div className={`p-4 rounded-2xl border transition-all ${
              enableListenTap ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableListenTap}
                    onChange={e => setEnableListenTap(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    🎧 Stage: Listen and Tap What You Hear (Echo with Headphones)
                  </span>
                </label>
              </div>

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

            {/* Stage C: Sentence Builder */}
            <div className={`p-4 rounded-2xl border transition-all ${
              enableSentenceBuilder ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSentenceBuilder}
                    onChange={e => setEnableSentenceBuilder(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    ✍️ Stage: Construct German Sentence (Syntax Builder)
                  </span>
                </label>
              </div>

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

            {/* Stage D: Sprechen Pronunciation */}
            <div className={`p-4 rounded-2xl border transition-all ${
              enableSprechen ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSprechen}
                    onChange={e => setEnableSprechen(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    🎙️ Stage: Sprechen Lip-Sync (Voice Pronunciation)
                  </span>
                </label>
              </div>

              {enableSprechen && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
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
              )}
            </div>

            {/* Stage E: Audio Karaoke Synced Reader */}
            <div className={`p-4 rounded-2xl border transition-all ${
              enableKaraoke ? 'bg-white/5 border-white/15' : 'bg-black/20 border-white/5 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableKaraoke}
                    onChange={e => setEnableKaraoke(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                  />
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    🎵 Stage: Audio Karaoke Synced Story
                  </span>
                </label>
              </div>

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
