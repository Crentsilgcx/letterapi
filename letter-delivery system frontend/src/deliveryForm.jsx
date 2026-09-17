import { useDeliveryForm } from './hooks/useDeliveryForm';

const DeliveryForm = () => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isCreatingPerson,
    submitMessage,
    recipients,
    organizations,
    deliveryPersons,
    selectedPerson,
    isNewPerson,
    isDuplicateName,
    handleChange,
    handleDeliveryPersonChange,
    handleSubmit,
    handleNewPersonCreated,
  } = useDeliveryForm();

  const showDeliveryPersonFields = isNewPerson || !values.deliveryPersonId;
  const showLetterFields = values.deliveryPersonId && values.deliveryPersonId !== '__new__';

  return (
    <div className="container">
      <div className="form-card">
        <h2 className="card-title">Create Delivery</h2>
        {submitMessage && (
          <div className={`alert alert-${submitMessage.type}`}>{submitMessage.text}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-section delivery-person-section">
            <h3 className="section-title">Delivery Person</h3>
            <div className="field">
              <label htmlFor="deliveryPersonId">Delivery Person *</label>
              <select
                id="deliveryPersonId"
                name="deliveryPersonId"
                value={values.deliveryPersonId}
                onChange={handleDeliveryPersonChange}
                required
                className={isDuplicateName ? 'has-warning' : ''}
              >
                <option value="" disabled>-- Select delivery person --</option>
                {deliveryPersons.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.organizationName && `- ${p.organizationName}`}
                  </option>
                ))}
                <option value="__new__">+ Add new delivery person</option>
              </select>
              {isDuplicateName && (
                <span className="field-warning">
                  ⚠ A delivery person with this name already exists. Please select from the list above.
                </span>
              )}
              {errors.deliveryPersonId && <span className="field-error">{errors.deliveryPersonId}</span>}
            </div>
          </div>

          {showDeliveryPersonFields && (
            <div className="form-section new-person-fields" style={{ animation: 'slideDown 0.2s ease' }}>
              <h3 className="section-title">New Delivery Person Details</h3>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={values.fullName}
                    onChange={handleChange}
                    maxLength={160}
                    placeholder="Enter full name"
                    required
                    disabled={isCreatingPerson}
                    className={isDuplicateName ? 'has-warning' : ''}
                  />
                  {isDuplicateName && (
                    <span className="field-warning">
                      ⚠ This name already exists in the system. Please select the existing delivery person from the dropdown above.
                    </span>
                  )}
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
                    disabled={isCreatingPerson}
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
                    placeholder="email@example.com"
                    disabled={isCreatingPerson}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="field">
                  <label htmlFor="organizationId">Organization</label>
                  <select
                    id="organizationId"
                    name="organizationId"
                    value={values.organizationId}
                    onChange={handleChange}
                    disabled={isCreatingPerson}
                  >
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
                  disabled={isCreatingPerson}
                />
              </div>
            </div>
          )}

          {showLetterFields && (
            <div className="form-section letter-section" style={{ animation: 'slideDown 0.2s ease' }}>
              <h3 className="section-title">Letter Details</h3>
              <div className="field">
                <label htmlFor="recipientId">Recipient *</label>
                <select
                  id="recipientId"
                  name="recipientId"
                  value={values.recipientId}
                  onChange={handleChange}
                  required
                  disabled={isCreatingPerson}
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

              <div className="form-row">
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
                    disabled={isCreatingPerson}
                  />
                  {errors.subject && <span className="field-error">{errors.subject}</span>}
                </div>

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
                    disabled={isCreatingPerson}
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
                  disabled={isCreatingPerson}
                />
                {errors.description && <span className="field-error">{errors.description}</span>}
              </div>
            </div>
          )}

          {!values.deliveryPersonId && (
            <div className="form-hint">
              Please select a delivery person or choose "Add new delivery person" to continue.
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting || isCreatingPerson || isDuplicateName || !values.deliveryPersonId} 
            className="btn btn-primary btn-full"
          >
            {isSubmitting || isCreatingPerson ? 'Creating...' : 'Create Delivery'}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DeliveryForm;