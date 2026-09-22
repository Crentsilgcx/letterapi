import { useState, useEffect } from 'react';
import { deliveryApi } from './api';
import { useStomp } from './hooks/useStomp';

const NEW_DELIVERY_PERSON_ID = '__new__';
const NEW_ORGANIZATION_ID = '__new_org__';

const initialValues = {
  deliveryPersonId: '',
  deliveryPersonName: '',
  recipientId: '',
  organizationId: '',
  organizationName: '',
  phone: '',
  email: '',
  subject: '',
};

const isNewDeliveryPerson = (id) => id === NEW_DELIVERY_PERSON_ID;
const isNewOrganization = (id) => id === NEW_ORGANIZATION_ID;

const validate = (values, isNewPerson, isNewOrg) => {
  const errors = {};
  if (!values.deliveryPersonId) errors.deliveryPersonId = 'Delivery person is required';
  if (isNewPerson) {
    if (!values.deliveryPersonName?.trim()) errors.deliveryPersonName = 'Delivery person name is required';
    if (values.phone && values.phone.length > 60) errors.phone = 'Phone too long (max 60)';
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address';
  }
  if (!values.recipientId) errors.recipientId = 'Recipient is required';
  if (!values.organizationId) errors.organizationId = 'Organization is required';
  if (isNewOrg && !values.organizationName?.trim()) errors.organizationName = 'Organization name is required';
  if (isNewOrg && values.organizationName && values.organizationName.length > 180) errors.organizationName = 'Organization name too long (max 180 characters)';
  if (values.subject && values.subject.length > 250) errors.subject = 'Subject too long (max 250 characters)';
  return errors;
};

