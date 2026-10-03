import { useReception } from './hooks/useReceptionContext.jsx';
import { useState } from 'react';
import { Search, Package, PackageCheck, Loader2, Inbox, X } from 'lucide-react';
import ConnectionStatus from './components/ConnectionStatus';
import './tokens.css';
import './ReceptionDashboard.css';

const statusBadge = (status) => {
  const classes = {
    DELIVERED: 'status-delivered',
    RECEIVED: 'status-received',
    PENDING: 'status-pending',
    FAILED: 'status-failed',
  };
  return <span className={`status-badge ${classes[status] || ''}`}>{status}</span>;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
};

const DATE_FILTER_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const SearchFilterBar = ({ 
  searchQuery, onSearchChange, 
  dateFilter, onDateFilterChange, 
  customDateFrom, customDateTo, onCustomDateFromChange, onCustomDateToChange, 
  showCustomDate, 
  recipientPositionFilter, onRecipientPositionFilterChange,
}) => {
  return (
    <div className="search-filter-bar">
      <div className="search-field">
        <label htmlFor="searchLetters" className="visually-hidden">Search letters</label>
        <Search className="search-icon" size={18} aria-hidden="true" />
        <input
          type="text"
          id="searchLetters"
          placeholder="Search recipient, position or reference code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filter-fields">
        <div className="filter-field">
          <label htmlFor="dateFilter">Date</label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="filter-select"
          >
            {DATE_FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        {showCustomDate && (
          <div className="custom-date-fields">
            <div className="filter-field">
              <label htmlFor="customDateFrom">From</label>
              <input
                type="date"
                id="customDateFrom"
                value={customDateFrom}
                onChange={(e) => onCustomDateFromChange(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-field">
              <label htmlFor="customDateTo">To</label>
              <input
                type="date"
                id="customDateTo"
                value={customDateTo}
                onChange={(e) => onCustomDateToChange(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
        )}
        
        <div className="filter-field filter-field--position">
          <label htmlFor="recipientPositionFilter">Recipient position</label>
          <select
            id="recipientPositionFilter"
            value={recipientPositionFilter}
            onChange={(e) => onRecipientPositionFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Positions</option>
            <option value="HR Officer">HR Officer</option>
            <option value="IT Officer">IT Officer</option>
            <option value="Finance Manager">Finance Manager</option>
            <option value="Human Resources Manager">Human Resources Manager</option>
            <option value="Chief Executive Officer">Chief Executive Officer</option>
            <option value="Chief Technology Officer">Chief Technology Officer</option>
            <option value="Managing Director">Managing Director</option>
            <option value="Administrative Manager">Administrative Manager</option>
            <option value="Accountant">Accountant</option>
            <option value="Procurement Officer">Procurement Officer</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const DeliveryTable = ({ 
  title, 
  deliveries, 
  emptyMessage, 
  isLoading, 
  receivingId, 
  onReceive, 
  showAction = true, 
  totalElements, 
  page, 
  totalPages, 
  onPageChange,
  expandedId,
  setExpandedId
}) => {
  if (isLoading) {
    return (
      <div className="dashboard-loading" role="status" aria-live="polite">
        <Loader2 className="dashboard-spinner" size={28} aria-hidden="true" />
        <span>Loading letters...</span>
      </div>
    );
  }
   
  if (deliveries.length === 0) {
    return (
      <div className="dashboard-empty" role="status" aria-live="polite">
        <span className="dashboard-empty-mark" aria-hidden="true">
          <Inbox size={24} />
        </span>
        <p className="dashboard-empty-text">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-section desktop-table">
        <div className="table-wrap dashboard-table-wrap">
<table className="dashboard-table">
              <caption className="visually-hidden">{title}</caption>
              <thead>
              <tr>
                <th scope="col">External Organization</th>
                <th scope="col">Recipient</th>
                <th scope="col">Reference</th>
                <th scope="col">Delivered</th>
                <th scope="col">Received</th>
                {showAction && <th scope="col" className="dashboard-cell-action">Action</th>}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="dashboard-cell-organization">
                    <strong>{d.organizationName || '—'}</strong>
                  </td>
                  <td>
                    <span className="dashboard-recipient-name">{d.recipientName}</span>
                    {d.recipientTitle && <span className="dashboard-recipient-title">{d.recipientTitle}</span>}
                  </td>
                  <td className="dashboard-cell-reference">
                    <code className="dashboard-reference-code">{d.trackingNumber}</code>
                  </td>
                  <td className="dashboard-cell-date">{formatDate(d.deliveredAt)}</td>
                  <td className="dashboard-cell-date">
                    {d.receivedAt ? formatDate(d.receivedAt) : <span className="muted">—</span>}
                  </td>
                  {showAction && (
                    <td className="dashboard-cell-action">
                      <button
                        className="dashboard-confirm-btn"
                        onClick={(e) => { e.stopPropagation(); onReceive(d.id); }}
                        disabled={receivingId === d.id}
                        aria-busy={receivingId === d.id}
                      >
                        {receivingId === d.id && (
                          <Loader2 size={16} className="dashboard-spinner" aria-hidden="true" />
                        )}
                        {receivingId === d.id ? 'Confirming...' : 'Confirm Receipt'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="delivery-cards mobile-cards">
        {deliveries.map((d) => (
          <div
            key={d.id}
            className={`delivery-card ${expandedId === d.id ? 'expanded' : ''}`}
            onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
          >
            <div className="delivery-card-header">
              <div className="delivery-card-main">
                <span className="delivery-card-position">{d.recipientName}</span>
                <span className="delivery-card-org">{d.organizationName || '—'}</span>
              </div>
              <div className="delivery-card-right">
                {statusBadge(d.status)}
                <span className="delivery-card-expand">▾</span>
              </div>
            </div>
            <div className="delivery-card-body">
              <div className="delivery-card-row">
                <span className="delivery-card-label">Recipient:</span>
                <span className="delivery-card-value"><strong>{d.recipientName}</strong>{d.recipientTitle && <span className="muted"> — {d.recipientTitle}</span>}</span>
              </div>
              <div className="delivery-card-row delivery-card-subject">
                <span className="delivery-card-label">Reference:</span>
                <span className="delivery-card-value"><strong>{d.trackingNumber}</strong></span>
              </div>
              <div className="delivery-card-row">
                <span className="delivery-card-label">Delivered:</span>
                <span className="delivery-card-value">{formatDate(d.deliveredAt)}</span>
              </div>
              <div className="delivery-card-row">
                <span className="delivery-card-label">Received:</span>
                <span className="delivery-card-value">{d.receivedAt ? formatDate(d.receivedAt) : <span className="muted">—</span>}</span>
              </div>
              {showAction && (
                <div className="delivery-card-actions">
                  <button
                    className="dashboard-confirm-btn"
                    onClick={(e) => { e.stopPropagation(); onReceive(d.id); }}
                    disabled={receivingId === d.id}
                    aria-busy={receivingId === d.id}
                  >
                    {receivingId === d.id && (
                      <Loader2 size={16} className="dashboard-spinner" aria-hidden="true" />
                    )}
                    {receivingId === d.id ? 'Confirming...' : 'Confirm Receipt'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {page * 10 + 1} to {Math.min((page + 1) * 10, totalElements)} of {totalElements}
          </span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => onPageChange(0)} disabled={page === 0} aria-label="First page">««</button>
            <button className="pagination-btn" onClick={() => onPageChange(page - 1)} disabled={page === 0} aria-label="Previous page">«</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page <= 2) {
                pageNum = i;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`pagination-btn${pageNum === page ? ' active' : ''}`}
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Page ${pageNum + 1}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button className="pagination-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} aria-label="Next page">»</button>
            <button className="pagination-btn" onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} aria-label="Last page">»»</button>
          </div>
        </div>
      )}
    </>
  );
};

const ReceptionDashboard = () => {
  const {
    pending,
    received,
    pendingPage,
    receivedPage,
    pendingTotalPages,
    receivedTotalPages,
    pendingTotalElements,
    receivedTotalElements,
    isLoading,
    error,
    success,
    receivingId,
    activeTab,
    setActiveTab,
    handleReceive,
    clearMessages,
    goToPendingPage,
    goToReceivedPage,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customDateFrom,
    customDateTo,
    setCustomDateFrom,
    setCustomDateTo,
    showCustomDate,
    recipientPositionFilter,
    setRecipientPositionFilter,
    isConnected,
  } = useReception();

  const [expandedPendingId, setExpandedPendingId] = useState(null);
  const [expandedReceivedId, setExpandedReceivedId] = useState(null);

  return (
    <div className="reception-dashboard">
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="page-title">Reception Dashboard</h1>
              <p className="page-subtitle">Manage incoming deliveries and receipt confirmations.</p>
            </div>
            <ConnectionStatus isConnected={isConnected} />
          </div>
        </header>

        {(success || error) && (
          <div className="messages">
            {success && (
              <div className="alert alert-success" role="status" aria-live="polite">
                <span>{success}</span>
                <button className="alert-close" onClick={clearMessages} aria-label="Dismiss message" type="button">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}
            {error && (
              <div className="alert alert-error" role="alert" aria-live="assertive">
                <span>{error}</span>
                <button className="alert-close" onClick={clearMessages} aria-label="Dismiss error" type="button">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          onCustomDateFromChange={setCustomDateFrom}
          onCustomDateToChange={setCustomDateTo}
          showCustomDate={showCustomDate}
          recipientPositionFilter={recipientPositionFilter}
          onRecipientPositionFilterChange={setRecipientPositionFilter}
        />

        <div className="dashboard-tabs" role="tablist" aria-label="Delivery status">
          <button
            className={`dashboard-tab${activeTab === 'pending' ? ' active' : ''}`}
            onClick={() => setActiveTab('pending')}
            role="tab"
            aria-selected={activeTab === 'pending'}
            aria-controls="pending-panel"
            id="pending-tab"
          >
            <Package size={16} aria-hidden="true" />
            <span>Awaiting Receipt</span>
            <span className="dashboard-tab-count">{pendingTotalElements}</span>
          </button>
          <button
            className={`dashboard-tab${activeTab === 'received' ? ' active' : ''}`}
            onClick={() => setActiveTab('received')}
            role="tab"
            aria-selected={activeTab === 'received'}
            aria-controls="received-panel"
            id="received-tab"
          >
            <PackageCheck size={16} aria-hidden="true" />
            <span>Received</span>
            <span className="dashboard-tab-count">{receivedTotalElements}</span>
          </button>
        </div>

        <div
          className="dashboard-panel"
          role="tabpanel"
          id={activeTab === 'pending' ? 'pending-panel' : 'received-panel'}
          aria-labelledby={activeTab === 'pending' ? 'pending-tab' : 'received-tab'}
        >
          {activeTab === 'pending' && (
            <DeliveryTable
              title="Awaiting Receipt"
              deliveries={pending}
              emptyMessage="No letters are waiting for receipt confirmation."
              isLoading={isLoading}
              receivingId={receivingId}
              onReceive={handleReceive}
              showAction={true}
              totalElements={pendingTotalElements}
              page={pendingPage}
              totalPages={pendingTotalPages}
              onPageChange={goToPendingPage}
              expandedId={expandedPendingId}
              setExpandedId={setExpandedPendingId}
            />
          )}

          {activeTab === 'received' && (
            <DeliveryTable
              title="Received Letters"
              deliveries={received}
              emptyMessage="No letters have been received yet."
              isLoading={isLoading}
              receivingId={receivingId}
              onReceive={handleReceive}
              showAction={false}
              totalElements={receivedTotalElements}
              page={receivedPage}
              totalPages={receivedTotalPages}
              onPageChange={goToReceivedPage}
              expandedId={expandedReceivedId}
              setExpandedId={setExpandedReceivedId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;