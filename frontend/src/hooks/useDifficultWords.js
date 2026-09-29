import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const listeners = new Set();
let globalBookmarkedFronts = new Set();
let globalActiveVolume = 1;
let globalCurrentCount = 0;
let globalActiveDeckId = null;
let isInitialized = false;

function notifyListeners() {
  const payload = {
    bookmarkedFronts: new Set(globalBookmarkedFronts),
    activeVolume: globalActiveVolume,
    currentCount: globalCurrentCount,
    activeDeckId: globalActiveDeckId,
  };
  listeners.forEach(cb => cb(payload));
}

export function useDifficultWords() {
  const [state, setState] = useState({
    bookmarkedFronts: globalBookmarkedFronts,
    activeVolume: globalActiveVolume,
    currentCount: globalCurrentCount,
    activeDeckId: globalActiveDeckId,
  });

  const loadState = useCallback(async () => {
    try {
      const { data } = await api.get('/flashcards', { params: { limit: 100 } });
      const decks = data.decks || [];
      const difficultDecks = decks.filter(d => (d.deckName || '').startsWith('Difficult Words'));

      const fronts = new Set();
      let maxVol = 0;
      let latestDeck = null;
      const regex = /Difficult Words - Vol (\d+)/;

      for (const deck of difficultDecks) {
        const cards = Array.isArray(deck.cards) ? deck.cards : [];
        for (const card of cards) {
          if (card.front && card.front.trim()) {
            fronts.add(card.front.trim().toLowerCase());
          }
        }
        const match = regex.exec(deck.deckName);
        if (match) {
          const vol = parseInt(match[1], 10) || 1;
          if (vol > maxVol) {
            maxVol = vol;
            latestDeck = deck;
          }
        }
      }

      globalBookmarkedFronts = fronts;
      if (maxVol === 0) {
        globalActiveVolume = 1;
        globalCurrentCount = 0;
        globalActiveDeckId = null;
      } else if (latestDeck && (latestDeck.cards || []).length < 10) {
        globalActiveVolume = maxVol;
        globalCurrentCount = (latestDeck.cards || []).length;
        globalActiveDeckId = latestDeck._id || latestDeck.id;
      } else {
        globalActiveVolume = maxVol + 1;
        globalCurrentCount = 0;
        globalActiveDeckId = null;
      }

      notifyListeners();
    } catch (_) {
      // Non-critical background sync
    }
  }, []);

  useEffect(() => {
    const handler = (newState) => setState(newState);
    listeners.add(handler);

    if (!isInitialized) {
      isInitialized = true;
      loadState();
    }

    return () => {
      listeners.delete(handler);
    };
  }, [loadState]);

  const toggleBookmark = async ({ front, back, hint }) => {
    if (!front || !front.trim()) return;
    const cleanFront = front.trim();
    const cleanKey = cleanFront.toLowerCase();

    const isCurrentlyBookmarked = globalBookmarkedFronts.has(cleanKey);

    if (isCurrentlyBookmarked) {
      // ─── UNBOOKMARK / REMOVE ───
      globalBookmarkedFronts.delete(cleanKey);
      notifyListeners();

      try {
        const { data } = await api.get('/flashcards', { params: { limit: 100 } });
        const decks = data.decks || [];
        for (const deck of decks.filter(d => (d.deckName || '').startsWith('Difficult Words'))) {
          const cards = Array.isArray(deck.cards) ? deck.cards : [];
          const cardIdx = cards.findIndex(c => (c.front || '').trim().toLowerCase() === cleanKey);
          if (cardIdx !== -1) {
            const updatedCards = cards.filter((_, i) => i !== cardIdx);
            await api.put(`/flashcards/${deck._id || deck.id}`, { cards: updatedCards });
            break;
          }
        }
        await loadState();
        toast('Removed from Difficult Words', { icon: '🗑️' });
      } catch (_) {
        globalBookmarkedFronts.add(cleanKey);
        notifyListeners();
        toast.error('Failed to remove word');
      }
    } else {
      // ─── BOOKMARK / ADD ───
      globalBookmarkedFronts.add(cleanKey);
      notifyListeners();

      const newCard = {
        front: cleanFront,
        back: (back || '').trim(),
        hint: (hint || '').trim(),
      };

      try {
        if (globalActiveDeckId && globalCurrentCount < 10) {
          const { data } = await api.get(`/flashcards/${globalActiveDeckId}`);
          const currentDeck = data.deck || {};
          const existingCards = Array.isArray(currentDeck.cards) ? currentDeck.cards : [];
          const updatedCards = [...existingCards, newCard];

          await api.put(`/flashcards/${globalActiveDeckId}`, { cards: updatedCards });
          const newCount = updatedCards.length;
          await loadState();

          if (newCount >= 10) {
            toast.success(`Added to Difficult Words - Vol ${globalActiveVolume - 1} (10/10) • Deck Complete! 🎉`);
          } else {
            toast.success(`Added to Difficult Words - Vol ${globalActiveVolume} (${newCount}/10)`);
          }
        } else {
          const newVol = globalActiveVolume;
          await api.post('/flashcards', {
            deckName: `Difficult Words - Vol ${newVol}`,
            description: 'Curated difficult words from quiz results (10 words max)',
            cards: [newCard],
            color: 'purple',
            tags: ['difficult-words'],
            isPublic: false,
          });

          await loadState();
          toast.success(`Added to Difficult Words - Vol ${newVol} (1/10)`);
        }
      } catch (_) {
        globalBookmarkedFronts.delete(cleanKey);
        notifyListeners();
        toast.error('Failed to add to flashcards');
      }
    }
  };

  const isBookmarked = (front) => {
    if (!front || !front.trim()) return false;
    return state.bookmarkedFronts.has(front.trim().toLowerCase());
  };

  return {
    isBookmarked,
    toggleBookmark,
    activeVolume: state.activeVolume,
    currentCount: state.currentCount,
  };
}
