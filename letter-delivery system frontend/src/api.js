const API_BASE = '/api/public';
const RECEPTION_BASE = '/api/reception';
const ADMIN_BASE = '/api/admin';

// Staff credentials are added by the Vite dev proxy from the project .env (see vite.config.js).

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      // X-Requested-With makes Spring answer 401 without the browser's Basic-auth popup.
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...options.headers },
    });
    if (res.status === 401) {
      throw new Error('Invalid username or password.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      const error = new Error('Network error - API server may not be running');
      error.cause = err;
      throw error;
    }
    throw err;
  }
}

export const deliveryApi = {
  getRecipients: () => fetchJson(`${API_BASE}/recipients`),

  getOrganizations: () => fetchJson(`${API_BASE}/organizations`),

  createOrganization: (data) => fetchJson(`${API_BASE}/organizations`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getDeliveryPersons: (q = '') => fetchJson(`${API_BASE}/delivery-persons?q=${encodeURIComponent(q)}`),

  getRecipientRoles: () => fetchJson(`${API_BASE}/recipient-roles`),

  createDelivery: (data) => fetchJson(`${API_BASE}/deliveries`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  trackDelivery: (trackingNumber) => fetchJson(`${API_BASE}/deliveries/${trackingNumber}`),
};

export const receptionApi = {
  getPending: () => fetchJson(`${RECEPTION_BASE}/deliveries/pending`),
  getReceived: () => fetchJson(`${RECEPTION_BASE}/deliveries/received`),
  getPendingPage: (page = 0, size = 10, q, dateFrom, dateTo, recipientPosition, organization) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.append('q', q);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (recipientPosition) params.append('recipientPosition', recipientPosition);
    if (organization) params.append('organization', organization);
    return fetchJson(`${RECEPTION_BASE}/deliveries/pending/page?${params.toString()}`);
  },
  getReceivedPage: (page = 0, size = 10, q, dateFrom, dateTo, recipientPosition, organization) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.append('q', q);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    if (recipientPosition) params.append('recipientPosition', recipientPosition);
    if (organization) params.append('organization', organization);
    return fetchJson(`${RECEPTION_BASE}/deliveries/received/page?${params.toString()}`);
  },
  getPendingPageRaw: (params, abortSignal) => fetchJson(`${RECEPTION_BASE}/deliveries/pending/page?${params}`, { signal: abortSignal }),
  getReceivedPageRaw: (params, abortSignal) => fetchJson(`${RECEPTION_BASE}/deliveries/received/page?${params}`, { signal: abortSignal }),
  receiveDelivery: (id, remarks) => fetchJson(`${RECEPTION_BASE}/deliveries/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  }),
  getStatistics: () => fetchJson(`${RECEPTION_BASE}/statistics`),
};

export const adminApi = {
  // Authentication
  login: (username, password) => fetchJson(`${ADMIN_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),

  logout: () => fetchJson(`${ADMIN_BASE}/logout`, {
    method: 'POST',
  }),

  checkAuth: () => fetchJson(`${ADMIN_BASE}/me`),

  getDeliveryPeople: () => fetchJson(`${ADMIN_BASE}/delivery-people`),

  createDeliveryPerson: (data) => fetchJson(`${ADMIN_BASE}/delivery-people`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateDeliveryPerson: (id, data) => fetchJson(`${ADMIN_BASE}/delivery-people/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteDeliveryPerson: (id) => fetchJson(`${ADMIN_BASE}/delivery-people/${id}`, {
    method: 'DELETE',
  }),

  // Recipient (Employee) management
  getRecipients: () => fetchJson(`${ADMIN_BASE}/recipients`),

  createRecipient: (data) => fetchJson(`${ADMIN_BASE}/recipients`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateRecipient: (id, data) => fetchJson(`${ADMIN_BASE}/recipients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  toggleRecipient: (recipient) => fetchJson(`${ADMIN_BASE}/recipients/${recipient.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      fullName: recipient.fullName,
      jobTitle: recipient.jobTitle,
      department: recipient.department,
      active: !recipient.active,
      sortOrder: recipient.sortOrder,
    }),
  }),

  // Organization management
  getOrganizations: () => fetchJson(`${ADMIN_BASE}/organizations`),

  createOrganization: (data) => fetchJson(`${ADMIN_BASE}/organizations`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateOrganization: (id, data) => fetchJson(`${ADMIN_BASE}/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  toggleOrganization: (id) => fetchJson(`${ADMIN_BASE}/organizations/${id}/toggle`, {
    method: 'PUT',
  }),
};