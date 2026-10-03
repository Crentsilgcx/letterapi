import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { receptionApi } from '../api';
import { useStomp } from './useStomp';

const ReceptionContext = createContext(null);

const DEFAULT_PAGE_SIZE = 10;

// Cache configuration
const CACHE_KEY = 'reception_cache_v1';
const CACHE_VERSION = 1;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getDateRange(filter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: today.toISOString().split('T')[0], to: tomorrow.toISOString().split('T')[0] };
    }
    case '7days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return { from: sevenDaysAgo.toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] };
    }
    case '30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { from: thirtyDaysAgo.toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] };
    }
    case 'thisMonth': {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      return { from: firstDay.toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] };
    }
    default:
      return { from: null, to: null };
  }
}

// Cache utility functions
function getCache() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.version === CACHE_VERSION) {
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function setCache(data) {
  try {
    const cacheData = {
      ...data,
      version: CACHE_VERSION,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // ignore storage errors
  }
}

function isCacheValid(cache) {
  if (!cache || cache.version !== CACHE_VERSION) return false;
  const age = Date.now() - cache.timestamp;
  return age < CACHE_TTL;
}

function getCacheState(cache) {
  if (!cache) return null;
  return {
    pending: cache.pending || [],
    received: cache.received || [],
    pendingPage: cache.pendingPage || 0,
    receivedPage: cache.receivedPage || 0,
    pendingTotalPages: cache.pendingTotalPages || 1,
    receivedTotalPages: cache.receivedTotalPages || 1,
    pendingTotalElements: cache.pendingTotalElements || 0,
    receivedTotalElements: cache.receivedTotalElements || 0,
    receivedTodayCount: cache.receivedTodayCount || 0,
    searchQuery: cache.searchQuery || '',
    dateFilter: cache.dateFilter || '',
    customDateFrom: cache.customDateFrom || '',
    customDateTo: cache.customDateTo || '',
    showCustomDate: cache.showCustomDate || false,
    recipientPositionFilter: cache.recipientPositionFilter || '',
    organizationFilter: cache.organizationFilter || '',
  };
}

function buildCacheState(state) {
  return {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    pending: state.pending,
    received: state.received,
    pendingPage: state.pendingPage,
    receivedPage: state.receivedPage,
    pendingTotalPages: state.pendingTotalPages,
    receivedTotalPages: state.receivedTotalPages,
    pendingTotalElements: state.pendingTotalElements,
    receivedTotalElements: state.receivedTotalElements,
    receivedTodayCount: state.receivedTodayCount,
    searchQuery: state.searchQuery,
    dateFilter: state.dateFilter,
    customDateFrom: state.customDateFrom,
    customDateTo: state.customDateTo,
    showCustomDate: state.showCustomDate,
    recipientPositionFilter: state.recipientPositionFilter,
    organizationFilter: state.organizationFilter,
  };
}

// Helper to check if a delivery matches current filters
function matchesFilters(delivery, filters) {
  if (!delivery) return false;
  
  const { searchQuery, dateFilter, customDateFrom, customDateTo, recipientPositionFilter, organizationFilter } = filters;
  
  // Search query match
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (delivery.recipientName?.toLowerCase().includes(query)) ||
      (delivery.organizationName?.toLowerCase().includes(query)) ||
      (delivery.subject?.toLowerCase().includes(query)) ||
      (delivery.deliveryPersonName?.toLowerCase().includes(query)) ||
      (delivery.trackingNumber?.toLowerCase().includes(query)) ||
      (delivery.referenceNumber?.toLowerCase().includes(query));
    if (!matchesSearch) return false;
  }
  
  // Recipient position filter
  if (recipientPositionFilter && delivery.recipientName?.toLowerCase() !== recipientPositionFilter.toLowerCase()) {
    return false;
  }
  
  // Organization filter
  if (organizationFilter && delivery.organizationName?.toLowerCase() !== organizationFilter.toLowerCase()) {
    return false;
  }
  
  // Date filter
  if (dateFilter) {
    const { from, to } = getDateRange(dateFilter);
    const deliveredAt = new Date(delivery.deliveredAt);
    if (from && deliveredAt < new Date(from)) return false;
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      if (deliveredAt > endOfDay) return false;
    }
  }
  
  // Custom date range
  if (customDateFrom || customDateTo) {
    const deliveredAt = new Date(delivery.deliveredAt);
    if (customDateFrom && deliveredAt < new Date(customDateFrom)) return false;
    if (customDateTo) {
      const endOfDay = new Date(customDateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (deliveredAt > endOfDay) return false;
    }
  }
  
  return true;
}

export function ReceptionProvider({ children }) {
  const [pending, setPending] = useState([]);
  const [received, setReceived] = useState([]);
  const [pendingPage, setPendingPage] = useState(0);
  const [receivedPage, setReceivedPage] = useState(0);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [receivedTotalPages, setReceivedTotalPages] = useState(1);
  const [pendingTotalElements, setPendingTotalElements] = useState(0);
  const [receivedTotalElements, setReceivedTotalElements] = useState(0);
  const [receivedTodayCount, setReceivedTodayCount] = useState(0);
  
  // Separate search input (immediate) from debounced search query (for API)
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [recipientPositionFilter, setRecipientPositionFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  
  // Timer refs for debouncing
  const searchTimeoutRef = useRef(null);
  const filterTimeoutRef = useRef(null);
  const pendingAbortRef = useRef(null);
  const receivedAbortRef = useRef(null);
  const loadPendingRef = useRef(null);
  const loadReceivedRef = useRef(null);
  // A response started before a real-time update must not replace that update.
  // These also keep stale responses from writing older cache snapshots.
  const pendingRealtimeRevisionRef = useRef(0);
  const receivedRealtimeRevisionRef = useRef(0);
  const processedEventKeysRef = useRef(new Set());
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [receivingId, setReceivingId] = useState(null);
  const [activeTab, setActiveTabState] = useState('pending');

  // Wrapped setActiveTab that reloads the newly active tab with current filters
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    // Reload the newly active tab with current filters
    if (tab === 'pending') {
      if (pendingAbortRef.current) pendingAbortRef.current.abort();
      const controller = new AbortController();
      pendingAbortRef.current = controller;
      setPendingPage(0);
      loadPendingRef.current?.(0, false, controller.signal);
    } else if (tab === 'received') {
      if (receivedAbortRef.current) receivedAbortRef.current.abort();
      const controller = new AbortController();
      receivedAbortRef.current = controller;
      setReceivedPage(0);
      loadReceivedRef.current?.(0, false, controller.signal);
    }
  }, []);
  
  // Stable filter values for API calls - use refs to avoid recreating callbacks
  const filtersRef = useRef({
    searchQuery: '',
    dateFilter: '',
    customDateFrom: '',
    customDateTo: '',
    recipientPositionFilter: '',
    organizationFilter: '',
  });

  // Keep filtersRef in sync with filter state for API calls
  useEffect(() => { filtersRef.current.searchQuery = searchQuery; }, [searchQuery]);
  useEffect(() => { filtersRef.current.dateFilter = dateFilter; }, [dateFilter]);
  useEffect(() => { filtersRef.current.customDateFrom = customDateFrom; }, [customDateFrom]);
  useEffect(() => { filtersRef.current.customDateTo = customDateTo; }, [customDateTo]);
  useEffect(() => { filtersRef.current.recipientPositionFilter = recipientPositionFilter; }, [recipientPositionFilter]);
  useEffect(() => { filtersRef.current.organizationFilter = organizationFilter; }, [organizationFilter]);
  
  // Refs for WebSocket handler to access current state without causing re-renders
  const stateRefs = useRef({
    pending: [],
    received: [],
    pendingPage: 0,
    receivedPage: 0,
    pendingTotalPages: 1,
    receivedTotalPages: 1,
    pendingTotalElements: 0,
    receivedTotalElements: 0,
    receivedTodayCount: 0,
    searchQuery: '',
    dateFilter: '',
    customDateFrom: '',
    customDateTo: '',
    showCustomDate: false,
    recipientPositionFilter: '',
    organizationFilter: '',
    activeTab: 'pending',
  });

  // Keep refs in sync with state
  useEffect(() => { stateRefs.current.pending = pending; }, [pending]);
  useEffect(() => { stateRefs.current.received = received; }, [received]);
  useEffect(() => { stateRefs.current.pendingPage = pendingPage; }, [pendingPage]);
  useEffect(() => { stateRefs.current.receivedPage = receivedPage; }, [receivedPage]);
  useEffect(() => { stateRefs.current.pendingTotalPages = pendingTotalPages; }, [pendingTotalPages]);
  useEffect(() => { stateRefs.current.receivedTotalPages = receivedTotalPages; }, [receivedTotalPages]);
  useEffect(() => { stateRefs.current.pendingTotalElements = pendingTotalElements; }, [pendingTotalElements]);
  useEffect(() => { stateRefs.current.receivedTotalElements = receivedTotalElements; }, [receivedTotalElements]);
  useEffect(() => { stateRefs.current.receivedTodayCount = receivedTodayCount; }, [receivedTodayCount]);
  useEffect(() => { stateRefs.current.searchQuery = searchQuery; }, [searchQuery]);
  useEffect(() => { stateRefs.current.dateFilter = dateFilter; }, [dateFilter]);
  useEffect(() => { stateRefs.current.customDateFrom = customDateFrom; }, [customDateFrom]);
  useEffect(() => { stateRefs.current.customDateTo = customDateTo; }, [customDateTo]);
  useEffect(() => { stateRefs.current.showCustomDate = showCustomDate; }, [showCustomDate]);
  useEffect(() => { stateRefs.current.recipientPositionFilter = recipientPositionFilter; }, [recipientPositionFilter]);
  useEffect(() => { stateRefs.current.organizationFilter = organizationFilter; }, [organizationFilter]);
  useEffect(() => { stateRefs.current.activeTab = activeTab; }, [activeTab]);

  const getDateRangeFromRefs = useCallback(() => {
    const { dateFilter, customDateFrom, customDateTo } = filtersRef.current;
    if (dateFilter === 'custom') {
      return { from: customDateFrom || null, to: customDateTo || null };
    }
    return getDateRange(dateFilter);
  }, []);

const buildApiParams = useCallback((page = 0) => {
    const { searchQuery, recipientPositionFilter, organizationFilter } = filtersRef.current;
    const { from, to } = getDateRangeFromRefs();
    const params = new URLSearchParams({ 
      page: String(page), 
      size: String(DEFAULT_PAGE_SIZE) 
    });
    if (searchQuery) params.append('q', searchQuery);
    if (from) params.append('dateFrom', from);
    if (to) params.append('dateTo', to);
    if (recipientPositionFilter) params.append('recipientPosition', recipientPositionFilter);
    if (organizationFilter) params.append('organization', organizationFilter);
    return params.toString();
  }, []);

  // Stable load functions using useCallback with [] deps - read from refs for current values
  const loadPending = useCallback(async (page = 0, append = false, abortSignal, overrideParams) => {
    const requestRealtimeRevision = pendingRealtimeRevisionRef.current;
    try {
      setError(null);
      const params = overrideParams || buildApiParams(page);
      const data = await receptionApi.getPendingPageRaw(params, abortSignal);
      if (requestRealtimeRevision !== pendingRealtimeRevisionRef.current) return;
      if (append) {
        setPending(prev => [...prev, ...data.content]);
      } else {
        setPending(data.content);
      }
      setPendingPage(data.page);
      setPendingTotalPages(data.totalPages);
      setPendingTotalElements(data.totalElements);
      
      // Update cache after successful fetch
      if (!append && page === 0) {
        setCache(buildCacheState({
          pending: data.content,
          received,
          pendingPage: data.page,
          receivedPage: receivedPage,
          pendingTotalPages: data.totalPages,
          receivedTotalPages: receivedTotalPages,
          pendingTotalElements: data.totalElements,
          receivedTotalElements: receivedTotalElements,
          receivedTodayCount: receivedTodayCount,
          searchQuery: searchQuery,
          dateFilter: dateFilter,
          customDateFrom: customDateFrom,
          customDateTo: customDateTo,
          showCustomDate: showCustomDate,
          recipientPositionFilter: recipientPositionFilter,
          organizationFilter: organizationFilter,
        }));
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    }
  }, [buildApiParams, received, receivedPage, receivedTotalPages, receivedTotalElements, receivedTodayCount, searchQuery, dateFilter, customDateFrom, customDateTo, showCustomDate, recipientPositionFilter, organizationFilter]);

  // Store loadPending in ref for use in setActiveTab (avoids circular dependency)
  useEffect(() => { loadPendingRef.current = loadPending; }, [loadPending]);

  const loadReceived = useCallback(async (page = 0, append = false, abortSignal, overrideParams) => {
    const requestRealtimeRevision = receivedRealtimeRevisionRef.current;
    try {
      setError(null);
      const params = overrideParams || buildApiParams(page);
      const data = await receptionApi.getReceivedPageRaw(params, abortSignal);
      if (requestRealtimeRevision !== receivedRealtimeRevisionRef.current) return;
      if (append) {
        setReceived(prev => [...prev, ...data.content]);
      } else {
        setReceived(data.content);
      }
      setReceivedPage(data.page);
      setReceivedTotalPages(data.totalPages);
      setReceivedTotalElements(data.totalElements);
      
      // Update cache after successful fetch
      if (!append && page === 0) {
        setCache(buildCacheState({
          pending: stateRefs.current.pending,
          received: data.content,
          pendingPage: stateRefs.current.pendingPage,
          receivedPage: data.page,
          pendingTotalPages: stateRefs.current.pendingTotalPages,
          receivedTotalPages: data.totalPages,
          pendingTotalElements: stateRefs.current.pendingTotalElements,
          receivedTotalElements: data.totalElements,
          receivedTodayCount: receivedTodayCount,
          searchQuery: searchQuery,
          dateFilter: dateFilter,
          customDateFrom: customDateFrom,
          customDateTo: customDateTo,
          showCustomDate: showCustomDate,
          recipientPositionFilter: recipientPositionFilter,
          organizationFilter: organizationFilter,
        }));
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    }
  }, [buildApiParams, pending, pendingPage, pendingTotalPages, pendingTotalElements, receivedTodayCount, searchQuery, dateFilter, customDateFrom, customDateTo, showCustomDate, recipientPositionFilter, organizationFilter]);

  // Store loadReceived in ref for use in setActiveTab
  useEffect(() => { loadReceivedRef.current = loadReceived; }, [loadReceived]);

  // Initial load - check cache first, then fetch if needed
  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      try {
        // Try to load from cache first
        const cached = getCache();
        const cachedState = getCacheState(cached);
        const cacheValid = isCacheValid(cached);
        
        if (cachedState && cacheValid) {
          // Restore from cache immediately - no loading spinner needed
          setPending(cachedState.pending);
          setReceived(cachedState.received);
          setPendingPage(cachedState.pendingPage);
          setReceivedPage(cachedState.receivedPage);
          setPendingTotalPages(cachedState.pendingTotalPages);
          setReceivedTotalPages(cachedState.receivedTotalPages);
          setPendingTotalElements(cachedState.pendingTotalElements);
          setReceivedTotalElements(cachedState.receivedTotalElements);
          setReceivedTodayCount(cachedState.receivedTodayCount);
          setSearchQuery(cachedState.searchQuery);
          setDateFilter(cachedState.dateFilter);
          setCustomDateFrom(cachedState.customDateFrom);
          setCustomDateTo(cachedState.customDateTo);
          setShowCustomDate(cachedState.showCustomDate);
          setRecipientPositionFilter(cachedState.recipientPositionFilter);
          setOrganizationFilter(cachedState.organizationFilter);
          setIsLoading(false);
          
          // Background refresh: always fetch fresh data after cache restore
          // This ensures received tab has data even if cache was empty
          loadPending(0, false);
          loadReceived(0, false);
        } else {
          // No valid cache - load from API
          setIsLoading(true);
          await Promise.all([loadPending(0, false), loadReceived(0, false)]);
        }
      } catch {
        // Ignore cache/init errors - UI will show empty state
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []); // Run only once on mount

  // Debounced search - only affects active tab
  const handleSearch = useCallback((query) => {
    setSearchInput(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
      
      // Abort any in-flight request
      if (activeTab === 'pending') {
        if (pendingAbortRef.current) pendingAbortRef.current.abort();
        const controller = new AbortController();
        pendingAbortRef.current = controller;
        
        // Build params with the new query directly (avoid stale ref read)
        const params = buildApiParams(0);
        // Override the search query in params
        const urlParams = new URLSearchParams(params);
        urlParams.set('q', query);
        
        setPendingPage(0);
        loadPending(0, false, controller.signal, urlParams.toString());
      } else {
        if (receivedAbortRef.current) receivedAbortRef.current.abort();
        const controller = new AbortController();
        receivedAbortRef.current = controller;
        
        const params = buildApiParams(0);
        const urlParams = new URLSearchParams(params);
        urlParams.set('q', query);
        
        setReceivedPage(0);
        loadReceived(0, false, controller.signal, urlParams.toString());
      }
    }, 150); // Reduced from 300ms for snappier feel
  }, [activeTab, buildApiParams]);

  // Filter handlers - only affect active tab, debounced
  const handleFilterChange = useCallback((setter, newValue) => {
    setter(newValue);
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      if (activeTab === 'pending') {
        if (pendingAbortRef.current) pendingAbortRef.current.abort();
        const controller = new AbortController();
        pendingAbortRef.current = controller;
        setPendingPage(0);
        loadPending(0, false, controller.signal);
      } else {
        if (receivedAbortRef.current) receivedAbortRef.current.abort();
        const controller = new AbortController();
        receivedAbortRef.current = controller;
        setReceivedPage(0);
        loadReceived(0, false, controller.signal);
      }
    }, 150);
  }, [activeTab]);

  const handleDateFilterChange = useCallback((filter) => {
    setDateFilter(filter);
    setShowCustomDate(filter === 'custom');
    if (filter !== 'custom') {
      setCustomDateFrom('');
      setCustomDateTo('');
    }
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      if (activeTab === 'pending') {
        if (pendingAbortRef.current) pendingAbortRef.current.abort();
        const controller = new AbortController();
        pendingAbortRef.current = controller;
        setPendingPage(0);
        loadPending(0, false, controller.signal);
      } else {
        if (receivedAbortRef.current) receivedAbortRef.current.abort();
        const controller = new AbortController();
        receivedAbortRef.current = controller;
        setReceivedPage(0);
        loadReceived(0, false, controller.signal);
      }
    }, 150);
  }, [activeTab]);

  const handleCustomDateChange = useCallback((from, to) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      if (activeTab === 'pending') {
        if (pendingAbortRef.current) pendingAbortRef.current.abort();
        const controller = new AbortController();
        pendingAbortRef.current = controller;
        setPendingPage(0);
        loadPending(0, false, controller.signal);
      } else {
        if (receivedAbortRef.current) receivedAbortRef.current.abort();
        const controller = new AbortController();
        receivedAbortRef.current = controller;
        setReceivedPage(0);
        loadReceived(0, false, controller.signal);
      }
    }, 150);
  }, [activeTab]);

  const handleRecipientPositionFilterChange = useCallback((filter) => {
    handleFilterChange(setRecipientPositionFilter, filter);
  }, [handleFilterChange]);

  const handleOrganizationFilterChange = useCallback((filter) => {
    handleFilterChange(setOrganizationFilter, filter);
  }, [handleFilterChange]);

  const handleReceive = useCallback(async (id) => {
    if (!confirm('Confirm that you have physically verified and received this letter?')) return;
    setReceivingId(id);
    try {
      const updatedDelivery = await receptionApi.receiveDelivery(id, 'Physical letter verified at reception');
      setSuccess('Receipted successfully.');
      
      // Optimistic update
      setPending(prev => prev.filter(d => d.id !== id));
      setPendingTotalElements(prev => Math.max(0, prev - 1));
      
      setReceived(prev => {
        const exists = prev.some(d => d.id === id);
        if (exists) return prev;
        return [updatedDelivery, ...prev];
      });
      setReceivedTotalElements(prev => prev + 1);
      setReceivedTodayCount(prev => prev + 1);
      
      // Update total pages for consistency
      const newPendingTotalElements = Math.max(0, pendingTotalElements - 1);
      const newReceivedTotalElements = receivedTotalElements + 1;
      setPendingTotalPages(Math.max(1, Math.ceil(newPendingTotalElements / DEFAULT_PAGE_SIZE)));
      setReceivedTotalPages(Math.max(1, Math.ceil(newReceivedTotalElements / DEFAULT_PAGE_SIZE)));
      
      // Update cache after successful receive
      setCache(buildCacheState({
        pending: pending.filter(d => d.id !== id),
        received: [...received, updatedDelivery],
        pendingPage,
        receivedPage,
        pendingTotalPages: Math.max(1, Math.ceil(newPendingTotalElements / DEFAULT_PAGE_SIZE)),
        receivedTotalPages: Math.max(1, Math.ceil(newReceivedTotalElements / DEFAULT_PAGE_SIZE)),
        pendingTotalElements: newPendingTotalElements,
        receivedTotalElements: newReceivedTotalElements,
        receivedTodayCount: receivedTodayCount + 1,
        searchQuery,
        dateFilter,
        customDateFrom,
        customDateTo,
        showCustomDate,
        recipientPositionFilter,
        organizationFilter,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setReceivingId(null);
    }
  }, [pending, received, pendingPage, receivedPage, pendingTotalPages, receivedTotalPages, pendingTotalElements, receivedTotalElements, receivedTodayCount, searchQuery, dateFilter, customDateFrom, customDateTo, showCustomDate, recipientPositionFilter, organizationFilter]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const { subscribe, isConnected } = useStomp();

  // WebSocket events update the state rendered by the tables directly. Fetches that
  // were already in flight are ignored via the per-table revision refs, rather than
  // fetching every page again for a single event.
  useEffect(() => {
    console.log('Setting up WebSocket subscription for /topic/deliveries');
    const unsubscribe = subscribe('/topic/deliveries', (event) => {
      console.log('RECEIVED DELIVERY EVENT:', event);
      const { type, deliveryId, status, delivery } = event;

      // Use refs to access current state without causing re-renders
      const state = stateRefs.current;

      if (type === 'DELIVERY_CREATED' && delivery) {
        const eventKey = `created:${delivery.id}`;
        if (processedEventKeysRef.current.has(eventKey)) return;

        // New delivery arrived - add to pending list if it matches current filters
        const filters = {
          searchQuery: state.searchQuery,
          dateFilter: state.dateFilter,
          customDateFrom: state.customDateFrom,
          customDateTo: state.customDateTo,
          recipientPositionFilter: state.recipientPositionFilter,
          organizationFilter: state.organizationFilter,
        };
        
        const matches = matchesFilters(delivery, filters);
        const alreadyVisible = state.pending.some(d => String(d.id) === String(delivery.id));
        const affectsCurrentResult = matches && !alreadyVisible;
        if (!affectsCurrentResult) {
          processedEventKeysRef.current.add(eventKey);
          return;
        }

        processedEventKeysRef.current.add(eventKey);
        pendingRealtimeRevisionRef.current += 1;

        // The API sorts pending deliveries by deliveredAt descending, so a new
        // delivery belongs on page 0. Do not place it incorrectly on later pages.
        const isFirstPendingPage = state.pendingPage === 0;
        const newPending = isFirstPendingPage
          ? [delivery, ...state.pending].slice(0, DEFAULT_PAGE_SIZE)
          : state.pending;
        const newPendingTotalElements = state.pendingTotalElements + 1;
        const newPendingTotalPages = Math.max(1, Math.ceil(newPendingTotalElements / DEFAULT_PAGE_SIZE));

        // Keep the refs, rendered state, and cache on the same snapshot. Updating
        // the ref synchronously also closes the duplicate-event window before React
        // has committed this render.
        stateRefs.current.pending = newPending;
        stateRefs.current.pendingTotalElements = newPendingTotalElements;
        stateRefs.current.pendingTotalPages = newPendingTotalPages;
        if (isFirstPendingPage) setPending(newPending);
        setPendingTotalElements(newPendingTotalElements);
        setPendingTotalPages(newPendingTotalPages);

        setCache(buildCacheState({
          pending: newPending,
          received: state.received,
          pendingPage: state.pendingPage,
          receivedPage: state.receivedPage,
          pendingTotalPages: newPendingTotalPages,
          receivedTotalPages: state.receivedTotalPages,
          pendingTotalElements: newPendingTotalElements,
          receivedTotalElements: state.receivedTotalElements,
          receivedTodayCount: state.receivedTodayCount,
          searchQuery: state.searchQuery,
          dateFilter: state.dateFilter,
          customDateFrom: state.customDateFrom,
          customDateTo: state.customDateTo,
          showCustomDate: state.showCustomDate,
          recipientPositionFilter: state.recipientPositionFilter,
          organizationFilter: state.organizationFilter,
        }));
      }

      if (type === 'DELIVERY_STATUS_CHANGED' && status === 'RECEIVED') {
        const id = deliveryId ?? delivery?.id;
        const eventKey = `received:${id}`;
        if (id == null || processedEventKeysRef.current.has(eventKey)) return;
        processedEventKeysRef.current.add(eventKey);

        pendingRealtimeRevisionRef.current += 1;
        receivedRealtimeRevisionRef.current += 1;

        const filters = {
          searchQuery: state.searchQuery,
          dateFilter: state.dateFilter,
          customDateFrom: state.customDateFrom,
          customDateTo: state.customDateTo,
          recipientPositionFilter: state.recipientPositionFilter,
          organizationFilter: state.organizationFilter,
        };
        const matches = !delivery || matchesFilters(delivery, filters);
        const wasAlreadyReceived = state.received.some(d => String(d.id) === String(id));
        const newPending = state.pending.filter(d => String(d.id) !== String(id));
        const isFirstReceivedPage = state.receivedPage === 0;
        const shouldMove = matches && !wasAlreadyReceived;
        const newReceived = delivery && isFirstReceivedPage && shouldMove
          ? [delivery, ...state.received].slice(0, DEFAULT_PAGE_SIZE)
          : state.received;
        const newPendingTotalElements = !shouldMove
          ? state.pendingTotalElements
          : Math.max(0, state.pendingTotalElements - 1);
        const newReceivedTotalElements = !shouldMove
          ? state.receivedTotalElements
          : state.receivedTotalElements + 1;
        const newPendingTotalPages = Math.max(1, Math.ceil(newPendingTotalElements / DEFAULT_PAGE_SIZE));
        const newReceivedTotalPages = Math.max(1, Math.ceil(newReceivedTotalElements / DEFAULT_PAGE_SIZE));

        stateRefs.current.pending = newPending;
        stateRefs.current.received = newReceived;
        stateRefs.current.pendingTotalElements = newPendingTotalElements;
        stateRefs.current.receivedTotalElements = newReceivedTotalElements;
        stateRefs.current.pendingTotalPages = newPendingTotalPages;
        stateRefs.current.receivedTotalPages = newReceivedTotalPages;
        if (shouldMove) stateRefs.current.receivedTodayCount += 1;

        setPending(newPending);
        if (isFirstReceivedPage && shouldMove) setReceived(newReceived);
        setPendingTotalElements(newPendingTotalElements);
        setReceivedTotalElements(newReceivedTotalElements);
        if (shouldMove) setReceivedTodayCount(stateRefs.current.receivedTodayCount);
        setPendingTotalPages(newPendingTotalPages);
        setReceivedTotalPages(newReceivedTotalPages);
        
        // Update cache with correct arrays
        setCache(buildCacheState({
          pending: newPending,
          received: newReceived,
          pendingPage: state.pendingPage,
          receivedPage: state.receivedPage,
          pendingTotalPages: newPendingTotalPages,
          receivedTotalPages: newReceivedTotalPages,
          pendingTotalElements: newPendingTotalElements,
          receivedTotalElements: newReceivedTotalElements,
          receivedTodayCount: stateRefs.current.receivedTodayCount,
          searchQuery: state.searchQuery,
          dateFilter: state.dateFilter,
          customDateFrom: state.customDateFrom,
          customDateTo: state.customDateTo,
          showCustomDate: state.showCustomDate,
          recipientPositionFilter: state.recipientPositionFilter,
          organizationFilter: state.organizationFilter,
        }));
        
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]); // Only depend on subscribe function

  const goToPendingPage = useCallback((page) => {
    if (page < 0 || page >= pendingTotalPages) return;
    if (pendingAbortRef.current) pendingAbortRef.current.abort();
    const controller = new AbortController();
    pendingAbortRef.current = controller;
    setPendingPage(page);
    loadPending(page, false, controller.signal);
    // Update cache with new page
    setCache(buildCacheState({
      pending,
      received,
      pendingPage: page,
      receivedPage,
      pendingTotalPages,
      receivedTotalPages,
      pendingTotalElements,
      receivedTotalElements,
      receivedTodayCount,
      searchQuery,
      dateFilter,
      customDateFrom,
      customDateTo,
      showCustomDate,
      recipientPositionFilter,
      organizationFilter,
    }));
  }, [pendingTotalPages, pending, received, pendingPage, receivedPage, pendingTotalPages, receivedTotalPages, pendingTotalElements, receivedTotalElements, receivedTodayCount, searchQuery, dateFilter, customDateFrom, customDateTo, showCustomDate, recipientPositionFilter, organizationFilter]);

  const goToReceivedPage = useCallback((page) => {
    if (page < 0 || page >= receivedTotalPages) return;
    if (receivedAbortRef.current) receivedAbortRef.current.abort();
    const controller = new AbortController();
    receivedAbortRef.current = controller;
    setReceivedPage(page);
    loadReceived(page, false, controller.signal);
    // Update cache with new page
    setCache(buildCacheState({
      pending,
      received,
      pendingPage,
      receivedPage: page,
      pendingTotalPages,
      receivedTotalPages,
      pendingTotalElements,
      receivedTotalElements,
      receivedTodayCount,
      searchQuery,
      dateFilter,
      customDateFrom,
      customDateTo,
      showCustomDate,
      recipientPositionFilter,
      organizationFilter,
    }));
  }, [receivedTotalPages, pending, received, pendingPage, receivedPage, pendingTotalPages, receivedTotalPages, pendingTotalElements, receivedTotalElements, receivedTodayCount, searchQuery, dateFilter, customDateFrom, customDateTo, showCustomDate, recipientPositionFilter, organizationFilter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
      if (pendingAbortRef.current) pendingAbortRef.current.abort();
      if (receivedAbortRef.current) receivedAbortRef.current.abort();
    };
  }, []);

  const value = useMemo(() => ({
    pending,
    received,
    pendingPage,
    receivedPage,
    pendingTotalPages,
    receivedTotalPages,
    pendingTotalElements,
    receivedTotalElements,
    receivedTodayCount,
    isLoading,
    isConnected,
    error,
    success,
    receivingId,
    activeTab,
    setActiveTab,
    handleReceive,
    clearMessages,
    goToPendingPage,
    goToReceivedPage,
    searchQuery,
    searchInput,
    setSearchQuery: handleSearch,
    setSearchInput,
    dateFilter,
    setDateFilter: handleDateFilterChange,
    customDateFrom,
    customDateTo,
    setCustomDateFrom: (d) => handleCustomDateChange(d, customDateTo),
    setCustomDateTo: (d) => handleCustomDateChange(customDateFrom, d),
    showCustomDate,
    recipientPositionFilter,
    setRecipientPositionFilter: handleRecipientPositionFilterChange,
    organizationFilter,
    setOrganizationFilter: handleOrganizationFilterChange,
  }), [
    pending,
    received,
    pendingPage,
    receivedPage,
    pendingTotalPages,
    receivedTotalPages,
    pendingTotalElements,
    receivedTotalElements,
    receivedTodayCount,
    isLoading,
    isConnected,
    error,
    success,
    receivingId,
    activeTab,
    searchQuery,
    searchInput,
    dateFilter,
    customDateFrom,
    customDateTo,
    showCustomDate,
    recipientPositionFilter,
    organizationFilter,
  ]);

  return (
    <ReceptionContext.Provider value={value}>
      {children}
    </ReceptionContext.Provider>
  );
}

export function useReception() {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error('useReception must be used within a ReceptionProvider');
  }
  return context;
}
