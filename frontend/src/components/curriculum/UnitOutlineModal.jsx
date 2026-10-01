import { useState } from 'react';
import { X, Plus, Trash2, ListPlus, Sparkles, Layers, ShieldAlert, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const NODE_TYPES = [
  { value: 'lesson', label: 'Interactive Lesson', icon: '🏝️' },
  { value: 'karaoke', label: 'Audio Karaoke Rhythm', icon: '🎵' },
  { value: 'speech', label: 'Sprechen Lip-Sync', icon: '🎙️' },
  { value: 'chest', label: 'Treasure Chest (+Pearls)', icon: '💎' },
  { value: 'match', label: 'Rapid Tile Match', icon: '🧩' },
  { value: 'quiz', label: 'Checkpoint Exam', icon: '🏆' },
];

export default function UnitOutlineModal({
  isOpen,
  onClose,
  onSuccess,
  currentLanguage = 'de',
  currentNative = 'en',
  currentLevel = 'A1',
  unitNumber = 1,
  unitTitle = 'Coral Reef',
}) {
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'paste'
  const [targetUnitNum, setTargetUnitNum] = useState(unitNumber);
  const [targetUnitTitle, setTargetUnitTitle] = useState(unitTitle);
  const [targetUnitDesc, setTargetUnitDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // Table rows mode
  const [rows, setRows] = useState([
    { title: 'Basics & Greetings', nodeType: 'lesson', subtitle: 'Essential German greetings & etiquette' },
    { title: 'Audio Karaoke Rhythm', nodeType: 'karaoke', subtitle: 'Word-by-word synced listening' },
    { title: 'Sprechen Lip-Sync', nodeType: 'speech', subtitle: 'Voice dictation & pronunciation' },
    { title: 'Sunken Treasure Chest', nodeType: 'chest', subtitle: 'Bonus 30 Pearls & 20 XP' },
  ]);

  // Bulk paste mode
  const [pasteText, setPasteText] = useState(
    "Basics & Greetings\nAudio Karaoke Rhythm\nSprechen Lip-Sync\nSunken Treasure Chest\nMatch the Pairs\nSentence Architect\nCoral Reef Exam"
  );

  if (!isOpen) return null;

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { title: '', nodeType: 'lesson', subtitle: '' },
    ]);
  };

  const removeRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleConvertPasteToRows = () => {
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast.error('Please enter at least one lesson heading');
      return;
    }

    const converted = lines.map(line => {
      let nodeType = 'lesson';
      const lower = line.toLowerCase();
      if (lower.includes('karaoke') || lower.includes('audio') || lower.includes('song')) nodeType = 'karaoke';
      else if (lower.includes('sprech') || lower.includes('voice') || lower.includes('speak')) nodeType = 'speech';
      else if (lower.includes('chest') || lower.includes('treasure') || lower.includes('pearl')) nodeType = 'chest';
      else if (lower.includes('match') || lower.includes('pair')) nodeType = 'match';
      else if (lower.includes('quiz') || lower.includes('exam') || lower.includes('test')) nodeType = 'quiz';

      return {
        title: line,
        nodeType,
        subtitle: `${line} practice`,
      };
    });

    setRows(converted);
    setActiveTab('table');
    toast.success(`Converted ${converted.length} lines into lesson headings!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'paste') {
      handleConvertPasteToRows();
      return;
    }

    const validRows = rows.filter(r => r.title.trim().length > 0);
    if (validRows.length === 0) {
      toast.error('Please provide at least one valid lesson title');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/curriculum/units/headings', {
        learningLanguage: currentLanguage,
        nativeLanguage: currentNative,
        level: currentLevel,
        unitNumber: parseInt(targetUnitNum, 10),
        unitTitle: targetUnitTitle,
        unitDescription: targetUnitDesc,
        headings: validRows,
      });

      toast.success(res.data.message || `Created ${validRows.length} lesson headings!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to outline unit headings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <ListPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Outline Unit Headings</h2>
              <p className="text-xs text-gray-400">
                Batch outline all lesson headings for {currentLevel} • Unit {targetUnitNum}
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
            <strong>Default Status: OFF (Draft).</strong> All lesson headings will be created as <em>Not Live</em> until you edit and explicitly publish them.
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Unit Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Unit Number
              </label>
              <input
                type="number"
                min="1"
                value={targetUnitNum}
                onChange={e => setTargetUnitNum(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Unit Title
              </label>
              <input
                type="text"
                value={targetUnitTitle}
                onChange={e => setTargetUnitTitle(e.target.value)}
                placeholder="e.g. Coral Reef – Introductions & Greetings"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-white/10 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`pb-2.5 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'table'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Row-by-Row Headings ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'paste'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Quick-Paste Lines
            </button>
          </div>

          {activeTab === 'table' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>Define sequence and node types for this unit</span>
                <button
                  type="button"
                  onClick={addRow}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Lesson Heading
                </button>
              </div>

              <div className="space-y-2.5">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>

                    {/* Lesson Title */}
                    <input
                      type="text"
                      value={row.title}
                      onChange={e => updateRow(idx, 'title', e.target.value)}
                      placeholder="Lesson heading title..."
                      className="input-field flex-1 text-sm py-2"
                      required
                    />

                    {/* Node Type Selector */}
                    <select
                      value={row.nodeType}
                      onChange={e => updateRow(idx, 'nodeType', e.target.value)}
                      className="input-field sm:w-48 text-xs py-2 bg-slate-800"
                    >
                      {NODE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length <= 1}
                      className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors"
                      title="Remove heading"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addRow}
                className="w-full py-2.5 rounded-2xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-500/5 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Another Heading
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Paste one lesson heading per line. The system will auto-detect node types like Karaoke, Sprechen, Chest, etc.
              </p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={8}
                className="input-field font-mono text-sm leading-relaxed"
                placeholder="Lesson 1 Title&#10;Lesson 2 Title&#10;..."
              />
              <button
                type="button"
                onClick={handleConvertPasteToRows}
                className="btn-secondary text-xs w-full py-2.5 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-cyan-400" />
                Convert Lines into Rows
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900/60 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {rows.filter(r => r.title.trim()).length} lessons will be generated as DRAFTS.
          </p>
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
              {loading ? 'Creating Headings...' : 'Generate Unit Headings 🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
