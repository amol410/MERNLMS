import { useState, useEffect } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
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
  sectionNumber: 1,
  sectionTitle: "Rookie",
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
        },
        {
          type: "word_match",
          title: "Match the word pairs (Part 2)",
          pairs: [
            { target: "Bitte", native: "Please" },
            { target: "Tschüss", native: "Goodbye" }
          ]
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
  sectionNumber = 1,
  sectionTitle = 'Rookie',
  unitNumber = 1,
}) {
  const [mode, setMode] = useState('csv'); // 'csv' or 'json'
  const [content, setContent] = useState(SAMPLE_CSV);
  const [loading, setLoading] = useState(false);
  const [targetSection, setTargetSection] = useState(sectionNumber);
  const [targetUnit, setTargetUnit] = useState(unitNumber);
  const [replaceMode, setReplaceMode] = useState(false);

  // Synchronize targetSection & targetUnit whenever the modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setTargetSection(sectionNumber);
      setTargetUnit(unitNumber);
      setReplaceMode(false);
    }
  }, [isOpen, sectionNumber, unitNumber]);

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
          try {
            const parsed = JSON.parse(text);
            let detectedSec = targetSection;
            if (parsed.sectionNumber && !isNaN(parseInt(parsed.sectionNumber, 10))) {
              detectedSec = parseInt(parsed.sectionNumber, 10);
              setTargetSection(detectedSec);
            }
            if (parsed.unitNumber && !isNaN(parseInt(parsed.unitNumber, 10))) {
              const detectedUnit = parseInt(parsed.unitNumber, 10);
              setTargetUnit(detectedUnit);
              toast.success(`Loaded ${file.name} (Auto-detected Section ${detectedSec} • Unit ${detectedUnit})`);
              return;
            }
          } catch (_) {}
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
      let payloadSection = parseInt(targetSection, 10) || 1;
      let payloadUnit = parseInt(targetUnit, 10) || 1;
      let payloadLang = currentLanguage;
      let payloadNative = currentNative;
      let payloadLevel = currentLevel;

      // If JSON mode or content is JSON, auto-align with file's root attributes
      if (mode === 'json' || content.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.sectionNumber && !isNaN(parseInt(parsed.sectionNumber, 10))) {
            payloadSection = parseInt(parsed.sectionNumber, 10);
          }
          if (parsed.unitNumber && !isNaN(parseInt(parsed.unitNumber, 10))) {
            payloadUnit = parseInt(parsed.unitNumber, 10);
          }
          if (parsed.learningLanguage) payloadLang = parsed.learningLanguage;
          if (parsed.nativeLanguage) payloadNative = parsed.nativeLanguage;
          if (parsed.level) payloadLevel = parsed.level;
        } catch (_) {}
      }

      const res = await api.post('/curriculum/bulk-upload', {
        learningLanguage: payloadLang,
        nativeLanguage: payloadNative,
        level: payloadLevel,
        sectionNumber: payloadSection,
        sectionTitle,
        unitNumber: payloadUnit,
        lessonsData: content,
        replace: Boolean(replaceMode),
      });

      const finalSection = res.data?.sectionNumber || payloadSection;
      const finalUnit = res.data?.unitNumber || payloadUnit;
      toast.success(res.data.message || `Bulk upload successful for Section ${finalSection} • Unit ${finalUnit}!`);
      onSuccess?.(finalUnit, finalSection);
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
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">
                  Target: {currentLevel} •
                </span>
                <label className="flex items-center gap-1 text-xs text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                  <span>Section:</span>
                  <select
                    value={targetSection}
                    onChange={e => setTargetSection(parseInt(e.target.value, 10))}
                    className="bg-transparent text-cyan-300 font-bold text-xs border-0 p-0 focus:ring-0 cursor-pointer"
                    title="Change target section (1-3)"
                  >
                    <option value={1} className="bg-slate-900">1 (Rookie)</option>
                    <option value={2} className="bg-slate-900">2 (Explorer)</option>
                    <option value={3} className="bg-slate-900">3 (Traveler)</option>
                  </select>
                </label>
                <label className="flex items-center gap-1 text-xs text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  <span>Unit (1–12):</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={targetUnit}
                    onChange={e => setTargetUnit(e.target.value)}
                    className="w-10 bg-transparent text-emerald-300 font-bold text-xs border-0 p-0 focus:ring-0 text-center"
                    title="Change target unit number (1 to 12)"
                  />
                </label>
              </div>
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

          {/* Replace vs Append Mode Option */}
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
            replaceMode
              ? 'bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/20'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}>
            <input
              type="checkbox"
              checked={replaceMode}
              onChange={e => setReplaceMode(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-rose-500 focus:ring-rose-400 bg-slate-800 border-white/20 cursor-pointer"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${replaceMode ? 'text-rose-300' : 'text-white'}`}>
                  {replaceMode && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  Replace Existing Unit Content
                </span>
                {replaceMode ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Wipes Existing Unit
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Appends Below Existing
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {replaceMode
                  ? '⚠️ Warning: Completely removes and discards all existing lessons in this unit from the database and inserts the new unit in its place.'
                  : 'Safe mode (Default): Newly uploaded lessons will be appended strictly below the existing lessons in this unit.'}
              </p>
            </div>
          </label>

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
          <span className="text-xs text-gray-500">Target: {currentLevel} • Section {targetSection} • Unit {targetUnit}</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                replaceMode
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                  : 'btn-primary'
              }`}
            >
              {loading
                ? (replaceMode ? 'Replacing Unit...' : 'Uploading...')
                : (replaceMode ? 'Replace Unit Entirely ⚠️' : 'Bulk Upload Drafts 🚀')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
