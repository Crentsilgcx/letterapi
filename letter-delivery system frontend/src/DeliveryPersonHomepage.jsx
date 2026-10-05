import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Mail, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { deliveryApi } from './api';
import { useStomp } from './hooks/useStomp';
import './tokens.css';
import './DeliveryPage.css';

const initialValues = {
  deliveryPersonName: '',
  phone: '',
  email: '',
  organizationName: '',
  recipientPosition: '',
};

const validate = (values) => {
  const errors = {};
  if (!values.deliveryPersonName?.trim()) errors.deliveryPersonName = 'Delivery person name is required';
  if (values.phone && values.phone.length > 60) errors.phone = 'Phone too long (max 60)';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address';
  return errors;
};

const DRAFT_STORAGE_KEY = 'delivery-form-draft';

const loadDraft = () => {
  try {
    const stored = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load draft from sessionStorage:', e);
  }
  return null;
};

const saveDraft = (values) => {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
  } catch (e) {
    console.warn('Failed to save draft to sessionStorage:', e);
  }
};

const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear draft from sessionStorage:', e);
  }
};

function DeliveryPersonHomepage() {
  const [values, setValues] = useState(() => loadDraft() || initialValues);
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
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    saveDraft(newValues);
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
          organizationName: values.organizationName?.trim() || 'Our Office',
          recipientPosition: values.recipientPosition?.trim() || 'Reception',
        };

        const response = await deliveryApi.createDelivery(payload);
      setSubmitMessage({ type: 'success', text: 'Delivery submitted successfully!' });
      setLastSubmittedDeliveryId(response.id);
      setDeliveryStatus('DELIVERED');
      clearDraft();
      setValues(initialValues);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Failed to submit delivery' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="delivery-page">
      <div className="delivery-main">
        <header className="delivery-header">
          <Link to="/" className="delivery-brand">
            <span className="delivery-brand-mark" aria-hidden="true">
              <Mail size={20} />
            </span>
            <span>Letter Delivery</span>
          </Link>
          <h1 className="delivery-title">Delivery Person</h1>
          <p className="delivery-subtitle">Submit a new letter for delivery to reception.</p>
        </header>

        <div className="delivery-card">
          <div className="delivery-card-accent" aria-hidden="true" />
          <div className="delivery-card-body">
            <div className="delivery-card-header">
              <span className="delivery-card-header-icon" aria-hidden="true">
                <Send size={20} />
              </span>
              <div>
                <h2 className="delivery-card-title">Submit a delivery</h2>
                <p className="delivery-card-subtitle">All fields marked with an asterisk are required.</p>
              </div>
            </div>

            {submitMessage && (
              <div className={`delivery-alert delivery-alert-${submitMessage.type}`} role="status" aria-live="polite">
                {submitMessage.type === 'success' ? (
                  <CheckCircle2 size={18} aria-hidden="true" />
                ) : (
                  <span className="delivery-status-dot" aria-hidden="true" />
                )}
                <span>{submitMessage.text}</span>
              </div>
            )}

            {deliveryStatus && (
              <div
                className={`delivery-status${
                  deliveryStatus.toLowerCase() === 'received' ? ' delivery-status-received' : ''
                }`}
                role="status"
                aria-live="polite"
              >
                <span className="delivery-status-dot" aria-hidden="true" />
                <span>
                  Latest delivery status: <strong>{deliveryStatus}</strong>
                  {deliveryStatus === 'RECEIVED' ? ' ✓' : ''}
                </span>
              </div>
            )}

            <form className="delivery-form" onSubmit={handleSubmit} noValidate>
              <section className="delivery-section">
                <h3 className="delivery-section-title">
                  <User size={14} className="delivery-section-icon" aria-hidden="true" />
                  Delivery details
                </h3>

                <div className="delivery-field">
                  <label className="delivery-label" htmlFor="deliveryPersonName">
                    Delivery Person Name <span className="delivery-required">*</span>
                  </label>
                  <div className={`delivery-input-wrap${errors.deliveryPersonName ? ' delivery-input-wrap-invalid' : ''}`}>
                    <User className="delivery-input-icon" size={18} aria-hidden="true" />
                    <input
                      type="text"
                      id="deliveryPersonName"
                      name="deliveryPersonName"
                      className="delivery-input"
                      value={values.deliveryPersonName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter delivery person's name"
                      maxLength={160}
                      aria-required="true"
                      aria-invalid={errors.deliveryPersonName ? 'true' : undefined}
                      autoFocus
                    />
                  </div>
                  {errors.deliveryPersonName && <span className="delivery-error">{errors.deliveryPersonName}</span>}
                </div>
              </section>

              <section className="delivery-section delivery-section--contact">
                <h3 className="delivery-section-title">
                  <Phone size={14} className="delivery-section-icon" aria-hidden="true" />
                  Contact information
                  <span className="delivery-optional">Optional</span>
                </h3>

                <div className="delivery-fields-row">
                  <div className="delivery-field">
                  <label className="delivery-label" htmlFor="phone">
                    Phone <span className="delivery-optional">Optional</span>
                  </label>
                  <div className={`delivery-input-wrap${errors.phone ? ' delivery-input-wrap-invalid' : ''}`}>
                    <Phone className="delivery-input-icon" size={18} aria-hidden="true" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="delivery-input"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Phone number (optional)"
                      maxLength={60}
                      aria-invalid={errors.phone ? 'true' : undefined}
                    />
                  </div>
                  {errors.phone && <span className="delivery-error">{errors.phone}</span>}
                </div>

                <div className="delivery-field">
                  <label className="delivery-label" htmlFor="email">
                    Email <span className="delivery-optional">Optional</span>
                  </label>
                  <div className={`delivery-input-wrap${errors.email ? ' delivery-input-wrap-invalid' : ''}`}>
                    <Mail className="delivery-input-icon" size={18} aria-hidden="true" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="delivery-input"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="delivery@example.com (optional)"
                      maxLength={180}
                      aria-invalid={errors.email ? 'true' : undefined}
                    />
                  </div>
                  {errors.email && <span className="delivery-error">{errors.email}</span>}
                </div>
              </div>
              </section>

              <div className="delivery-actions">
                <button type="submit" disabled={isSubmitting} className="delivery-submit">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="delivery-spinner" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} aria-hidden="true" />
                      Deliver Letter
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryPersonHomepage;