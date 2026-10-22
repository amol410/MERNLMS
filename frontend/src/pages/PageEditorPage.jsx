import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TipTapImage from '../components/editor/TipTapImage';
import {
  ArrowLeft, Save, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading1, Heading2, Heading3, Code, Quote,
  Minus, Image as ImageIcon, Link as LinkIcon, Eye, Upload,
  Check, X, Globe, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import Loader from '../components/common/Loader';

function ToolbarBtn({ onClick, active, title, disabled, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled && onClick) onClick();
      }}
      title={title}
      className={clsx(
        'p-2 rounded-lg text-sm transition-all duration-150',
        active
          ? 'bg-dolphin-600/40 text-dolphin-300'
          : 'text-gray-400 hover:text-white hover:bg-white/10',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export default function PageEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState('published');
  const [featuredImage, setFeaturedImage] = useState('');
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');

  const imageInputRef = useRef(null);
  const featuredInputRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline, TipTapImage],
    content: '',
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none min-h-[420px] p-6 text-gray-200',
        'data-placeholder': 'Write your blog post or page content here...',
      },
    },
  });

  // Load existing page if editing
  useEffect(() => {
    if (isEdit && editor) {
      setLoading(true);
      api.get(`/pages/${id}`)
        .then(({ data }) => {
          const p = data.page;
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setSummary(p.summary || '');
          setStatus(p.status || 'published');
          setFeaturedImage(p.featuredImage || '');
          setAutoSlug(false);
          if (p.content) {
            editor.commands.setContent(p.content);
          }
          setLoading(false);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || 'Failed to load page');
          navigate('/admin/pages');
        });
    }
  }, [isEdit, editor, id, navigate]);

  // Handle title change and auto-slug
  const handleTitleChange = (val) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val) => {
    setAutoSlug(false);
    setSlug(slugify(val));
  };

  // Upload image to backend and insert into editor
  const handleEditorImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const { data } = await api.post('/pages/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.url && editor) {
        editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        toast.success('Image inserted into page!', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleInsertManualImage = (e) => {
    e.preventDefault();
    if (!manualImageUrl.trim()) return;

    if (editor) {
      editor.chain().focus().setImage({ src: manualImageUrl.trim() }).run();
      toast.success('Image added');
    }
    setManualImageUrl('');
    setShowImageUrlModal(false);
  };

  // Upload featured image
  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading cover image...');
    try {
      const { data } = await api.post('/pages/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeaturedImage(data.url);
      toast.success('Cover image uploaded!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      if (featuredInputRef.current) featuredInputRef.current.value = '';
    }
  };

  // Save / Update page
  const handleSave = async (targetStatus = status) => {
    if (!title.trim()) {
      toast.error('Page title is required');
      return;
    }

    const cleanSlug = slugify(slug || title);
    if (!cleanSlug) {
      toast.error('A valid custom URL slug is required');
      return;
    }

    const contentHtml = editor?.getHTML() || '';
    if (!contentHtml || contentHtml === '<p></p>') {
      toast.error('Page content cannot be empty');
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      slug: cleanSlug,
      summary: summary.trim() || null,
      featuredImage: featuredImage || null,
      status: targetStatus,
      content: contentHtml,
    };

    try {
      if (isEdit) {
        await api.put(`/pages/${id}`, payload);
        toast.success('Page updated successfully!');
      } else {
        const { data } = await api.post('/pages', payload);
        toast.success('Page created successfully!');
        navigate(`/admin/pages/${data.page.id}/edit`, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/pages"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Back to Pages"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs text-dolphin-400 font-semibold tracking-wider uppercase">
              {isEdit ? 'Edit Page' : 'New Custom Page'}
            </span>
            <h1 className="text-2xl font-bold text-white">
              {title || (isEdit ? 'Edit Page' : 'Create Page')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {isEdit && slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 hover:text-dolphin-300"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Live
            </a>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(status === 'published' ? 'draft' : status)}
            className="btn-secondary py-2 px-4 text-xs font-semibold"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-dolphin-900/40"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="space-y-6">
        {/* URL Configuration Card */}
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Custom URL (Slug)
          </label>
          <div className="flex items-center rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm focus-within:border-dolphin-500 transition-colors">
            <Globe className="w-4 h-4 text-dolphin-400 mr-2 shrink-0" />
            <span className="text-gray-500 select-none font-mono">
              {window.location.origin}/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="whatever-you-want"
              className="flex-1 bg-transparent text-white font-mono text-sm border-none outline-none px-1 placeholder-gray-600"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This page will be accessible publicly at{' '}
            <span className="text-dolphin-400 font-mono">
              {window.location.origin}/{slug || 'whatever-you-want'}
            </span>
          </p>
        </div>

        {/* Title & Metadata Card */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Page / Blog Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Master Full-Stack Web Development in 2026"
              className="w-full text-2xl font-bold bg-transparent text-white placeholder-gray-600 border-none outline-none pb-2 border-b border-white/10 focus:border-dolphin-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Short Summary / Excerpt (Optional)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief 1-2 sentence description for this page..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-dolphin-500 transition-colors"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Featured / Cover Image (Optional)
            </label>
            {featuredImage ? (
              <div className="relative rounded-xl overflow-hidden border border-white/15 max-h-56 group">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-52 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-red-400 hover:text-red-300 hover:bg-black transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={featuredInputRef}
                  accept="image/*"
                  onChange={handleFeaturedImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => featuredInputRef.current?.click()}
                  className="btn-secondary py-2 px-3 text-xs flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Cover Image
                </button>
                <input
                  type="text"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="Or paste external image URL..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-dolphin-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Editor Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-3 border-b border-white/10 bg-white/5 backdrop-blur-md">
            {/* Formatting */}
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarBtn>

            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarBtn>

            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Headings */}
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor?.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarBtn>

            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor?.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarBtn>

            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor?.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Lists */}
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarBtn>

            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Code & Quotes */}
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleCode().run()}
              active={editor?.isActive('code')}
              title="Inline Code"
            >
              <Code className="w-4 h-4" />
            </ToolbarBtn>

            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarBtn>

            <ToolbarBtn
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              active={false}
              title="Divider"
            >
              <Minus className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Image Upload / Insert Button */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              onChange={handleEditorImageUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              title="Upload & Insert Image from device"
              className="p-2 rounded-lg text-sm text-dolphin-400 hover:text-dolphin-300 hover:bg-dolphin-500/10 transition-all flex items-center gap-1.5 font-medium"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs">Add Image</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImageUrlModal(true)}
              title="Insert image by URL"
              className="p-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs"
            >
              URL Image
            </button>
          </div>

          {/* Editor Body */}
          <div className="bg-black/20 min-h-[420px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Manual Image URL Modal */}
      {showImageUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-white/15 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Insert Image by URL</h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter any direct image link (e.g. from Unsplash or your image host):
            </p>
            <form onSubmit={handleInsertManualImage} className="space-y-4">
              <input
                type="url"
                required
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="input-field text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageUrlModal(false)}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs px-4 py-2">
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
