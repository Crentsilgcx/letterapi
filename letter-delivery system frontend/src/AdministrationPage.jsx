import { useState, useEffect, useCallback } from 'react';
import { adminApi } from './api';
import { useAuth } from './AuthContext';

const STATUSES = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

function AdministrationPage({ initialTab }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'employees'); // 'employees' | 'organizations'
  
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
    loadRecipients();
    loadOrganizations();
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
  const recipientCount = recipients.length;
  const organizationCount = organizations.length;

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
              + Add {activeTab === 'employees' ? 'Employee' : 'Organization'}
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="tab-nav" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('employees'); setSearchQuery(''); setStatusFilter('true'); }}
          >
            Employees ({recipientCount})
          </button>
          <button
            className={`btn ${activeTab === 'organizations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('organizations'); setSearchQuery(''); setStatusFilter('true'); }}
          >
            Organizations ({organizationCount})
          </button>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-value" style={{ color: '#166534' }}>{activeCount}</div>
            <div className="stat-label">Active</div>
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
            <label htmlFor="searchEmployees">Search {activeTab === 'employees' ? 'employees' : 'organizations'}</label>
            <input
              type="text"
              id="searchEmployees"
              placeholder={`Search by ${activeTab === 'employees' ? 'name, role, or department' : 'name'}...`}
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
                {activeTab === 'employees' ? (
                  <>
                    <th>Employee</th>
                    <th>Job Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </>
                ) : (
                  <>
                    <th>Organization</th>
                    <th>Status</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentIsLoading ? (
                <tr>
                  <td colSpan={activeTab === 'employees' ? 5 : 3} className="loading">
                    Loading {activeTab === 'employees' ? 'employees' : 'organizations'}...
                  </td>
                </tr>
              ) : currentFiltered.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'employees' ? 5 : 3} className="empty">
                    {(activeTab === 'employees' ? recipientCount : organizationCount) === 0
                      ? `No ${activeTab === 'employees' ? 'employees' : 'organizations'} registered yet. Click "Add ${activeTab === 'employees' ? 'Employee' : 'Organization'}" to get started.`
                      : 'No results match your search/filters.'}
                  </td>
                </tr>
              ) : (
                currentFiltered.map(r => (
                  <tr key={r.id}>
                    {activeTab === 'employees' ? (
                      <>
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
                              className="btn btn-link btn-small"
                              onClick={() => handleToggle(r)}
                              style={{ color: r.active ? '#dc2626' : '#166534' }}
                            >
                              {r.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <strong>{r.name}</strong>
                        </td>
                        <td>
                          <span className={`status-badge ${r.active ? 'status-received' : 'status-failed'}`}>
                            {r.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
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
                              className="btn btn-link btn-small"
                              onClick={() => handleToggle(r)}
                              style={{ color: r.active ? '#dc2626' : '#166534' }}
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

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? `Edit ${activeTab === 'employees' ? 'Employee' : 'Organization'}` : `Add ${activeTab === 'employees' ? 'Employee' : 'Organization'}`}</h3>
              <button type="button" className="modal-close" onClick={handleCloseModal} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p className="form-hint" style={{ marginBottom: '20px', textAlign: 'left' }}>
                  {editingItem 
                    ? `Update ${activeTab === 'employees' ? 'employee' : 'organization'} details below.`
                    : `Register a new ${activeTab === 'employees' ? 'employee' : 'organization'} in the organisation.`}
                </p>
                
                {activeTab === 'employees' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="field">
                      <label htmlFor="name">Organization Name <span style={{ color: '#dc2626' }}>*</span></label>
                      <input
                        type="text"
                        id="name"
                        name="name"
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
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
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
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingItem ? `Update ${activeTab === 'employees' ? 'Employee' : 'Organization'}` : `Add ${activeTab === 'employees' ? 'Employee' : 'Organization'}`)}
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