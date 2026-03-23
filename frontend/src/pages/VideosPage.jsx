import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Video, Search, Plus, Eye, Play, X } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { GridSkeleton } from '../components/common/Loader';

export default function VideosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 24 };
      if (search) params.q = search;
      const { data } = await api.get('/videos', { params });
      setVideos(data.videos);
    } catch {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-red-400" />
            Video Library
          </h1>
          <p className="text-gray-500 mt-1">{videos.length} videos • YouTube embedded</p>
        </div>
        {user?.role === 'instructor' && (
          <Link to="/videos/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Video
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="glass-card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="input-field pl-11"
              placeholder="Search videos..."
            />
          </div>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="btn-icon">
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : videos.length === 0 ? (
        <EmptyState
          icon="🎬"
          title="No videos yet"
          description={user?.role === 'instructor' ? 'Add your first YouTube video to the library.' : 'No videos have been added yet.'}
          action={user?.role === 'instructor' && (
            <Link to="/videos/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Video</Link>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map(video => (
            <div
              key={video._id}
              onClick={() => navigate(`/videos/${video._id}`)}
              className="glass-card overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-black">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { e.target.src = `https://picsum.photos/seed/${video._id}/400/225`; }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-dolphin-300 transition-colors mb-1">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3">{video.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {video.viewCount} views
                  </span>
                  <span>{video.addedBy?.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
