import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { PageLoader } from '../components/common/Loader';
import { MatchPairsReview } from '../components/quiz/MatchPairsQuestion';
import { CodeSnippetDisplay } from '../components/quiz/CodeSnippetQuestion';
import {
  ChevronLeft, Award, CheckCircle, XCircle, RotateCcw,
  Clock, Calendar, BookOpen, ArrowRight, BarChart2
} from 'lucide-react';
import clsx from 'clsx';

function formatTime(secs) {
  if (!secs) return '0s';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default function QuizReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/quizzes/${id}/review`)
      .then(({ data }) => {
        setData(data.result);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load quiz results');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center animate-fade-in">
        <div className="glass-card p-8 border border-white/10">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-white mb-2">No Saved Result Found</h2>
          <p className="text-gray-400 text-sm mb-6">
            {error || "You haven't completed this quiz yet, or the result is no longer available."}
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/activity" className="btn-secondary text-sm flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Activity History
            </Link>
            <Link to={`/quizzes/${id}/take`} className="btn-primary text-sm flex items-center gap-2">
              Take Quiz Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { attempt, quiz, questions } = data;
  const circumference = 2 * Math.PI * 45;
  const dashoffset = circumference - (attempt.percentage / 100) * circumference;

  const submittedDateFormatted = attempt.submittedAt
    ? new Date(attempt.submittedAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors group px-2.5 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <span className="text-gray-600">/</span>
          <Link to="/activity" className="text-sm text-gray-400 hover:text-white transition-colors">
            Activity History
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-dolphin-400 font-medium truncate max-w-xs">{quiz.title}</span>
        </div>

        <Link
          to={`/quizzes/${id}/take`}
          className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retake Quiz
        </Link>
      </div>

      {/* Score Summary Card */}
      <div className="glass-card p-6 sm:p-8 text-center mb-8 border border-white/10 gradient-border relative overflow-hidden">
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={attempt.passed ? '#22c55e' : '#ef4444'}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              className="progress-ring"
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-3xl font-black text-white">{attempt.percentage}%</div>
            <div className="text-[10px] text-gray-400 font-medium">SCORE</div>
          </div>
        </div>

        <div className="flex justify-center mb-2">
          <span className={clsx(
            'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider',
            attempt.passed
              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
              : 'bg-red-500/15 text-red-400 border border-red-500/30'
          )}>
            {attempt.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {attempt.passed ? 'Quiz Passed' : 'Quiz Failed'}
          </span>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">{quiz.title}</h1>

        {/* Tags & Badges */}
        <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
          {quiz.subject?.name && (
            <span className="badge badge-purple text-xs px-2.5 py-0.5">{quiz.subject.name}</span>
          )}
          {quiz.topic && (
            <span className="badge badge-blue text-xs px-2.5 py-0.5">{quiz.topic}</span>
          )}
        </div>

        {/* Attempt Details Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-xs text-gray-500">Points</div>
            <div className="text-sm font-bold text-white mt-0.5">{attempt.score} / {attempt.maxScore}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-xs text-gray-500">Attempt Count</div>
            <div className="text-sm font-bold text-white mt-0.5">#{attempt.attemptNumber} (Latest)</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-xs text-gray-500">Duration</div>
            <div className="text-sm font-bold text-white mt-0.5 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {formatTime(attempt.timeTakenSecs)}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-xs text-gray-500">Solved On</div>
            <div className="text-xs font-bold text-white mt-1 truncate" title={submittedDateFormatted}>
              {submittedDateFormatted || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-dolphin-400" />
          Detailed Questions & Solutions ({questions.length})
        </h2>
        <span className="text-xs text-gray-500">Review your answers and explanations below</span>
      </div>

      <div className="space-y-5">
        {questions.map((q, i) => {
          if (q.type === 'match-pairs') {
            return <MatchPairsReview key={q._id ?? i} question={q} index={i} />;
          }

          return (
            <div
              key={q._id ?? i}
              className={clsx(
                'glass-card p-5 sm:p-6 border-l-4 transition-all duration-200',
                q.isCorrect ? 'border-l-green-500 border-white/8' : 'border-l-red-500 border-white/8'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="w-6 h-6 rounded-md bg-white/10 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-white font-medium text-sm sm:text-base leading-relaxed">{q.text}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {q.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" /> Correct (+{q.pointsEarned})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )}
                </div>
              </div>

              {q.type === 'code-mcq' && q.codeSnippet && (
                <div className="mb-4">
                  <CodeSnippetDisplay question={q} disabled={true} />
                </div>
              )}

              {/* Options */}
              {Array.isArray(q.options) && (
                <div className="space-y-2 mb-3">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = optIdx === q.chosenIndex;
                    const isCorrectAnswer = optIdx === q.correctIndex;

                    return (
                      <div
                        key={optIdx}
                        className={clsx(
                          'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border',
                          isCorrectAnswer
                            ? 'bg-green-500/15 text-green-300 border-green-500/40'
                            : isChosen && !q.isCorrect
                            ? 'bg-red-500/15 text-red-300 border-red-500/40'
                            : 'bg-white/5 text-gray-400 border-white/5'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={clsx(
                              'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold',
                              isCorrectAnswer
                                ? 'bg-green-500 text-black'
                                : isChosen
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-gray-400'
                            )}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          <div className="text-xs font-bold">
                            {isCorrectAnswer && '✓ Correct Answer'}
                            {isChosen && !q.isCorrect && '✗ Your Answer'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="mt-3.5 px-4 py-2.5 bg-dolphin-600/10 rounded-xl border border-dolphin-500/20">
                  <p className="text-dolphin-300 text-xs leading-relaxed">
                    <strong className="text-white">Explanation:</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
