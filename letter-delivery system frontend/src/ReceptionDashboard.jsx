import { useReception } from './hooks/useReception';

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

const DeliveryTable = ({ title, deliveries, emptyMessage, isLoading, receivingId, onReceive, showAction = true }) => {
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (deliveries.length === 0) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
    <div className="table-section">
      <h3 className="table-title">{title} <span className="count">({deliveries.length})</span></h3>
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
    </div>
  );
};

const ReceptionDashboard = () => {
  const {
    pending,
    received,
    isLoading,
    error,
    success,
    receivingId,
    handleReceive,
  } = useReception();

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Reception Dashboard</h2>
          <a href="/" target="_blank" className="btn btn-secondary btn-small">Home</a>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="stats">
          <div className="stat">
            <div className="stat-value">{pending.length}</div>
            <div className="stat-label">Awaiting Receipt</div>
          </div>
          <div className="stat">
            <div className="stat-value">{received.length}</div>
            <div className="stat-label">Received</div>
          </div>
        </div>

        <DeliveryTable
          title="Pending Receipt"
          deliveries={pending}
          emptyMessage="No letters are waiting for receipt confirmation."
          isLoading={isLoading}
          receivingId={receivingId}
          onReceive={handleReceive}
          showAction={true}
        />

        <DeliveryTable
          title="Received Letters"
          deliveries={received}
          emptyMessage="No letters have been received yet."
          isLoading={isLoading}
          receivingId={receivingId}
          onReceive={handleReceive}
          showAction={false}
        />
      </div>
    </div>
  );
};

export default ReceptionDashboard;