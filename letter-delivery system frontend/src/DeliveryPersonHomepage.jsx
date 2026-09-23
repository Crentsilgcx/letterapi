import { useState, useEffect } from 'react';
import { deliveryApi } from './api';
import { useStomp } from './hooks/useStomp';
import { RECIPIENT_POSITIONS } from './constants/recipientPositions';

const initialValues = {
  deliveryPersonName: '',
  phone: '',
  email: '',
  organizationName: '',
  organizationAddress: '',
  recipientPosition: '',
  subject: '',
};

const validate = (values) => {
  const errors = {};
  if (!values.deliveryPersonName?.trim()) errors.deliveryPersonName = 'Delivery person name is required';
  if (values.phone && values.phone.length > 60) errors.phone = 'Phone too long (max 60)';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address';
  if (!values.organizationName?.trim()) errors.organizationName = 'Organization name is required';
  if (values.organizationName && values.organizationName.length > 180) errors.organizationName = 'Organization name too long (max 180 characters)';
  if (values.organizationAddress && values.organizationAddress.length > 250) errors.organizationAddress = 'Organization address too long (max 250 characters)';
  if (!values.recipientPosition) errors.recipientPosition = 'Recipient position is required';
  if (values.subject && values.subject.length > 250) errors.subject = 'Subject too long (max 250 characters)';
  return errors;
};

function DeliveryPersonHomepage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [lastSubmittedDeliveryId, setLastSubmittedDeliveryId] = useState(null);

  const { subscribe } = useStomp();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const newErrors = validate({ ...values, [name]: values[name] });
    if (newErrors[name]) setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate(values);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setDeliveryStatus(null);

    try {
      const payload = {
        fullName: values.deliveryPersonName.trim(),
        phone: values.phone?.trim() || null,
        email: values.email?.trim() || null,
        organizationName: values.organizationName.trim(),
        organizationAddress: values.organizationAddress?.trim() || null,
        recipientPosition: values.recipientPosition,
        subject: values.subject?.trim() || null,
        referenceNumber: null,
        description: `Organization: ${values.organizationName.trim()}\nOrganization Address: ${values.organizationAddress?.trim() || 'N/A'}\nRecipient Position: ${values.recipientPosition}`,
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

            <div className="field">
              <label htmlFor="recipientPosition">Recipient Position *</label>
              <select
                id="recipientPosition"
                name="recipientPosition"
                value={values.recipientPosition || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="" disabled>Select recipient position</option>
                {RECIPIENT_POSITIONS.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.recipientPosition && <span className="field-error">{errors.recipientPosition}</span>}
            </div>
          </div>

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
                placeholder="Phone number (optional)"
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
                placeholder="delivery@example.com (optional)"
                maxLength={180}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="organizationName">Organization Name *</label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                value={values.organizationName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Organization name"
                maxLength={180}
                required
              />
              {errors.organizationName && <span className="field-error">{errors.organizationName}</span>}
            </div>

            <div className="field">
              <label htmlFor="organizationAddress">Organization Address</label>
              <input
                type="text"
                id="organizationAddress"
                name="organizationAddress"
                value={values.organizationAddress}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Organization address (optional)"
                maxLength={250}
              />
              {errors.organizationAddress && <span className="field-error">{errors.organizationAddress}</span>}
            </div>
          </div>

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

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-full">
            {isSubmitting ? 'Submitting...' : 'Deliver Letter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DeliveryPersonHomepage;