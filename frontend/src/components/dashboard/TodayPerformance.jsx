import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Brain, BookOpen, Layers, ArrowRight, TrendingUp } from 'lucide-react';

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TodayPerformance() {
  const [summary, setSummary] = useState({ quizCount: 0, noteCount: 0, flashcardCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = getLocalDateString(new Date());
    api.get(`/activity/summary?date=${today}&countsOnly=true`)
      .then(({ data }) => {
        setSummary(data.summary || { quizCount: 0, noteCount: 0, flashcardCount: 0 });
      })
      .catch(() => {
        setSummary({ quizCount: 0, noteCount: 0, flashcardCount: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="glass-card p-5 mb-8 border border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dolphin-600 to-ocean-600 flex items-center justify-center flex-shrink-0">
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

      {/* Summary chips */}
      <div className="flex gap-2.5 mt-4 flex-wrap">
        {loading ? (
          <>
            <div className="skeleton h-8 w-24 rounded-full" />
            <div className="skeleton h-8 w-20 rounded-full" />
            <div className="skeleton h-8 w-28 rounded-full" />
          </>
        ) : (
          <>
            <StatChip
              icon={Brain}
              iconColor="text-purple-400"
              iconBg="bg-purple-500/10"
              value={summary.quizCount ?? 0}
              label="Quizzes"
            />
            <StatChip
              icon={BookOpen}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              value={summary.noteCount ?? 0}
              label="Notes"
            />
            <StatChip
              icon={Layers}
              iconColor="text-green-400"
              iconBg="bg-green-500/10"
              value={summary.flashcardCount ?? 0}
              label="Flashcards"
            />
          </>
        )}
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, iconColor, iconBg, value, label }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${iconBg} border border-white/5`}>
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      <span className="text-white text-xs font-bold">{value}</span>
      <span className="text-gray-400 text-xs">{label}</span>
    </div>
  );
}
