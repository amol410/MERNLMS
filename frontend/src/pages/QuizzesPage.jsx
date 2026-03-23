import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Search, Plus, Clock, Award, Users, Play, X, CheckCircle, Pencil } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { GridSkeleton } from '../components/common/Loader';

export default function QuizzesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [myAttempts, setMyAttempts] = useState({});

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 24 };
      if (search) params.q = search;
      const { data } = await api.get('/quizzes', { params });
      setQuizzes(data.quizzes);
    } catch {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  const difficultyColor = (questions) => {
    const q = questions?.length || 0;
    if (q <= 5) return { label: 'Easy', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    if (q <= 15) return { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Hard', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            Quizzes
          </h1>
          <p className="text-gray-500 mt-1">{quizzes.length} quizzes • Auto-graded with explanations</p>
        </div>
        {user?.role === 'instructor' && (
          <Link to="/quizzes/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Quiz
          </Link>
        )}
      </div>

      <div className="glass-card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} className="input-field pl-11" placeholder="Search quizzes..." />
          </div>
          {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="btn-icon"><X className="w-4 h-4" /></button>}
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon="🧠"
          title="No quizzes yet"
          description={user?.role === 'instructor' ? 'Create your first quiz.' : 'No quizzes available yet.'}
          action={user?.role === 'instructor' && <Link to="/quizzes/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Quiz</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map(quiz => {
            const diff = difficultyColor(quiz.questions);
            const isOwner = user?.role === 'instructor' && quiz.createdBy?._id === user._id;
            return (
              <div key={quiz._id} className="glass-card p-5 border border-purple-500/10 hover:border-purple-500/25 transition-all duration-300 group flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge border text-xs ${diff.color}`}>{diff.label}</span>
                    {quiz.timeLimit > 0 && (
                      <span className="badge badge-yellow flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {quiz.timeLimit}m
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-white font-semibold mb-1.5 group-hover:text-purple-300 transition-colors leading-snug">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3 flex-1">{quiz.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-500" />
                    {quiz.questions?.length || 0} questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    Pass: {quiz.passingScore}%
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Link to={`/quizzes/${quiz._id}/take`} className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2">
                    <Play className="w-3.5 h-3.5" />
                    Take Quiz
                  </Link>
                  {isOwner && (
                    <Link to={`/quizzes/${quiz._id}/edit`} className="btn-icon p-2.5 border border-white/10" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
