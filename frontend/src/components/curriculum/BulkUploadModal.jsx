import { useState } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const SAMPLE_CSV = `Title,NodeType,Subtitle,XpReward
Basics & Greetings,lesson,Essential German greetings & etiquette,15
Audio Karaoke Rhythm,karaoke,Word-by-word synced listening,20
Sprechen Lip-Sync,speech,Voice dictation & pronunciation,25
Sunken Treasure Chest,chest,Bonus 30 Pearls & 20 XP,20
Match the Pairs,match,Rapid vocabulary tile match,20
Sentence Architect,lesson,Grammar structure puzzle,20
Coral Reef Checkpoint,quiz,Unit mastery challenge,35`;

const SAMPLE_JSON = JSON.stringify({
  learningLanguage: "de",
  nativeLanguage: "en",
  level: "A1",
  unitNumber: 1,
  unitTitle: "Coral Reef",
  lessons: [
    {
      title: "Basics & Greetings",
      nodeType: "lesson",
      subtitle: "Essential German greetings & etiquette",
      xpReward: 15,
      stages: [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: [
            { target: "Guten Tag", native: "Hello" },
            { target: "Danke", native: "Thank you" }
          ]
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: "Guten Tag, ich bin Anna",
          tokens: ["Kaffee", "Guten", "Tag,", "ich", "bin", "Anna"]
        }
      ]
    },
    {
      title: "Audio Karaoke Rhythm",
      nodeType: "karaoke",
      subtitle: "Word-by-word synced listening",
      xpReward: 20
    }
  ]
}, null, 2);

export default function BulkUploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentLanguage = 'de',
  currentNative = 'en',
  currentLevel = 'A1',
  unitNumber = 1,
}) {
  const [mode, setMode] = useState('csv'); // 'csv' or 'json'
  const [content, setContent] = useState(SAMPLE_CSV);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const downloadFile = (filename, text) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}!`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setContent(text);
        if (file.name.endsWith('.json')) {
          setMode('json');
        } else {
          setMode('csv');
        }
        toast.success(`Loaded file: ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please paste or upload curriculum data');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/curriculum/bulk-upload', {
        learningLanguage: currentLanguage,
        nativeLanguage: currentNative,
        level: currentLevel,
        unitNumber: parseInt(unitNumber, 10),
        lessonsData: content,
      });

      toast.success(res.data.message || 'Bulk upload successful (All saved as Draft)!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk upload lessons');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Bulk Upload Lessons</h2>
              <p className="text-xs text-gray-400">
                Upload entire curriculum for {currentLevel} • Unit {unitNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice: Default Draft State */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3 text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Default Status: OFF (Draft).</strong> All bulk-uploaded lessons will be saved as <em>Not Live</em> until you inspect and toggle them live.
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format selection and Template download buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setMode('csv'); setContent(SAMPLE_CSV); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'csv'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                CSV Table Format
              </button>
              <button
                type="button"
                onClick={() => { setMode('json'); setContent(SAMPLE_JSON); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'json'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                JSON Schema Format
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadFile('curriculum_template.csv', SAMPLE_CSV)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Download CSV
              </button>
              <button
                type="button"
                onClick={() => downloadFile('curriculum_template.json', SAMPLE_JSON)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Download JSON
              </button>
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Or Choose File from Computer
            </label>
            <input
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileUpload}
              className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
            />
          </div>

          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Raw Data ({mode.toUpperCase()})
              </label>
              <span className="text-[11px] text-gray-500">Edit or paste directly</span>
            </div>
            <textarea
              rows={10}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input-field font-mono text-xs leading-relaxed"
              placeholder={mode === 'csv' ? 'Title,NodeType,Subtitle,XpReward...' : '{\n  "lessons": [...]\n}'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-gray-500">Target: {currentLevel} • Unit {unitNumber}</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {loading ? 'Uploading...' : 'Bulk Upload Drafts 🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
