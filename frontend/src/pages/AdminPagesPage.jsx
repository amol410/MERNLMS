import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  FileText, Plus, Search, ExternalLink, Edit3, Trash2,
  Copy, Check, Eye, Clock, Globe, ArrowLeft
} from 'lucide-react';
import clsx from 'clsx';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

export default function AdminPagesPage() {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await api.get('/pages', { params });
      setPages(data.pages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPages();
  };

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    toast.success('Page link copied to clipboard!');
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/pages/${id}`);
      toast.success('Page deleted successfully');
      setPages(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete page');
    } finally {
      setDeletingId(null);
    }
  };

  const counts = {
    all: pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft: pages.filter(p => p.status === 'draft').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-dolphin-400 text-sm font-medium mb-1">
            <FileText className="w-4 h-4" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Pages & Blog</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create and manage custom pages, blog posts, and landing pages with custom URLs.
          </p>
        </div>

        <Link
          to="/admin/pages/new"
          className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-dolphin-900/40"
        >
          <Plus className="w-4 h-4" />
          Create New Page
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 self-start">
          {[
            { id: 'all', label: 'All Pages' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize',
                statusFilter === tab.id
                  ? 'bg-dolphin-600 text-white shadow-md shadow-dolphin-900/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or URL..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-dolphin-500 transition-colors"
            />
          </div>
          <button type="submit" className="btn-secondary text-xs px-3.5 py-2">
            Search
          </button>
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : pages.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No pages found"
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your search query or filter options.'
              : 'You have not created any custom pages yet. Click "Create New Page" to publish your first blog post or custom page!'
          }
          action={
            <Link to="/admin/pages/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create First Page
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pages.map((p) => {
            const isPublished = p.status === 'published';
            const pageUrl = `/${p.slug}`;

            return (
              <div
                key={p.id}
                className="glass-card p-5 rounded-2xl hover:border-white/20 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span
                      className={clsx(
                        'text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider',
                        isPublished
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      )}
                    >
                      {p.status}
                    </span>

                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </span>

                    {p.author && (
                      <span className="text-gray-500 text-xs">
                        by <span className="text-gray-300">{p.author.name}</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-white truncate mb-1">
                    {p.title}
                  </h2>

                  <div className="flex items-center gap-2 text-xs text-dolphin-400 font-mono bg-dolphin-950/40 px-2.5 py-1 rounded-lg border border-dolphin-500/20 max-w-fit">
                    <Globe className="w-3.5 h-3.5 text-dolphin-400 shrink-0" />
                    <span className="truncate">/{p.slug}</span>
                    <button
                      onClick={() => handleCopyLink(p.slug)}
                      className="ml-1 p-0.5 text-gray-400 hover:text-white transition-colors"
                      title="Copy full URL"
                    >
                      {copiedSlug === p.slug ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {isPublished && (
                    <a
                      href={pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 hover:text-dolphin-300"
                      title="View live page"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Live
                    </a>
                  )}

                  <Link
                    to={`/admin/pages/${p.id}/edit`}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-gray-300 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    disabled={deletingId === p.id}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150"
                    title="Delete page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
