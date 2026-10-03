import { useState, useEffect, useCallback } from 'react';
import { Building2, LogOut, Plus, Search, Users } from 'lucide-react';
import { adminApi } from './api';
import { useAuth } from './AuthContext';
import './tokens.css';
import './AdministrationPage.css';

const STATUSES = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

function AdministrationPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'organizations'
  
  // Employee state
  const [recipients, setRecipients] = useState([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  
  // Organization state
  const [organizations, setOrganizations] = useState([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  
  // Shared state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('true');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    department: '',
    active: true,
    name: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRecipients = useCallback(async () => {
    try {
      setError(null);
      const data = await adminApi.getRecipients();
      setRecipients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    try {
      setError(null);
      const data = await adminApi.getOrganizations();
      setOrganizations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingOrganizations(false);
    }
  }, []);

  useEffect(() => {
    // Call async loaders inside an async IIFE to avoid synchronous setState calls
    (async () => {
      await loadRecipients();
      await loadOrganizations();
    })();
  }, [loadRecipients, loadOrganizations]);

  const filteredRecipients = recipients.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.jobTitle && r.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.department && r.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === '' || r.active.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOrganizations = organizations.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || r.active.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeRecipientCount = recipients.filter(r => r.active).length;
  const inactiveRecipientCount = recipients.filter(r => !r.active).length;
  const activeOrgCount = organizations.filter(r => r.active).length;
  const inactiveOrgCount = organizations.filter(r => !r.active).length;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      if (activeTab === 'employees') {
        setFormData({
          fullName: item.fullName,
          jobTitle: item.jobTitle || '',
          department: item.department || '',
          active: item.active,
          name: '',
        });
      } else {
        setFormData({
          fullName: '',
          jobTitle: '',
          department: '',
          active: item.active,
          name: item.name,
        });
      }
    } else {
      setEditingItem(null);
      setFormData({
        fullName: '',
        jobTitle: '',
        department: '',
        active: true,
        name: '',
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      fullName: '',
      jobTitle: '',
      department: '',
      active: true,
      name: '',
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
    if (activeTab === 'employees') {
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
    } else {
      if (!formData.name?.trim()) {
        errors.name = 'Organization name is required';
      } else if (formData.name.length > 180) {
        errors.name = 'Organization name too long (max 180 characters)';
      }
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
      if (activeTab === 'employees') {
        const payload = {
          fullName: formData.fullName.trim(),
          jobTitle: formData.jobTitle?.trim() || null,
          department: formData.department?.trim() || null,
          active: formData.active,
        };

        if (editingItem) {
          await adminApi.updateRecipient(editingItem.id, payload);
          setSuccess('Employee updated successfully.');
        } else {
          await adminApi.createRecipient(payload);
          setSuccess('Employee added successfully.');
        }
        await loadRecipients();
      } else {
        const payload = {
          name: formData.name.trim(),
          active: formData.active,
        };

        if (editingItem) {
          await adminApi.updateOrganization(editingItem.id, payload);
          setSuccess('Organization updated successfully.');
        } else {
          await adminApi.createOrganization(payload);
          setSuccess('Organization added successfully.');
        }
        await loadOrganizations();
      }
      handleCloseModal();
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        setError(activeTab === 'employees' 
          ? 'An employee with this name already exists. This delivery person is already registered in the system.'
          : 'Organization already exists.');
      } else {
        setError(err.message || `Failed to save ${activeTab === 'employees' ? 'employee' : 'organization'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item) => {
    clearMessages();
    try {
      if (activeTab === 'employees') {
        await adminApi.toggleRecipient(item);
        setSuccess(item.active ? 'Employee deactivated.' : 'Employee activated.');
        await loadRecipients();
      } else {
        await adminApi.toggleOrganization(item.id);
        setSuccess(item.active ? 'Organization deactivated.' : 'Organization activated.');
        await loadOrganizations();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const currentIsLoading = activeTab === 'employees' ? isLoadingRecipients : isLoadingOrganizations;
  const currentFiltered = activeTab === 'employees' ? filteredRecipients : filteredOrganizations;
  const activeCount = activeTab === 'employees' ? activeRecipientCount : activeOrgCount;
  const inactiveCount = activeTab === 'employees' ? inactiveRecipientCount : inactiveOrgCount;
  const totalCount = activeTab === 'employees' ? recipients.length : organizations.length;

  const entityLabel = activeTab === 'employees' ? 'employee' : 'organization';
  const entityPlural = activeTab === 'employees' ? 'employees' : 'organizations';

  return (
    <div className="admin-page">
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-content">
            <div className="admin-header-text">
              <h1 className="admin-title">Administration</h1>
              <p className="admin-subtitle">Manage employees and organisational information.</p>
            </div>
            <div className="admin-header-actions">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => handleOpenModal()}
              >
                <Plus size={18} aria-hidden="true" />
                Add {activeTab === 'employees' ? 'Employee' : 'Organization'}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleLogout}
              >
                <LogOut size={18} aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {(success || error) && (
          <div className="admin-messages">
            {success && (
              <div className="admin-alert admin-alert-success" role="status" aria-live="polite">
                {success}
              </div>
            )}
            {error && (
              <div className="admin-alert admin-alert-error" role="alert" aria-live="assertive">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="admin-tabs" role="tablist" aria-label="Administration sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'employees'}
            className={`admin-tab${activeTab === 'employees' ? ' admin-tab-active' : ''}`}
            onClick={() => { setActiveTab('employees'); setSearchQuery(''); setStatusFilter('true'); }}
          >
            <Users size={16} aria-hidden="true" />
            <span>Employees</span>
            <span className="admin-tab-count">{recipients.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'organizations'}
            className={`admin-tab${activeTab === 'organizations' ? ' admin-tab-active' : ''}`}
            onClick={() => { setActiveTab('organizations'); setSearchQuery(''); setStatusFilter('true'); }}
          >
            <Building2 size={16} aria-hidden="true" />
            <span>Organizations</span>
            <span className="admin-tab-count">{organizations.length}</span>
          </button>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat-value">{activeCount}</div>
            <div className="admin-stat-label">Active</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-value admin-stat-value--inactive">{inactiveCount}</div>
            <div className="admin-stat-label">Inactive</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-value admin-stat-value--text">{user?.displayName || user?.username}</div>
            <div className="admin-stat-label">Signed in as</div>
          </div>
        </div>

        <div className="admin-filters">
          <div className="admin-search">
            <label className="admin-field-label" htmlFor="searchEntities">
              Search {entityPlural}
            </label>
            <input
              type="text"
              id="searchEntities"
              className="admin-input"
              placeholder={`Search by ${activeTab === 'employees' ? 'name, role, or department' : 'name'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="admin-search-icon" size={18} aria-hidden="true" />
          </div>
          <div className="admin-field-group">
            <label className="admin-field-label" htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              className="admin-select"
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

        <div className="admin-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {activeTab === 'employees' ? (
                    <>
                      <th scope="col">Employee</th>
                      <th scope="col">Job Role</th>
                      <th scope="col">Department</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </>
                  ) : (
                    <>
                      <th scope="col">Organization</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentIsLoading ? (
                  <tr>
                    <td colSpan={activeTab === 'employees' ? 5 : 3}>
                      <div className="admin-table-state">
                        <span className="admin-loading">
                          <span className="admin-spinner" />
                          Loading {entityPlural}...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : currentFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'employees' ? 5 : 3}>
                      <div className="admin-empty">
                        <span className="admin-empty-icon" aria-hidden="true">
                          {activeTab === 'employees'
                            ? <Users size={26} />
                            : <Building2 size={26} />}
                        </span>
                        <h3 className="admin-empty-title">
                          {totalCount === 0
                            ? `No ${entityPlural} registered yet`
                            : `No ${entityLabel}s match your search`}
                        </h3>
                        <p className="admin-empty-message">
                          {totalCount === 0
                            ? `Click "Add ${activeTab === 'employees' ? 'Employee' : 'Organization'}" to register the first one.`
                            : 'Try a different search term or status filter.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentFiltered.map(r => (
                    <tr key={r.id} className="admin-row">
                      {activeTab === 'employees' ? (
                        <>
                          <td className="admin-cell-primary">{r.fullName}</td>
                          <td>{r.jobTitle || <span className="admin-cell-muted">—</span>}</td>
                          <td>{r.department || <span className="admin-cell-muted">—</span>}</td>
                          <td>
                            <span className={`admin-status ${r.active ? 'admin-status-active' : 'admin-status-inactive'}`}>
                              <span className="admin-status-dot" aria-hidden="true" />
                              {r.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-cell-actions">
                              <button
                                type="button"
                                className="admin-row-action"
                                onClick={() => handleOpenModal(r)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`admin-row-action${r.active ? ' admin-row-action--danger' : ''}`}
                                onClick={() => handleToggle(r)}
                              >
                                {r.active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="admin-cell-primary">{r.name}</td>
                          <td>
                            <span className={`admin-status ${r.active ? 'admin-status-active' : 'admin-status-inactive'}`}>
                              <span className="admin-status-dot" aria-hidden="true" />
                              {r.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-cell-actions">
                              <button
                                type="button"
                                className="admin-row-action"
                                onClick={() => handleOpenModal(r)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`admin-row-action${r.active ? ' admin-row-action--danger' : ''}`}
                                onClick={() => handleToggle(r)}
                              >
                                {r.active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <span className="admin-modal-title-icon" aria-hidden="true">
                  {activeTab === 'employees' ? <Users size={18} /> : <Building2 size={18} />}
                </span>
                {editingItem
                  ? `Edit ${activeTab === 'employees' ? 'Employee' : 'Organization'}`
                  : `Add ${activeTab === 'employees' ? 'Employee' : 'Organization'}`}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <p className="admin-modal-hint">
                  {editingItem
                    ? `Update ${entityLabel} details below.`
                    : `Register a new ${entityLabel} in the organisation.`}
                </p>

                {activeTab === 'employees' ? (
                  <>
                    <div className="admin-modal-field">
                      <label className="admin-modal-label" htmlFor="fullName">
                        Full Name <span className="admin-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="admin-input"
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
                      {formErrors.fullName && <span className="admin-field-error">{formErrors.fullName}</span>}
                    </div>

                    <div className="admin-modal-row">
                      <div className="admin-modal-field">
                        <label className="admin-modal-label" htmlFor="jobTitle">Job Role</label>
                        <input
                          type="text"
                          id="jobTitle"
                          name="jobTitle"
                          className="admin-input"
                          value={formData.jobTitle}
                          onChange={handleFormChange}
                          maxLength={160}
                          placeholder="e.g. HR Manager"
                        />
                        {formErrors.jobTitle && <span className="admin-field-error">{formErrors.jobTitle}</span>}
                      </div>
                      <div className="admin-modal-field">
                        <label className="admin-modal-label" htmlFor="department">Department</label>
                        <input
                          type="text"
                          id="department"
                          name="department"
                          className="admin-input"
                          value={formData.department}
                          onChange={handleFormChange}
                          maxLength={160}
                          placeholder="e.g. Human Resources"
                        />
                        {formErrors.department && <span className="admin-field-error">{formErrors.department}</span>}
                      </div>
                    </div>

                    <div className="admin-checkbox-row">
                      <label className="admin-checkbox-label" htmlFor="active-employee">
                        <input
                          type="checkbox"
                          id="active-employee"
                          name="active"
                          className="admin-checkbox"
                          checked={formData.active}
                          onChange={handleFormChange}
                        />
                        <span>Active</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="admin-modal-field">
                      <label className="admin-modal-label" htmlFor="name">
                        Organization Name <span className="admin-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="admin-input"
                        value={formData.name}
                        onChange={handleFormChange}
                        onBlur={() => {
                          if (!formData.name?.trim()) {
                            setFormErrors(prev => ({ ...prev, name: 'Organization name is required' }));
                          }
                        }}
                        maxLength={180}
                        required
                        autoFocus
                        placeholder="e.g. ABC Logistics"
                      />
                      {formErrors.name && <span className="admin-field-error">{formErrors.name}</span>}
                    </div>

                    <div className="admin-checkbox-row">
                      <label className="admin-checkbox-label" htmlFor="active-organization">
                        <input
                          type="checkbox"
                          id="active-organization"
                          name="active"
                          className="admin-checkbox"
                          checked={formData.active}
                          onChange={handleFormChange}
                        />
                        <span>Active</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingItem
                      ? `Update ${activeTab === 'employees' ? 'Employee' : 'Organization'}`
                      : `Add ${activeTab === 'employees' ? 'Employee' : 'Organization'}`}
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