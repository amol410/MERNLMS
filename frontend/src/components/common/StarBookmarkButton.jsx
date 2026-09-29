import { Star } from 'lucide-react';
import { useDifficultWords } from '../../hooks/useDifficultWords';
import clsx from 'clsx';

export default function StarBookmarkButton({
  front,
  back,
  hint = 'Quiz Revision',
  className = '',
  size = 18,
}) {
  const { isBookmarked, toggleBookmark } = useDifficultWords();

  if (!front || !front.trim()) return null;

  const starred = isBookmarked(front);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleBookmark({ front, back, hint });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={starred ? 'Remove from Difficult Words' : 'Add to Difficult Words'}
      className={clsx(
        'p-1.5 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center flex-shrink-0',
        starred
          ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
          : 'text-gray-400 hover:text-amber-400 hover:bg-white/5',
        className
      )}
    >
      <Star
        size={size}
        className={clsx(
          'transition-transform duration-200',
          starred ? 'fill-amber-400 text-amber-400 scale-105' : 'hover:scale-110'
        )}
      />
    </button>
  );
}
