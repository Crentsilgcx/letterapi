import { useDeliveryForm } from './hooks/useDeliveryForm';

const DeliveryForm = () => {
  const {
    values,
    errors,
    isSubmitting,
    submitMessage,
    recipients,
    organizations,
    deliveryPersons,
    handleChange,
    handleSubmit,
  } = useDeliveryForm();

  return (
    <div className="container">
      <div className="form-card">
        <h2 className="card-title">Create Delivery</h2>
        {submitMessage && (
          <div className={`alert alert-${submitMessage.type}`}>{submitMessage.text}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="recipientId">Recipient *</label>
              <select
                id="recipientId"
                name="recipientId"
                value={values.recipientId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select recipient</option>
                {recipients.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.title && `(${r.title})`} {r.department && `- ${r.department}`}
                  </option>
                ))}
              </select>
              {errors.recipientId && <span className="field-error">{errors.recipientId}</span>}
            </div>

            <div className="field">
              <label htmlFor="deliveryPersonId">Delivery Person</label>
              <select id="deliveryPersonId" name="deliveryPersonId" value={values.deliveryPersonId} onChange={handleChange}>
                <option value="" disabled>Select delivery person (optional)</option>
                {deliveryPersons.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.organizationName && `- ${p.organizationName}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="fullName">Sender Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={values.fullName}
                onChange={handleChange}
                maxLength={160}
                placeholder="Sender full name"
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                maxLength={60}
                placeholder="Phone number"
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                maxLength={180}
                placeholder="sender@example.com"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="organizationId">Organization</label>
              <select id="organizationId" name="organizationId" value={values.organizationId} onChange={handleChange}>
                <option value="" disabled>Select organization (optional)</option>
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="organizationName">Organization Name (if not in list)</label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              value={values.organizationName}
              onChange={handleChange}
              maxLength={180}
              placeholder="Organization name"
            />
          </div>

          <div className="field">
            <label htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={values.subject}
              onChange={handleChange}
              maxLength={250}
              required
              placeholder="Delivery subject"
            />
            {errors.subject && <span className="field-error">{errors.subject}</span>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="referenceNumber">Reference Number</label>
              <input
                type="text"
                id="referenceNumber"
                name="referenceNumber"
                value={values.referenceNumber}
                onChange={handleChange}
                maxLength={120}
                placeholder="Optional reference"
              />
              {errors.referenceNumber && <span className="field-error">{errors.referenceNumber}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              maxLength={5000}
              rows={4}
              placeholder="Additional details..."
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Creating...' : 'Create Delivery'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeliveryForm;