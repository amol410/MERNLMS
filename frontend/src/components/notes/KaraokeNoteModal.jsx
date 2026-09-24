import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, BookOpen, Music, Sparkles, Upload, FileText, ArrowRight,
  Loader2, CheckCircle, Download, AlertCircle
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useSubjects } from '../../hooks/useSubjects';
import { downloadKaraokeTemplate, normalizeKaraokeJson } from '../../utils/downloadKaraokeTemplate';
import clsx from 'clsx';

// Helper to determine audio duration from a File or URL
const getAudioDuration = (fileOrUrl) => {
  return new Promise((resolve) => {
    try {
      const audio = new Audio();
      const src = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
      audio.src = src;
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 45);
      };
      audio.onerror = () => resolve(45);
    } catch {
      resolve(45);
    }
  });
};

// Generates time-aligned sentence & word timestamps across the audio duration (Approximation)
function generateKaraokePayload(title, storyText, translationText, duration, subjectName, topicName) {
  const totalDuration = Math.max(duration || 40, 10);
  
  // Split into sentences by punctuation or newlines
  const rawSentences = storyText
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  const rawTranslations = (translationText || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (rawSentences.length === 0) {
    throw new Error('Please enter at least one sentence of story text.');
  }

  // Calculate proportional length weight for each sentence
  const totalChars = rawSentences.reduce((sum, s) => sum + Math.max(s.length, 5), 0);
  let accumulatedTime = 0.5; // slight intro padding
  const usableDuration = totalDuration - 1.0; // leave padding at end

  const sentences = [];
  const allWords = [];
  const vocabMap = {};

  rawSentences.forEach((sentenceText, sIdx) => {
    const sWeight = Math.max(sentenceText.length, 5) / totalChars;
    const sDuration = sWeight * usableDuration;
    const sStart = parseFloat(accumulatedTime.toFixed(2));
    const sEnd = parseFloat((accumulatedTime + sDuration).toFixed(2));
    accumulatedTime = sEnd + 0.2; // small pause between sentences

    // Split sentence into words
    const rawWords = sentenceText.split(/\s+/).filter(Boolean);
    const sentenceWords = [];
    const totalWordChars = rawWords.reduce((sum, w) => sum + Math.max(w.length, 1), 0);
    let wordAccumTime = sStart;

    rawWords.forEach((word) => {
      const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '');
      const wWeight = Math.max(word.length, 1) / totalWordChars;
      const wDuration = wWeight * (sEnd - sStart);
      const wStart = parseFloat(wordAccumTime.toFixed(2));
      const wEnd = parseFloat((wordAccumTime + wDuration).toFixed(2));
      wordAccumTime = wEnd;

      const wordObj = {
        word,
        clean: cleanWord,
        start: wStart,
        end: wEnd,
        sentenceIndex: sIdx,
      };

      sentenceWords.push(wordObj);
      allWords.push(wordObj);

      // Collect potential German nouns (capitalized and length > 3)
      if (cleanWord.length > 3 && cleanWord[0] === cleanWord[0].toUpperCase() && !vocabMap[cleanWord]) {
        vocabMap[cleanWord] = {
          word: cleanWord,
          meaning: `Vocabulary item: ${cleanWord}`,
          type: 'Noun'
        };
      }
    });

    sentences.push({
      index: sIdx,
      text: sentenceText,
      translation: rawTranslations[sIdx] || '',
      start: sStart,
      end: sEnd,
      words: sentenceWords,
    });
  });

  return {
    title,
    englishTitle: title,
    subject: subjectName || 'German',
    topic: topicName || 'Reading Practice',
    duration: totalDuration,
    sentences,
    words: allWords,
    vocab: vocabMap,
  };
}

