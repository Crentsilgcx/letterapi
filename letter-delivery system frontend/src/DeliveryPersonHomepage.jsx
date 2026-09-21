import { useState, useEffect } from 'react';
import { deliveryApi } from './api';
import { useStomp } from './hooks/useStomp';

const NEW_DELIVERY_PERSON_ID = '__new__';

const initialValues = {
  deliveryPersonId: '',
  deliveryPersonName: '',
  recipientId: '',
  organisation: '',
  phone: '',
  email: '',
};

const isNewDeliveryPerson = (id) => id === NEW_DELIVERY_PERSON_ID;

const validate = (values, isNewPerson) => {
  const errors = {};
  if (!values.deliveryPersonId) errors.deliveryPersonId = 'Delivery person is required';
  if (isNewPerson) {
    if (!values.deliveryPersonName?.trim()) errors.deliveryPersonName = 'Delivery person name is required';
    if (values.phone && values.phone.length > 60) errors.phone = 'Phone too long (max 60)';
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address';
  }
  if (!values.recipientId) errors.recipientId = 'Recipient is required';
  if (!values.organisation) errors.organisation = 'Organisation is required';
  return errors;
};

const ConnectionStatus = ({ isConnected, wsError }) => (
  <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
    <span className="status-dot" />
    <span>{isConnected ? 'Real-time connected' : 'Real-time disconnected'}</span>
    {wsError && <span className="ws-error"> ({wsError})</span>}
  </div>
);

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

  const { isConnected, error: wsError, subscribe } = useStomp();

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
    if (!lastSubmittedDeliveryId || !isConnected) return;

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
  }, [lastSubmittedDeliveryId, isConnected, subscribe]);

  const selectedPerson = deliveryPersons.find(p => p.id === Number(values.deliveryPersonId));
  const isNewPerson = isNewDeliveryPerson(values.deliveryPersonId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    
    // When selecting an existing delivery person, clear personal info fields
    if (name === 'deliveryPersonId' && !isNewDeliveryPerson(value)) {
      setValues(prev => ({ ...prev, deliveryPersonName: '', phone: '', email: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const newErrors = validate({ ...values, [name]: values[name] }, isNewDeliveryPerson(values.deliveryPersonId));
    if (newErrors[name]) setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isNew = isNewDeliveryPerson(values.deliveryPersonId);
    const newErrors = validate(values, isNew);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setDeliveryStatus(null);

    try {
      const organization = organizations.find(o => o.name === values.organisation) || organizations[0];
      const deliveryPerson = isNew ? null : deliveryPersons.find(p => p.id === Number(values.deliveryPersonId));

      const selectedRecipient = recipients.find(r => r.id === Number(values.recipientId));
      const payload = {
        deliveryPersonId: deliveryPerson ? deliveryPerson.id : null,
        fullName: isNew ? values.deliveryPersonName : (deliveryPerson ? deliveryPerson.name : null),
        phone: isNew ? (values.phone || null) : null,
        email: isNew ? (values.email || null) : null,
        organizationId: organization?.id || null,
        organizationName: values.organisation,
        recipientId: Number(values.recipientId),
        subject: `Delivery to ${selectedRecipient?.name || 'Recipient'}`,
        referenceNumber: null,
        description: `Organisation: ${values.organisation}\nRecipient: ${selectedRecipient?.name || ''}${selectedRecipient?.title ? ' — ' + selectedRecipient.title : ''}${selectedRecipient?.department ? ' (' + selectedRecipient.department + ')' : ''}`,
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
          <ConnectionStatus isConnected={isConnected} wsError={wsError} />
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
              <label htmlFor="organisation">Organisation *</label>
              <input type="text" name="organisation" id="organisation" 
                value={values.organisation}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter organisation name"
                maxLength={160}
                required
              />
              {errors.organisation && <span className="field-error">{errors.organisation}</span>}
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

        <div className="home-actions" style={{ marginTop: '24px' }}>
        </div>
      </div>
    </div>
  );
}

export default DeliveryPersonHomepage;