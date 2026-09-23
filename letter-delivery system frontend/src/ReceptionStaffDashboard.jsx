import { useReception } from './hooks/useReceptionContext';

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

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const DeliveryTable = ({ title, deliveries, emptyMessage, isLoading, receivingId, onReceive, showAction = true, count, totalElements, page, totalPages, onPageChange, showDeliveryPerson = false }) => {
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
   
  if (deliveries.length === 0) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
    <div className="table-section">
      <h3 className="table-title">{title} <span className="count">({totalElements || deliveries.length})</span></h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Recipient Position</th>
              <th>Organization</th>
              <th>Subject</th>
              <th>Delivery Person</th>
              <th>Date</th>
              {showAction && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.recipientName}</strong>
                </td>
                <td>
                  <strong>{d.organizationName || '—'}</strong>
                  {d.organizationAddress && <br />}
                  {d.organizationAddress && (
                    <span className="muted">{d.organizationAddress}</span>
                  )}
                </td>
                <td>
                  <strong>{d.subject || '—'}</strong>
                  {d.referenceNumber && <br />}
                  {d.referenceNumber && <span className="muted">Ref: {d.referenceNumber}</span>}
                </td>
                <td>
                  <span className="muted">{d.deliveryPersonName || '—'}</span>
                </td>
                <td className="nowrap">
                  {d.deliveredAt ? formatDateShort(d.deliveredAt) : '—'}
                </td>
                {showAction && (
                  <td>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => onReceive(d.id)}
                      disabled={receivingId === d.id}
                    >
                      {receivingId === d.id ? 'Confirming...' : 'Receive'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="delivery-cards">
        {deliveries.map((d) => (
          <div key={d.id} className="delivery-card">
            <div className="delivery-card-header">
              <span className="delivery-card-org">{d.organizationName || '—'}</span>
              <span className="delivery-card-status">{statusBadge(d.status)}</span>
            </div>
            <div className="delivery-card-body">
              <div className="delivery-card-row">
                <span className="delivery-card-label">Recipient Position:</span>
                <span className="delivery-card-value"><strong>{d.recipientName}</strong></span>
              </div>
              <div className="delivery-card-row">
                <span className="delivery-card-label">Delivery Person:</span>
                <span className="delivery-card-value"><span className="muted">{d.deliveryPersonName || '—'}</span></span>
              </div>
              <div className="delivery-card-row delivery-card-subject">
                <span className="delivery-card-label">Subject:</span>
                <span className="delivery-card-value">
                  <strong>{d.subject || '—'}</strong>
                  {d.referenceNumber && <span className="muted"> (Ref: {d.referenceNumber})</span>}
                </span>
              </div>
              <div className="delivery-card-row">
                <span className="delivery-card-label">Delivered:</span>
                <span className="delivery-card-value">{d.deliveredAt ? formatDateShort(d.deliveredAt) : '—'}</span>
              </div>
              {showAction && (
                <div className="delivery-card-actions">
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => onReceive(d.id)}
                    disabled={receivingId === d.id}
                  >
                    {receivingId === d.id ? 'Confirming...' : 'Receive'}
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
    </div>
  );
};

const SearchFilterBar = ({ 
  searchQuery, onSearchChange, 
  dateFilter, onDateFilterChange, 
  customDateFrom, customDateTo, onCustomDateFromChange, onCustomDateToChange, 
  showCustomDate, 
  recipientPositionFilter, onRecipientPositionFilterChange,
  organizationFilter, onOrganizationFilterChange,
  totalElements 
}) => {
  const DATE_FILTER_OPTIONS = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

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
      </div>
    </div>
  );
};

const ReceptionStaffDashboard = () => {
  const {
    pending,
    received,
    pendingPage,
    receivedPage,
    pendingTotalPages,
    receivedTotalPages,
    pendingTotalElements,
    receivedTotalElements,
    receivedTodayCount,
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
    // These need to be added to the context
    recipientPositionFilter,
    setRecipientPositionFilter,
    organizationFilter,
    setOrganizationFilter,
  } = useReception();

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Reception Staff</h2>
            <p className="card-subtitle">Manage incoming letters and receipt confirmations</p>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <h3>{activeTab === 'pending' ? 'Awaiting Receipt' : 'Received Letters'}</h3>
          </div>
          <div className="toolbar-right">
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setActiveTab(activeTab === 'pending' ? 'received' : 'pending')}
            >
              {activeTab === 'pending' ? 'View Full Register' : 'Awaiting Receipt'}
            </button>
          </div>
        </div>

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
          totalElements={activeTab === 'pending' ? pendingTotalElements : receivedTotalElements}
        />

        {activeTab === 'pending' && (
          <DeliveryTable
            title=""
            deliveries={pending}
            emptyMessage="No letters are currently awaiting receipt."
            isLoading={isLoading}
            receivingId={receivingId}
            onReceive={handleReceive}
            showAction={true}
            showDeliveryPerson={true}
            count={pending.length}
            totalElements={pendingTotalElements}
            page={pendingPage}
            totalPages={pendingTotalPages}
            onPageChange={goToPendingPage}
          />
        )}

        {activeTab === 'received' && (
          <DeliveryTable
            title=""
            deliveries={received}
            emptyMessage="No received letters match your current search or filter."
            isLoading={isLoading}
            receivingId={receivingId}
            onReceive={handleReceive}
            showAction={false}
            showDeliveryPerson={true}
            count={received.length}
            totalElements={receivedTotalElements}
            page={receivedPage}
            totalPages={receivedTotalPages}
            onPageChange={goToReceivedPage}
          />
        )}
      </div>
    </div>
  );
};

export default ReceptionStaffDashboard;