import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Brain, BookOpen, Layers, ArrowRight, ChevronDown, ChevronUp,
  Clock, TrendingUp, BarChart2,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday() {
  return getLocalDateString(new Date());
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
        className="w-full flex items-center gap-2 py-1.5 px-1 text-left hover:opacity-80 transition-opacity cursor-pointer"
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
        <span className="ml-auto text-gray-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {items.length === 0 ? (
            <p className="text-gray-600 text-xs px-3 py-2">{emptyText}</p>
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TodayPerformance() {
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch today's summary
  useEffect(() => {
    const today = getToday();
    api.get(`/activity/summary?date=${today}`)
      .then(({ data }) => {
        setDayData(data);
      })
      .catch(() => {
        setDayData({ activities: { quizzes: [], notes: [], flashcards: [] }, summary: { quizCount: 0, noteCount: 0, flashcardCount: 0 } });
      })
      .finally(() => setLoading(false));
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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
            <h2 className="text-base font-semibold text-white">Today's Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">{todayFormatted}</p>
          </div>
        </div>

        {/* View All navigates to the dedicated Activity History page */}
        <Link
          to="/activity"
          className="flex items-center gap-1.5 text-xs text-dolphin-400 hover:text-dolphin-300 transition-colors font-semibold group px-2.5 py-1.5 rounded-lg hover:bg-dolphin-500/10"
          title="View full weekly performance history"
        >
          View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-8 rounded-xl" />
          <div className="skeleton h-8 rounded-xl" />
          <div className="skeleton h-8 rounded-xl" />
        </div>
      ) : total === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">⚡</div>
          <p className="text-gray-400 text-sm font-medium">No activity yet today</p>
          <p className="text-gray-600 text-xs mt-1">Solve quizzes, read notes, or study flashcards to track your progress today!</p>
          <div className="mt-4">
            <Link
              to="/activity"
              className="inline-flex items-center gap-1 text-xs text-dolphin-400 hover:text-dolphin-300 font-medium"
            >
              View past weekly history <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
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
              emptyText="No quizzes solved today"
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
              emptyText="No notes read for 3+ minutes today"
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
              emptyText="No flashcard decks studied for 2+ minutes today"
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

          <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
            <Link
              to="/activity"
              className="inline-flex items-center gap-1 text-xs text-dolphin-400 hover:text-dolphin-300 font-medium group"
            >
              View full weekly history <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Small stat chip for summary header ──────────────────────────────────────
function StatChip({ icon: Icon, iconColor, iconBg, value, label }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${iconBg} border border-white/5`}>
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      <span className="text-white text-xs font-bold">{value}</span>
      <span className="text-gray-400 text-xs">{label}</span>
    </div>
  );
}
