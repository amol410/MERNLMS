import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Brain, ChevronDown, ChevronUp } from 'lucide-react';

const defaultQuestion = () => ({
  text: '',
  type: 'multiple-choice',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  points: 1,
});

export default function QuizFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: 0,
    shuffleQuestions: false,
    isPublished: true,
  });
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [expandedQ, setExpandedQ] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/quizzes/${id}`).then(({ data }) => {
        const q = data.quiz;
        setForm({
          title: q.title, description: q.description, passingScore: q.passingScore,
          timeLimit: q.timeLimit, shuffleQuestions: q.shuffleQuestions, isPublished: q.isPublished,
        });
        setQuestions(q.questions.length > 0 ? q.questions : [defaultQuestion()]);
      }).catch(() => navigate('/quizzes'));
    }
  }, [isEdit, id, navigate]);

  const addQuestion = () => {
    setQuestions([...questions, defaultQuestion()]);
    setExpandedQ(questions.length);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) { toast.error('At least one question required'); return; }
    setQuestions(questions.filter((_, i) => i !== idx));
    if (expandedQ >= idx) setExpandedQ(Math.max(0, expandedQ - 1));
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[optIdx] = value;
      return { ...q, options };
    }));
  };

  const handleTypeChange = (idx, type) => {
    const options = type === 'true-false' ? ['True', 'False'] : ['', '', '', ''];
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, type, options, correctIndex: 0 } : q));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { toast.error(`Question ${i + 1}: text is required`); return; }
      if (q.options.some(o => !o.trim())) { toast.error(`Question ${i + 1}: all options must be filled`); return; }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/quizzes/${id}`, { ...form, questions });
        toast.success('Quiz updated!');
      } else {
        await api.post('/quizzes', { ...form, questions });
        toast.success('Quiz created!');
      }
      navigate('/quizzes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button onClick={() => navigate('/quizzes')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Quizzes
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz settings */}
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-400" />
            {isEdit ? 'Edit Quiz' : 'Create Quiz'}
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quiz Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. JavaScript Fundamentals" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={3} placeholder="Brief quiz description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Passing Score (%)</label>
                <input type="number" min={0} max={100} value={form.passingScore} onChange={e => setForm({ ...form, passingScore: parseInt(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (mins, 0=none)</label>
                <input type="number" min={0} value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: parseInt(e.target.value) })} className="input-field" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.shuffleQuestions} onChange={e => setForm({ ...form, shuffleQuestions: e.target.checked })} className="accent-purple-500" />
                <span className="text-gray-300 text-sm">Shuffle questions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="accent-purple-500" />
                <span className="text-gray-300 text-sm">Published</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Questions ({questions.length})</h2>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="glass-card overflow-hidden border border-white/10">
              {/* Question header */}
              <button
                type="button"
                onClick={() => setExpandedQ(expandedQ === qIdx ? -1 : qIdx)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center text-sm font-bold">
                    {qIdx + 1}
                  </div>
                  <span className="text-gray-300 text-sm text-left truncate max-w-md">
                    {q.text || 'Untitled question'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedQ === qIdx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {expandedQ === qIdx && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Question Text *</label>
                    <textarea
                      value={q.text}
                      onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                      className="input-field resize-none text-sm"
                      rows={2}
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
                      <select value={q.type} onChange={e => handleTypeChange(qIdx, e.target.value)} className="select-field text-sm">
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True / False</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Points</label>
                      <input type="number" min={1} value={q.points} onChange={e => updateQuestion(qIdx, 'points', parseInt(e.target.value))} className="input-field text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Options (select correct)</label>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIdx, 'correctIndex', optIdx)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                              q.correctIndex === optIdx
                                ? 'border-green-500 bg-green-500'
                                : 'border-white/20 hover:border-white/40'
                            }`}
                          >
                            {q.correctIndex === optIdx && (
                              <span className="block w-full h-full rounded-full bg-green-500" />
                            )}
                          </button>
                          {q.type === 'true-false' ? (
                            <span className="input-field text-sm py-2 flex-1">{opt}</span>
                          ) : (
                            <input
                              value={opt}
                              onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                              className="input-field text-sm py-2 flex-1"
                              placeholder={`Option ${optIdx + 1}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Explanation (shown after answer)</label>
                    <input
                      value={q.explanation}
                      onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)}
                      className="input-field text-sm"
                      placeholder="Why is this the correct answer?"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="btn-secondary w-full flex items-center justify-center gap-2 py-3 border-dashed border-white/20">
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? 'Update Quiz' : 'Create Quiz'}
        </button>
      </form>
    </div>
  );
}
