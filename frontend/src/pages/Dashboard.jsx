import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import {
  BookOpen, Video, Brain, Layers, ArrowRight, TrendingUp,
  Clock, Award, Plus,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ notes: 0, videos: 0, quizzes: 0, flashcards: 0 });
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notesRes, videosRes, quizzesRes, flashcardsRes] = await Promise.allSettled([
          api.get('/notes?limit=3'),
          api.get('/videos?limit=1'),
          api.get('/quizzes?limit=1'),
          api.get('/flashcards?limit=1'),
        ]);

        if (notesRes.status === 'fulfilled') {
          setStats(prev => ({ ...prev, notes: notesRes.value.data.pagination?.total || 0 }));
          setRecentNotes(notesRes.value.data.notes || []);
        }
        if (videosRes.status === 'fulfilled') {
          setStats(prev => ({ ...prev, videos: videosRes.value.data.pagination?.total || 0 }));
        }
        if (quizzesRes.status === 'fulfilled') {
          setStats(prev => ({ ...prev, quizzes: quizzesRes.value.data.pagination?.total || 0 }));
        }
        if (flashcardsRes.status === 'fulfilled') {
          setStats(prev => ({ ...prev, flashcards: flashcardsRes.value.data.pagination?.total || 0 }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      to: '/notes',
      icon: BookOpen,
      label: 'My Notes',
      value: stats.notes,
      unit: 'notes',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-500/10 to-cyan-500/5',
      border: 'border-blue-500/20',
      action: '/notes/new',
    },
    {
      to: '/videos',
      icon: Video,
      label: 'Video Library',
      value: stats.videos,
      unit: 'videos',
      gradient: 'from-red-500 to-orange-500',
      bg: 'from-red-500/10 to-orange-500/5',
      border: 'border-red-500/20',
      action: user?.role === 'instructor' ? '/videos/new' : null,
    },
    {
      to: '/quizzes',
      icon: Brain,
      label: 'Quizzes',
      value: stats.quizzes,
      unit: 'quizzes',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-500/10 to-pink-500/5',
      border: 'border-purple-500/20',
      action: user?.role === 'instructor' ? '/quizzes/new' : null,
    },
    {
      to: '/flashcards',
      icon: Layers,
      label: 'Flashcard Decks',
      value: stats.flashcards,
      unit: 'decks',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-500/10 to-emerald-500/5',
      border: 'border-green-500/20',
      action: '/flashcards/new',
    },
  ];

  const quickActions = [
    { to: '/notes/new', icon: BookOpen, label: 'New Note', color: 'text-blue-400' },
    { to: '/flashcards/new', icon: Layers, label: 'New Deck', color: 'text-green-400' },
    ...(user?.role === 'instructor' ? [
      { to: '/videos/new', icon: Video, label: 'Add Video', color: 'text-orange-400' },
      { to: '/quizzes/new', icon: Brain, label: 'New Quiz', color: 'text-purple-400' },
    ] : [
      { to: '/quizzes', icon: Brain, label: 'Take Quiz', color: 'text-purple-400' },
      { to: '/videos', icon: Video, label: 'Watch Videos', color: 'text-orange-400' },
    ]),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Hero greeting */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-dolphin-900/30">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0]}!</span>
            </h1>
            <p className="text-gray-500 text-sm capitalize">{user?.role} • DolphinCoder LMS</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ to, icon: Icon, label, value, unit, gradient, bg, border, action }) => (
          <Link
            key={to}
            to={to}
            className={`glass-card p-5 border ${border} bg-gradient-to-br ${bg} hover:scale-[1.02] transition-all duration-300 group`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              {action && (
                <Link
                  to={action}
                  onClick={e => e.stopPropagation()}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-0.5">{value}</div>
            <div className="text-gray-500 text-xs">{unit}</div>
            <div className="text-gray-400 text-sm font-medium mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-dolphin-400" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            {quickActions.map(({ to, icon: Icon, label, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/8 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-dolphin-400" />
              Recent Notes
            </h2>
            <Link to="/notes" className="text-dolphin-400 hover:text-dolphin-300 text-sm transition-colors">
              View all →
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No notes yet</p>
              <Link to="/notes/new" className="inline-flex items-center gap-1.5 mt-3 text-dolphin-400 hover:text-dolphin-300 text-sm transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create your first note
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map(note => (
                <Link
                  key={note._id}
                  to={`/notes/${note._id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/8 transition-all duration-200 group"
                >
                  <div className={`w-1 h-full min-h-8 rounded-full flex-shrink-0 ${
                    note.color === 'blue' ? 'bg-blue-500' :
                    note.color === 'green' ? 'bg-green-500' :
                    note.color === 'yellow' ? 'bg-yellow-500' :
                    note.color === 'pink' ? 'bg-pink-500' :
                    note.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-dolphin-300 transition-colors truncate">{note.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{new Date(note.updatedAt).toLocaleDateString()}</p>
                  </div>
                  {note.isPinned && <Award className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
