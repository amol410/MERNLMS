import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Globe, Heart, Sparkles, Flame, Trophy, Award, ChevronDown, Check,
  BookOpen, HelpCircle, ArrowRight, Zap, RefreshCw, Compass, Lock,
  ChevronRight, Volume2
} from 'lucide-react';
import clsx from 'clsx';
import api from '../api/axios';
import LingoLessonModal from '../components/lingodolphy/LingoLessonModal';
import toast from 'react-hot-toast';

const AVAILABLE_COURSES = [
  {
    title: 'German A1 (Deutsch)',
    subtitle: 'English instruction • Complete 105 Units',
    flag: '🇩🇪',
    targetLanguage: 'de',
    nativeLanguage: 'en',
    level: 'A1',
    accent: '#1CB0F6',
  },
  {
    title: 'English A1 (इंग्रजी)',
    subtitle: 'मराठी माध्यमातून शिका • Section 1 (35 Units)',
    flag: '🇬🇧',
    targetLanguage: 'en',
    nativeLanguage: 'mr',
    level: 'A1',
    accent: '#58CC02',
  },
  {
    title: 'English A1 (अंग्रेजी)',
    subtitle: 'हिन्दी माध्यम से सीखें • Section 1 (35 Units)',
    flag: '🇬🇧',
    targetLanguage: 'en',
    nativeLanguage: 'hi',
    level: 'A1',
    accent: '#FF9600',
  },
];

const SECTIONS = [
  { num: 1, title: 'Rookie', range: 'Units 1 – 35', color: '#1CB0F6' },
  { num: 2, title: 'Explorer', range: 'Units 36 – 70', color: '#58CC02' },
  { num: 3, title: 'Traveler', range: 'Units 71 – 105', color: '#FF9600' },
];

