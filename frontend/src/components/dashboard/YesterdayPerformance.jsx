import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  Brain, BookOpen, Layers, ArrowRight, ChevronDown, ChevronUp,
  Clock, TrendingUp, Calendar, ChevronLeft, BarChart2,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getCurrentWeekMonday() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0=Mon
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  const s = new Date(start + 'T00:00:00').toLocaleDateString('en-US', opts);
  const e = new Date(end + 'T00:00:00').toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${s} – ${e}`;
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ActivityItem({ icon: Icon, iconColor, iconBg, label, subject, topic, meta }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-snug truncate group-hover:text-dolphin-300 transition-colors">
          {label}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {subject && (
            <span className="badge badge-purple text-[11px] px-2 py-0">{subject}</span>
          )}
          {topic && (
            <span className="badge badge-blue text-[11px] px-2 py-0">{topic}</span>
          )}
        </div>
      </div>
      {meta && (
        <div className="flex-shrink-0 text-right">
          {meta}
        </div>
      )}
    </div>
  );
}

function QuizMeta({ metadata }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      {metadata?.attemptCount > 0 && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <BarChart2 className="w-3 h-3" />
          {metadata.attemptCount}×
        </span>
      )}
      {metadata?.timeTakenSecs > 0 && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(metadata.timeTakenSecs)}
        </span>
      )}
      {metadata?.passed !== undefined && (
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
          metadata.passed ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
        }`}>
          {metadata.passed ? 'Passed' : 'Failed'}
        </span>
      )}
    </div>
  );
}

