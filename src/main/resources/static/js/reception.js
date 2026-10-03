(() => {
  const csrfToken = window.csrfToken || '';
  const csrfHeader = window.csrfHeader || 'X-CSRF-TOKEN';
  let stompClient = null;
  let currentTab = 'awaiting';
  let awaitingPage = 0;
  let receivedPage = 0;
  const pageSize = 10;
  let awaitingFilters = { q: '', recipientPosition: '', organization: '', dateFrom: '', dateTo: '' };
  let receivedFilters = { q: '', recipientPosition: '', organization: '', dateFrom: '', dateTo: '' };
  let awaitingTotalPages = 1;
  let receivedTotalPages = 1;
  let isLoadingAwaiting = false;
  let isLoadingReceived = false;
  const highlightDuration = 3000;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tabAwaiting = document.getElementById('tab-awaiting');
  const tabReceived = document.getElementById('tab-received');
  const panelAwaiting = document.getElementById('panel-awaiting');
  const panelReceived = document.getElementById('panel-received');
  const awaitingTbody = document.getElementById('awaitingTbody');
  const receivedTbody = document.getElementById('receivedTbody');
  const awaitingEmpty = document.getElementById('awaitingEmpty');
  const receivedEmpty = document.getElementById('receivedEmpty');
  const awaitingPagination = document.getElementById('awaitingPagination');
  const receivedPagination = document.getElementById('receivedPagination');
  const awaitingPageInfo = document.getElementById('awaitingPageInfo');
  const receivedPageInfo = document.getElementById('receivedPageInfo');
  const filterForm = document.getElementById('filterForm');
  const searchInput = document.getElementById('searchInput');
  const recipientPositionFilter = document.getElementById('recipientPositionFilter');
  const organizationFilter = document.getElementById('organizationFilter');
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const tabCountAwaiting = document.getElementById('tabCountAwaiting');
  const tabCountReceived = document.getElementById('tabCountReceived');
  const awaitingCountEl = document.getElementById('awaitingCount');
  const deliveredTodayCountEl = document.getElementById('deliveredTodayCount');
  const receivedTodayCountEl = document.getElementById('receivedTodayCount');

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateStr;
    }
  }

  function formatDateOnly(dateStr) {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  function createSkeletonRow(cols) {
    const tr = document.createElement('tr');
    tr.className = 'skeleton-row';
    for (let i = 0; i < cols; i++) {
      const td = document.createElement('td');
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton';
      td.appendChild(skeleton);
      tr.appendChild(td);
    }
    return tr;
  }

  function showSkeletonRows(tbody, count, cols) {
    tbody.innerHTML = '';
    for (let i = 0; i < count; i++) {
      tbody.appendChild(createSkeletonRow(cols));
    }
  }

  function updateEmptyState(tbody, emptyEl, hasData) {
    if (hasData) {
      emptyEl.classList.add('hidden');
      tbody.parentElement.style.display = '';
    } else {
      emptyEl.classList.remove('hidden');
      tbody.parentElement.style.display = 'none';
    }
  }

  function updatePagination(paginationEl, pageInfoEl, currentPage, totalPages, onPrev, onNext) {
    if (totalPages <= 1) {
      paginationEl.hidden = true;
      return;
    }
    paginationEl.hidden = false;
    pageInfoEl.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    const prevBtn = paginationEl.querySelector('[data-page="prev"]');
    const nextBtn = paginationEl.querySelector('[data-page="next"]');
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    prevBtn.onclick = onPrev;
    nextBtn.onclick = onNext;
  }

  function buildQueryParams(filters, page) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', pageSize);
    if (filters.q) params.set('q', filters.q);
    if (filters.recipientPosition) params.set('recipientPosition', filters.recipientPosition);
    if (filters.organization) params.set('organization', filters.organization);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    return params;
  }

  async function fetchAwaiting(page = 0) {
    if (isLoadingAwaiting) return;
    isLoadingAwaiting = true;
    showSkeletonRows(awaitingTbody, 5, 5);
    awaitingEmpty.classList.add('hidden');
    awaitingPagination.hidden = true;

    try {
      const params = buildQueryParams(awaitingFilters, page);
      const response = await fetch(`/api/reception/deliveries/pending/page?${params.toString()}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to load awaiting receipt letters');
      const data = await response.json();
      awaitingPage = data.page;
      awaitingTotalPages = data.totalPages;
      renderAwaitingTable(data.content);
      updatePagination(awaitingPagination, awaitingPageInfo, data.page, data.totalPages, () => fetchAwaiting(page - 1), () => fetchAwaiting(page + 1));
      updateTabCounts();
    } catch (err) {
      console.error('Error loading awaiting receipt:', err);
      awaitingTbody.innerHTML = '';
      awaitingEmpty.textContent = 'Failed to load letters';
      awaitingEmpty.classList.remove('hidden');
    } finally {
      isLoadingAwaiting = false;
    }
  }

  async function fetchReceived(page = 0) {
    if (isLoadingReceived) return;
    isLoadingReceived = true;
    showSkeletonRows(receivedTbody, 5, 5);
    receivedEmpty.classList.add('hidden');
    receivedPagination.hidden = true;

    try {
      const params = buildQueryParams(receivedFilters, page);
      const response = await fetch(`/api/reception/deliveries/received/page?${params.toString()}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to load received letters');
      const data = await response.json();
      receivedPage = data.page;
      receivedTotalPages = data.totalPages;
      renderReceivedTable(data.content);
      updatePagination(receivedPagination, receivedPageInfo, data.page, data.totalPages, () => fetchReceived(page - 1), () => fetchReceived(page + 1));
      updateTabCounts();
    } catch (err) {
      console.error('Error loading received letters:', err);
      receivedTbody.innerHTML = '';
      receivedEmpty.textContent = 'Failed to load letters';
      receivedEmpty.classList.remove('hidden');
    } finally {
      isLoadingReceived = false;
    }
  }

  function renderAwaitingTable(deliveries) {
    awaitingTbody.innerHTML = '';
    if (!deliveries || deliveries.length === 0) {
      updateEmptyState(awaitingTbody, awaitingEmpty, false);
      return;
    }
    updateEmptyState(awaitingTbody, awaitingEmpty, true);

    deliveries.forEach(delivery => {
      const tr = document.createElement('tr');
      tr.dataset.id = delivery.id;
      tr.innerHTML = `
        <td class="nowrap"><strong>${escapeHtml(delivery.trackingNumber)}</strong></td>
        <td>${escapeHtml(delivery.recipientName)}</td>
        <td>${escapeHtml(delivery.recipientTitle || '—')}</td>
        <td class="nowrap">${formatDateTime(delivery.deliveredAt)}</td>
        <td>
          <button class="btn primary btn-small receive-btn" data-id="${delivery.id}" data-tracking="${escapeHtml(delivery.trackingNumber)}">
            Receive
          </button>
        </td>
      `;
      awaitingTbody.appendChild(tr);
    });

    awaitingTbody.querySelectorAll('.receive-btn').forEach(btn => {
      btn.addEventListener('click', handleReceiveClick);
    });
  }

  function renderReceivedTable(deliveries) {
    receivedTbody.innerHTML = '';
    if (!deliveries || deliveries.length === 0) {
      updateEmptyState(receivedTbody, receivedEmpty, false);
      return;
    }
    updateEmptyState(receivedTbody, receivedEmpty, true);

    deliveries.forEach(delivery => {
      const tr = document.createElement('tr');
      tr.dataset.id = delivery.id;
      const statusClass = delivery.status === 'RECEIVED' ? 'received' : 'delivered';
      tr.innerHTML = `
        <td class="nowrap"><strong>${escapeHtml(delivery.trackingNumber)}</strong></td>
        <td>${escapeHtml(delivery.recipientName)}</td>
        <td>${escapeHtml(delivery.recipientTitle || '—')}</td>
        <td class="nowrap">${formatDateTime(delivery.receivedAt)}</td>
        <td><span class="status ${statusClass}">${escapeHtml(delivery.status)}</span></td>
      `;
      receivedTbody.appendChild(tr);
    });
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '—';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function handleReceiveClick(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const tracking = btn.dataset.tracking;
    const remarks = prompt(`Confirm receipt for ${tracking}?\nOptional remarks:`);
    if (remarks === null) return;

    btn.disabled = true;
    btn.textContent = 'Receiving...';

    try {
      const response = await fetch(`/api/reception/deliveries/${id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [csrfHeader]: csrfToken
        },
        body: JSON.stringify({ remarks })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to confirm receipt' }));
        throw new Error(err.message || 'Failed to confirm receipt');
      }
      const updated = await response.json();
      showNotification(`Receipt confirmed for ${tracking}`, 'success');
      await refreshCurrentTab();
    } catch (err) {
      console.error('Receive error:', err);
      showNotification(err.message || 'Failed to confirm receipt', 'error');
      btn.disabled = false;
      btn.textContent = 'Receive';
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    if (tab === 'awaiting') {
      tabAwaiting.classList.add('active');
      tabAwaiting.setAttribute('aria-selected', 'true');
      tabReceived.classList.remove('active');
      tabReceived.setAttribute('aria-selected', 'false');
      panelAwaiting.hidden = false;
      panelReceived.hidden = true;
      if (awaitingTbody.children.length === 0 && !isLoadingAwaiting) {
        fetchAwaiting(0);
      }
    } else {
      tabReceived.classList.add('active');
      tabReceived.setAttribute('aria-selected', 'true');
      tabAwaiting.classList.remove('active');
      tabAwaiting.setAttribute('aria-selected', 'false');
      panelReceived.hidden = false;
      panelAwaiting.hidden = true;
      if (receivedTbody.children.length === 0 && !isLoadingReceived) {
        fetchReceived(0);
      }
    }
  }

  async function refreshCurrentTab() {
    if (currentTab === 'awaiting') {
      await fetchAwaiting(awaitingPage);
    } else {
      await fetchReceived(receivedPage);
    }
    await loadStatistics();
  }

  async function loadStatistics() {
    try {
      const response = await fetch('/api/reception/statistics');
      if (response.ok) {
        const stats = await response.json();
        if (awaitingCountEl) awaitingCountEl.textContent = stats.pendingCount ?? 0;
        if (deliveredTodayCountEl) deliveredTodayCountEl.textContent = stats.pendingCount ?? 0;
        if (receivedTodayCountEl) receivedTodayCountEl.textContent = stats.receivedTodayCount ?? 0;
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }

  function updateTabCounts() {
    if (tabCountAwaiting) {
      const awaitingRows = awaitingTbody.querySelectorAll('tr:not(.skeleton-row)');
      tabCountAwaiting.textContent = awaitingRows.length;
    }
    if (tabCountReceived) {
      const receivedRows = receivedTbody.querySelectorAll('tr:not(.skeleton-row)');
      tabCountReceived.textContent = receivedRows.length;
    }
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(filterForm);
    awaitingFilters = {
      q: formData.get('q') || '',
      recipientPosition: formData.get('recipientPosition') || '',
      organization: formData.get('organization') || '',
      dateFrom: formData.get('dateFrom') || '',
      dateTo: formData.get('dateTo') || ''
    };
    receivedFilters = { ...awaitingFilters };
    if (currentTab === 'awaiting') {
      fetchAwaiting(0);
    } else {
      fetchReceived(0);
    }
  }

  function clearFilters() {
    filterForm.reset();
    awaitingFilters = { q: '', recipientPosition: '', organization: '', dateFrom: '', dateTo: '' };
    receivedFilters = { q: '', recipientPosition: '', organization: '', dateFrom: '', dateTo: '' };
    if (currentTab === 'awaiting') {
      fetchAwaiting(0);
    } else {
      fetchReceived(0);
    }
  }

  async function loadFilterOptions() {
    try {
      const [positionsRes, orgsRes] = await Promise.all([
        fetch('/api/reception/filter-options/positions'),
        fetch('/api/reception/filter-options/organizations')
      ]);
      if (positionsRes.ok) {
        const positions = await positionsRes.json();
        populateSelect(recipientPositionFilter, positions);
      }
      if (orgsRes.ok) {
        const orgs = await orgsRes.json();
        populateSelect(organizationFilter, orgs);
      }
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }

  function populateSelect(select, options) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">All</option>';
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    select.value = currentValue;
  }

  function connectWebSocket() {
    if (typeof Stomp === 'undefined') {
      console.warn('STOMP not available, WebSocket disabled');
      return;
    }
    const socket = new WebSocket('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = () => {};
    stompClient.connect({}, onConnected, onError);
  }

  function onConnected() {
    stompClient.subscribe('/topic/deliveries', onMessageReceived);
  }

  function onError(err) {
    console.error('WebSocket error:', err);
    setTimeout(connectWebSocket, 5000);
  }

  function onMessageReceived(message) {
    try {
      const payload = JSON.parse(message.body);
      handleWebSocketEvent(payload);
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }

  function handleWebSocketEvent(payload) {
    const { type, delivery } = payload;
    if (!delivery) return;

    if (type === 'DELIVERY_CREATED') {
      if (currentTab === 'awaiting') {
        prependAwaitingRow(delivery);
      }
      updateTabCounts();
      loadStatistics();
    } else if (type === 'DELIVERY_STATUS_CHANGED') {
      if (delivery.status === 'RECEIVED') {
        removeAwaitingRow(delivery.id);
        if (currentTab === 'received') {
          prependReceivedRow(delivery);
        }
      }
      updateTabCounts();
      loadStatistics();
    }
  }

  function prependAwaitingRow(delivery) {
    const empty = awaitingTbody.querySelector('.empty');
    if (empty) empty.remove();

    const tr = document.createElement('tr');
    tr.dataset.id = delivery.id;
    tr.className = 'new-highlight';
    tr.innerHTML = `
      <td class="nowrap"><strong>${escapeHtml(delivery.trackingNumber)}</strong></td>
      <td>${escapeHtml(delivery.recipientName)}</td>
      <td>${escapeHtml(delivery.recipientTitle || '—')}</td>
      <td class="nowrap">${formatDateTime(delivery.deliveredAt)}</td>
      <td>
        <button class="btn primary btn-small receive-btn" data-id="${delivery.id}" data-tracking="${escapeHtml(delivery.trackingNumber)}">
          Receive
        </button>
      </td>
    `;
    awaitingTbody.insertBefore(tr, awaitingTbody.firstChild);

    const btn = tr.querySelector('.receive-btn');
    btn.addEventListener('click', handleReceiveClick);

    if (!prefersReducedMotion) {
      setTimeout(() => tr.classList.remove('new-highlight'), highlightDuration);
    } else {
      tr.classList.remove('new-highlight');
    }

    updatePagination(awaitingPagination, awaitingPageInfo, awaitingPage, awaitingTotalPages,
      () => fetchAwaiting(awaitingPage - 1), () => fetchAwaiting(awaitingPage + 1));
  }

  function prependReceivedRow(delivery) {
    const empty = receivedTbody.querySelector('.empty');
    if (empty) empty.remove();

    const tr = document.createElement('tr');
    tr.dataset.id = delivery.id;
    tr.className = 'new-highlight';
    tr.innerHTML = `
      <td class="nowrap"><strong>${escapeHtml(delivery.trackingNumber)}</strong></td>
      <td>${escapeHtml(delivery.recipientName)}</td>
      <td>${escapeHtml(delivery.recipientTitle || '—')}</td>
      <td class="nowrap">${formatDateTime(delivery.receivedAt)}</td>
      <td><span class="status received">${escapeHtml(delivery.status)}</span></td>
    `;
    receivedTbody.insertBefore(tr, receivedTbody.firstChild);

    if (!prefersReducedMotion) {
      setTimeout(() => tr.classList.remove('new-highlight'), highlightDuration);
    } else {
      tr.classList.remove('new-highlight');
    }

    updatePagination(receivedPagination, receivedPageInfo, receivedPage, receivedTotalPages,
      () => fetchReceived(receivedPage - 1), () => fetchReceived(receivedPage + 1));
  }

  function removeAwaitingRow(id) {
    const row = awaitingTbody.querySelector(`tr[data-id="${id}"]`);
    if (row) row.remove();
    if (awaitingTbody.children.length === 0) {
      updateEmptyState(awaitingTbody, awaitingEmpty, false);
    }
  }

  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  tabAwaiting.addEventListener('click', () => switchTab('awaiting'));
  tabReceived.addEventListener('click', () => switchTab('received'));
  filterForm.addEventListener('submit', handleFilterSubmit);
  clearFiltersBtn.addEventListener('click', clearFilters);

  document.addEventListener('DOMContentLoaded', async () => {
    await loadFilterOptions();
    await loadStatistics();
    connectWebSocket();
    fetchAwaiting(0);
  });
})();