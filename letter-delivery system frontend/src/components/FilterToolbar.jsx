import { Search, X } from 'lucide-react';
import { RECIPIENT_FILTER_OPTIONS } from '../constants/recipientRoles';
import '../tokens.css';
import './FilterToolbar.css';

const DATE_FILTER_OPTIONS = [
  { value: '', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * Search and filters for the Reception dashboard.
 *
 * Every control here maps to a parameter the backend already supports on
 * GET /api/reception/deliveries/{pending,received}/page, so filtering happens
 * on the server. Nothing here filters the already-loaded rows in the browser.
 */
function FilterToolbar({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  customDateFrom,
  customDateTo,
  onCustomDateFromChange,
  onCustomDateToChange,
  showCustomDate,
  recipientPositionFilter,
  onRecipientPositionFilterChange,
  hasActiveFilters,
  onClearFilters,
}) {
  const showClearFilters = hasActiveFilters;

  return (
    <div className="filter-toolbar" role="search" aria-label="Filter deliveries">
      <div className="filter-row filter-row--search">
        <label htmlFor="search-deliveries" className="visually-hidden">
          Search deliveries
        </label>
        <div className="search-field">
          <Search className="search-icon" size={18} aria-hidden="true" />
          <input
            type="search"
            id="search-deliveries"
            placeholder="Search recipient, position or reference code"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="filter-input"
            aria-describedby="search-hint"
          />
        </div>
        <span id="search-hint" className="visually-hidden">
          Type to search by recipient, recipient position, reference or tracking code, or delivery person name.
        </span>
      </div>

      <div className="filter-row filter-row--filters">
        <div className="filter-group">
          <label htmlFor="date-filter" className="visually-hidden">
            Date filter
          </label>
          <select
            id="date-filter"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="filter-select"
          >
            {DATE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {showCustomDate && (
          <>
            <div className="filter-group">
              <label htmlFor="custom-date-from">From</label>
              <input
                type="date"
                id="custom-date-from"
                value={customDateFrom}
                onChange={(e) => onCustomDateFromChange(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label htmlFor="custom-date-to">To</label>
              <input
                type="date"
                id="custom-date-to"
                value={customDateTo}
                onChange={(e) => onCustomDateToChange(e.target.value)}
                className="filter-input"
              />
            </div>
          </>
        )}

        <div className="filter-group filter-group--grow">
          <label htmlFor="position-filter">Recipient position</label>
          <select
            id="position-filter"
            value={recipientPositionFilter}
            onChange={(e) => onRecipientPositionFilterChange(e.target.value)}
            className="filter-select"
          >
            {RECIPIENT_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {showClearFilters && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={onClearFilters}
            aria-label="Clear all filters"
          >
            <X size={16} aria-hidden="true" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterToolbar;
