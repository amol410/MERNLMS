import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, Edit3, ArrowLeft, Globe } from 'lucide-react';
import Loader from '../components/common/Loader';

export default function PublicPageView() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    api.get(`/pages/public/${slug}`)
      .then(({ data }) => {
        if (isMounted) {
          setPage(data.page);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div>
          <div className="text-8xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <p className="text-gray-400 mb-6">Page not found</p>
          <Link to="/" className="btn-primary inline-flex">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Quick Edit Bar */}
      {isAdmin && (
        <div className="mb-6 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-orange-300 font-medium">
            <Globe className="w-4 h-4 text-orange-400" />
            <span>You are viewing this custom page as Admin</span>
          </div>
          <Link
            to={`/admin/pages/${page.id}/edit`}
            className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 hover:text-white"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit this Page
          </Link>
        </div>
      )}

      {/* Article Header */}
      <header className="mb-8 space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {page.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 border-y border-white/10 py-3">
          {page.author && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-dolphin-400" />
              <span>{page.author.name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-dolphin-400" />
            <span>
              {new Date(page.publishedAt || page.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Short Summary (if exists) */}
        {page.summary && (
          <p className="text-lg text-gray-300 italic border-l-2 border-dolphin-500 pl-4 my-4">
            {page.summary}
          </p>
        )}

        {/* Featured Image Banner */}
        {page.featuredImage && (
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl my-6">
            <img
              src={page.featuredImage}
              alt={page.title}
              className="w-full max-h-[460px] object-cover"
            />
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <div className="glass-card p-6 sm:p-10 rounded-2xl border border-white/10 shadow-xl">
        <div
          className="ProseMirror prose-invert max-w-none text-gray-200"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </article>
  );
}
