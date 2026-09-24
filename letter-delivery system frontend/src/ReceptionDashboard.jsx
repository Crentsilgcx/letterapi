import { useReception } from './hooks/useReceptionContext.jsx';
import { useState } from 'react';

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
  organizationFilter, onOrganizationFilterChange,
}) => {
  return (
    <div className="search-filter-bar">
      <div className="search-field">
        <label htmlFor="searchLetters" className="visually-hidden">Search letters</label>
        <input
          type="text"
          id="searchLetters"
          placeholder="Search letters..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filter-fields">
        <div className="filter-field">
          <label htmlFor="dateFilter" className="visually-hidden">Date filter</label>
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
        
        <div className="filter-field">
          <label htmlFor="recipientPositionFilter" className="visually-hidden">Recipient Position filter</label>
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
        
        <div className="filter-field">
          <label htmlFor="organizationFilter" className="visually-hidden">Organization filter</label>
          <input
            type="text"
            id="organizationFilter"
            placeholder="Filter by organization..."
            value={organizationFilter}
            onChange={(e) => onOrganizationFilterChange(e.target.value)}
            className="filter-input"
          />
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
    return <div className="loading">Loading...</div>;
  }
   
  if (deliveries.length === 0) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
    <>
      <div className="table-section desktop-table">
        <h3 className="table-title">{title} <span className="count">({totalElements || deliveries.length})</span></h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>External Organization</th>
                <th>Recipient</th>
                <th>Letter Subject</th>
                <th>Delivered</th>
                <th>Received</th>
                {showAction && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.organizationName || '—'}</strong>
                  </td>
                  <td>
                    <strong>{d.recipientName}</strong><br />
                    <span className="muted">{d.recipientTitle || ''}</span>
                  </td>
                  <td>
                    <strong>{d.subject}</strong><br />
                    {d.referenceNumber && <span className="muted">Ref: {d.referenceNumber}</span>}
                  </td>
                  <td className="nowrap">{formatDate(d.deliveredAt)}</td>
                  <td className="nowrap">{d.receivedAt ? formatDate(d.receivedAt) : <span className="muted">—</span>}</td>
                  {showAction && (
                    <td>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={(e) => { e.stopPropagation(); onReceive(d.id); }}
                        disabled={receivingId === d.id}
                      >
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
                <span className="delivery-card-label">Subject:</span>
                <span className="delivery-card-value"><strong>{d.subject}</strong>{d.referenceNumber && <span className="muted"> (Ref: {d.referenceNumber})</span>}</span>
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
                    className="btn btn-primary btn-small"
                    onClick={(e) => { e.stopPropagation(); onReceive(d.id); }}
                    disabled={receivingId === d.id}
                  >
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
                className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button className="pagination-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} aria-label="Next page">»</button>
          <button className="pagination-btn" onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} aria-label="Last page">»»</button>
          <span className="pagination-info">Page {page + 1} of {totalPages} ({totalElements} total)</span>
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
    organizationFilter,
    setOrganizationFilter,
    isConnected,
  } = useReception();

  const [expandedPendingId, setExpandedPendingId] = useState(null);
  const [expandedReceivedId, setExpandedReceivedId] = useState(null);

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Reception Staff</h2>
            <p className="card-subtitle">Manage incoming deliveries and receipt confirmations</p>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

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
          organizationFilter={organizationFilter}
          onOrganizationFilterChange={setOrganizationFilter}
        />

        <div className="tab-nav" role="tablist">
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            role="tab"
            aria-selected={activeTab === 'pending'}
          >
            Awaiting Receipt
          </button>
          <button
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
            role="tab"
            aria-selected={activeTab === 'received'}
          >
            Received
          </button>
        </div>

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
  );
};

export default ReceptionDashboard;