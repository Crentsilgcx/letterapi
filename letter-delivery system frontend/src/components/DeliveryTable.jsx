import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import Pagination from './Pagination';
import '../tokens.css';
import './DeliveryTable.css';

const COPY_FEEDBACK_MS = 2000;

function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** The backend generates a single identifier per letter in tracking_number. */
function getReference(delivery) {
  return delivery?.trackingNumber || delivery?.referenceNumber || '—';
}

function DeliveryTable({
  deliveries,
  isLoading,
  receivingId,
  onReceive,
  showAction = true,
  totalElements,
  page,
  totalPages,
  onPageChange,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(copyTimeoutRef.current), []);

  const handleCopy = useCallback((reference, rowId) => {
    if (!reference || reference === '—') return;
    navigator.clipboard?.writeText(reference).catch(() => {
      // Clipboard access can be denied; nothing else to report.
    });
    setCopiedId(rowId);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedId(null), COPY_FEEDBACK_MS);
  }, []);

  const handleReceive = useCallback((id) => {
    onReceive(id);
  }, [onReceive]);

  if (isLoading) {
    return <DeliveryTableSkeleton rowCount={5} showAction={showAction} />;
  }

  if (deliveries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="table-container" role="region" aria-label="Deliveries" tabIndex={0}>
        <table className="delivery-table">
          <caption className="visually-hidden">
            Letters {showAction ? 'awaiting receipt' : 'received'}, with recipient, recipient position, reference code and timestamps.
          </caption>
          <thead>
            <tr>
              <th scope="col">Recipient</th>
              <th scope="col">Recipient position</th>
              <th scope="col">Reference / Tracking</th>
              <th scope="col">Delivered</th>
              <th scope="col">Received</th>
              {showAction && <th scope="col" className="cell-action">Action</th>}
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <DeliveryRow
                key={d.id}
                delivery={d}
                receivingId={receivingId}
                onReceive={handleReceive}
                onCopy={handleCopy}
                copiedId={copiedId}
                showAction={showAction}
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}

function DeliveryRow({
  delivery,
  receivingId,
  onReceive,
  onCopy,
  copiedId,
  showAction,
}) {
  const reference = getReference(delivery);
  const recipientName = delivery.recipientName || '—';
  const recipientPosition = delivery.recipientTitle || delivery.recipientName || '—';
  // For letters logged through the current form the backend stores the position
  // in both fields. Repeating it verbatim would read as a bug, so an identical
  // position is de-emphasised instead of duplicated.
  const positionMatchesRecipient =
    recipientPosition.trim().toLowerCase() === recipientName.trim().toLowerCase();

  const deliveredTitle = formatFullDateTime(delivery.deliveredAt);
  const receivedTitle = formatFullDateTime(delivery.receivedAt);

  return (
    <tr data-delivery-id={delivery.id}>
      <td className="cell-recipient">
        <span className="recipient-name">{recipientName}</span>
      </td>
      <td className="cell-position">
        <span className={positionMatchesRecipient ? 'recipient-position-muted' : 'recipient-position'}>
          {recipientPosition}
        </span>
      </td>
      <td className="cell-reference">
        <div className="reference-cell">
          <code className="reference-code">{reference}</code>
          {reference !== '—' && (
            <button
              type="button"
              className="btn-copy"
              onClick={() => onCopy(reference, delivery.id)}
              aria-label={`Copy reference ${reference}`}
              title={copiedId === delivery.id ? 'Copied' : 'Copy reference'}
            >
              {copiedId === delivery.id ? (
                <span className="copy-success" aria-live="polite">Copied</span>
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </td>
      <td className="cell-delivered">
        {/* The visible text is relative for scannability; the full timestamp is
            the accessible description and the tooltip. */}
        <span className="delivered-time" title={deliveredTitle} aria-label={deliveredTitle}>
          {formatRelativeTime(delivery.deliveredAt)}
        </span>
      </td>
      <td className="cell-received">
        {delivery.receivedAt ? (
          <span className="received-pill" title={receivedTitle} aria-label={`Received ${receivedTitle}`}>
            <span className="received-dot" aria-hidden="true" />
            <span>Received</span>
            <span className="received-time">{formatRelativeTime(delivery.receivedAt)}</span>
          </span>
        ) : (
          <span className="received-pending" aria-label="Not yet received">
            —
          </span>
        )}
      </td>
      {showAction && (
        <td className="cell-action">
          <ConfirmReceiptButton
            isProcessing={receivingId === delivery.id}
            reference={reference}
            onClick={() => onReceive(delivery.id)}
          />
        </td>
      )}
    </tr>
  );
}

function ConfirmReceiptButton({ isProcessing, reference, onClick }) {
  return (
    <button
      type="button"
      className={`btn-confirm-receipt${isProcessing ? ' processing' : ''}`}
      onClick={onClick}
      disabled={isProcessing}
      aria-busy={isProcessing}
      aria-label={
        isProcessing
          ? `Confirming receipt of ${reference}`
          : `Confirm receipt of ${reference}`
      }
    >
      {isProcessing ? (
        <>
          <Loader2 size={16} className="spinning" aria-hidden="true" />
          <span>Confirming…</span>
        </>
      ) : (
        <>
          <Check size={16} aria-hidden="true" />
          <span>Confirm receipt</span>
        </>
      )}
    </button>
  );
}

function DeliveryTableSkeleton({ rowCount = 5, showAction = true }) {
  return (
    <div className="table-container" role="status" aria-label="Loading deliveries">
      <table className="delivery-table">
        <thead>
          <tr>
            <th scope="col"><Skeleton width="120" /></th>
            <th scope="col"><Skeleton width="150" /></th>
            <th scope="col"><Skeleton width="160" /></th>
            <th scope="col"><Skeleton width="90" /></th>
            <th scope="col"><Skeleton width="110" /></th>
            {showAction && <th scope="col"><Skeleton width="120" /></th>}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, i) => (
            <tr key={i} className="skeleton-row">
              <td><Skeleton width="120" /></td>
              <td><Skeleton width="150" /></td>
              <td><Skeleton width="160" /></td>
              <td><Skeleton width="80" /></td>
              <td><Skeleton width="90" /></td>
              {showAction && <td><Skeleton width="120" height="40" /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Skeleton({ width = '100%', height = '16px', className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, minWidth: width, minHeight: height }}
      aria-hidden="true"
    />
  );
}

export default DeliveryTable;
