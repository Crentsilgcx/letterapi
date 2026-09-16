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

const ReceptionDashboard = () => {
  const {
    pending,
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
          <a href="/" target="_blank" className="btn btn-secondary btn-small">home</a>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="stats">
          <div className="stat">
            <div className="stat-value">{pending.length}</div>
            <div className="stat-label">Awaiting Receipt</div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : pending.length === 0 ? (
          <div className="empty">No letters are waiting for receipt confirmation.</div>
        ) : (
          <div className="table-wrap">
            <table>
<thead>
                 <tr>
                   <th>Delivered By / From</th>
                   <th>Addressed To</th>
                   <th>Letter</th>
                   <th>Delivered</th>
                   <th>Action</th>
                 </tr>
               </thead>
               <tbody>
                 {pending.map((d) => (
                   <tr key={d.id}>
                     <td>
                       <strong>{d.deliveryPersonName || '—'}</strong><br />
                       <span className="muted">{d.organizationName || '—'}</span>
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
                    <td>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleReceive(d.id)}
                        disabled={receivingId === d.id}
                      >
                        {receivingId === d.id ? 'Confirming...' : 'Confirm Receipt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionDashboard;