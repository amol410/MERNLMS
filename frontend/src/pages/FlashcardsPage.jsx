import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Layers, Search, Plus, X, Play, Lock, Globe } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { GridSkeleton } from '../components/common/Loader';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const deckColors = {
  default: 'from-gray-600 to-gray-700',
  blue: 'from-blue-600 to-blue-700',
  green: 'from-green-600 to-green-700',
  yellow: 'from-yellow-600 to-yellow-700',
  pink: 'from-pink-600 to-pink-700',
  purple: 'from-purple-600 to-purple-700',
};

export default function FlashcardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 24 };
      if (search) params.q = search;
      const { data } = await api.get('/flashcards', { params });
      setDecks(data.decks);
    } catch {
      toast.error('Failed to load decks');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this deck?')) return;
    try {
      await api.delete(`/flashcards/${id}`);
      setDecks(prev => prev.filter(d => d._id !== id));
      toast.success('Deck deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-green-400" />
            Flashcard Decks
          </h1>
          <p className="text-gray-500 mt-1">{decks.length} decks • Spaced repetition learning</p>
        </div>
        <Link to="/flashcards/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Deck
        </Link>
      </div>

      <div className="glass-card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} className="input-field pl-11" placeholder="Search decks..." />
          </div>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="btn-icon"><X className="w-4 h-4" /></button>
          )}
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : decks.length === 0 ? (
        <EmptyState
          icon="🃏"
          title="No decks yet"
          description="Create your first flashcard deck to start studying."
          action={<Link to="/flashcards/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Deck</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {decks.map(deck => {
            const isOwner = deck.owner?._id === user?._id || deck.owner === user?._id;
            return (
              <div
                key={deck._id}
                className="glass-card overflow-hidden hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(`/flashcards/${deck._id}/study`)}
              >
                {/* Color header */}
                <div className={clsx('h-24 bg-gradient-to-br flex items-center justify-center relative', deckColors[deck.color] || deckColors.default)}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative text-center">
                    <div className="text-4xl mb-1">🃏</div>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {deck.isPublic
                      ? <span className="badge bg-black/30 text-white border-white/20"><Globe className="w-3 h-3 mr-1" />Public</span>
                      : <span className="badge bg-black/30 text-white border-white/20"><Lock className="w-3 h-3 mr-1" />Private</span>
                    }
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 group-hover:text-green-300 transition-colors truncate">
                    {deck.deckName}
                  </h3>
                  {deck.description && (
                    <p className="text-gray-500 text-xs line-clamp-2 mb-3">{deck.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm font-medium">{deck.cardCount} cards</span>
                    <span className="text-gray-600 text-xs">{deck.owner?.name}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/flashcards/${deck._id}/study`); }}
                      className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Study
                    </button>
                    {isOwner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/flashcards/${deck._id}/edit`); }}
                        className="btn-secondary text-sm px-3 py-2"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
