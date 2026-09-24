import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, Music, Sparkles, Upload, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSubjects } from '../../hooks/useSubjects';
import clsx from 'clsx';

export default function KaraokeNoteModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  const [mode, setMode] = useState('select'); // 'select' | 'karaoke-form'

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [storyText, setStoryText] = useState('');
  const [audioFileName, setAudioFileName] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setMode('select');
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

  const currentTopics = subjectId
    ? (subjects.find(s => s.id === parseInt(subjectId))?.topics || [])
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setMode('select')}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                &larr; Back
              </button>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-dolphin-400" />
                  New Karaoke Note
                </h2>
                <p className="text-xs text-gray-400">Upload audio and story text for synchronized reading</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Story / Note Title</label>
                <input
                  type="text"
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
                    className="input-field w-full text-sm"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={!subjectId}
                    className="input-field w-full text-sm disabled:opacity-50"
                  >
                    <option value="">Select Topic</option>
                    {currentTopics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audio Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Audio File (.mp3, .wav)</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/15 hover:border-dolphin-500/50 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-dolphin-400 transition-colors mb-1" />
                  <span className="text-xs text-gray-300 font-medium">
                    {audioFileName ? audioFileName : 'Click to select or drop audio file'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-0.5">MP3, WAV up to 20MB</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAudioFileName(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Story Text Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Story Text</label>
                <textarea
                  rows={4}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Paste your story text here..."
                  className="input-field w-full text-sm leading-relaxed"
                />
              </div>

              {/* Interactive Demo Banner inside form */}
              <div className="p-3 rounded-xl bg-dolphin-500/10 border border-dolphin-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-dolphin-200 truncate">
                    Ready to test? Launch the sample German story now.
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
          </div>
        )}
      </div>
    </div>
  );
}
