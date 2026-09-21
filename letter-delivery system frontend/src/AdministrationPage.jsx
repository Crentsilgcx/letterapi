import { useState, useEffect, useCallback } from 'react';
import { adminApi } from './api';
import { useStomp } from './hooks/useStomp';
import { useAuth } from './AuthContext';

const STATUSES = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

function AdministrationPage() {
  const { user, logout } = useAuth();
  const [recipients, setRecipients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('true'); // Default to active only
  const [showModal, setShowModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    department: '',
    active: true,
    sortOrder: 100,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isConnected, error: wsError } = useStomp();

  const loadRecipients = useCallback(async () => {
    try {
      setError(null);
      const data = await adminApi.getRecipients();
      setRecipients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  // Default to active employees only; inactive can be viewed via filter
  const filteredRecipients = recipients.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.jobTitle && r.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.department && r.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === '' || r.active.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = recipients.filter(r => r.active).length;
  const inactiveCount = recipients.filter(r => !r.active).length;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleOpenModal = (recipient = null) => {
    if (recipient) {
      setEditingRecipient(recipient);
      setFormData({
        fullName: recipient.fullName,
        jobTitle: recipient.jobTitle || '',
        department: recipient.department || '',
        active: recipient.active,
        sortOrder: recipient.sortOrder || 100,
      });
    } else {
      setEditingRecipient(null);
      setFormData({
        fullName: '',
        jobTitle: '',
        department: '',
        active: true,
        sortOrder: 100,
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRecipient(null);
    setFormData({
      fullName: '',
      jobTitle: '',
      department: '',
      active: true,
      sortOrder: 100,
    });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? e.target.checked : value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.length > 160) {
      errors.fullName = 'Full name too long (max 160 characters)';
    }
    if (formData.jobTitle && formData.jobTitle.length > 160) {
      errors.jobTitle = 'Job title too long (max 160 characters)';
    }
    if (formData.department && formData.department.length > 160) {
      errors.department = 'Department too long (max 160 characters)';
    }
    if (formData.sortOrder < 1 || formData.sortOrder > 9999) {
      errors.sortOrder = 'Sort order must be between 1 and 9999';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    clearMessages();

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        jobTitle: formData.jobTitle?.trim() || null,
        department: formData.department?.trim() || null,
        active: formData.active,
        sortOrder: formData.sortOrder,
      };

      if (editingRecipient) {
        await adminApi.updateRecipient(editingRecipient.id, payload);
        setSuccess('Employee updated successfully.');
      } else {
        await adminApi.createRecipient(payload);
        setSuccess('Employee added successfully.');
      }
      handleCloseModal();
      await loadRecipients();
    } catch (err) {
      // Handle duplicate/unique constraint errors
      if (err.message && err.message.includes('already exists')) {
        setError('An employee with this information already exists.');
      } else {
        setError(err.message || 'Failed to save employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (recipient) => {
    clearMessages();
    try {
      await adminApi.toggleRecipient(recipient);
      setSuccess(recipient.active ? 'Employee deactivated.' : 'Employee activated.');
      await loadRecipients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Administration</h2>
            <p className="card-subtitle">Manage employees and organisational information.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Add Employee
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="stats">
          <div className="stat">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Employees</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: '#991b1b' }}>{inactiveCount}</div>
            <div className="stat-label">Inactive</div>
          </div>
          <div className="stat">
            <div className="stat-value" style={{ color: '#166534' }}>{user?.displayName || user?.username}</div>
            <div className="stat-label">Signed in as</div>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: '16px', gap: '16px' }}>
          <div className="field" style={{ flex: 1, minWidth: '280px' }}>
            <label htmlFor="searchEmployees">Search employees</label>
            <input
              type="text"
              id="searchEmployees"
              placeholder="Search by name, role, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '40px' }}
            />
          </div>
          <div className="field" style={{ minWidth: '180px' }}>
            <label htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
              <option value="">All</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Job Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Sort Order</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="loading">Loading employees...</td>
                </tr>
              ) : filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    {recipients.length === 0
                      ? 'No employees registered yet. Click "Add Employee" to get started.'
                      : 'No employees match your search/filters.'}
                  </td>
                </tr>
              ) : (
                filteredRecipients.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.fullName}</strong>
                    </td>
                    <td>{r.jobTitle || <span className="muted">—</span>}</td>
                    <td>{r.department || <span className="muted">—</span>}</td>
                    <td>
                      <span className={`status-badge ${r.active ? 'status-received' : 'status-failed'}`}>
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{r.sortOrder}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-link btn-small"
                          onClick={() => handleOpenModal(r)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`btn btn-link btn-small ${r.active ? '' : ''}`}
                          onClick={() => handleToggle(r)}
                          style={{ color: r.active ? '#dc2626' : '#166534' }}
                        >
                          {r.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRecipient ? 'Edit Employee' : 'Add Employee'}</h3>
              <button type="button" className="modal-close" onClick={handleCloseModal} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p className="form-hint" style={{ marginBottom: '20px', textAlign: 'left' }}>
                  {editingRecipient ? 'Update employee details below.' : 'Register a new employee in the organisation.'}
                </p>
                
                <div className="field">
                  <label htmlFor="fullName">Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    onBlur={() => {
                      if (!formData.fullName?.trim()) {
                        setFormErrors(prev => ({ ...prev, fullName: 'Full name is required' }));
                      }
                    }}
                    maxLength={160}
                    required
                    autoFocus
                  />
                  {formErrors.fullName && <span className="field-error">{formErrors.fullName}</span>}
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="jobTitle">Job Role</label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleFormChange}
                      maxLength={160}
                      placeholder="e.g. HR Manager"
                    />
                    {formErrors.jobTitle && <span className="field-error">{formErrors.jobTitle}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="department">Department</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleFormChange}
                      maxLength={160}
                      placeholder="e.g. Human Resources"
                    />
                    {formErrors.department && <span className="field-error">{formErrors.department}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="sortOrder">Sort Order</label>
                    <input
                      type="number"
                      id="sortOrder"
                      name="sortOrder"
                      value={formData.sortOrder}
                      onChange={handleFormChange}
                      onBlur={() => {
                        if (formData.sortOrder < 1 || formData.sortOrder > 9999) {
                          setFormErrors(prev => ({ ...prev, sortOrder: 'Sort order must be between 1 and 9999' }));
                        }
                      }}
                      min={1}
                      max={9999}
                    />
                    {formErrors.sortOrder && <span className="field-error">{formErrors.sortOrder}</span>}
                  </div>
                  <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%' }}>
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleFormChange}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingRecipient ? 'Update Employee' : 'Add Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdministrationPage;