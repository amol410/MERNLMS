import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, BookOpen, Pin, Trash2, Edit, Tag, X } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { GridSkeleton } from '../components/common/Loader';
import clsx from 'clsx';

const colorMap = {
  default: { border: 'border-gray-600/40', dot: 'bg-gray-500' },
  blue: { border: 'border-blue-500/40', dot: 'bg-blue-500' },
  green: { border: 'border-green-500/40', dot: 'bg-green-500' },
  yellow: { border: 'border-yellow-500/40', dot: 'bg-yellow-500' },
  pink: { border: 'border-pink-500/40', dot: 'bg-pink-500' },
  purple: { border: 'border-purple-500/40', dot: 'bg-purple-500' },
};

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.q = search;
      if (activeTag) params.tag = activeTag;
      const { data } = await api.get('/notes', { params });
      setNotes(data.notes);

      // Collect all tags
      const tags = [...new Set(data.notes.flatMap(n => n.tags))].filter(Boolean);
      setAllTags(tags);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [search, activeTag]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handlePin = async (id, isPinned) => {
    try {
      await api.patch(`/notes/${id}/pin`);
      setNotes(prev => prev.map(n => n._id === id ? { ...n, isPinned: !isPinned } : n)
        .sort((a, b) => b.isPinned - a.isPinned));
      toast.success(isPinned ? 'Unpinned' : 'Pinned!');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').trim().slice(0, 140);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            My Notes
          </h1>
          <p className="text-gray-500 mt-1">{notes.length} notes • Organized & searchable</p>
        </div>
        <Link to="/notes/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Note
        </Link>
      </div>

      {/* Search & filters */}
      <div className="glass-card p-4 mb-6 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="input-field pl-11"
              placeholder="Search notes..."
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="btn-icon"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag('')}
              className={clsx('badge transition-all', activeTag === '' ? 'badge-blue' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20')}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className={clsx('badge transition-all', activeTag === tag ? 'badge-blue' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20')}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <GridSkeleton />
      ) : notes.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No notes yet"
          description="Create your first note to start building your knowledge base."
          action={<Link to="/notes/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Note</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map(note => {
            const color = colorMap[note.color] || colorMap.default;
            return (
              <div
                key={note._id}
                className={clsx('glass-card p-5 border-l-4 hover:scale-[1.02] transition-all duration-300 group', color.border)}
              >
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/notes/${note._id}`} className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate group-hover:text-dolphin-300 transition-colors text-sm">
                      {note.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handlePin(note._id, note.isPinned)} className="btn-icon p-1">
                      <Pin className={clsx('w-3.5 h-3.5', note.isPinned ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500')} />
                    </button>
                    <Link to={`/notes/${note._id}/edit`} className="btn-icon p-1">
                      <Edit className="w-3.5 h-3.5 text-gray-500" />
                    </Link>
                    <button onClick={() => handleDelete(note._id)} className="btn-icon p-1">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                <Link to={`/notes/${note._id}`}>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-4 mb-3">
                    {stripHtml(note.content) || 'Empty note'}
                  </p>
                </Link>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {note.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="badge bg-white/8 text-gray-400 border border-white/10 text-xs">{tag}</span>
                    ))}
                    {note.tags?.length > 2 && (
                      <span className="badge bg-white/8 text-gray-500 border border-white/10 text-xs">+{note.tags.length - 2}</span>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs">{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
