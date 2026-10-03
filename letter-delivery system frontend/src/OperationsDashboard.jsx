import { useOperations } from './hooks/useOperationsContext';

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
              <th>Date</th>
              {showDeliveryPerson && <th>Delivery Person</th>}
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
                <td className="nowrap">
                  {d.deliveredAt ? formatDateShort(d.deliveredAt) : '—'}
                </td>
                {showDeliveryPerson && (
                  <td>
                    <span className="muted">{d.deliveryPersonName || '—'}</span>
                  </td>
                )}
                {showAction && (
                  <td>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => onReceive(d.id)}
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
              {showDeliveryPerson && (
                <div className="delivery-card-row">
                  <span className="delivery-card-label">Delivery Person:</span>
                  <span className="delivery-card-value"><span className="muted">{d.deliveryPersonName || '—'}</span></span>
                </div>
              )}
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
    </div>
  );
};

const SearchFilterBar = ({ searchQuery, onSearchChange, dateFilter, onDateFilterChange, customDateFrom, customDateTo, onCustomDateFromChange, onCustomDateToChange, showCustomDate, totalElements }) => {
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
        <label htmlFor="searchReceived" className="visually-hidden">Search received letters</label>
        <input
          type="text"
          id="searchReceived"
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
      </div>
    </div>
  );
};

const OperationsDashboard = () => {
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
  } = useOperations();

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Operations</h2>
            <p className="card-subtitle">Manage incoming deliveries and receipt confirmations</p>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="stats">
          <div className="stat">
            <div className="stat-value">{pendingTotalElements}</div>
            <div className="stat-label">Pending Receipt</div>
          </div>
          <div className="stat">
            <div className="stat-value">{receivedTodayCount}</div>
            <div className="stat-label">Received Today</div>
          </div>
          <div className="stat">
            <div className="stat-value">{receivedTotalElements}</div>
            <div className="stat-label">Received Total</div>
          </div>
        </div>

        <div className="tab-nav" role="tablist">
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            role="tab"
            aria-selected={activeTab === 'pending'}
          >
            Pending ({pendingTotalElements})
          </button>
          <button
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
            role="tab"
            aria-selected={activeTab === 'received'}
          >
            Received ({receivedTotalElements})
          </button>
        </div>

        {activeTab === 'pending' && (
          <DeliveryTable
            title="Pending Letters"
            deliveries={pending}
            emptyMessage="No letters are waiting for receipt confirmation."
            isLoading={isLoading}
            receivingId={receivingId}
            onReceive={handleReceive}
            showAction={true}
            showDeliveryPerson={false}
            count={pending.length}
            totalElements={pendingTotalElements}
            page={pendingPage}
            totalPages={pendingTotalPages}
            onPageChange={goToPendingPage}
          />
        )}

        {activeTab === 'received' && (
          <>
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
              totalElements={receivedTotalElements}
            />
            <DeliveryTable
              title="Received Letters / Recent Activity"
              deliveries={received}
              emptyMessage="No letters have been received yet."
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
          </>
        )}
      </div>
    </div>
  );
};

export default OperationsDashboard;