export default function LingoDolphyPage() {
  const [status, setStatus] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchingCourse, setSwitchingCourse] = useState(false);

  // Active track selection
  const [targetLanguage, setTargetLanguage] = useState('de');
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [level, setLevel] = useState('A1');

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showGuidebook, setShowGuidebook] = useState(false);
  const [activeLessonNode, setActiveLessonNode] = useState(null);

  // Active visible unit header
  const [selectedSection, setSelectedSection] = useState(1);

  // Fetch initial economy status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/gamification/status');
      if (res.data?.success && res.data.status) {
        const s = res.data.status;
        setStatus(s);
        if (s.targetLanguage) setTargetLanguage(s.targetLanguage);
        if (s.nativeLanguage) setNativeLanguage(s.nativeLanguage);
        if (s.currentLevel) setLevel(s.currentLevel);
      }
    } catch (err) {
      console.warn('Status fetch error:', err);
    }
  }, []);

  // Fetch archipelago path
  const fetchPath = useCallback(async (target, native, lvl, sec = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/gamification/path', {
        params: {
          targetLanguage: target,
          nativeLanguage: native,
          level: lvl,
          section: sec,
        },
      });
      if (res.data?.success && Array.isArray(res.data.nodes)) {
        setNodes(res.data.nodes);
      }
    } catch (err) {
      console.error('Path fetch error:', err);
      toast.error('Unable to load language path. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await fetchStatus();
    }
    init();
  }, [fetchStatus]);

  useEffect(() => {
    fetchPath(targetLanguage, nativeLanguage, level, selectedSection);
  }, [targetLanguage, nativeLanguage, level, selectedSection, fetchPath]);

  // Handle Course Switch
  async function handleSwitchCourse(course) {
    if (course.targetLanguage === targetLanguage && course.nativeLanguage === nativeLanguage) {
      setShowCourseModal(false);
      return;
    }
    setShowCourseModal(false);
    setSwitchingCourse(true);
    setTargetLanguage(course.targetLanguage);
    setNativeLanguage(course.nativeLanguage);
    setLevel(course.level);
    setSelectedSection(1);

    try {
      const [switchRes] = await Promise.all([
        api.post('/gamification/switch-course', {
          targetLanguage: course.targetLanguage,
          nativeLanguage: course.nativeLanguage,
          level: course.level,
        }),
        fetchPath(course.targetLanguage, course.nativeLanguage, course.level, 1),
      ]);
      if (switchRes.data?.success) {
        setStatus(prev => ({ ...prev, ...switchRes.data.status }));
        toast.success(`Switched to ${course.title}!`, { icon: course.flag });
      }
    } catch (err) {
      console.error('Course switch error:', err);
      toast.error('Failed to update course track.');
    } finally {
      setSwitchingCourse(false);
    }
  }

  // Refill Oxygen
  async function handleRefillOxygen() {
    try {
      const res = await api.post('/gamification/shop/refill-oxygen');
      if (res.data?.success) {
        setStatus(prev => ({
          ...prev,
          oxygen: res.data.oxygen,
          pearls: res.data.pearls,
        }));
        toast.success('Oxygen refilled to maximum (5/5)!', { icon: '❤️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Need at least 30 pearls to refill oxygen.');
    }
  }

  // Group nodes by Unit
  const unitsMap = useMemo(() => {
    const map = new Map();
    nodes.forEach(node => {
      const uNum = node.unitNumber || 1;
      if (!map.has(uNum)) {
        map.set(uNum, {
          unitNumber: uNum,
          unitTitle: node.unitTitle || 'Introductions & Greetings',
          unitDescription: node.unitDescription || '',
          sectionNumber: node.sectionNumber || 1,
          sectionTitle: node.sectionTitle || 'Rookie',
          colorHex: node.colorHex || '#1CB0F6',
          lessons: [],
        });
      }
      map.get(uNum).lessons.push(node);
    });
    return Array.from(map.values());
  }, [nodes]);

  const currentCourse = AVAILABLE_COURSES.find(
    c => c.targetLanguage === targetLanguage && c.nativeLanguage === nativeLanguage
  ) || AVAILABLE_COURSES[0];

  const zigzagOffsets = [0, 45, -45, 25, -35, 40, -20, 0];

  return (
    <div className="min-h-screen bg-[#0F171A] text-white selection:bg-cyan-500/30">
      {/* 1. Top Gamified Status & Economy Bar */}
      <div className="sticky top-20 z-40 bg-[#131F24]/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Active Course Switcher Button */}
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#202F36] border border-white/10 hover:border-cyan-500/40 hover:bg-[#273840] transition-all group"
          >
            <span className="text-2xl leading-none">{currentCourse.flag}</span>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-gray-300 block leading-none">
                {currentCourse.title.split(' ')[0]} {currentCourse.level}
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold leading-none">Tap to switch</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          </button>

          {/* Economy Badges */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-sm">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
              <span>{status?.streakCount || 1}</span>
            </div>

            {/* Oxygen Hearts */}
            <button
              onClick={handleRefillOxygen}
              title="Refill Hearts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-sm hover:scale-105 active:scale-95 transition-all"
            >
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>{status?.oxygen ?? 5}</span>
            </button>

            {/* Pearls */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{status?.pearls || 100}</span>
            </div>

            {/* XP */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-sm">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{status?.totalXp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Archipelago Path Container */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Section Navigation Header */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSectionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1A262C] border border-white/10 hover:border-cyan-500/40 text-sm font-black transition-all"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Section {selectedSection}: {SECTIONS[selectedSection - 1]?.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <button
            onClick={() => setShowGuidebook(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#202F36] border border-white/10 hover:border-white/20 text-xs font-bold text-gray-300 hover:text-white transition-all"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Guidebook</span>
          </button>
        </div>

        {/* Shimmer Loading Skeleton */}
        {(loading || switchingCourse) ? (
          <div className="flex flex-col items-center py-6 animate-pulse">
            {/* Shimmer Banner */}
            <div className="w-full h-24 rounded-3xl bg-[#1E2B31] mb-12 shadow-lg" />

            {/* Shimmer Stepping Stones in Zig-Zag */}
            <div className="w-full flex flex-col items-center gap-6">
              {[0, 45, -40, 25, -35, 40].map((offset, i) => (
                <div
                  key={i}
                  style={{ transform: `translateX(${offset}px)` }}
                  className="w-18 h-18 rounded-full bg-[#1E2B31] border-4 border-[#151E22] shadow-xl"
                />
              ))}
            </div>
          </div>
        ) : (
          /* Real Archipelago Units and Stepping Stones */
          <div className="space-y-12">
            {unitsMap.map((unit) => {
              const unitColor = unit.colorHex || '#1CB0F6';
              return (
                <div key={unit.unitNumber} className="relative">
                  {/* Sticky Unit Header Banner */}
                  <div
                    style={{ backgroundColor: unitColor }}
                    className="p-5 rounded-3xl shadow-xl mb-8 text-white relative overflow-hidden transition-all"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-white/80 block mb-1">
                          SECTION {unit.sectionNumber} • UNIT {unit.unitNumber}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">{unit.unitTitle}</h2>
                        {unit.unitDescription && (
                          <p className="text-xs sm:text-sm font-semibold text-white/90 mt-0.5">
                            {unit.unitDescription}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowGuidebook(true)}
                        className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white transition-colors"
                        title="Unit guidebook"
                      >
                        <BookOpen className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stepping Stones Path in this Unit */}
                  <div className="flex flex-col items-center gap-5 relative py-2">
                    {unit.lessons.map((node, idx) => {
                      const offset = zigzagOffsets[idx % zigzagOffsets.length];
                      const isCompleted = node.status === 'completed';
                      const isAvailable = node.status === 'available';
                      const isLocked = !isCompleted && !isAvailable;
                      const isChest = node.type === 'chest';

                      return (
                        <div
                          key={node.id || idx}
                          style={{ transform: `translateX(${offset}px)` }}
                          className="flex flex-col items-center group relative"
                        >
                          {/* Active Mascot Avatar Badge on Available Node */}
                          {isAvailable && (
                            <div className="mb-2 animate-bounce flex flex-col items-center">
                              <div className="px-3 py-1 rounded-xl bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-500/40 uppercase tracking-wider">
                                START HERE
                              </div>
                              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-cyan-500" />
                            </div>
                          )}

                          {/* Stepping Stone Button */}
                          <button
                            disabled={isLocked}
                            onClick={() => setActiveLessonNode(node)}
                            className={clsx(
                              'w-20 h-20 rounded-full border-b-[6px] flex flex-col items-center justify-center font-black transition-all duration-200 relative',
                              isCompleted
                                ? 'bg-[#58CC02] border-[#46A302] text-white hover:scale-105 active:translate-y-1 shadow-lg shadow-green-950/40'
                                : isAvailable
                                  ? 'bg-[#1CB0F6] border-[#1899D6] text-white hover:scale-105 active:translate-y-1 ring-8 ring-cyan-500/20 shadow-xl shadow-cyan-950/50'
                                  : isChest
                                    ? 'bg-[#FF9600] border-[#D97D00] text-white hover:scale-105 active:translate-y-1'
                                    : 'bg-[#273840] border-[#1B272C] text-gray-500 cursor-not-allowed'
                            )}
                          >
                            {isCompleted ? (
                              <div className="flex flex-col items-center">
                                <Check className="w-7 h-7 stroke-[3]" />
                                <div className="flex gap-0.5 mt-0.5">
                                  {Array.from({ length: node.stars || 3 }).map((_, i) => (
                                    <span key={i} className="text-[10px] text-amber-300">⭐</span>
                                  ))}
                                </div>
                              </div>
                            ) : isAvailable ? (
                              <span className="text-2xl">{isChest ? '💎' : '🏝️'}</span>
                            ) : (
                              <Lock className="w-6 h-6 text-gray-500" />
                            )}
                          </button>

                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 pointer-events-none z-30 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#202F36] border border-white/10 text-white font-bold text-xs shadow-xl">
                            {node.title} • {isCompleted ? 'Review' : isAvailable ? 'Start' : 'Locked'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Switcher Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#131F24] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-1">Switch Language Course</h3>
            <p className="text-gray-400 text-sm mb-6">Choose which course track and native language to learn with:</p>

            <div className="space-y-3">
              {AVAILABLE_COURSES.map(course => {
                const isSelected = course.targetLanguage === targetLanguage && course.nativeLanguage === nativeLanguage;
                return (
                  <button
                    key={`${course.targetLanguage}_${course.nativeLanguage}`}
                    onClick={() => handleSwitchCourse(course)}
                    className={clsx(
                      'w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all',
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'bg-[#1E2B31] border-[#2C3E47] hover:border-cyan-500/40'
                    )}
                  >
                    <span className="text-3xl leading-none">{course.flag}</span>
                    <div className="flex-1">
                      <p className="text-base font-black text-white">{course.title}</p>
                      <p className="text-xs text-gray-400">{course.subtitle}</p>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowCourseModal(false)}
              className="w-full mt-6 py-3 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/15 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Section Jumper Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#131F24] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-1">Course Sections</h3>
            <p className="text-gray-400 text-sm mb-6">Jump to a CEFR learning milestone:</p>

            <div className="space-y-3">
              {SECTIONS.map(sec => {
                const isCurrent = sec.num === selectedSection;
                return (
                  <button
                    key={sec.num}
                    onClick={() => {
                      setSelectedSection(sec.num);
                      setShowSectionModal(false);
                    }}
                    className={clsx(
                      'w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all',
                      isCurrent
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-lg'
                        : 'bg-[#1E2B31] border-[#2C3E47] text-white hover:border-cyan-500/40'
                    )}
                  >
                    <div>
                      <p className="text-base font-black">Section {sec.num}: {sec.title}</p>
                      <p className="text-xs text-gray-400">{sec.range}</p>
                    </div>
                    {isCurrent && <Check className="w-5 h-5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowSectionModal(false)}
              className="w-full mt-6 py-3 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/15 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Unit Guidebook Modal */}
      {showGuidebook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[#131F24] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-white mb-2">Unit Guidebook & Tips</h3>
            <p className="text-gray-400 text-sm mb-6">Key vocabulary and phrases for this milestone:</p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#1A262C] border border-white/5">
                <h4 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-2">Essential Phrases</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="font-bold text-white">Hallo / Hello</span>
                    <span className="text-gray-400">Greetings</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="font-bold text-white">Guten Morgen</span>
                    <span className="text-gray-400">Good morning</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="font-bold text-white">Danke schön</span>
                    <span className="text-gray-400">Thank you very much</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1A262C] border border-white/5">
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider mb-2">Pro Tip</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Repeat words out loud as you tap them! Spoken repetition creates muscle memory for German sounds like <span className="font-bold text-cyan-300">ä, ö, ü</span> and English rhythm.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuidebook(false)}
              className="w-full mt-6 py-3 rounded-2xl bg-cyan-500 text-white font-black hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Interactive Multi-Stage Lesson Runner Modal */}
      {activeLessonNode && (
        <LingoLessonModal
          node={activeLessonNode}
          targetLanguage={targetLanguage}
          onClose={() => {
            setActiveLessonNode(null);
            fetchPath(targetLanguage, nativeLanguage, level, selectedSection);
            fetchStatus();
          }}
          onComplete={async (completedNode, resultData) => {
            // Optimistic instant unlock: mark current completed and next available
            const completedIdx = completedNode?.index;
            setNodes(prev => prev.map(n => {
              const isThisNode = (completedIdx !== undefined && n.index === completedIdx) ||
                                 (completedNode?.id && String(n.id) === String(completedNode.id));
              if (isThisNode) {
                return { ...n, status: 'completed', stars: 3 };
              }
              if (completedIdx !== undefined && n.index === completedIdx + 1) {
                return { ...n, status: 'available' };
              }
              return n;
            }));

            // Refresh economy stats and fetch fresh canonical path
            fetchStatus();
            try {
              await fetchPath(targetLanguage, nativeLanguage, level, selectedSection);
            } catch (_) {}
          }}
        />
      )}
    </div>
  );
}
