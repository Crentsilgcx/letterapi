import { useState, useEffect } from 'react';
import { adminApi } from '../api';

const NewDeliveryPersonModal = ({ isOpen, onClose, onSuccess, organizations, deliveryPersons }) => {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    organizationId: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ fullName: '', phone: '', email: '', organizationId: '' });
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (submitError) setSubmitError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (form.fullName && form.fullName.length > 160) newErrors.fullName = 'Name too long (max 160)';
    if (form.phone && form.phone.length > 60) newErrors.phone = 'Phone too long (max 60)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (form.email && form.email.length > 180) newErrors.email = 'Email too long (max 180)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone || null,
        email: form.email || null,
        organizationId: form.organizationId ? Number(form.organizationId) : null,
      };
      await adminApi.createDeliveryPerson(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isDuplicateName = deliveryPersons.some(
    p => p.fullName?.toLowerCase() === form.fullName?.toLowerCase() && form.fullName
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Delivery Person</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {submitError && <div className="alert alert-error">{submitError}</div>}
            
            <div className="field">
              <label htmlFor="dp-fullName">Full Name *</label>
              <input
                type="text"
                id="dp-fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                maxLength={160}
                placeholder="Enter full name"
                required
                disabled={isSubmitting}
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              {isDuplicateName && (
                <span className="field-warning">⚠ A delivery person with this name already exists</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="dp-phone">Phone</label>
              <input
                type="tel"
                id="dp-phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={60}
                placeholder="Phone number"
                disabled={isSubmitting}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <div className="field">
              <label htmlFor="dp-email">Email</label>
              <input
                type="email"
                id="dp-email"
                name="email"
                value={form.email}
                onChange={handleChange}
                maxLength={180}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="dp-organizationId">Organization</label>
              <select
                id="dp-organizationId"
                name="organizationId"
                value={form.organizationId}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="" disabled>Select organization (optional)</option>
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !validate() || isDuplicateName}>
              {isSubmitting ? 'Creating...' : 'Create Delivery Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDeliveryPersonModal;