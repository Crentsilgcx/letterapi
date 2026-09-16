const API_BASE = '/api/public';
const RECEPTION_BASE = '/api/reception';

const RECEPTION_AUTH = btoa('admin:SecureAdminPassword123');

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
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

  getDeliveryPersons: (q = '') => fetchJson(`${API_BASE}/delivery-persons?q=${encodeURIComponent(q)}`),

  createDelivery: (data) => fetchJson(`${API_BASE}/deliveries`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const receptionApi = {
  getPending: () => fetchJson(`${RECEPTION_BASE}/deliveries/pending`, {
    headers: { Authorization: `Basic ${RECEPTION_AUTH}` },
  }),
  receiveDelivery: (id, remarks) => fetchJson(`${RECEPTION_BASE}/deliveries/${id}/receive`, {
    method: 'POST',
    headers: { Authorization: `Basic ${RECEPTION_AUTH}` },
    body: JSON.stringify({ remarks }),
  }),
};