function DeliveryPersonHomepage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [lastSubmittedDeliveryId, setLastSubmittedDeliveryId] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgFormData, setOrgFormData] = useState({ name: '', active: true });
  const [orgFormErrors, setOrgFormErrors] = useState({});
  const [isOrgSubmitting, setIsOrgSubmitting] = useState(false);

  const { subscribe } = useStomp();

  useEffect(() => {
    deliveryApi.getRecipients()
      .then(setRecipients)
      .catch(() => {});
    deliveryApi.getOrganizations()
      .then(setOrganizations)
      .catch(() => {});
    deliveryApi.getDeliveryPersons()
      .then(setDeliveryPersons)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!lastSubmittedDeliveryId) return;

    const unsubscribe = subscribe('/topic/deliveries', (event) => {
      const { type, deliveryId, status } = event;
      
      if (type === 'DELIVERY_STATUS_CHANGED' && deliveryId === lastSubmittedDeliveryId) {
        setDeliveryStatus(status);
        if (status === 'RECEIVED') {
          setSubmitMessage({ 
            type: 'success', 
            text: `Delivery confirmed as RECEIVED` 
          });
        }
      }
    });

    return unsubscribe;
  }, [lastSubmittedDeliveryId, subscribe]);

  const selectedPerson = deliveryPersons.find(p => p.id === Number(values.deliveryPersonId));
  const selectedOrg = organizations.find(o => o.id === Number(values.organizationId));
  const isNewPerson = isNewDeliveryPerson(values.deliveryPersonId);
  const isNewOrg = isNewOrganization(values.organizationId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    
    // When selecting an existing delivery person, clear personal info fields
    // and auto-select their organization
    if (name === 'deliveryPersonId' && !isNewDeliveryPerson(value)) {
      setValues(prev => ({ ...prev, deliveryPersonName: '', phone: '', email: '' }));
      
      const person = deliveryPersons.find(p => p.id === Number(value));
      if (person?.organizationName) {
        const org = organizations.find(o => o.name === person.organizationName);
        if (org) {
          setValues(prev => ({ ...prev, organizationId: String(org.id), organizationName: '' }));
        }
      }
    }
    // When selecting an existing organization, clear organization name field
    if (name === 'organizationId' && !isNewOrganization(value)) {
      setValues(prev => ({ ...prev, organizationName: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const newErrors = validate({ ...values, [name]: values[name] }, isNewDeliveryPerson(values.deliveryPersonId), isNewOrganization(values.organizationId));
    if (newErrors[name]) setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
  };

  const handleOrgChange = (e) => {
    const { name, value, type } = e.target;
    setOrgFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? e.target.checked : value }));
    if (orgFormErrors[name]) {
      setOrgFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateOrgForm = () => {
    const errors = {};
    if (!orgFormData.name?.trim()) {
      errors.name = 'Organization name is required';
    } else if (orgFormData.name.length > 180) {
      errors.name = 'Organization name too long (max 180 characters)';
    }
    setOrgFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    if (!validateOrgForm()) return;

    setIsOrgSubmitting(true);
    setOrgFormErrors({});

    try {
      const payload = {
        name: orgFormData.name.trim(),
        active: orgFormData.active,
      };
      await deliveryApi.createOrganization(payload);
      setShowOrgModal(false);
      setOrgFormData({ name: '', active: true });
      setOrgFormErrors({});
      // Refresh organizations list
      const data = await deliveryApi.getOrganizations();
      setOrganizations(data);
      // Select the newly created organization
      const newOrg = data.find(o => o.name.toLowerCase() === payload.name.toLowerCase());
      if (newOrg) {
        setValues(prev => ({ ...prev, organizationId: String(newOrg.id) }));
      }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        setOrgFormErrors({ name: 'Organization already exists.' });
      } else {
        setOrgFormErrors({ name: err.message || 'Failed to create organization' });
      }
    } finally {
      setIsOrgSubmitting(false);
    }
  };

  const handleOrgModalOpen = () => {
    setOrgFormData({ name: '', active: true });
    setOrgFormErrors({});
    setShowOrgModal(true);
  };

  const handleOrgModalClose = () => {
    setShowOrgModal(false);
    setOrgFormData({ name: '', active: true });
    setOrgFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isNew = isNewDeliveryPerson(values.deliveryPersonId);
    const isNewOrg = isNewOrganization(values.organizationId);
    const newErrors = validate(values, isNew, isNewOrg);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setDeliveryStatus(null);

    try {
      let organization;
      if (isNewOrg) {
        // Use the new organization name entered by the user
        const orgName = values.organizationName.trim();
        const existingOrg = organizations.find(o => o.name.toLowerCase() === orgName.toLowerCase());
        if (existingOrg) {
          organization = existingOrg;
        } else {
          // Create the organization via API
          const created = await deliveryApi.createOrganization({ name: orgName, active: true });
          organization = created;
          // Refresh organizations list
          const data = await deliveryApi.getOrganizations();
          setOrganizations(data);
        }
      } else {
        organization = organizations.find(o => o.id === Number(values.organizationId));
      }
      const deliveryPerson = isNew ? null : deliveryPersons.find(p => p.id === Number(values.deliveryPersonId));
      const selectedRecipient = recipients.find(r => r.id === Number(values.recipientId));

      const payload = {
        deliveryPersonId: deliveryPerson ? deliveryPerson.id : null,
        fullName: isNew ? values.deliveryPersonName : (deliveryPerson ? deliveryPerson.name : null),
        phone: isNew ? (values.phone || null) : null,
        email: isNew ? (values.email || null) : null,
        organizationId: organization?.id || null,
        organizationName: organization?.name || values.organisation || '',
        recipientId: Number(values.recipientId),
        subject: values.subject.trim(),
        referenceNumber: null,
        description: `Organization: ${organization?.name || ''}\nRecipient: ${selectedRecipient?.name || ''}${selectedRecipient?.title ? ' — ' + selectedRecipient.title : ''}${selectedRecipient?.department ? ' (' + selectedRecipient.department + ')' : ''}`,
      };

      const response = await deliveryApi.createDelivery(payload);
      setSubmitMessage({ type: 'success', text: 'Delivery submitted successfully!' });
      setLastSubmittedDeliveryId(response.id);
      setDeliveryStatus('DELIVERED');
      setValues(initialValues);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Failed to submit delivery' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Delivery Person</h2>
          <p className="card-subtitle">Submit a new delivery</p>
        </div>

        {submitMessage && (
          <div className={`alert alert-${submitMessage.type}`}>{submitMessage.text}</div>
        )}

        {deliveryStatus && (
          <div className={`status-indicator status-${deliveryStatus.toLowerCase()}`}>
            Latest delivery status: <strong>{deliveryStatus}</strong>
            {deliveryStatus === 'RECEIVED' && ' ✓'}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="deliveryPersonId">Delivery Person *</label>
              <select
                id="deliveryPersonId"
                name="deliveryPersonId"
                value={values.deliveryPersonId}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="" disabled>Select delivery person</option>
                <option value={NEW_DELIVERY_PERSON_ID}>+ New Delivery Person</option>
                {deliveryPersons.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.organizationName && `- ${p.organizationName}`}
                  </option>
                ))}
              </select>
              {errors.deliveryPersonId && <span className="field-error">{errors.deliveryPersonId}</span>}
            </div>

            <div className="field">
              <label htmlFor="recipientId">Recipient *</label>
              {recipients.length === 0 ? (
                <>
                  <select
                    id="recipientId"
                    name="recipientId"
                    disabled
                    required
                  >
                    <option value="" disabled selected>
                      No recipients configured - add them in Administration
                    </option>
                  </select>
                  <span className="field-error">
                    No recipients available. Please add recipients in the Administration panel first.
                  </span>
                </>
              ) : (
                <>
                  <select
                    id="recipientId"
                    name="recipientId"
                    value={values.recipientId || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="" disabled>Select recipient</option>
                    {recipients.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.title && `— ${r.title}`} {r.department && `(${r.department})`}
                      </option>
                    ))}
                  </select>
                  {errors.recipientId && <span className="field-error">{errors.recipientId}</span>}
                </>
              )}
            </div>
          </div>

          {isNewPerson && (
            <div className="form-row new-person-fields">
              <div className="field">
                <label htmlFor="deliveryPersonName">Delivery Person Name *</label>
                <input
                  type="text"
                  id="deliveryPersonName"
                  name="deliveryPersonName"
                  value={values.deliveryPersonName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter delivery person's name"
                  maxLength={160}
                  required
                  autoFocus
                />
                {errors.deliveryPersonName && <span className="field-error">{errors.deliveryPersonName}</span>}
              </div>
            </div>
          )}

          {!isNewPerson && selectedPerson && (
            <div className="existing-person-info">
              <div className="info-badge">
                <span className="badge-label">Existing Delivery Person</span>
                <span className="badge-value">
                  <strong>{selectedPerson.name}</strong>
                  {selectedPerson.organizationName && ` - ${selectedPerson.organizationName}`}
                  {selectedPerson.phone && ` - ${selectedPerson.phone}`}
                  {selectedPerson.email && ` - ${selectedPerson.email}`}
                </span>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="field">
              <label htmlFor="organizationId">Organization *</label>
              <select
                id="organizationId"
                name="organizationId"
                value={values.organizationId}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="" disabled>Select organization</option>
                <option value={NEW_ORGANIZATION_ID}>+ Add New Organization</option>
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {errors.organizationId && <span className="field-error">{errors.organizationId}</span>}
            </div>
          </div>

          {isNewOrg && (
            <div className="form-row new-person-fields">
              <div className="field">
                <label htmlFor="organizationName">Organization Name *</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={values.organizationName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter organization name"
                  maxLength={180}
                  required
                  autoFocus
                />
                {errors.organizationName && <span className="field-error">{errors.organizationName}</span>}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="field">
              <label htmlFor="subject">Letter Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={values.subject}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter letter subject (optional)"
                maxLength={250}
              />
              {errors.subject && <span className="field-error">{errors.subject}</span>}
            </div>
          </div>

          {isNewPerson && (
            <div className="form-row">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Delivery person phone number"
                  maxLength={60}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="delivery@example.com"
                  maxLength={180}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-full">
            {isSubmitting ? 'Submitting...' : 'Delivered'}
          </button>
        </form>

        {showOrgModal && (
          <div className="modal-overlay" onClick={handleOrgModalClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Organization</h3>
                <button type="button" className="modal-close" onClick={handleOrgModalClose} aria-label="Close">×</button>
              </div>
              <form onSubmit={handleOrgSubmit}>
                <div className="modal-body">
                  <p className="form-hint" style={{ marginBottom: '20px', textAlign: 'left' }}>
                    Register a new organization for the delivery.
                  </p>
                  
                  <div className="field">
                    <label htmlFor="orgName">Organization Name <span style={{ color: '#dc2626' }}>*</span></label>
                    <input
                      type="text"
                      id="orgName"
                      name="name"
                      value={orgFormData.name}
                      onChange={handleOrgChange}
                      onBlur={() => {
                        if (!orgFormData.name?.trim()) {
                          setOrgFormErrors(prev => ({ ...prev, name: 'Organization name is required' }));
                        }
                      }}
                      maxLength={180}
                      required
                      autoFocus
                      placeholder="e.g. ABC Logistics"
                    />
                    {orgFormErrors.name && <span className="field-error">{orgFormErrors.name}</span>}
                  </div>

                  <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%' }}>
                      <input
                        type="checkbox"
                        name="active"
                        checked={orgFormData.active}
                        onChange={handleOrgChange}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleOrgModalClose} disabled={isOrgSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isOrgSubmitting}>
                    {isOrgSubmitting ? 'Adding...' : 'Add Organization'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryPersonHomepage;