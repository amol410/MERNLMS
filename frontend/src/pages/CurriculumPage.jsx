import { useState, useEffect, useCallback } from 'react';
import {
  Compass, Plus, Upload, ListPlus, Search, Filter, Sparkles,
  Layers, CheckCircle2, AlertCircle, Edit3, Trash2, Eye, EyeOff,
  Headphones, Mic, Music, Trophy, ChevronRight, RefreshCw, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import UnitOutlineModal from '../components/curriculum/UnitOutlineModal';
import LessonEditorModal from '../components/curriculum/LessonEditorModal';
import BulkUploadModal from '../components/curriculum/BulkUploadModal';

const LEARNING_LANGUAGES = [
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
];

const NATIVE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
];

const CEFR_LEVELS = [
  { level: 'A1', label: 'Beginner' },
  { level: 'A2', label: 'Elementary' },
  { level: 'B1', label: 'Intermediate' },
  { level: 'B2', label: 'Upper Intermediate' },
];

const NODE_TYPE_MAP = {
  lesson:  { label: 'Interactive Lesson', icon: '🏝️', color: 'from-blue-500 to-cyan-500' },
  karaoke: { label: 'Audio Karaoke Rhythm', icon: '🎵', color: 'from-pink-500 to-rose-500' },
  speech:  { label: 'Sprechen Lip-Sync', icon: '🎙️', color: 'from-purple-500 to-indigo-500' },
  chest:   { label: 'Treasure Chest', icon: '💎', color: 'from-amber-400 to-yellow-500' },
  match:   { label: 'Word Matching', icon: '🧩', color: 'from-emerald-500 to-teal-500' },
  quiz:    { label: 'Checkpoint Exam', icon: '🏆', color: 'from-orange-500 to-red-500' },
};