export default function KaraokeNoteModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  const [mode, setMode] = useState('select'); // 'select' | 'karaoke-form'
  const [creationTab, setCreationTab] = useState('json'); // 'json' | 'text'

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [storyText, setStoryText] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonFileName, setJsonFileName] = useState('');
  const [parsedKaraokeData, setParsedKaraokeData] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setMode('select');
    setSaving(false);
    onClose();
  };

  const handleSelectNormal = () => {
    handleClose();
    navigate('/notes/new');
  };

  const handleSelectKaraoke = () => {
    setMode('karaoke-form');
  };

  const handleOpenDemo = () => {
    handleClose();
    navigate('/notes/karaoke/demo');
  };

  // Safe subject & topic extraction
  const selectedSubject = subjects.find(s => String(s.id ?? s._id) === String(subjectId));
  const currentTopics = selectedSubject?.topics || [];

  // Handler for uploading JSON alignment file
  const handleJsonSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonFile(file);
    setJsonFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawObj = JSON.parse(event.target.result);
        const normalized = normalizeKaraokeJson(rawObj);
        setParsedKaraokeData(normalized);
        if (normalized.title && !title) setTitle(normalized.title);
        if (normalized.audioUrl && !customAudioUrl && !audioFile) {
          setCustomAudioUrl(normalized.audioUrl);
          setAudioFileName(normalized.audioUrl);
        }
        toast.success(`Valid alignment JSON: ${normalized.sentences.length} sentences parsed!`);
      } catch (err) {
        setParsedKaraokeData(null);
        toast.error(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Populate sample German fable
  const handleLoadSample = () => {
    setTitle('Die Schildkröte und der Hase');
    setStoryText(
      'Es war einmal eine kleine Schildkröte und ein schneller Hase.\n' +
      'Der Hase lachte oft über die langsame Schildkröte.\n' +
      'Eines Tages sagte die Schildkröte: Lass uns ein Rennen machen!\n' +
      'Alle Waldtiere kamen zusammen, um das große Rennen zu sehen.\n' +
      'Der Hase rannte so schnell er konnte und war bald weit vorne.\n' +
      'Er dachte sich: Ich habe genug Zeit und kann mich etwas ausruhen.\n' +
      'Während der Hase tief schlief, ging die Schildkröte Schritt für Schritt weiter.\n' +
      'Als der Hase endlich aufwachte, sah er die Schildkröte schon im Ziel.'
    );
    setTranslationText(
      'Once upon a time there was a little tortoise and a fast hare.\n' +
      'The hare often laughed at the slow tortoise.\n' +
      'One day the tortoise said: Let\'s have a race!\n' +
      'All the forest animals gathered to watch the big race.\n' +
      'The hare ran as fast as he could and was soon far ahead.\n' +
      'He thought to himself: I have plenty of time and can rest a bit.\n' +
      'While the hare slept deeply, the tortoise kept walking step by step.\n' +
      'When the hare finally woke up, he saw the tortoise already at the finish line.'
    );
    setCustomAudioUrl('/audio/demo_german_story.mp3');
    setAudioFileName('demo_german_story.mp3 (Built-in Audio)');
    const germanSub = subjects.find(s => s.name.toLowerCase().includes('german'));
    if (germanSub) {
      setSubjectId(String(germanSub.id ?? germanSub._id));
      if (germanSub.topics?.length > 0) {
        const firstTopic = germanSub.topics[0];
        setTopic(typeof firstTopic === 'string' ? firstTopic : (firstTopic.name || ''));
      }
    }
    toast.success('Sample German fable loaded!');
  };

  // Handle Create Karaoke Note submission
  const handleCreateKaraoke = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    if (creationTab === 'json') {
      if (!parsedKaraokeData) {
        toast.error('Please upload a valid Karaoke alignment JSON file');
        return;
      }
    } else {
      if (!storyText.trim()) {
        toast.error('Please enter the story text');
        return;
      }
    }

    setSaving(true);
    try {
      let finalAudioUrl = customAudioUrl || '/audio/demo_german_story.mp3';
      let audioDuration = parsedKaraokeData?.duration || 42.35;

      // 1. Upload audio file if user attached one
      if (audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        const uploadRes = await api.post('/notes/upload-audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadRes.data?.audioUrl) {
          finalAudioUrl = uploadRes.data.audioUrl;
        }
        audioDuration = await getAudioDuration(audioFile);
      } else if (customAudioUrl) {
        audioDuration = await getAudioDuration(customAudioUrl);
      }

      // 2. Prepare karaoke alignment data
      let karaokeData;
      let noteContent = '';

      if (creationTab === 'json') {
        karaokeData = {
          ...parsedKaraokeData,
          title: title.trim(),
          duration: audioDuration || parsedKaraokeData.duration,
          subject: selectedSubject?.name || parsedKaraokeData.subject,
          topic: topic || parsedKaraokeData.topic,
          audioUrl: finalAudioUrl,
        };
        noteContent = parsedKaraokeData.sentences.map(s => s.text).join('\n\n');
      } else {
        karaokeData = generateKaraokePayload(
          title.trim(),
          storyText.trim(),
          translationText.trim(),
          audioDuration,
          selectedSubject?.name,
          topic
        );
        karaokeData.audioUrl = finalAudioUrl;
        noteContent = storyText.trim();
      }

      // 3. Create note in DB
      const res = await api.post('/notes', {
        title: title.trim(),
        content: noteContent,
        subject: subjectId || null,
        topic: topic || null,
        isKaraoke: true,
        audioUrl: finalAudioUrl,
        karaokeData,
      });

      toast.success('Karaoke note created successfully!');
      handleClose();

      const createdId = res.data?.note?._id || res.data?.note?.id;
      if (createdId) {
        navigate(`/notes/${createdId}`);
      } else {
        navigate('/notes');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create karaoke note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="glass-card w-full max-w-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden relative my-8">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={saving}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'select' ? (
          /* ─── Step 1: Choose Note Type ─── */
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-dolphin-900/40">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white">Create New Note</h2>
              <p className="text-gray-400 text-sm mt-1">
                Choose the type of learning material you would like to create
              </p>
            </div>

            <div className="space-y-4">
              {/* Option 1: Normal Note */}
              <button
                type="button"
                onClick={handleSelectNormal}
                className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-blue-500/40 transition-all duration-200 group flex items-start gap-4 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-base group-hover:text-blue-300 transition-colors">
                      Normal Study Note
                    </h3>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Standard rich-text study notes with formatting, DOCX import, code snippets, tags, and pin options.
                  </p>
                </div>
              </button>

              {/* Option 2: Karaoke Note */}
              <button
                type="button"
                onClick={handleSelectKaraoke}
                className="w-full text-left p-4 rounded-xl border border-dolphin-500/30 bg-gradient-to-r from-dolphin-600/10 via-ocean-600/10 to-transparent hover:border-dolphin-500/60 hover:bg-dolphin-600/15 transition-all duration-200 group flex items-start gap-4 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-dolphin-500 text-white px-2 py-0.5 rounded-full shadow-md">
                    Interactive
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-dolphin-900/40">
                  <Music className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-base group-hover:text-dolphin-300 transition-colors flex items-center gap-1.5">
                      Karaoke Story Note
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-dolphin-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Audio-synchronized stories with live word-by-word highlight, vocabulary tooltips, and click-to-seek playback.
                  </p>
                </div>
              </button>
            </div>

            {/* Quick Demo Shortcut */}
            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={handleOpenDemo}
                className="inline-flex items-center gap-2 text-xs font-semibold text-dolphin-400 hover:text-dolphin-300 transition-colors group cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Want to test it first? Open German Karaoke Story Demo &rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          /* ─── Step 2: Karaoke Note Form ─── */
          <form onSubmit={handleCreateKaraoke} className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  disabled={saving}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  &larr; Back
                </button>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Music className="w-5 h-5 text-dolphin-400" />
                    New Karaoke Note
                  </h2>
                  <p className="text-xs text-gray-400">Audio and word alignment for synchronized reading</p>
                </div>
              </div>

              {creationTab === 'text' && (
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] font-semibold text-dolphin-400 hover:text-dolphin-300 border border-dolphin-500/30 hover:border-dolphin-500/60 bg-dolphin-500/10 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Fill Sample</span>
                </button>
              )}
            </div>

            {/* Sync Method Tabs */}
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setCreationTab('json')}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  creationTab === 'json'
                    ? 'bg-gradient-to-r from-dolphin-500 to-ocean-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Upload JSON & Audio (Exact Sync)</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationTab('text')}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  creationTab === 'text'
                    ? 'bg-gradient-to-r from-dolphin-500 to-ocean-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text (Auto-Align)</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Story / Note Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Die Schildkröte und der Hase"
                  className="input-field w-full text-sm"
                />
              </div>

              {/* Subject & Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setTopic('');
                    }}
                    className="select-field text-sm w-full"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => {
                      const sId = s.id ?? s._id;
                      return (
                        <option key={sId} value={sId}>
                          {s.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={!subjectId}
                    className="select-field text-sm w-full disabled:opacity-50"
                  >
                    <option value="">Select Topic</option>
                    {currentTopics.map((t, idx) => {
                      const topicName = typeof t === 'string' ? t : (t.name || t.title || '');
                      const topicKey = typeof t === 'string' ? t : (t._id || t.id || idx);
                      return (
                        <option key={topicKey} value={topicName}>
                          {topicName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* TAB 1: JSON Alignment Upload */}
              {creationTab === 'json' && (
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-dolphin-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-dolphin-200">
                      <span className="font-bold text-white block">Word-Level JSON Alignment</span>
                      <span>Provides frame-accurate millisecond timestamps matching your audio.</span>
                    </div>
                    <button
                      type="button"
                      onClick={downloadKaraokeTemplate}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0 cursor-pointer hover:border-dolphin-400"
                      title="Download template JSON format"
                    >
                      <Download className="w-3.5 h-3.5 text-dolphin-400" />
                      <span>Download Template</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Alignment File (.json) *
                    </label>
                    <div
                      onClick={() => jsonInputRef.current?.click()}
                      className={clsx(
                        'flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer group',
                        parsedKaraokeData
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-white/15 hover:border-dolphin-500/50 bg-white/[0.02] hover:bg-white/[0.04]'
                      )}
                    >
                      {parsedKaraokeData ? (
                        <CheckCircle className="w-6 h-6 text-emerald-400 mb-1" />
                      ) : (
                        <FileText className="w-6 h-6 text-gray-400 group-hover:text-dolphin-400 transition-colors mb-1" />
                      )}
                      <span className="text-xs text-gray-200 font-medium text-center">
                        {jsonFileName ? jsonFileName : 'Click to select JSON alignment file (.json)'}
                      </span>
                      {parsedKaraokeData ? (
                        <span className="text-[11px] text-emerald-400 font-semibold mt-1">
                          ✅ {parsedKaraokeData.sentences.length} sentences • {parsedKaraokeData.words.length} words • {parsedKaraokeData.duration}s duration
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 mt-0.5">
                          Contains sentence and word start/end timestamps
                        </span>
                      )}
                      <input
                        ref={jsonInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleJsonSelect}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Upload Box (for both tabs) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Audio File (.mp3, .wav, .m4a)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/15 hover:border-dolphin-500/50 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group"
                >
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-dolphin-400 transition-colors mb-1" />
                  <span className="text-xs text-gray-300 font-medium text-center">
                    {audioFileName ? audioFileName : 'Click to select audio file (.mp3, .wav)'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-0.5">
                    Audio will stream in real-time with word highlighting
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAudioFile(file);
                        setAudioFileName(file.name);
                        setCustomAudioUrl('');
                      }
                    }}
                  />
                </div>
              </div>

              {/* TAB 2: Text Area Inputs */}
              {creationTab === 'text' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-300">Story Text (Target Language) *</label>
                      <span className="text-[10px] text-gray-500">Sentence per line or separated by periods</span>
                    </div>
                    <textarea
                      rows={4}
                      required={creationTab === 'text'}
                      value={storyText}
                      onChange={(e) => setStoryText(e.target.value)}
                      placeholder="Paste your story text here..."
                      className="input-field w-full text-sm leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-300">English Translation (Optional)</label>
                      <span className="text-[10px] text-gray-500">Matches sentences 1-to-1</span>
                    </div>
                    <textarea
                      rows={3}
                      value={translationText}
                      onChange={(e) => setTranslationText(e.target.value)}
                      placeholder="Paste English translation lines here..."
                      className="input-field w-full text-sm leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-dolphin-600/30 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Karaoke Note...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Create Karaoke Note</span>
                    </>
                  )}
                </button>
              </div>

              {/* Interactive Demo Banner inside form */}
              <div className="p-3 rounded-xl bg-dolphin-500/10 border border-dolphin-500/20 flex items-center justify-between gap-3 mt-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-dolphin-200 truncate">
                    Want to test first? Launch the pre-built German fable.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenDemo}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <span>Launch Demo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
