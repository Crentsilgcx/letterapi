import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { receptionApi } from '../api';
import { useStomp } from './useStomp';

const ReceptionContext = createContext(null);

const DEFAULT_PAGE_SIZE = 10;

const DATE_FILTER_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [receivingId, setReceivingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [recipientPositionFilter, setRecipientPositionFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  
  // Request cancellation refs
  const pendingAbortRef = useRef(null);
  const receivedAbortRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const filterTimeoutRef = useRef(null);

  // Stable filter values for API calls - use refs to avoid recreating callbacks
  const filtersRef = useRef({
    searchQuery: '',
    dateFilter: '',
    customDateFrom: '',
    customDateTo: '',
    recipientPositionFilter: '',
    organizationFilter: '',
  });
  
  // Keep refs in sync with state
  useEffect(() => { filtersRef.current.searchQuery = searchQuery; }, [searchQuery]);
  useEffect(() => { filtersRef.current.dateFilter = dateFilter; }, [dateFilter]);
  useEffect(() => { filtersRef.current.customDateFrom = customDateFrom; }, [customDateFrom]);
  useEffect(() => { filtersRef.current.customDateTo = customDateTo; }, [customDateTo]);
  useEffect(() => { filtersRef.current.recipientPositionFilter = recipientPositionFilter; }, [recipientPositionFilter]);
  useEffect(() => { filtersRef.current.organizationFilter = organizationFilter; }, [organizationFilter]);

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

  const loadPending = useCallback(async (page = 0, append = false, abortSignal) => {
    try {
      setError(null);
      const params = buildApiParams(page);
      const data = await receptionApi.getPendingPageRaw(params, abortSignal);
      if (append) {
        setPending(prev => [...prev, ...data.content]);
      } else {
        setPending(data.content);
      }
      setPendingPage(data.page);
      setPendingTotalPages(data.totalPages);
      setPendingTotalElements(data.totalElements);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    }
  }, [buildApiParams]);

  const loadReceived = useCallback(async (page = 0, append = false, abortSignal) => {
    try {
      setError(null);
      const params = buildApiParams(page);
      const data = await receptionApi.getReceivedPageRaw(params, abortSignal);
      if (append) {
        setReceived(prev => [...prev, ...data.content]);
      } else {
        setReceived(data.content);
      }
      setReceivedPage(data.page);
      setReceivedTotalPages(data.totalPages);
      setReceivedTotalElements(data.totalElements);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    }
  }, [buildApiParams]);

  // Initial load - fetch both tabs in PARALLEL
  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      try {
        setIsLoading(true);
        await Promise.all([loadPending(0, false), loadReceived(0, false)]);
      } catch (e) {
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadPending, loadReceived]);

  // Debounced search - only affects active tab
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (activeTab === 'pending') {
        setPendingPage(0);
        loadPending(0, false);
      } else {
        setReceivedPage(0);
        loadReceived(0, false);
      }
    }, 300);
  }, [activeTab, loadPending, loadReceived]);

  // Filter handlers - only affect active tab, debounced
  const handleFilterChange = useCallback((setter, newValue) => {
    setter(newValue);
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      if (activeTab === 'pending') {
        setPendingPage(0);
        loadPending(0, false);
      } else {
        setReceivedPage(0);
        loadReceived(0, false);
      }
    }, 150);
  }, [activeTab, loadPending, loadReceived]);

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
        setPendingPage(0);
        loadPending(0, false);
      } else {
        setReceivedPage(0);
        loadReceived(0, false);
      }
    }, 150);
  }, [activeTab, loadPending, loadReceived]);

  const handleCustomDateChange = useCallback((from, to) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    filterTimeoutRef.current = setTimeout(() => {
      if (activeTab === 'pending') {
        setPendingPage(0);
        loadPending(0, false);
      } else {
        setReceivedPage(0);
        loadReceived(0, false);
      }
    }, 150);
  }, [activeTab, loadPending, loadReceived]);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setReceivingId(null);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const { subscribe } = useStomp();

  // WebSocket event handler - use optimistic updates
  useEffect(() => {
    console.log('Setting up WebSocket subscription for /topic/deliveries');
    const unsubscribe = subscribe('/topic/deliveries', (event) => {
      console.log('RECEIVED DELIVERY EVENT:', event);
      const { type, deliveryId, status, delivery } = event;

      if (type === 'DELIVERY_CREATED' && delivery) {
        // Optimistic insert for pending tab
        if (activeTab === 'pending' && pendingPage === 0) {
          setPending(prev => {
            if (prev.some(d => d.id === delivery.id)) return prev;
            return [delivery, ...prev];
          });
          setPendingTotalElements(prev => prev + 1);
        } else {
          setPendingTotalElements(prev => prev + 1);
        }
      }

      if (type === 'DELIVERY_STATUS_CHANGED' && status === 'RECEIVED') {
        // Remove from pending
        setPending(prev => prev.filter(d => d.id !== deliveryId));
        setPendingTotalElements(prev => Math.max(0, prev - 1));
        
        // Add to received if we have the delivery data
        if (delivery) {
          setReceived(prev => {
            if (prev.some(d => d.id === deliveryId)) return prev;
            return [delivery, ...prev];
          });
          setReceivedTotalElements(prev => prev + 1);
        } else {
          setReceivedTotalElements(prev => prev + 1);
        }
        setReceivedTodayCount(prev => prev + 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, activeTab, pendingPage]);

  const goToPendingPage = useCallback((page) => {
    if (page < 0 || page >= pendingTotalPages) return;
    setPendingPage(page);
    loadPending(page, false);
  }, [loadPending, pendingTotalPages]);

  const goToReceivedPage = useCallback((page) => {
    if (page < 0 || page >= receivedTotalPages) return;
    setReceivedPage(page);
    loadReceived(page, false);
  }, [loadReceived, receivedTotalPages]);

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
    setSearchQuery: handleSearch,
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
    error,
    success,
    receivingId,
    activeTab,
    searchQuery,
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