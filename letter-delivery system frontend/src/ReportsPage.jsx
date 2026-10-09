import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Copy, Download, FileText, Loader2, RotateCcw, Search, SearchX, X } from 'lucide-react';
import { receptionApi } from './api';
import Pagination from './components/Pagination';
import { RECIPIENT_FILTER_OPTIONS } from './constants/recipientRoles';
import './tokens.css';
import './ReportsPage.css';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 150;
const COPY_FEEDBACK_MS = 2000;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DELIVERED', label: 'Awaiting receipt' },
  { value: 'RECEIVED', label: 'Received' },
];

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const STATUS_PRESENTATION = {
  RECEIVED: { label: 'Received', tone: 'received' },
  DELIVERED: { label: 'Awaiting receipt', tone: 'awaiting' },
};

const EXPORT_OPTIONS = [
  { type: 'csv', label: 'CSV', extension: 'csv' },
  { type: 'excel', label: 'Excel', extension: 'xlsx' },
];

function getDateRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: today.toISOString().split('T')[0], to: tomorrow.toISOString().split('T')[0] };
    }
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { from: weekStart.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: monthStart.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    default:
      return { from: '', to: '' };
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAppliedDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).split('T')[0];
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function describeAppliedRange(filters) {
  const from = formatAppliedDate(filters?.dateFrom);
  const to = formatAppliedDate(filters?.dateTo);
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return 'All time';
}

function statusPresentation(status) {
  return STATUS_PRESENTATION[status] || { label: status, tone: 'neutral' };
}

function getReference(record) {
  return record?.trackingNumber || record?.referenceNumber || '—';
}

function toUserMessage(err, action) {
  const raw = (err && err.message) || '';
  const noun = action === 'export' ? 'export' : 'report';

  if (/network error/i.test(raw)) {
    return `We could not reach the server to build the ${noun}. Check your connection and try again.`;
  }
  if (/invalid username or password/i.test(raw)) {
    return 'Your session is no longer valid. Sign in again to continue.';
  }
  if (/^export failed/i.test(raw)) {
    return 'That export could not be created. Please try again.';
  }
  if (/request failed: 5\d\d|internal server error/i.test(raw)) {
    return `The service is temporarily unavailable, so the ${noun} could not be created. Please try again in a moment.`;
  }
  return `Something went wrong while building the ${noun}. Please try again.`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function matchesReportSearch(record, query) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    (record.recipientName ?? '').toLowerCase().includes(needle) ||
    (record.recipientTitle ?? '').toLowerCase().includes(needle) ||
    (record.trackingNumber ?? '').toLowerCase().includes(needle) ||
    (record.referenceNumber ?? '').toLowerCase().includes(needle) ||
    (record.deliveryPersonName ?? '').toLowerCase().includes(needle)
  );
}

function ReportSkeleton() {
  return (
    <div className="report-skeleton" aria-hidden="true">
      <div className="report-skeleton-head">
        <span className="report-skeleton-bar" style={{ width: '160px', height: '18px' }} />
        <span className="report-skeleton-bar" style={{ width: '240px', height: '14px' }} />
      </div>
      {Array.from({ length: 8 }, (_, row) => (
        <div className="report-skeleton-row" key={row}>
          <span className="report-skeleton-bar" style={{ width: '130px' }} />
          <span className="report-skeleton-bar" style={{ width: '150px' }} />
          <span className="report-skeleton-bar" style={{ width: '160px' }} />
          <span className="report-skeleton-bar" style={{ width: '110px' }} />
          <span className="report-skeleton-bar" style={{ width: '110px' }} />
          <span className="report-skeleton-bar" style={{ width: '100px' }} />
        </div>
      ))}
    </div>
  );
}

