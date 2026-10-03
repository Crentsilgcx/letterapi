import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import '../tokens.css';
import './Pagination.css';

/**
 * Page navigation.
 *
 * `pageSize` must match the page size the rows were actually fetched with, so the
 * "Showing X to Y of Z" summary stays honest. The dashboard pages server-side at
 * 10; the Record page paginates the generated report at 25.
 */
function Pagination({ currentPage, totalPages, totalElements, onPageChange, pageSize = 10 }) {
  const start = totalElements > 0 ? currentPage * pageSize + 1 : 0;
  const end = Math.min((currentPage + 1) * pageSize, totalElements);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages = [0];
    if (currentPage > 2) pages.push('ellipsis');

    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages - 2, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) pages.push('ellipsis');
    pages.push(totalPages - 1);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="pagination" aria-label="Pagination" role="navigation">
      <div className="pagination-info" aria-live="polite">
        Showing {start} to {end} of {totalElements}
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
        </button>

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <div className="pagination-pages" role="group" aria-label="Page numbers">
          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden="true">…</span>
            ) : (
              <button
                key={page}
                className={`pagination-btn pagination-page${page === currentPage ? ' active' : ''}`}
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page + 1}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page + 1}
              </button>
            )
          )}
        </div>

        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        <button
          className="pagination-btn"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;