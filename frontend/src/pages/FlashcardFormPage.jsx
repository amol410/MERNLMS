import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Layers } from 'lucide-react';
import clsx from 'clsx';

const colors = ['default', 'blue', 'green', 'yellow', 'pink', 'purple'];
const colorDots = {
  default: 'bg-gray-500', blue: 'bg-blue-500', green: 'bg-green-500',
  yellow: 'bg-yellow-500', pink: 'bg-pink-500', purple: 'bg-purple-500',
};

const defaultCard = () => ({ front: '', back: '', hint: '' });

export default function FlashcardFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ deckName: '', description: '', color: 'default', isPublic: false });
  const [cards, setCards] = useState([defaultCard(), defaultCard()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/flashcards/${id}`).then(({ data }) => {
        const d = data.deck;
        setForm({ deckName: d.deckName, description: d.description, color: d.color, isPublic: d.isPublic });
        setCards(d.cards.length > 0 ? d.cards : [defaultCard()]);
      }).catch(() => navigate('/flashcards'));
    }
  }, [isEdit, id, navigate]);

  const addCard = () => setCards([...cards, defaultCard()]);
  const removeCard = (idx) => {
    if (cards.length === 1) { toast.error('At least one card required'); return; }
    setCards(cards.filter((_, i) => i !== idx));
  };
  const updateCard = (idx, field, value) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < cards.length; i++) {
      if (!cards[i].front.trim() || !cards[i].back.trim()) {
        toast.error(`Card ${i + 1}: front and back are required`);
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/flashcards/${id}`, { ...form, cards });
        toast.success('Deck updated!');
      } else {
        await api.post('/flashcards', { ...form, cards });
        toast.success('Deck created!');
      }
      navigate('/flashcards');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button onClick={() => navigate('/flashcards')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Flashcards
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deck settings */}
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <Layers className="w-7 h-7 text-green-400" />
            {isEdit ? 'Edit Deck' : 'Create Flashcard Deck'}
          </h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Deck Name *</label>
              <input value={form.deckName} onChange={e => setForm({ ...form, deckName: e.target.value })} className="input-field" placeholder="e.g. Biology Chapter 3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={2} placeholder="What is this deck about?" />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={clsx('w-6 h-6 rounded-full transition-all', colorDots[c], form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-125' : 'opacity-50 hover:opacity-100')}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="accent-green-500" />
                <span className="text-gray-300 text-sm">Make deck public</span>
              </label>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Cards ({cards.length})</h2>
          </div>

          {cards.map((card, idx) => (
            <div key={idx} className="glass-card p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm font-medium">Card {idx + 1}</span>
                <button type="button" onClick={() => removeCard(idx)} className="btn-icon p-1">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Front (Question) *</label>
                  <textarea
                    value={card.front}
                    onChange={e => updateCard(idx, 'front', e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={3}
                    placeholder="Question or term..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Back (Answer) *</label>
                  <textarea
                    value={card.back}
                    onChange={e => updateCard(idx, 'back', e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={3}
                    placeholder="Answer or definition..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Hint (optional)</label>
                <input
                  value={card.hint}
                  onChange={e => updateCard(idx, 'hint', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="A helpful hint..."
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={addCard} className="btn-secondary w-full flex items-center justify-center gap-2 py-3 border-dashed border-white/20">
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Update Deck' : 'Create Deck'}
        </button>
      </form>
    </div>
  );
}
