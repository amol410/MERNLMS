import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  ChevronLeft, BarChart2, Brain, BookOpen, Layers,
  Clock, Calendar, CheckCircle2, XCircle, Filter, ArrowUpRight, ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

// ─── Date & Time Helpers ──────────────────────────────────────────────────────

function formatTime(secs) {
  if (!secs || secs <= 0) return '0s';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentWeekMonday() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - day);
  return getLocalDateString(d);
}

function formatWeekLabel(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  const s = new Date(start + 'T00:00:00').toLocaleDateString('en-US', opts);
  const e = new Date(end + 'T00:00:00').toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${s} – ${e}`;
}

function getDayCategoryInfo(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  const weekdayShort = target.toLocaleDateString('en-US', { weekday: 'short' });
  const weekdayLong = target.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (diffDays === 0) {
    return {
      badge: 'TODAY',
      badgeClass: 'bg-dolphin-500/20 text-dolphin-300 border-dolphin-500/30',
      dateLabel: `${weekdayLong}, ${formattedDate}`,
    };
  } else if (diffDays === 1) {
    return {
      badge: 'YESTERDAY',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      dateLabel: `${weekdayLong}, ${formattedDate}`,
    };
  } else if (diffDays === 2) {
    return {
      badge: `DAY BEFORE YESTERDAY (${weekdayShort.toUpperCase()})`,
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      dateLabel: `${weekdayLong}, ${formattedDate}`,
    };
  } else {
    const colors = {
      Mon: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      Tue: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      Wed: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      Thu: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      Fri: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      Sat: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      Sun: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    };
    return {
      badge: weekdayLong.toUpperCase(),
      badgeClass: colors[weekdayShort] || 'bg-white/10 text-gray-300 border-white/15',
      dateLabel: `${weekdayLong}, ${formattedDate}`,
    };
  }
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ActivityHistoryPage() {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [earliestWeekOf, setEarliestWeekOf] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'quiz' | 'note' | 'flashcard'

  // Fetch one week given a Monday date string
  const fetchWeek = useCallback(async (weekOfDate, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await api.get(`/activity/summary?weekOf=${weekOfDate}`);
      if (data.type === 'week') {
        setWeeks(prev => [...prev, { weekRange: data.weekRange, days: data.days, total: data.total }]);
        
        // Calculate previous Monday
        const prevMonday = new Date(weekOfDate + 'T00:00:00');
        prevMonday.setDate(prevMonday.getDate() - 7);
        const prevStr = getLocalDateString(prevMonday);
        setEarliestWeekOf(prevStr);

        if (data.total === 0 && !isInitial) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch activity week:', err);
      setHasMore(false);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  // Initial load: current week
  useEffect(() => {
    fetchWeek(getCurrentWeekMonday(), true);
  }, [fetchWeek]);

  const handleLoadPrevWeek = () => {
    if (earliestWeekOf && !loadingMore) {
      fetchWeek(earliestWeekOf, false);
    }
  };

  // Compute aggregated statistics across all loaded weeks
  const stats = useMemo(() => {
    let quizCount = 0;
    let noteCount = 0;
    let flashcardCount = 0;
    let totalQuizSecs = 0;
    let totalNoteSecs = 0;
    let totalFlashcardSecs = 0;
    const activeDaysSet = new Set();

    weeks.forEach(w => {
      Object.entries(w.days || {}).forEach(([dateStr, day]) => {
        const dayTotal = (day.quizzes?.length || 0) + (day.notes?.length || 0) + (day.flashcards?.length || 0);
        if (dayTotal > 0) activeDaysSet.add(dateStr);

        (day.quizzes || []).forEach(q => {
          quizCount++;
          totalQuizSecs += q.metadata?.timeTakenSecs || 0;
        });

        (day.notes || []).forEach(n => {
          noteCount++;
          totalNoteSecs += n.metadata?.engagementSecs || 0;
        });

        (day.flashcards || []).forEach(f => {
          flashcardCount++;
          totalFlashcardSecs += f.metadata?.engagementSecs || 0;
        });
      });
    });

    return {
      quizCount,
      noteCount,
      flashcardCount,
      totalSecs: totalQuizSecs + totalNoteSecs + totalFlashcardSecs,
      activeDays: activeDaysSet.size,
    };
  }, [weeks]);

  const totalLoadedActivities = stats.quizCount + stats.noteCount + stats.flashcardCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      {/* Page Header */}
      <div className="glass-card p-6 mb-8 border border-white/10 bg-gradient-to-r from-dolphin-600/10 via-ocean-600/10 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white shadow-xl shadow-dolphin-900/30 flex-shrink-0">
              <BarChart2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Weekly Performance History
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Detailed day-by-day record of your quizzes, notes completed, and flashcards studied
              </p>
            </div>
          </div>

          {/* Quick Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-bold text-purple-400">{stats.quizCount}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">Quizzes</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-bold text-blue-400">{stats.noteCount}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">Notes</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-bold text-green-400">{stats.flashcardCount}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">Flashcards</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-bold text-amber-400">{formatTime(stats.totalSecs)}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">Total Time</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </span>
          {[
            { id: 'all', label: 'All Activities', count: totalLoadedActivities },
            { id: 'quiz', label: 'Quizzes', count: stats.quizCount, icon: Brain, color: 'text-purple-400' },
            { id: 'note', label: 'Notes', count: stats.noteCount, icon: BookOpen, color: 'text-blue-400' },
            { id: 'flashcard', label: 'Flashcards', count: stats.flashcardCount, icon: Layers, color: 'text-green-400' },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer',
                  active
                    ? 'bg-dolphin-500 text-white shadow-lg shadow-dolphin-900/40'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                )}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : tab.color}`} />}
                <span>{tab.label}</span>
                <span className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 border border-white/5">
              <div className="skeleton h-6 w-48 mb-4 rounded-lg" />
              <div className="space-y-3">
                <div className="skeleton h-14 rounded-xl" />
                <div className="skeleton h-14 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : weeks.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/5">
          <div className="text-5xl mb-3">📊</div>
          <h3 className="text-lg font-bold text-white mb-1">No Activity History Yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Complete quizzes, study notes for at least 3 minutes, or practice flashcards to start tracking your performance.
          </p>
          <Link to="/quizzes" className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
            Take a Quiz <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {weeks.map((week, idx) => (
            <WeekSection
              key={idx}
              weekRange={week.weekRange}
              days={week.days}
              activeFilter={activeFilter}
            />
          ))}

          {/* Load More Pagination */}
          <div className="text-center pt-4 pb-8">
            {hasMore ? (
              <button
                onClick={handleLoadPrevWeek}
                disabled={loadingMore}
                className="btn-secondary text-sm px-6 py-2.5 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-dolphin-400 rounded-full animate-spin" />
                    <span>Loading Previous Week...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-dolphin-400" />
                    <span>Load Previous Week</span>
                  </>
                )}
              </button>
            ) : (
              <p className="text-gray-500 text-xs">
                You've reached the beginning of your activity history 🎉
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Week Section ────────────────────────────────────────────────────────────

function WeekSection({ weekRange, days, activeFilter }) {
  // Sort dates descending so newest days appear first
  const dateKeys = Object.keys(days || {}).sort().reverse();

  // Filter days based on the active filter
  const filteredDays = dateKeys.filter(dateStr => {
    const day = days[dateStr];
    if (activeFilter === 'quiz') return (day.quizzes?.length || 0) > 0;
    if (activeFilter === 'note') return (day.notes?.length || 0) > 0;
    if (activeFilter === 'flashcard') return (day.flashcards?.length || 0) > 0;
    return (day.quizzes?.length || 0) + (day.notes?.length || 0) + (day.flashcards?.length || 0) > 0;
  });

  return (
    <div className="glass-card p-6 border border-white/8 relative overflow-hidden">
      {/* Week Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-dolphin-500/15 border border-dolphin-500/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-dolphin-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Week of {formatWeekLabel(weekRange.start, weekRange.end)}
            </h2>
            <p className="text-xs text-gray-500">
              {filteredDays.length} {filteredDays.length === 1 ? 'day' : 'days'} active
            </p>
          </div>
        </div>
      </div>

      {filteredDays.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No matching activities found for this week.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDays.map(dateStr => (
            <DayBlock
              key={dateStr}
              dateStr={dateStr}
              day={days[dateStr]}
              activeFilter={activeFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Day Block ───────────────────────────────────────────────────────────────

function DayBlock({ dateStr, day, activeFilter }) {
  const showQuizzes = activeFilter === 'all' || activeFilter === 'quiz';
  const showNotes = activeFilter === 'all' || activeFilter === 'note';
  const showFlashcards = activeFilter === 'all' || activeFilter === 'flashcard';

  const quizzes = showQuizzes ? (day.quizzes || []) : [];
  const notes = showNotes ? (day.notes || []) : [];
  const flashcards = showFlashcards ? (day.flashcards || []) : [];

  const category = getDayCategoryInfo(dateStr);

  const dayQuizSecs = (day.quizzes || []).reduce((acc, q) => acc + (q.metadata?.timeTakenSecs || 0), 0);
  const dayNoteSecs = (day.notes || []).reduce((acc, n) => acc + (n.metadata?.engagementSecs || 0), 0);
  const dayFlashcardSecs = (day.flashcards || []).reduce((acc, f) => acc + (f.metadata?.engagementSecs || 0), 0);
  const dayTotalSecs = dayQuizSecs + dayNoteSecs + dayFlashcardSecs;
  const totalActivities = quizzes.length + notes.length + flashcards.length;

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-5">
      {/* Day Title & Daily Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={clsx(
            'text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border',
            category.badgeClass
          )}>
            {category.badge}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {category.dateLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Daily Study Time Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold text-xs shadow-sm shadow-amber-500/5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatTime(dayTotalSecs)}</span>
            <span className="text-[10px] text-amber-400/80 font-normal uppercase tracking-wider">study time</span>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
          </span>
        </div>
      </div>

      {/* Activities Grid / List */}
      <div className="space-y-2.5">
        {/* Quizzes */}
        {quizzes.map((quiz, i) => (
          <div
            key={`quiz-${quiz.id || i}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-purple-500/10 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/quizzes/${quiz.resourceId}/review`}
                    className="text-white text-sm font-semibold truncate hover:text-purple-300 transition-colors"
                  >
                    {quiz.resourceTitle}
                  </Link>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Quiz
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {quiz.subjectName && (
                    <span className="badge badge-purple text-[11px] px-2 py-0">{quiz.subjectName}</span>
                  )}
                  {quiz.topicName && (
                    <span className="badge badge-blue text-[11px] px-2 py-0">{quiz.topicName}</span>
                  )}
                  {quiz.metadata?.attemptCount > 0 && (
                    <span className="text-xs text-gray-500">
                      Attempt #{quiz.metadata.attemptCount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quiz performance badges and review button */}
            <div className="flex items-center gap-2.5 sm:flex-shrink-0 pl-12 sm:pl-0 flex-wrap">
              {quiz.metadata?.timeTakenSecs > 0 && (
                <div className="text-xs text-gray-400 flex items-center gap-1" title="Time taken">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {formatTime(quiz.metadata.timeTakenSecs)}
                </div>
              )}
              {quiz.metadata?.percentage !== undefined && (
                <div className="text-xs font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg">
                  {quiz.metadata.score}/{quiz.metadata.maxScore} ({quiz.metadata.percentage}%)
                </div>
              )}
              {quiz.metadata?.passed !== undefined && (
                <div className={clsx(
                  'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
                  quiz.metadata.passed
                    ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                )}>
                  {quiz.metadata.passed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Failed
                    </>
                  )}
                </div>
              )}
              <Link
                to={`/quizzes/${quiz.resourceId}/review`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors"
                title="Review test questions, answers, and solutions"
              >
                <span>Review</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}

        {/* Notes */}
        {notes.map((note, i) => (
          <div
            key={`note-${note.id || i}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-blue-500/10 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold truncate hover:text-blue-300 transition-colors">
                    {note.resourceTitle}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    Note Read
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {note.subjectName && (
                    <span className="badge badge-purple text-[11px] px-2 py-0">{note.subjectName}</span>
                  )}
                  {note.topicName && (
                    <span className="badge badge-blue text-[11px] px-2 py-0">{note.topicName}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    Completed study
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:flex-shrink-0 pl-12 sm:pl-0">
              {note.metadata?.engagementSecs > 0 && (
                <div className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Read for {formatTime(note.metadata.engagementSecs)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Flashcards */}
        {flashcards.map((card, i) => (
          <div
            key={`fc-${card.id || i}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-green-500/10 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Layers className="w-4 h-4 text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold truncate hover:text-green-300 transition-colors">
                    {card.resourceTitle}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-green-500/10 text-green-300 border border-green-500/20">
                    Flashcards
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {card.subjectName && (
                    <span className="badge badge-purple text-[11px] px-2 py-0">{card.subjectName}</span>
                  )}
                  {card.topicName && (
                    <span className="badge badge-blue text-[11px] px-2 py-0">{card.topicName}</span>
                  )}
                  {card.metadata?.cardCount > 0 && (
                    <span className="text-xs text-gray-500">
                      {card.metadata.cardCount} cards in deck
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:flex-shrink-0 pl-12 sm:pl-0">
              {card.metadata?.masteredCount !== undefined && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg font-medium">
                  {card.metadata.masteredCount} mastered
                </div>
              )}
              {card.metadata?.engagementSecs > 0 && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {formatTime(card.metadata.engagementSecs)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