function CategorySection({ icon: Icon, iconColor, iconBg, title, items, emptyText, renderItem }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-3 last:mb-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 py-1.5 px-1 text-left hover:opacity-80 transition-opacity"
      >
        <div className={`w-6 h-6 rounded-md ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <span className="text-sm font-semibold text-gray-200">{title}</span>
        <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
          items.length > 0 ? 'bg-dolphin-500/20 text-dolphin-300' : 'bg-white/5 text-gray-600'
        }`}>
          {items.length}
        </span>
        <span className="ml-auto text-gray-700">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {items.length === 0 ? (
            <p className="text-gray-700 text-xs px-3 py-2">{emptyText}</p>
          ) : (
            items.map((item, i) => (
              <div key={item.id || i}>{renderItem(item)}</div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Weekly History View ─────────────────────────────────────────────────────

function WeekBlock({ weekRange, days }) {
  const dateKeys = Object.keys(days).sort();
  const hasAnyActivity = dateKeys.some(d =>
    days[d].quizzes.length + days[d].notes.length + days[d].flashcards.length > 0
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gray-950/90 backdrop-blur-sm py-1.5 -mx-1 px-1 z-10">
        <Calendar className="w-4 h-4 text-dolphin-400" />
        <span className="text-sm font-semibold text-white">
          {formatWeekLabel(weekRange.start, weekRange.end)}
        </span>
      </div>

      {!hasAnyActivity ? (
        <p className="text-gray-700 text-sm text-center py-4">No activity this week</p>
      ) : (
        dateKeys.map(dateStr => {
          const day = days[dateStr];
          const total = day.quizzes.length + day.notes.length + day.flashcards.length;
          if (total === 0) return null;

          return (
            <div key={dateStr} className="mb-4 last:mb-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 pl-1">
                {formatDateLabel(dateStr)}
              </div>
              <div className="space-y-0.5">
                {day.quizzes.map((item, i) => (
                  <ActivityItem
                    key={`q-${item.id || i}`}
                    icon={Brain}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    label={item.resourceTitle}
                    subject={item.subjectName}
                    topic={item.topicName}
                    meta={<QuizMeta metadata={item.metadata} />}
                  />
                ))}
                {day.notes.map((item, i) => (
                  <ActivityItem
                    key={`n-${item.id || i}`}
                    icon={BookOpen}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    label={item.resourceTitle}
                    subject={item.subjectName}
                    topic={item.topicName}
                    meta={
                      item.metadata?.engagementSecs > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.metadata.engagementSecs)}
                        </span>
                      )
                    }
                  />
                ))}
                {day.flashcards.map((item, i) => (
                  <ActivityItem
                    key={`f-${item.id || i}`}
                    icon={Layers}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    label={item.resourceTitle}
                    subject={item.subjectName}
                    topic={item.topicName}
                    meta={
                      item.metadata?.cardCount > 0 && (
                        <span className="text-xs text-gray-500">{item.metadata.cardCount} cards</span>
                      )
                    }
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function YesterdayPerformance() {
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);

  // Weekly history state — array of { weekRange, days }
  const [weeks, setWeeks] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);
  const [earliestWeekOf, setEarliestWeekOf] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // ── Fetch yesterday's summary ──
  useEffect(() => {
    const yesterday = getYesterday();
    api.get(`/activity/summary?date=${yesterday}`)
      .then(({ data }) => {
        setDayData(data);
      })
      .catch(() => {
        setDayData({ activities: { quizzes: [], notes: [], flashcards: [] }, summary: { quizCount: 0, noteCount: 0, flashcardCount: 0 } });
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch one week of history ──
  const fetchWeek = useCallback(async (weekOfDate) => {
    setWeekLoading(true);
    try {
      const { data } = await api.get(`/activity/summary?weekOf=${weekOfDate}`);
      if (data.type === 'week') {
        setWeeks(prev => [...prev, { weekRange: data.weekRange, days: data.days }]);
        // Go back one more week for the "Load Previous" button
        const prevMonday = new Date(weekOfDate + 'T00:00:00');
        prevMonday.setDate(prevMonday.getDate() - 7);
        const prevStr = prevMonday.toISOString().split('T')[0];
        setEarliestWeekOf(prevStr);
        // If the fetched week has no data it may be the end, but still allow 1 more
        if (data.total === 0) setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setWeekLoading(false);
    }
  }, []);

  // ── Open weekly view — load current week first ──
  const handleViewAll = () => {
    setViewAll(true);
    if (weeks.length === 0) {
      fetchWeek(getCurrentWeekMonday());
    }
  };

  const handleLoadPrevWeek = () => {
    if (earliestWeekOf) fetchWeek(earliestWeekOf);
  };

  // ─── Summary card (default view) ────────────────────────────────────────
  if (!viewAll) {
    const { quizzes = [], notes = [], flashcards = [] } = dayData?.activities || {};
    const summary = dayData?.summary || {};
    const total = (summary.total ?? 0);

    return (
      <div className="glass-card p-5 mb-8 border border-white/8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dolphin-600 to-ocean-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Yesterday's Performance</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {new Date(getYesterday() + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleViewAll}
            className="flex items-center gap-1 text-xs text-dolphin-400 hover:text-dolphin-300 transition-colors font-medium"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-8 rounded-xl" />
            <div className="skeleton h-8 rounded-xl" />
            <div className="skeleton h-8 rounded-xl" />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🌟</div>
            <p className="text-gray-500 text-sm">No activity yesterday</p>
            <p className="text-gray-700 text-xs mt-1">Keep learning and check back tomorrow!</p>
          </div>
        ) : (
          <>
            {/* Summary chips */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <StatChip icon={Brain} iconColor="text-purple-400" iconBg="bg-purple-500/10" value={summary.quizCount} label="Quizzes" />
              <StatChip icon={BookOpen} iconColor="text-blue-400" iconBg="bg-blue-500/10" value={summary.noteCount} label="Notes" />
              <StatChip icon={Layers} iconColor="text-green-400" iconBg="bg-green-500/10" value={summary.flashcardCount} label="Flashcards" />
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1">
              <CategorySection
                icon={Brain} iconColor="text-purple-400" iconBg="bg-purple-500/10"
                title="Quizzes Solved"
                items={quizzes}
                emptyText="No quizzes solved yesterday"
                renderItem={(item) => (
                  <ActivityItem
                    icon={Brain} iconColor="text-purple-400" iconBg="bg-purple-500/10"
                    label={item.resourceTitle}
                    subject={item.subjectName}
                    topic={item.topicName}
                    meta={<QuizMeta metadata={item.metadata} />}
                  />
                )}
              />
              <CategorySection
                icon={BookOpen} iconColor="text-blue-400" iconBg="bg-blue-500/10"
                title="Notes Completed"
                items={notes}
                emptyText="No notes read for 3+ minutes yesterday"
                renderItem={(item) => (
                  <ActivityItem
                    icon={BookOpen} iconColor="text-blue-400" iconBg="bg-blue-500/10"
                    label={item.resourceTitle}
                    subject={item.subjectName}
                    topic={item.topicName}
                    meta={
                      item.metadata?.engagementSecs > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.metadata.engagementSecs)}
                        </span>
                      )
                    }
                  />
                )}
              />
              <CategorySection
                icon={Layers} iconColor="text-green-400" iconBg="bg-green-500/10"
                title="Flashcards Completed"
                items={flashcards}
                emptyText="No flashcard decks studied for 2+ minutes yesterday"
                renderItem={(item) => (
                  <ActivityItem
                    icon={Layers} iconColor="text-green-400" iconBg="bg-green-500/10"
                    label={item.resourceTitle}
                    subject={item.subjectName}
                    topic={item.topicName}
                    meta={
                      item.metadata?.cardCount > 0 && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">{item.metadata.cardCount} cards</span>
                      )
                    }
                  />
                )}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Full Weekly History View ─────────────────────────────────────────────
  return (
    <div className="glass-card p-5 mb-8 border border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setViewAll(false)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-dolphin-400" />
              Activity History
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">Week by week</p>
          </div>
        </div>
      </div>

      {/* Weeks */}
      <div className="max-h-[70vh] overflow-y-auto -mx-1 px-1">
        {weeks.length === 0 && weekLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : (
          <>
            {weeks.map((w, i) => (
              <WeekBlock key={i} weekRange={w.weekRange} days={w.days} />
            ))}

            {/* Load previous week button */}
            {hasMore && (
              <div className="pt-2 pb-1 text-center">
                <button
                  onClick={handleLoadPrevWeek}
                  disabled={weekLoading}
                  className="btn-secondary text-sm px-5 py-2 flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {weekLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-dolphin-400 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="w-4 h-4" />
                      Load Previous Week
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasMore && weeks.length > 0 && (
              <p className="text-center text-gray-700 text-xs py-4">You've reached the beginning of your history 🎉</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Small stat chip for summary header ──────────────────────────────────────
function StatChip({ icon: Icon, iconColor, iconBg, value, label }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${iconBg} border border-white/5`}>
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      <span className="text-white text-xs font-bold">{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}
