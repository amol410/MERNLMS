import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  ArrowLeft, Save, Bold, Italic, UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Code, Quote, Minus, Tag, X, Pin,
} from 'lucide-react';
import clsx from 'clsx';

const colors = ['default', 'blue', 'green', 'yellow', 'pink', 'purple'];
const colorDots = {
  default: 'bg-gray-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
};

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={clsx(
        'p-2 rounded-lg text-sm transition-all duration-150',
        active
          ? 'bg-dolphin-600/40 text-dolphin-300'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      )}
    >
      {children}
    </button>
  );
}

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [color, setColor] = useState('default');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none min-h-96 p-4',
        'data-placeholder': 'Start writing your note...',
      },
    },
  });

  useEffect(() => {
    if (isEdit && editor) {
      api.get(`/notes/${id}`).then(({ data }) => {
        const note = data.note;
        setTitle(note.title);
        setColor(note.color || 'default');
        setTags(note.tags || []);
        setIsPinned(note.isPinned || false);
        editor.commands.setContent(note.content);
        setLoading(false);
      }).catch(() => {
        toast.error('Failed to load note');
        navigate('/notes');
      });
    }
  }, [isEdit, editor, id, navigate]);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    const content = editor?.getHTML();
    if (!content || content === '<p></p>') { toast.error('Content is required'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/notes/${id}`, { title, content, tags, color, isPinned });
        toast.success('Note updated!');
      } else {
        await api.post('/notes', { title, content, tags, color, isPinned });
        toast.success('Note created!');
      }
      navigate('/notes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white/10 border-t-dolphin-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/notes')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={clsx('btn-icon', isPinned && 'text-yellow-400')}
          >
            <Pin className={clsx('w-4 h-4', isPinned && 'fill-yellow-400')} />
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Update' : 'Save Note'}
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Title */}
        <div className="p-6 border-b border-white/10">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full text-3xl font-bold bg-transparent text-white placeholder-gray-700 border-none outline-none"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-white/10 bg-white/3">
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
            <Bold className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
            <Italic className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline">
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Inline Code">
            <Code className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote">
            <Quote className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} active={false} title="Divider">
            <Minus className="w-4 h-4" />
          </ToolbarBtn>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} className="min-h-96" />

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/3 space-y-4">
          {/* Color picker */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium">Color:</span>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    'w-5 h-5 rounded-full transition-all duration-150',
                    colorDots[c],
                    color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-125' : 'opacity-60 hover:opacity-100'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center flex-wrap gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 badge badge-blue">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tag, press Enter..."
              className="bg-transparent text-gray-400 text-sm outline-none placeholder-gray-700 min-w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