const ReportsPage = () => {
  const [datePreset, setDatePreset] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState('');

  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const copyTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(copyTimeoutRef.current);
    clearTimeout(searchTimeoutRef.current);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setCurrentPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchInput]);

  const buildFilters = useCallback(() => ({
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    recipientPosition: recipient || null,
    status: status || null,
  }), [dateFrom, dateTo, recipient, status]);

  const handleDatePresetChange = useCallback((value) => {
    setDatePreset(value);
    if (value) {
      const { from, to } = getDateRange(value);
      setDateFrom(from);
      setDateTo(to);
    }
  }, []);

  const handleDateFromChange = useCallback((value) => {
    setDateFrom(value);
    setDatePreset('');
  }, []);

  const handleDateToChange = useCallback((value) => {
    setDateTo(value);
    setDatePreset('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setError(null);
    setIsGenerating(true);
    try {
      const data = await receptionApi.generateReport(buildFilters());
      setReportData(data);
      setCurrentPage(0);
    } catch (err) {
      console.error('[record] report generation failed', err);
      setError(toUserMessage(err, 'generate'));
      setReportData(null);
      setCurrentPage(0);
    } finally {
      setIsGenerating(false);
    }
  }, [buildFilters, isGenerating]);

  const handleExport = useCallback(async (type) => {
    if (isExporting) return;
    setError(null);
    setIsExporting(type);
    try {
      const filters = buildFilters();
      const extension = EXPORT_OPTIONS.find((option) => option.type === type)?.extension ?? type;
      const filename = `incoming-letter-record-${new Date().toISOString().slice(0, 10)}.${extension}`;

      let blob;
      if (type === 'csv') {
        blob = await receptionApi.exportCsv(filters);
      } else if (type === 'excel') {
        blob = await receptionApi.exportExcel(filters);
      }
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('[record] export failed', err);
      setError(toUserMessage(err, 'export'));
    } finally {
      setIsExporting(null);
    }
  }, [buildFilters, isExporting]);

  const handleResetFilters = useCallback(() => {
    setDatePreset('');
    setDateFrom('');
    setDateTo('');
    setRecipient('');
    setStatus('');
    setError(null);
  }, []);

  const handleDismissError = useCallback(() => setError(null), []);

  const handleCopy = useCallback((reference, key) => {
    if (!reference || reference === '—') return;
    navigator.clipboard?.writeText(reference).catch(() => {});
    setCopiedKey(key);
    clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedKey(null), COPY_FEEDBACK_MS);
  }, []);

  const records = useMemo(
    () => (reportData && Array.isArray(reportData.records) ? reportData.records : []),
    [reportData]
  );

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesReportSearch(record, searchQuery)),
    [records, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const visibleRecords = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const totalRecords = reportData && typeof reportData.totalRecords === 'number'
    ? reportData.totalRecords
    : records.length;
  const appliedRange = describeAppliedRange(
    reportData && reportData.filters ? reportData.filters : { dateFrom, dateTo }
  );
  const hasReportData = records.length > 0;

  return (
    <div className="reports-page">
      <main className="reports-main" role="main">
        <header className="reports-header">
          <h1 className="reports-title">Record</h1>
          <p className="reports-subtitle">
            The full letter register. Choose filters, generate the report, then export it.
          </p>
        </header>

        <div className="reports-container">
          <section className="report-panel report-filters-panel" aria-labelledby="report-filters-title">
            <h2 className="report-panel-title" id="report-filters-title">Filters</h2>
            <p className="report-panel-hint">
              These filters are applied on the server when the report is generated.
            </p>

            <div className="report-field-group">
              <span className="report-field-label" id="report-date-range-label">Date range</span>
              <div className="report-preset-track" role="group" aria-labelledby="report-date-range-label">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`report-preset${datePreset === preset.value ? ' active' : ''}`}
                    aria-pressed={datePreset === preset.value}
                    onClick={() => handleDatePresetChange(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="report-date-pair">
                <div className="report-field">
                  <label className="report-field-label" htmlFor="report-date-from">From</label>
                  <input
                    type="date"
                    id="report-date-from"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="report-control"
                  />
                </div>
                <div className="report-field">
                  <label className="report-field-label" htmlFor="report-date-to">To</label>
                  <input
                    type="date"
                    id="report-date-to"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="report-control"
                  />
                </div>
              </div>
            </div>

            <div className="report-field-group report-field-group--grid">
              <div className="report-field">
                <label className="report-field-label" htmlFor="report-recipient">Recipient</label>
                <select
                  id="report-recipient"
                  className="report-control"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                >
                  {RECIPIENT_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="report-field">
                <label className="report-field-label" htmlFor="report-status">Status</label>
                <select
                  id="report-status"
                  className="report-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="report-actions">
              <button
                type="button"
                className="report-generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="report-spin" size={20} aria-hidden="true" />
                    <span>Generating report</span>
                  </>
                ) : (
                  <>
                    <FileText size={20} aria-hidden="true" />
                    <span>Generate report</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="report-reset-btn"
                onClick={handleResetFilters}
                disabled={isGenerating}
              >
                <RotateCcw size={16} aria-hidden="true" />
                <span>Reset filters</span>
              </button>
            </div>
          </section>

          <section className="report-panel report-results-panel" aria-label="Report results">
            <div className="report-results-area" aria-live="polite" aria-busy={isGenerating}>
              {isGenerating && (
                <>
                  <span className="visually-hidden">Generating report</span>
                  <ReportSkeleton />
                </>
              )}

              {!isGenerating && error && (
                <div className="report-error" role="alert">
                  <AlertCircle size={20} aria-hidden="true" />
                  <div className="report-error-body">
                    <p className="report-error-title">We could not build that report</p>
                    <p className="report-error-message">{error}</p>
                  </div>
                  <button
                    type="button"
                    className="report-error-close"
                    onClick={handleDismissError}
                    aria-label="Dismiss error"
                    title="Dismiss error"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              )}

              {!isGenerating && !error && !reportData && (
                <div className="report-empty">
                  <span className="report-empty-mark" aria-hidden="true">
                    <FileText size={24} />
                  </span>
                  <h3 className="report-empty-title">No report yet</h3>
                  <p className="report-empty-text">Choose a date range and filters, then generate a report.</p>
                </div>
              )}

              {!isGenerating && !error && reportData && !hasReportData && (
                <div className="report-empty">
                  <span className="report-empty-mark report-empty-mark--warning" aria-hidden="true">
                    <SearchX size={24} />
                  </span>
                  <h3 className="report-empty-title">No letters match these filters</h3>
                  <p className="report-empty-text">Try a wider date range or reset the filters.</p>
                </div>
              )}

              {!isGenerating && !error && hasReportData && (
                <>
                  <div className="report-results-header">
                    <div className="report-results-heading">
                      <h2 className="report-results-title">Report results</h2>
                      <p className="report-results-range">
                        {appliedRange}
                        {reportData.generatedAt && (
                          <span className="report-results-generated">
                            Generated {formatDateTime(reportData.generatedAt)}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="report-export-bar" role="group" aria-label="Export report">
                      {EXPORT_OPTIONS.map(({ type, label }) => (
                        <button
                          key={type}
                          type="button"
                          className="report-export-btn"
                          onClick={() => handleExport(type)}
                          disabled={isExporting !== null}
                          aria-label={`Export report as ${label}`}
                          title={`Exports every letter matching the server-side filters, not the in-report search`}
                        >
                          {isExporting === type ? (
                            <Loader2 className="report-spin" size={16} aria-hidden="true" />
                          ) : (
                            <Download size={16} aria-hidden="true" />
                          )}
                          <span>{isExporting === type ? 'Exporting' : label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="report-search-row">
                    <label htmlFor="record-search" className="report-search-label">
                      Search this report
                    </label>
                    <div className="search-field">
                      <Search className="search-icon" size={18} aria-hidden="true" />
                      <input
                        type="search"
                        id="record-search"
                        className="filter-input"
                        placeholder="Reference, recipient, delivered by, or tracking number"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        aria-describedby="record-search-hint"
                      />
                    </div>
                    <p className="report-search-hint" id="record-search-hint">
                      Filters the rows already loaded in this report only. Exports always use the server-side filters above.
                    </p>
                  </div>

                  <div className="report-summary">
                    <div className="report-summary-box">
                      <span className="report-summary-label">Total letters</span>
                      <span className="report-summary-value">{totalRecords}</span>
                    </div>
                    <div className="report-summary-box">
                      <span className="report-summary-label">Shown</span>
                      <span className="report-summary-value">{filteredRecords.length}</span>
                    </div>
                    <div className="report-summary-box">
                      <span className="report-summary-label">Date range</span>
                      <span className="report-summary-value report-summary-value--text">{appliedRange}</span>
                    </div>
                  </div>

                  {filteredRecords.length === 0 ? (
                    <div className="report-empty">
                      <span className="report-empty-mark report-empty-mark--warning" aria-hidden="true">
                        <SearchX size={24} />
                      </span>
                      <h3 className="report-empty-title">Nothing matches your search</h3>
                      <p className="report-empty-text">
                        Clear the search box to see all {records.length} letters in this report.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="report-table-wrap">
                        <table className="report-table">
<caption className="visually-hidden">
                            Incoming letter record for {appliedRange}, {filteredRecords.length} letters shown
                          </caption>
<thead>
                             <tr>
                               <th scope="col">Reference</th>
                               <th scope="col">Delivered By</th>
                               <th scope="col">Recipient</th>
                               <th scope="col">Date</th>
                               <th scope="col">Status</th>
                             </tr>
                           </thead>
<tbody>
                             {visibleRecords.map((record, index) => {
                               const reference = getReference(record);
                               const statusMeta = statusPresentation(record.status);
                               const rowKey = record.id ?? `${record.trackingNumber}-${index}`;

                               return (
                                 <tr key={rowKey}>
                                   <td className="report-cell">
                                     <div className="reference-cell">
                                       <code className="reference-code">{reference}</code>
                                       {reference !== '—' && (
                                         <button
                                           type="button"
                                           className="btn-copy"
                                           onClick={() => handleCopy(reference, rowKey)}
                                           aria-label={`Copy reference ${reference}`}
                                           title={copiedKey === rowKey ? 'Copied' : 'Copy reference'}
                                         >
                                           {copiedKey === rowKey ? (
                                             <span className="copy-success" aria-live="polite">Copied</span>
                                           ) : (
                                             <Copy size={16} aria-hidden="true" />
                                           )}
                                         </button>
                                       )}
                                     </div>
                                   </td>
                                   <td className="report-cell">{record.deliveryPersonName || '—'}</td>
                                   <td className="report-cell">{record.recipientTitle || '—'}</td>
                                   <td className="report-cell report-cell--delivered">{formatDateTime(record.deliveredAt)}</td>
                                   <td className="report-cell report-cell--status">
                                     <span className={`report-status-pill report-status-pill--${statusMeta.tone}`}>
                                       {statusMeta.label}
                                     </span>
                                   </td>
                                 </tr>
                               );
                             })}
                           </tbody>
                        </table>
                      </div>

                      {filteredRecords.length > PAGE_SIZE && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalElements={filteredRecords.length}
                          onPageChange={setCurrentPage}
                          pageSize={PAGE_SIZE}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;