import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Pagination({
  page = 1,
  pages = 1,
  total = 0,
  limit = 6,
  onPageChange,
  itemName = 'items',
  className = '',
}) {
  if (!pages || pages <= 0) return null;

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = total > 0 ? Math.min(page * limit, total) : 0;

  // Generate page numbers with smart ellipsis for larger page counts
  const getPageNumbers = () => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    const items = [];
    items.push(1);

    if (page > 3) {
      items.push('...');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(pages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (page < pages - 2) {
      items.push('...');
    }

    items.push(pages);
    return items;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (p) => {
    if (typeof p === 'number' && p !== page && p >= 1 && p <= pages) {
      onPageChange(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (page < pages) {
      onPageChange(page + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      className={clsx(
        'mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none',
        className
      )}
    >
      {/* Item count text */}
      <div className="text-xs text-gray-400 font-medium">
        {total > 0 ? (
          <>
            Showing <span className="text-white font-semibold">{startItem}</span>–
            <span className="text-white font-semibold">{endItem}</span> of{' '}
            <span className="text-white font-semibold">{total}</span> {itemName}
          </>
        ) : (
          <>
            Page <span className="text-white font-semibold">{page}</span> of{' '}
            <span className="text-white font-semibold">{pages}</span>
          </>
        )}
      </div>

      {/* Pagination controls */}
      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 h-7 flex items-center justify-center text-xs text-gray-500 font-medium"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageClick(p)}
                  className={clsx(
                    'w-7 h-7 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer',
                    isCurrent
                      ? 'bg-gradient-to-r from-dolphin-500 to-ocean-500 text-white shadow-md shadow-dolphin-500/20 font-bold scale-105'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={page >= pages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
            title="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
