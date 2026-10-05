import { useDeliveryForm } from './hooks/useDeliveryForm';

const DeliveryForm = () => {
  const {
    values,
    errors,
    isSubmitting,
    isCreatingPerson,
    submitMessage,
    recipientRoles,
    deliveryPersons,
    isNewPerson,
    isDuplicateName,
    handleChange,
    handleDeliveryPersonChange,
    handleSubmit,
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
              </div>
            </div>
          )}

          {showLetterFields && (
            <div className="form-section letter-section" style={{ animation: 'slideDown 0.2s ease' }}>
              <h3 className="section-title">Letter Details</h3>
              <div className="field">
                <label htmlFor="recipientRole">Recipient Position *</label>
                <select
                  id="recipientRole"
                  name="recipientRole"
                  value={values.recipientRole}
                  onChange={handleChange}
                  required
                  disabled={isCreatingPerson}
                >
                  <option value="" disabled>Select recipient position</option>
                  {recipientRoles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.recipientRole && <span className="field-error">{errors.recipientRole}</span>}
              </div>

              <div className="field">
                <label htmlFor="organizationName">Organization Name</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={values.organizationName}
                  onChange={handleChange}
                  maxLength={180}
                  placeholder="Organization name (optional)"
                  disabled={isCreatingPerson}
                />
                {errors.organizationName && <span className="field-error">{errors.organizationName}</span>}
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