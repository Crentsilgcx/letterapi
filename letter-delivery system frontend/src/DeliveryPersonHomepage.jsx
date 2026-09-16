import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deliveryApi } from './api';


const JOB_ROLES = [
  'CEO',
  'CTO',
  'CFO',
  'COO',
  'Managing Director',
  'Director',
  'Manager',
  'Supervisor',
  'HR Manager',
  'Administrator',
];

const initialValues = {
  deliveryPersonName: '',
  recipientJobRole: '',
  organisation: '',
  phone: '',
  email: '',
  from: '',
  to: '',
};

const validate = (values) => {
  const errors = {};
  if (!values.deliveryPersonName?.trim()) errors.deliveryPersonName = 'Delivery person name is required';
  if (!values.recipientJobRole) errors.recipientJobRole = 'Recipient job role is required';
  if (!values.organisation) errors.organisation = 'Organisation is required';
  if (!values.from?.trim()) errors.from = 'From address is required';
  if (!values.to?.trim()) errors.to = 'To address is required';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address';
  return errors;
};

function DeliveryPersonHomepage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    deliveryApi.getRecipients()
      .then(setRecipients)
      .catch(() => {});
    deliveryApi.getOrganizations()
      .then(setOrganizations)
      .catch(() => {});
  }, []);

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

    try {
      const recipient = recipients.find(r => r.title === values.recipientJobRole) || recipients[0];
      const organization = organizations.find(o => o.name === values.organisation) || organizations[0];

      const payload = {
        deliveryPersonId: null,
        fullName: values.deliveryPersonName,
        phone: values.phone || null,
        email: values.email || null,
        organizationId: organization?.id || null,
        organizationName: values.organisation,
        recipientId: recipient?.id || 1,
        subject: `Delivery to ${values.recipientJobRole} - ${values.from} to ${values.to}`,
        referenceNumber: null,
        description: `From: ${values.from}\nTo: ${values.to}`,
      };

      await deliveryApi.createDelivery(payload);
      setSubmitMessage({ type: 'success', text: 'Delivery submitted successfully!' });
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

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="deliveryPersonName">Delivery Person Name</label>
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
              />
              {errors.deliveryPersonName && <span className="field-error">{errors.deliveryPersonName}</span>}
            </div>

            <div className="field">
              <label htmlFor="recipientJobRole">Recipient Job Role *</label>
              <select
                id="recipientJobRole"
                name="recipientJobRole"
                value={values.recipientJobRole}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              >
                <option value="" disabled>Select job role</option>
                {JOB_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {errors.recipientJobRole && <span className="field-error">{errors.recipientJobRole}</span>}
            </div>
          </div>

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

          <div className="form-row">
            <div className="field">
              <label htmlFor="from">From *</label>
              <input
                type="text"
                id="from"
                name="from"
                value={values.from}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Sender address/location"
                maxLength={250}
                required
              />
              {errors.from && <span className="field-error">{errors.from}</span>}
            </div>

            <div className="field">
              <label htmlFor="to">To *</label>
              <input
                type="text"
                id="to"
                name="to"
                value={values.to}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Recipient address/location"
                maxLength={250}
                required
              />
              {errors.to && <span className="field-error">{errors.to}</span>}
            </div>
          </div>

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