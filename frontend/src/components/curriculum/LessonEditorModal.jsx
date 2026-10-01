import { useState, useEffect } from 'react';
import {
  X, Check, Plus, Trash2, Headphones, Mic, Sparkles, Layers,
  Volume2, Music, Link2, BookOpen, AlertCircle, Eye, EyeOff
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
  const [audioUrl, setAudioUrl] = useState('');
  const [sourceNoteId, setSourceNoteId] = useState('');

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
      setAudioUrl(initialData.audioUrl || '');
      setSourceNoteId(initialData.sourceNoteId || '');

      const stages = Array.isArray(initialData.stages) ? initialData.stages : [];
      const matchStage = stages.find(s => s.type === 'word_match');
      const listenStage = stages.find(s => s.type === 'listen_tap');
      const builderStage = stages.find(s => s.type === 'sentence_builder');
      const sprechenStage = stages.find(s => s.type === 'sprechen');
      const karaokeStage = stages.find(s => s.type === 'karaoke');

      setEnableWordMatch(Boolean(matchStage));
      if (matchStage?.pairs) setWordPairs(matchStage.pairs);

      setEnableListenTap(Boolean(listenStage));
      if (listenStage?.targetSentence) setListenTarget(listenStage.targetSentence);

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
    } else {
      // New lesson defaults
      setTitle('');
      setSubtitle('');
      setNodeType('lesson');
      setXpReward(15);
      setPearlsReward(5);
      setIsLive(false); // DEFAULT OFF
      setAudioUrl('');
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
    if (note.audioUrl) setAudioUrl(note.audioUrl);

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
        audioUrl: audioUrl || null,
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
      audioUrl: audioUrl.trim() || null,
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

            {/* Audio URL Input */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Audio Prompt URL (Optional)
              </label>
              <input
                type="text"
                value={audioUrl}
                onChange={e => setAudioUrl(e.target.value)}
                placeholder="https://.../guten_tag.mp3 or /uploads/audio/..."
                className="input-field text-xs font-mono"
              />
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
                  <button
                    type="button"
                    onClick={addWordPair}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Pair
                  </button>
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