export default function CurriculumPage() {
  const { user } = useAuth();

  // Filters State
  const [learningLanguage, setLearningLanguage] = useState('de');
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [level, setLevel] = useState('A1');
  const [unitNumber, setUnitNumber] = useState(1);
  const [unitTitle, setUnitTitle] = useState('Coral Reef');

  // Lessons Data
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unitsSummary, setUnitsSummary] = useState([]);

  // Modals
  const [outlineModalOpen, setOutlineModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  // Fetch lessons for active filters
  const fetchCurriculum = useCallback(async () => {
    setLoading(true);
    try {
      const [lessonsRes, unitsRes] = await Promise.allSettled([
        api.get('/curriculum/lessons', {
          params: { learningLanguage, nativeLanguage, level, unitNumber },
        }),
        api.get('/curriculum/units', {
          params: { learningLanguage, nativeLanguage, level },
        }),
      ]);

      if (lessonsRes.status === 'fulfilled') {
        const fetchedLessons = lessonsRes.value.data.lessons || [];
        setLessons(fetchedLessons);
        if (fetchedLessons.length > 0 && fetchedLessons[0].unitTitle) {
          setUnitTitle(fetchedLessons[0].unitTitle);
        }
      }

      if (unitsRes.status === 'fulfilled') {
        setUnitsSummary(unitsRes.value.data.units || []);
      }
    } catch {
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, [learningLanguage, nativeLanguage, level, unitNumber]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  // Seed default Unit 1 demo if empty
  const handleSeedDefault = async () => {
    try {
      const res = await api.post('/curriculum/seed-default');
      toast.success(res.data.message || 'Seeded Unit 1 successfully!');
      fetchCurriculum();
    } catch {
      toast.error('Failed to seed default unit');
    }
  };

  // Toggle Live / Draft status
  const handleToggleLive = async (e, lesson) => {
    e.stopPropagation();
    const targetId = lesson.id || lesson._id;
    const nextStatus = !lesson.isLive;

    // Optimistic update
    setLessons(prev =>
      prev.map(l => (l.id === targetId || l._id === targetId ? { ...l, isLive: nextStatus } : l))
    );

    try {
      const res = await api.patch(`/curriculum/lessons/${targetId}/live`, {
        isLive: nextStatus,
      });
      toast.success(res.data.message || `Status updated!`);
    } catch {
      // Revert on error
      setLessons(prev =>
        prev.map(l => (l.id === targetId || l._id === targetId ? { ...l, isLive: !nextStatus } : l))
      );
      toast.error('Failed to update live status');
    }
  };

  // Delete a lesson
  const handleDeleteLesson = async (e, lesson) => {
    e.stopPropagation();
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;

    const targetId = lesson.id || lesson._id;
    try {
      await api.delete(`/curriculum/lessons/${targetId}`);
      setLessons(prev => prev.filter(l => l.id !== targetId && l._id !== targetId));
      toast.success('Lesson deleted');
    } catch {
      toast.error('Failed to delete lesson');
    }
  };

  // Open editor for a specific lesson
  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setEditorModalOpen(true);
  };

  // Open editor for new lesson
  const handleCreateNewLesson = () => {
    setEditingLesson(null);
    setEditorModalOpen(true);
  };

  const totalLessons = lessons.length;
  const liveCount = lessons.filter(l => l.isLive).length;
  const draftCount = totalLessons - liveCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-8">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center shadow-lg shadow-dolphin-900/40">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Curriculum & Lesson Studio
              </h1>
              <p className="text-gray-400 text-sm">
                Design archipelago units, manage interactive challenge stages, and toggle lessons live
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setOutlineModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-2"
          >
            <ListPlus className="w-4 h-4 text-cyan-400" />
            Outline Unit Headings
          </button>

          <button
            onClick={() => setBulkModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Bulk Upload
          </button>

          <button
            onClick={handleCreateNewLesson}
            className="btn-primary text-xs flex items-center gap-2 shadow-lg shadow-dolphin-900/30"
          >
            <Plus className="w-4 h-4" />
            Add Lesson
          </button>
        </div>
      </div>

      {/* 2. Language & CEFR Filter Hub */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Multi-Language & Level Filter
          </span>
          <button
            onClick={fetchCurriculum}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target / Learning Language */}
          <div>
            <label className="text-xs text-gray-400 font-semibold block mb-1.5">
              Learning Language (Target)
            </label>
            <select
              value={learningLanguage}
              onChange={e => setLearningLanguage(e.target.value)}
              className="input-field text-sm font-semibold bg-slate-800"
            >
              {LEARNING_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Native / Interface Language */}
          <div>
            <label className="text-xs text-gray-400 font-semibold block mb-1.5">
              Native Language (Learner)
            </label>
            <select
              value={nativeLanguage}
              onChange={e => setNativeLanguage(e.target.value)}
              className="input-field text-sm font-semibold bg-slate-800"
            >
              {NATIVE_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* CEFR Level Selector */}
          <div>
            <label className="text-xs text-gray-400 font-semibold block mb-1.5">
              CEFR Level
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-800/80 border border-white/10">
              {CEFR_LEVELS.map(({ level: lvl }) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                    level === lvl
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Unit Selector */}
          <div>
            <label className="text-xs text-gray-400 font-semibold block mb-1.5">
              Unit Section
            </label>
            <select
              value={unitNumber}
              onChange={e => setUnitNumber(parseInt(e.target.value, 10))}
              className="input-field text-sm font-semibold bg-slate-800"
            >
              {unitsSummary.length > 0 ? (
                unitsSummary.map(u => (
                  <option key={u.unitNumber} value={u.unitNumber}>
                    Unit {u.unitNumber}: {u.unitTitle} ({u.totalLessons} lessons)
                  </option>
                ))
              ) : (
                <option value={1}>Unit 1: {unitTitle}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Unit Overview Card */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-blue-900/50 via-slate-900/60 to-cyan-950/40 border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">
              {level} • UNIT {unitNumber}
            </span>
            <h2 className="text-2xl font-black text-white mt-0.5">{unitTitle}</h2>
            <p className="text-xs text-gray-400 mt-1">
              Active learning path for {LEARNING_LANGUAGES.find(l => l.code === learningLanguage)?.name} learners
            </p>
          </div>

          {/* Unit Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="block text-xl font-black text-white">{totalLessons}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="block text-xl font-black text-emerald-400">{liveCount}</span>
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold">Live 🟢</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="block text-xl font-black text-amber-400">{draftCount}</span>
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">Draft 🔒</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lessons List */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Lessons in this Section
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
              {lessons.length}
            </span>
          </h3>
          <span className="text-xs text-gray-400">
            Click <strong>Edit</strong> to configure challenge stages, or toggle <strong>LIVE</strong> to publish
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 glass-card rounded-3xl">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-400" />
            <p className="text-sm">Loading curriculum lessons...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-3xl border border-dashed border-white/20 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
              🏝️
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">No lessons in {level} Unit {unitNumber} yet</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                You can outline the lesson headings for this unit in seconds, create a new lesson, or seed the default demo.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => setOutlineModalOpen(true)}
                className="btn-primary text-xs flex items-center gap-2"
              >
                <ListPlus className="w-4 h-4" /> Outline Unit Headings
              </button>
              <button
                onClick={handleCreateNewLesson}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Single Lesson
              </button>
              {unitNumber === 1 && level === 'A1' && learningLanguage === 'de' && (
                <button
                  onClick={handleSeedDefault}
                  className="btn-secondary text-xs flex items-center gap-2 text-cyan-300 border-cyan-500/30"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Seed Default Unit 1 Demo
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, idx) => {
              const nodeMeta = NODE_TYPE_MAP[lesson.nodeType] || NODE_TYPE_MAP.lesson;
              const stages = Array.isArray(lesson.stages) ? lesson.stages : [];
              const hasMatch = stages.some(s => s.type === 'word_match');
              const hasListen = stages.some(s => s.type === 'listen_tap');
              const hasBuilder = stages.some(s => s.type === 'sentence_builder');
              const hasSprechen = stages.some(s => s.type === 'sprechen');
              const hasKaraoke = stages.some(s => s.type === 'karaoke') || lesson.nodeType === 'karaoke';

              return (
                <div
                  key={lesson.id || lesson._id || idx}
                  className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Sequence index + Title + Badges */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-sm text-cyan-400 shrink-0 shadow-md">
                      #{idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-semibold flex items-center gap-1.5">
                          <span>{nodeMeta.icon}</span>
                          <span>{nodeMeta.label}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          +{lesson.xpReward || 15} XP • +{lesson.pearlsReward || 5} 💎
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {lesson.title}
                      </h4>
                      {lesson.subtitle && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {lesson.subtitle}
                        </p>
                      )}

                      {/* Active Challenge Stage Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {hasMatch && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                            🧩 Word Pairs
                          </span>
                        )}
                        {hasListen && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium flex items-center gap-1">
                            <Headphones className="w-3 h-3" /> Listen & Tap
                          </span>
                        )}
                        {hasBuilder && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                            ✍️ Syntax
                          </span>
                        )}
                        {hasSprechen && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium flex items-center gap-1">
                            <Mic className="w-3 h-3" /> Voice
                          </span>
                        )}
                        {hasKaraoke && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-300 border border-pink-500/30 font-medium flex items-center gap-1">
                            <Music className="w-3 h-3" /> Synced Karaoke
                          </span>
                        )}
                        {stages.length === 0 && lesson.nodeType !== 'chest' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                            ⚠️ No stages configured yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Toggle & Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                    {/* Live Status Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLive(e, lesson)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        lesson.isLive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                      title={lesson.isLive ? 'Click to make Draft' : 'Click to publish Live'}
                    >
                      {lesson.isLive ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE 🟢</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>DRAFT 🔒</span>
                        </>
                      )}
                    </button>

                    {/* Edit Lesson Button */}
                    <button
                      type="button"
                      onClick={() => handleEditLesson(lesson)}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-white"
                      title="Edit this lesson"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteLesson(e, lesson)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
                      title="Delete lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <UnitOutlineModal
        isOpen={outlineModalOpen}
        onClose={() => setOutlineModalOpen(false)}
        onSuccess={fetchCurriculum}
        currentLanguage={learningLanguage}
        currentNative={nativeLanguage}
        currentLevel={level}
        unitNumber={unitNumber}
        unitTitle={unitTitle}
      />

      <BulkUploadModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={fetchCurriculum}
        currentLanguage={learningLanguage}
        currentNative={nativeLanguage}
        currentLevel={level}
        unitNumber={unitNumber}
      />

      <LessonEditorModal
        isOpen={editorModalOpen}
        onClose={() => { setEditorModalOpen(false); setEditingLesson(null); }}
        lessonId={editingLesson?.id || editingLesson?._id}
        initialData={editingLesson}
        onSuccess={fetchCurriculum}
        currentLanguage={learningLanguage}
        currentNative={nativeLanguage}
        currentLevel={level}
        currentUnit={unitNumber}
      />
    </div>
  );
}
