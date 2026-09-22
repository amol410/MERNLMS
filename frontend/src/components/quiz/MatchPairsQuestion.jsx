import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Link2, Unlink, GripVertical, CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import clsx from 'clsx';

/**
 * Helper to produce a derangement (shuffled array where no item stays at its original index)
 */
function getDerangedRightItems(items) {
  if (!items || items.length <= 1) return [...(items || [])];
  const n = items.length;
  let shuffled;
  let attempts = 0;

  do {
    shuffled = [...items];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (attempts < 30 && shuffled.some((item, idx) => item === items[idx]));

  // Guaranteed fallback: cyclic shift by 1 if items are distinct
  if (shuffled.some((item, idx) => item === items[idx])) {
    shuffled = items.map((_, i) => items[(i + 1) % n]);
  }
  return shuffled;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. MatchPairsForm — Authoring / Editor component in QuizFormPage
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function MatchPairsForm({ question, qIdx, updateQuestion }) {
  // Ensure we always have exactly 4 pairs
  const rawPairs = Array.isArray(question.pairs) ? question.pairs : [];
  const pairs = [0, 1, 2, 3].map(i => ({
    left: rawPairs[i]?.left ?? '',
    right: rawPairs[i]?.right ?? '',
  }));

  const handlePairChange = (pairIdx, side, value) => {
    const updated = [...pairs];
    updated[pairIdx] = { ...updated[pairIdx], [side]: value };
    updateQuestion(qIdx, 'pairs', updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div>
          <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
            Match the Pairs Editor — 4 on Left and 4 on Right
          </label>
          <p className="text-xs text-gray-400 mt-0.5">
            Define 4 prompts on the left and their 4 corresponding matching answers on the right.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          4 Left ↔ 4 Right
        </span>
      </div>

      {/* Side-by-side: 4 on Left and 4 on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT COLUMN: 4 ITEMS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-dolphin-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-dolphin-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-dolphin-400" />
              Left Side — 4 Prompts / Premises
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dolphin-500/20 text-dolphin-300">
              Left
            </span>
          </div>

          {pairs.map((pair, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-dolphin-500/40 transition-all space-y-1.5"
            >
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-dolphin-500/20 text-dolphin-300 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                Left Item {idx + 1} (Prompt / Premise) *
              </label>
              <textarea
                value={pair.left}
                onChange={e => handlePairChange(idx, 'left', e.target.value)}
                placeholder={`Enter prompt / premise ${idx + 1}...`}
                rows={2}
                className="input-field text-sm resize-none"
                required
              />
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: 4 ITEMS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              Right Side — 4 Corresponding Matches
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              Right
            </span>
          </div>

          {pairs.map((pair, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-purple-500/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  Right Item {idx + 1} (Match for Left {idx + 1}) *
                </span>
                <span className="text-[10px] text-purple-400/80 font-mono flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> Pair {idx + 1}
                </span>
              </div>
              <textarea
                value={pair.right}
                onChange={e => handlePairChange(idx, 'right', e.target.value)}
                placeholder={`Enter matching answer for left prompt ${idx + 1}...`}
                rows={2}
                className="input-field text-sm resize-none"
                required
              />
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-black/20 border border-white/5 text-xs text-gray-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span>
          During the quiz, the 4 right items will automatically be randomized/mismatched so students must match them.
        </span>
      </div>
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. MatchPairsDisplay — Interactive Drag-and-Drop & Tap-to-Pair Taking UI
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function MatchPairsDisplay({ question, currentAnswer, onAnswer, disabled }) {
  // Extract left items and right items from question
  // Question can provide leftItems + rightItems (sanitized from server) OR pairs (if owner)
  const leftItems = useMemo(() => {
    if (Array.isArray(question.leftItems) && question.leftItems.length > 0) {
      return question.leftItems;
    }
    if (Array.isArray(question.pairs)) {
      return question.pairs.map(p => p.left);
    }
    return [];
  }, [question]);

  const rawRightItems = useMemo(() => {
    if (Array.isArray(question.rightItems) && question.rightItems.length > 0) {
      return question.rightItems;
    }
    if (Array.isArray(question.pairs)) {
      return question.pairs.map(p => p.right);
    }
    return [];
  }, [question]);

  // Initial Mismatch: Ensure the right items start in a randomized order for this specific question
  const initialRightList = useMemo(() => {
    return getDerangedRightItems(rawRightItems);
  }, [question._id, rawRightItems]);

  // Current pairing mapping: { [leftItemText]: rightItemText }
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [draggedRight, setDraggedRight] = useState(null);

  // Clear selected state when question changes
  useEffect(() => {
    setSelectedLeft(null);
    setDraggedRight(null);
  }, [question._id]);

  // Initialize or restore answer map
  const pairsMap = useMemo(() => {
    const map = {};
    if (Array.isArray(currentAnswer)) {
      currentAnswer.forEach(item => {
        if (item && item.left && item.right) {
          map[item.left] = item.right;
        }
      });
    } else if (currentAnswer && typeof currentAnswer === 'object' && !Array.isArray(currentAnswer)) {
      Object.assign(map, currentAnswer);
    }
    return map;
  }, [currentAnswer]);

  // Which right items have been placed?
  const pairedRightSet = useMemo(() => {
    return new Set(Object.values(pairsMap));
  }, [pairsMap]);

  // Unplaced right items available in the draggable pool
  const availableRightItems = useMemo(() => {
    return initialRightList.filter(item => !pairedRightSet.has(item));
  }, [initialRightList, pairedRightSet]);

  const commitMatches = (newMap) => {
    if (disabled) return;
    const arrayPayload = leftItems.map(left => ({
      left,
      right: newMap[left] || '',
    }));
    onAnswer(arrayPayload);
  };

  const handlePair = (leftText, rightText) => {
    if (disabled) return;
    const updated = { ...pairsMap };

    // If this rightText was already assigned to another left, unassign it
    for (const key of Object.keys(updated)) {
      if (updated[key] === rightText) {
        delete updated[key];
      }
    }

    updated[leftText] = rightText;
    commitMatches(updated);
    setSelectedLeft(null);
  };

  const handleUnpair = (leftText) => {
    if (disabled) return;
    const updated = { ...pairsMap };
    delete updated[leftText];
    commitMatches(updated);
  };

  const handleReset = () => {
    if (disabled) return;
    commitMatches({});
    setSelectedLeft(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e, rightText) => {
    if (disabled) return;
    setDraggedRight(rightText);
    e.dataTransfer.setData('text/plain', rightText);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnLeft = (e, leftText) => {
    if (disabled) return;
    e.preventDefault();
    const rightText = e.dataTransfer.getData('text/plain') || draggedRight;
    if (rightText) {
      handlePair(leftText, rightText);
    }
    setDraggedRight(null);
  };

  const totalPaired = Object.keys(pairsMap).filter(k => Boolean(pairsMap[k])).length;
  const isComplete = leftItems.length > 0 && totalPaired === leftItems.length;

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Top action helper */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
        <div className="flex items-center gap-2 text-purple-200 font-medium">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>
            <strong>Match the Pairs:</strong> Drag answers from the right to matching prompts, or click a prompt then click an answer.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx(
            'px-2.5 py-1 rounded-full font-mono text-xs font-semibold',
            isComplete
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-white/10 text-gray-300'
          )}>
            {totalPaired} / {leftItems.length} paired
          </span>
          {totalPaired > 0 && !disabled && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Matching Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Fixed Prompts with Drop Targets */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-dolphin-400" />
            Prompts / Premises ({leftItems.length})
          </h3>

          {leftItems.map((leftText, idx) => {
            const matchedRight = pairsMap[leftText];
            const isSelected = selectedLeft === leftText;

            return (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnLeft(e, leftText)}
                onClick={() => {
                  if (disabled) return;
                  setSelectedLeft(isSelected ? null : leftText);
                }}
                className={clsx(
                  'rounded-xl border transition-all duration-200 p-4 relative cursor-pointer',
                  matchedRight
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                    : isSelected
                      ? 'bg-dolphin-950/30 border-dolphin-400 ring-2 ring-dolphin-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                )}
              >
                {/* Left Prompt Title */}
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-white/10 text-gray-300 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 font-medium text-white text-sm leading-snug">
                    {leftText}
                  </div>
                </div>

                {/* Paired Match Target Zone */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium min-w-0">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    {matchedRight ? (
                      <span className="text-purple-200 font-semibold truncate bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
                        {matchedRight}
                      </span>
                    ) : (
                      <span className={clsx(
                        'italic',
                        isSelected ? 'text-dolphin-300 font-semibold' : 'text-gray-500'
                      )}>
                        {isSelected ? 'Click an answer on the right to link...' : 'Drop or tap answer to match'}
                      </span>
                    )}
                  </div>

                  {matchedRight && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnpair(leftText);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Unpair"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Answers / Draggable Matches Pool */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Answers (Shuffled)
          </h3>

          <div className="space-y-2.5">
            {initialRightList.map((rightText, idx) => {
              const isPaired = pairedRightSet.has(rightText);

              return (
                <div
                  key={idx}
                  draggable={!disabled && !isPaired}
                  onDragStart={(e) => handleDragStart(e, rightText)}
                  onClick={() => {
                    if (disabled || isPaired) return;
                    if (selectedLeft) {
                      handlePair(selectedLeft, rightText);
                    }
                  }}
                  className={clsx(
                    'p-3.5 rounded-xl border transition-all duration-200 text-sm flex items-center gap-3',
                    isPaired
                      ? 'opacity-30 bg-white/5 border-white/5 cursor-not-allowed line-through text-gray-500'
                      : selectedLeft
                        ? 'bg-purple-900/25 border-purple-400/60 hover:bg-purple-900/40 text-purple-100 cursor-pointer shadow-lg shadow-purple-500/10'
                        : 'bg-white/5 border-white/15 hover:border-white/30 text-gray-200 cursor-grab active:cursor-grabbing hover:bg-white/10'
                  )}
                >
                  <GripVertical className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="flex-1 font-medium leading-snug">
                    {rightText}
                  </span>
                  {!isPaired && selectedLeft && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500 text-white flex-shrink-0">
                      Link
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {availableRightItems.length === 0 && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center text-xs text-green-400 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              All 4 items have been paired!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. MatchPairsReview — Question Review display on results screen
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function MatchPairsReview({ question, index }) {
  const correctPairs = Array.isArray(question.pairs) ? question.pairs : [];
  const submittedMatches = Array.isArray(question.submittedMatches)
    ? question.submittedMatches
    : [];

  const totalPairs = correctPairs.length || 4;
  let correctCount = 0;

  // Build review items
  const reviewItems = correctPairs.map(cp => {
    const userMatch = submittedMatches.find(
      sm => String(sm.left ?? '').trim().toLowerCase() === String(cp.left ?? '').trim().toLowerCase()
    );
    const userRight = userMatch?.right || '(Not paired)';
    const isPairCorrect =
      String(userRight).trim().toLowerCase() === String(cp.right ?? '').trim().toLowerCase();

    if (isPairCorrect) correctCount++;

    return {
      left: cp.left,
      correctRight: cp.right,
      userRight,
      isPairCorrect,
    };
  });

  const isAllCorrect = totalPairs > 0 && correctCount === totalPairs;

  return (
    <div
      className={clsx(
        'glass-card p-5 border-l-4 transition-all',
        isAllCorrect ? 'border-green-500/60' : 'border-red-500/60'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Match the Pairs
            </span>
            <span className="text-xs text-gray-400 font-mono">
              ({correctCount} / {totalPairs} pairs correct)
            </span>
          </div>
          <p className="text-white font-medium text-sm">
            {index + 1}. {question.text}
          </p>
        </div>
        {isAllCorrect ? (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-3" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 ml-3" />
        )}
      </div>

      {/* Pairs Comparison Grid */}
      <div className="space-y-2 mb-4">
        {reviewItems.map((item, idx) => (
          <div
            key={idx}
            className={clsx(
              'p-3 rounded-lg border text-xs grid grid-cols-1 md:grid-cols-12 gap-2 items-center',
              item.isPairCorrect
                ? 'bg-green-500/10 border-green-500/30 text-green-200'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            )}
          >
            {/* Prompt */}
            <div className="md:col-span-5 font-semibold text-white flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-white/10 text-gray-300 font-mono text-[10px] flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <span>{item.left}</span>
            </div>

            {/* User Answer */}
            <div className="md:col-span-4 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className={item.isPairCorrect ? 'text-green-300 font-medium' : 'text-red-300 line-through'}>
                {item.userRight}
              </span>
            </div>

            {/* Correct Match (if wrong) */}
            <div className="md:col-span-3 text-right">
              {item.isPairCorrect ? (
                <span className="inline-flex items-center gap-1 text-green-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Correct
                </span>
              ) : (
                <span className="text-gray-300 font-medium">
                  Match: <strong className="text-green-400">{item.correctRight}</strong>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation */}
      {question.explanation && (
        <div className="mt-3 px-3.5 py-2.5 bg-dolphin-600/10 rounded-lg border border-dolphin-500/20">
          <p className="text-dolphin-300 text-xs leading-relaxed">
            <strong>Explanation:</strong> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
