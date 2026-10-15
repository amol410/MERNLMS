import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Compass, Plus, Upload, ListPlus, Search, Filter, Sparkles,
  Layers, CheckCircle2, AlertCircle, Edit3, Trash2, Eye, EyeOff,
  Headphones, Mic, Music, Trophy, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  RefreshCw, Globe, MessageSquare, Type, HelpCircle, Check, ArrowUp, ArrowDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import UnitOutlineModal from '../components/curriculum/UnitOutlineModal';
import LessonEditorModal from '../components/curriculum/LessonEditorModal';
import BulkUploadModal from '../components/curriculum/BulkUploadModal';

const LEARNING_LANGUAGES = [
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
];

const NATIVE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
];

const CEFR_LEVELS = [
  { level: 'A1', label: 'Beginner' },
  { level: 'A2', label: 'Elementary' },
  { level: 'B1', label: 'Intermediate' },
  { level: 'B2', label: 'Upper Intermediate' },
];

const SECTIONS = [
  {
    number: 1,
    title: 'Rookie',
    subtitle: 'First Steps & Daily Essentials',
    range: 'Units 1 – 35',
    minUnit: 1,
    maxUnit: 35,
    icon: '🔰',
    gradient: 'from-blue-600/30 via-slate-900 to-cyan-950/40 border-cyan-500/40 text-cyan-300',
    activeBadge: 'bg-cyan-500 text-white shadow-lg shadow-cyan-900/50',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    number: 2,
    title: 'Explorer',
    subtitle: 'Conversations, Routines & Travel',
    range: 'Units 36 – 70',
    minUnit: 36,
    maxUnit: 70,
    icon: '🧭',
    gradient: 'from-emerald-600/30 via-slate-900 to-teal-950/40 border-emerald-500/40 text-emerald-300',
    activeBadge: 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    number: 3,
    title: 'Traveler',
    subtitle: 'Grammar Depth, Past Tense & Mastery',
    range: 'Units 71 – 105',
    minUnit: 71,
    maxUnit: 105,
    icon: '✈️',
    gradient: 'from-purple-600/30 via-slate-900 to-indigo-950/40 border-purple-500/40 text-purple-300',
    activeBadge: 'bg-purple-500 text-white shadow-lg shadow-purple-900/50',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
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
  const [selectedSection, setSelectedSection] = useState(1);
  const [unitNumber, setUnitNumber] = useState(1);
  const [unitTitle, setUnitTitle] = useState('Greet and introduce yourself');
  const [unitDescription, setUnitDescription] = useState('Erste Begrüßungen');

  // Search filter inside unit
  const [lessonSearch, setLessonSearch] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState(null);

  // English Voice Persona State (Default: female - Samantha)
  const [voicePersona, setVoicePersona] = useState(() => {
    try {
      return localStorage.getItem('lingo_voice_persona') || 'female';
    } catch (_) {
      return 'female';
    }
  });

  const handleVoicePersonaChange = (persona) => {
    setVoicePersona(persona);
    try {
      localStorage.setItem('lingo_voice_persona', persona);
    } catch (_) {}
    toast.success(`Voice set to ${persona === 'female' ? 'Female (Samantha)' : 'Male (Daniel)'}`);

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = persona === 'female'
          ? 'Hello! I am your female English voice.'
          : 'Hello! I am your male English voice.';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;

        const voices = window.speechSynthesis.getVoices();
        const NOVELTY = [
          'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
          'deranged', 'fred', 'good news', 'hysterical', 'junior', 'organ',
          'pipe organ', 'trinoids', 'whisper', 'wobble', 'zarvox', 'jester'
        ];
        const cleanVoices = (voices || []).filter(v => {
          const n = (v.name || '').toLowerCase();
          const l = (v.lang || '').toLowerCase().replace('_', '-');
          return !NOVELTY.some(x => n.includes(x)) && l.startsWith('en');
        });

        const preferred = persona === 'female'
          ? ['samantha', 'google us english', 'google uk english female', 'karen', 'serena', 'jenny', 'zira', 'fiona', 'moira', 'victoria', 'allison', 'ava', 'susan']
          : ['daniel', 'google us english male', 'google uk english male', 'david', 'oliver', 'george', 'guy', 'reed', 'rocko', 'eddy'];

        let chosen = null;
        for (const pref of preferred) {
          chosen = cleanVoices.find(v => (v.name || '').toLowerCase().includes(pref));
          if (chosen) break;
        }
        if (!chosen && cleanVoices.length > 0) chosen = cleanVoices[0];
        if (chosen) utterance.voice = chosen;

        window.speechSynthesis.speak(utterance);
      } catch (_) {}
    }
  };

  // Lessons Data
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unitsSummary, setUnitsSummary] = useState([]);
  const [togglingUnit, setTogglingUnit] = useState(false);

  // Modals
  const [outlineModalOpen, setOutlineModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  // Synchronize active section based on unitNumber
  useEffect(() => {
    const secNum = unitNumber <= 35 ? 1 : (unitNumber <= 70 ? 2 : 3);
    if (secNum !== selectedSection) {
      setSelectedSection(secNum);
    }
  }, [unitNumber]);

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
        if (fetchedLessons.length > 0) {
          if (fetchedLessons[0].unitTitle) setUnitTitle(fetchedLessons[0].unitTitle);
          if (fetchedLessons[0].unitDescription) setUnitDescription(fetchedLessons[0].unitDescription);
        }
      }

      if (unitsRes.status === 'fulfilled') {
        const fetchedUnits = unitsRes.value.data.units || [];
        setUnitsSummary(fetchedUnits);
        const curUnit = fetchedUnits.find(u => u.unitNumber === unitNumber);
        if (curUnit) {
          if (curUnit.unitTitle) setUnitTitle(curUnit.unitTitle);
          if (curUnit.unitDescription) setUnitDescription(curUnit.unitDescription);
        }
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

  // Filter units for the selected section
  const currentSectionMeta = useMemo(() => {
    return SECTIONS.find(s => s.number === selectedSection) || SECTIONS[0];
  }, [selectedSection]);

  const unitsForCurrentSection = useMemo(() => {
    if (!unitsSummary || unitsSummary.length === 0) return [];
    return unitsSummary.filter(
      u => u.unitNumber >= currentSectionMeta.minUnit && u.unitNumber <= currentSectionMeta.maxUnit
    );
  }, [unitsSummary, currentSectionMeta]);

  // Handle switching section
  const handleSelectSection = (secNum) => {
    setSelectedSection(secNum);
    const sec = SECTIONS.find(s => s.number === secNum);
    if (sec) {
      if (unitNumber < sec.minUnit || unitNumber > sec.maxUnit) {
        setUnitNumber(sec.minUnit);
      }
    }
  };

  // Navigate to previous / next unit
  const handlePrevUnit = () => {
    if (unitNumber > 1) {
      setUnitNumber(prev => prev - 1);
    }
  };

  const handleNextUnit = () => {
    if (unitNumber < 105) {
      setUnitNumber(prev => prev + 1);
    }
  };

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

  // Toggle Live / Draft status for a single lesson
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

  // Toggle ALL lessons in current unit to Live or Draft
  const handleToggleUnitLive = async (targetLive) => {
    setTogglingUnit(true);
    try {
      await api.patch(`/curriculum/units/${unitNumber}/live`, {
        isLive: targetLive,
        learningLanguage,
        level,
      });
      toast.success(`Unit ${unitNumber} updated to ${targetLive ? 'LIVE 🟢' : 'DRAFT 🔒'}`);
      fetchCurriculum();
    } catch {
      toast.error('Failed to update unit live status');
    } finally {
      setTogglingUnit(false);
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

  // Delete entire unit
  const handleDeleteEntireUnit = async () => {
    if (!confirm(`⚠️ Are you sure you want to delete ALL lessons in Unit ${unitNumber}: "${unitTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/curriculum/units/${unitNumber}`, {
        params: { learningLanguage, level },
      });
      toast.success(res.data.message || `Deleted Unit ${unitNumber}`);
      fetchCurriculum();
    } catch {
      toast.error('Failed to delete unit');
    }
  };

  // Move lesson order up/down
  const handleMoveLessonOrder = async (e, index, direction) => {
    e.stopPropagation();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= lessons.length) return;

    const copy = [...lessons];
    const currentItem = copy[index];
    const targetItem = copy[newIdx];

    // Swap positions locally
    copy[index] = targetItem;
    copy[newIdx] = currentItem;
    setLessons(copy);

    try {
      const curId = currentItem.id || currentItem._id;
      const targetId = targetItem.id || targetItem._id;
      await Promise.all([
        api.put(`/curriculum/lessons/${curId}`, { lessonIndex: targetItem.lessonIndex }),
        api.put(`/curriculum/lessons/${targetId}`, { lessonIndex: currentItem.lessonIndex }),
      ]);
      toast.success('Lesson reordered');
    } catch {
      toast.error('Failed to save order change');
      fetchCurriculum();
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

  // Filter lessons by search query
  const filteredLessons = useMemo(() => {
    if (!lessonSearch.trim()) return lessons;
    const q = lessonSearch.toLowerCase();
    return lessons.filter(l =>
      (l.title && l.title.toLowerCase().includes(q)) ||
      (l.subtitle && l.subtitle.toLowerCase().includes(q)) ||
      (l.nodeType && l.nodeType.toLowerCase().includes(q))
    );
  }, [lessons, lessonSearch]);

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
                Hierarchical control: <strong>Section ➔ Unit ➔ Lesson</strong> with full CRUD & challenge builders
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setOutlineModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-2 cursor-pointer hover:border-cyan-400"
          >
            <ListPlus className="w-4 h-4 text-cyan-400" />
            Outline Unit Headings
          </button>

          <button
            onClick={() => setBulkModalOpen(true)}
            className="btn-secondary text-xs flex items-center gap-2 cursor-pointer hover:border-emerald-400"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Bulk Upload
          </button>

          <button
            onClick={handleCreateNewLesson}
            className="btn-primary text-xs flex items-center gap-2 shadow-lg shadow-dolphin-900/30 cursor-pointer"
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
            <Globe className="w-4 h-4" /> Target Language & CEFR Level
          </span>
          <button
            onClick={fetchCurriculum}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${learningLanguage === 'en' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
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
              Native Language (Learner Instruction)
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
                  className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
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

          {/* English Voice Persona Selector (Only visible when English is selected) */}
          {learningLanguage === 'en' && (
            <div>
              <label className="text-xs text-gray-400 font-semibold block mb-1.5 flex items-center justify-between">
                <span>English Voice</span>
                <span className="text-[10px] text-cyan-400 font-normal">Tap to preview</span>
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-800/80 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleVoicePersonaChange('female')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    voicePersona === 'female'
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Female Voice (Default: Samantha on Mac, Google Female, Jenny)"
                >
                  <span>👩</span> Female
                </button>
                <button
                  type="button"
                  onClick={() => handleVoicePersonaChange('male')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    voicePersona === 'male'
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Male Voice (Daniel on Mac, Google Male, David)"
                >
                  <span>👨</span> Male
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. STEP 1: SECTION DRILL-DOWN SELECTOR */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">
              1
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Step 1: Choose Curriculum Section
            </h2>
          </div>
          <span className="text-xs text-gray-400">
            Each section contains 35 modular progressive units
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SECTIONS.map(sec => {
            const isSelected = selectedSection === sec.number;
            const secUnits = unitsSummary.filter(u => u.unitNumber >= sec.minUnit && u.unitNumber <= sec.maxUnit);
            const secLessons = secUnits.reduce((acc, u) => acc + (u.totalLessons || 0), 0);
            const secLive = secUnits.reduce((acc, u) => acc + (u.liveLessons || 0), 0);

            return (
              <button
                key={sec.number}
                type="button"
                onClick={() => handleSelectSection(sec.number)}
                className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? `bg-gradient-to-br ${sec.gradient} shadow-xl scale-[1.01] ring-2 ring-white/20`
                    : 'glass-card hover:border-white/25 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{sec.icon}</span>
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        SECTION {sec.number}
                      </span>
                      <h3 className="text-xl font-black text-white">{sec.title}</h3>
                    </div>
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                    isSelected ? sec.activeBadge : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    {sec.range}
                  </span>
                </div>

                <p className="text-xs text-gray-300 font-medium mb-3">
                  {sec.subtitle}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-3 border-t border-white/10 text-gray-400">
                  <span>{secUnits.length || 35} Units • {secLessons} Lessons</span>
                  <span className={secLive > 0 ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                    {secLive > 0 ? `${secLive} Live 🟢` : 'Draft Mode 🔒'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. STEP 2: UNIT SELECTOR & UNIT OVERVIEW CARD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">
              2
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Step 2: Select Unit in Section {selectedSection} ({currentSectionMeta.title})
            </h2>
          </div>

          {/* Unit Jump Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevUnit}
              disabled={unitNumber <= 1}
              className="p-1.5 rounded-xl bg-slate-800 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Unit"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-300">
              Unit {unitNumber} / 105
            </span>
            <button
              type="button"
              onClick={handleNextUnit}
              disabled={unitNumber >= 105}
              className="p-1.5 rounded-xl bg-slate-800 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Unit"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unit Dropdown / Quick Switcher */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="text-xs font-bold text-gray-400 shrink-0 uppercase tracking-wider">
            Active Unit:
          </label>
          <select
            value={unitNumber}
            onChange={e => setUnitNumber(parseInt(e.target.value, 10))}
            className="input-field text-sm font-bold bg-slate-800 flex-1"
          >
            {unitsForCurrentSection.length > 0 ? (
              unitsForCurrentSection.map(u => (
                <option key={u.unitNumber} value={u.unitNumber}>
                  Unit {u.unitNumber}: {u.unitTitle} — ({u.totalLessons || 0} lessons {u.liveLessons > 0 ? `• ${u.liveLessons} live` : '• draft'})
                </option>
              ))
            ) : (
              <option value={unitNumber}>Unit {unitNumber}: {unitTitle}</option>
            )}
          </select>
        </div>

        {/* Unit Hero Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-blue-900/60 via-slate-900/80 to-cyan-950/60 border border-white/15 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black tracking-widest text-cyan-400 uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                  SECTION {selectedSection}: {currentSectionMeta.title.toUpperCase()}
                </span>
                <span className="text-[11px] font-black text-gray-300 px-2 py-0.5 rounded-full bg-white/10">
                  {level} • UNIT {unitNumber} (Lesson {unitNumber <= 35 ? unitNumber : (unitNumber <= 70 ? unitNumber - 35 : unitNumber - 70)} of 35)
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {unitTitle}
              </h3>

              {unitDescription && (
                <p className="text-sm font-semibold text-cyan-300/80">
                  🇩🇪 {unitDescription}
                </p>
              )}

              <p className="text-xs text-gray-400 pt-1">
                Active learning path for German A1 Goethe / CEFR Curriculum
              </p>
            </div>

            {/* Right: Unit Stats & Unit-Level Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Stats badges */}
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[70px]">
                  <span className="block text-xl font-black text-white">{totalLessons}</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Total</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[70px]">
                  <span className="block text-xl font-black text-emerald-400">{liveCount}</span>
                  <span className="text-[9px] text-emerald-300 uppercase tracking-wider font-semibold">Live 🟢</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center min-w-[70px]">
                  <span className="block text-xl font-black text-amber-400">{draftCount}</span>
                  <span className="text-[9px] text-amber-300 uppercase tracking-wider font-semibold">Draft 🔒</span>
                </div>
              </div>

              {/* Unit Quick Control Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 sm:border-l sm:border-white/10 sm:pl-3">
                <button
                  type="button"
                  disabled={togglingUnit || totalLessons === 0}
                  onClick={() => handleToggleUnitLive(liveCount < totalLessons)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    liveCount === totalLessons && totalLessons > 0
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-md'
                  }`}
                  title="Toggle all lessons in this unit"
                >
                  {liveCount === totalLessons && totalLessons > 0 ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Draft All</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Publish All Live</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteEntireUnit}
                  disabled={totalLessons === 0}
                  className="p-2 text-gray-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete entire unit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. STEP 3: LESSONS LIST & COMPLETE STAGE CONTROLS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-black">
              3
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Step 3: Lessons in Unit {unitNumber} ({filteredLessons.length} of {lessons.length})
            </h3>
          </div>

          {/* Search bar inside lessons */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lessonSearch}
              onChange={e => setLessonSearch(e.target.value)}
              placeholder="Search lessons & topics..."
              className="input-field text-xs pl-9 py-1.5 bg-slate-900/80"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 glass-card rounded-3xl">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-400" />
            <p className="text-sm">Loading curriculum lessons for Unit {unitNumber}...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-3xl border border-dashed border-white/20 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
              🏝️
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">No lessons in {level} Unit {unitNumber} yet</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                You can outline the 16 lesson headings for this unit, add a custom lesson, or seed demo data.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => setOutlineModalOpen(true)}
                className="btn-primary text-xs flex items-center gap-2 cursor-pointer"
              >
                <ListPlus className="w-4 h-4" /> Outline Unit Headings
              </button>
              <button
                onClick={handleCreateNewLesson}
                className="btn-secondary text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Single Lesson
              </button>
              {unitNumber === 1 && level === 'A1' && learningLanguage === 'de' && (
                <button
                  onClick={handleSeedDefault}
                  className="btn-secondary text-xs flex items-center gap-2 text-cyan-300 border-cyan-500/30 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Seed Default Unit 1 Demo
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLessons.map((lesson, idx) => {
              const nodeMeta = NODE_TYPE_MAP[lesson.nodeType] || NODE_TYPE_MAP.lesson;
              const stages = Array.isArray(lesson.stages) ? lesson.stages : [];
              const hasMatch = stages.some(s => s.type === 'word_match' || s.type === 'match_pairs');
              const hasListenTap = stages.some(s => s.type === 'listen_tap');
              const hasCloze = stages.some(s => s.type === 'cloze_test' || s.type === 'cloze');
              const hasBuilder = stages.some(s => s.type === 'sentence_builder');
              const hasType = stages.some(s => s.type === 'type_word' || s.type === 'type_input');
              const hasDialogue = stages.some(s => s.type === 'dialogue_bubble' || s.type === 'dialogue');
              const hasListenSelect = stages.some(s => s.type === 'listen_select' || s.type === 'listen_comprehension');
              const hasSprechen = stages.some(s => s.type === 'sprechen');
              const hasKaraoke = stages.some(s => s.type === 'karaoke') || lesson.nodeType === 'karaoke';

              const isExpanded = expandedLessonId === (lesson.id || lesson._id || idx);

              return (
                <div
                  key={lesson.id || lesson._id || idx}
                  className="glass-card rounded-3xl border border-white/10 hover:border-white/20 transition-all overflow-hidden"
                >
                  {/* Lesson Main Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Sequence index + Title + Badges */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      {/* Step index badge & Reorder buttons */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-sm text-cyan-400 shadow-md">
                          #{idx + 1}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => handleMoveLessonOrder(e, idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleMoveLessonOrder(e, idx, 'down')}
                            disabled={idx === filteredLessons.length - 1}
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
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

                        <h4 className="text-base font-bold text-white truncate hover:text-cyan-300 transition-colors">
                          {lesson.title}
                        </h4>
                        {lesson.subtitle && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {lesson.subtitle}
                          </p>
                        )}

                        {/* Interactive Stage Format Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {hasMatch && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                              🧩 Word Pairs
                            </span>
                          )}
                          {hasListenTap && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium flex items-center gap-1">
                              <Headphones className="w-3 h-3" /> Listen & Tap
                            </span>
                          )}
                          {hasCloze && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium">
                              📝 Cloze Blank
                            </span>
                          )}
                          {hasType && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                              ⌨️ Umlaut Type
                            </span>
                          )}
                          {hasDialogue && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Chat Bubble
                            </span>
                          )}
                          {hasListenSelect && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium">
                              👂 Listen Select
                            </span>
                          )}
                          {hasBuilder && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                              ✍️ Syntax
                            </span>
                          )}
                          {hasSprechen && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium flex items-center gap-1">
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

                    {/* Right: Actions Toolbar */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                      {/* Inspect / Preview Stages Accordion Button */}
                      {stages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedLessonId(isExpanded ? null : (lesson.id || lesson._id || idx))}
                          className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Preview questions and stages"
                        >
                          <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Live Status Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleLive(e, lesson)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
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
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-white cursor-pointer hover:border-cyan-400"
                        title="Edit challenge stages and content"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteLesson(e, lesson)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10 cursor-pointer"
                        title="Delete lesson"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Stage Details Accordion */}
                  {isExpanded && stages.length > 0 && (
                    <div className="bg-black/40 border-t border-white/10 p-4 sm:p-5 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
                        <span>Configured Challenge Stages ({stages.length})</span>
                        <span className="text-[11px] text-cyan-400">All questions configured in Admin Panel</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stages.map((stg, sIdx) => (
                          <div key={sIdx} className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">
                                Stage {sIdx + 1}: {stg.type}
                              </span>
                              {stg.audioUrl && (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                  <Headphones className="w-3 h-3" /> Audio Attached
                                </span>
                              )}
                            </div>

                            {stg.type === 'cloze_test' && (
                              <div>
                                <p className="text-white font-semibold">Sentence: {stg.prompt || stg.sentence}</p>
                                <p className="text-emerald-400">Missing Answer: <strong>{stg.blank || stg.correctOption || stg.correctAnswer}</strong></p>
                                {Array.isArray(stg.options) && (
                                  <p className="text-gray-400 text-[11px]">Options: {stg.options.join(', ')}</p>
                                )}
                              </div>
                            )}

                            {stg.type === 'type_word' && (
                              <div>
                                <p className="text-white font-semibold">Prompt: {stg.prompt}</p>
                                <p className="text-emerald-400">Target Word: <strong>{stg.target || stg.targetWord || stg.word}</strong></p>
                                <p className="text-gray-400 text-[11px]">Meaning: {stg.translation || stg.nativeMeaning}</p>
                              </div>
                            )}

                            {stg.type === 'dialogue_bubble' && (
                              <div>
                                <p className="text-purple-300 font-bold">{stg.partnerName}: <span className="text-white font-normal">"{stg.partnerMessage || stg.prompt}"</span></p>
                                <p className="text-gray-400 text-[11px]">Trans: {stg.translation}</p>
                                <p className="text-emerald-400">Correct Reply: {stg.correctOption || stg.correctAnswer}</p>
                              </div>
                            )}

                            {stg.type === 'listen_select' && (
                              <div>
                                <p className="text-white font-semibold">Spoken: "{stg.spokenGerman || stg.sentence}"</p>
                                <p className="text-gray-400 text-[11px]">Question: {stg.question || stg.prompt}</p>
                                <p className="text-emerald-400">Answer: {stg.correctOption || stg.correctAnswer}</p>
                              </div>
                            )}

                            {stg.type === 'word_match' && Array.isArray(stg.pairs) && (
                              <div>
                                <p className="text-gray-300">Pairs ({stg.pairs.length}): {stg.pairs.map(p => `${p.target} = ${p.native}`).join(', ')}</p>
                              </div>
                            )}

                            {stg.type === 'listen_tap' && (
                              <div>
                                <p className="text-white font-semibold">Heard: "{stg.targetSentence}"</p>
                                {Array.isArray(stg.tokens) && (
                                  <p className="text-gray-400 text-[11px]">Tokens: {stg.tokens.join(', ')}</p>
                                )}
                              </div>
                            )}

                            {stg.type === 'sentence_builder' && (
                              <div>
                                <p className="text-gray-400 text-[11px]">{stg.prompt}</p>
                                <p className="text-white font-semibold">Target: "{stg.targetSentence}"</p>
                              </div>
                            )}

                            {stg.type === 'sprechen' && (
                              <div>
                                <p className="text-white font-semibold">Speak: "{stg.prompt}"</p>
                                <p className="text-gray-400 text-[11px]">Trans: {stg.translation} • Min Acc: {stg.minAccuracy || 75}%</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
