(() => {
  const form = document.getElementById('deliveryForm');
  if (!form) return;
  const personSelect = document.getElementById('deliveryPersonId');
  const newPerson = document.getElementById('newPersonFields');
  const contactFields = document.getElementById('contactFields');
  const orgSelect = document.getElementById('organizationId');
  const newOrg = document.getElementById('newOrganizationField');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const fullName = document.getElementById('fullName');
  const orgName = document.getElementById('organizationName');
  const submit = document.getElementById('submitDelivery');
  const result = document.getElementById('deliveryResult');
  const error = document.getElementById('deliveryError');

  const syncPerson = () => {
    const option = personSelect.options[personSelect.selectedIndex];
    const existing = personSelect.value !== '';
    newPerson.classList.toggle('hidden', existing);
    contactFields.classList.toggle('hidden', existing);
    fullName.required = !existing;
    if (existing) {
      phone.value = '';
      email.value = '';
      if (option.dataset.orgId && [...orgSelect.options].some(o => o.value === option.dataset.orgId)) {
        orgSelect.value = option.dataset.orgId;
        syncOrg();
      }
    }
  };
  const syncOrg = () => {
    const isOther = orgSelect.value === 'other';
    newOrg.classList.toggle('hidden', !isOther);
    orgName.required = isOther;
  };
  personSelect.addEventListener('change', syncPerson);
  orgSelect.addEventListener('change', syncOrg);
  syncPerson();
  syncOrg();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.classList.add('hidden');
    result.classList.add('hidden');
    submit.disabled = true;
    form.classList.add('loading');
    const blankToNull = (value) => {
      if (value == null) return null;
      const trimmed = String(value).trim();
      return trimmed === '' ? null : trimmed;
    };
    const existingPerson = personSelect.value ? Number(personSelect.value) : null;
    const existingOrg = orgSelect.value && orgSelect.value !== 'other' ? Number(orgSelect.value) : null;
    const payload = {
      deliveryPersonId: existingPerson,
      fullName: existingPerson ? personSelect.options[personSelect.selectedIndex].dataset.name : fullName.value,
      phone: existingPerson ? null : blankToNull(phone.value),
      email: existingPerson ? null : blankToNull(email.value),
      organizationId: existingOrg,
      organizationName: existingOrg ? null : blankToNull(orgName.value),
      recipientId: Number(document.getElementById('recipientId').value),
      subject: document.getElementById('subject').value,
      referenceNumber: blankToNull(document.getElementById('referenceNumber').value),
      description: blankToNull(document.getElementById('description').value)
    };
    try {
      const response = await fetch('/api/public/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || Object.values(data.errors || {}).join(', ') || 'Could not submit delivery.');
      }
      document.getElementById('resultTracking').textContent = data.trackingNumber;
      document.getElementById('resultRecipient').textContent = [data.recipientName, data.recipientTitle].filter(Boolean).join(' — ');
      document.getElementById('resultTime').textContent = new Date(data.deliveredAt).toLocaleString();
      document.getElementById('resultTrackLink').href = '/track/' + encodeURIComponent(data.trackingNumber);
      result.classList.remove('hidden');
      result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.reset();
      personSelect.value = '';
      orgSelect.value = '';
      syncPerson();
      syncOrg();
    } catch (err) {
      error.textContent = err.message;
      error.classList.remove('hidden');
      error.scrollIntoView({ behavior: 'smooth' });
    } finally {
      submit.disabled = false;
      form.classList.remove('loading');
    }
  });
})();
