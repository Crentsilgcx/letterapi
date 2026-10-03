import { Mail, X, Search } from 'lucide-react';
import '../tokens.css';
import './EmptyState.css';

/**
 * Empty state for a letter list.
 *
 * `title`/`message` are supplied by the caller so the same component can describe
 * either tab without claiming, for example, that nothing is "awaiting receipt"
 * when the Received tab is simply empty.
 */
function EmptyState({ variant = 'default', title, message, onClearFilters }) {
  if (variant === 'filtered') {
    return (
      <div className="empty-state empty-state--filtered" role="status" aria-live="polite">
        <div className="empty-icon filtered">
          <Search size={48} aria-hidden="true" />
        </div>
        <h3 className="empty-title">{title || 'No letters match your filters'}</h3>
        <p className="empty-message">
          {message || 'Your current search and filter criteria returned no results. Try adjusting your filters or search terms.'}
        </p>
        <button
          className="btn-clear-filters-inline"
          onClick={onClearFilters}
          type="button"
        >
          <X size={16} aria-hidden="true" />
          <span>Clear filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-icon">
        <Mail size={48} aria-hidden="true" />
      </div>
      <h3 className="empty-title">{title || 'No letters awaiting receipt'}</h3>
      <p className="empty-message">
        {message || 'New deliveries will appear here as soon as they are logged.'}
      </p>
    </div>
  );
}

export default EmptyState;