import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
      return { from: sevenDaysAgo.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    case '30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { from: thirtyDaysAgo.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    case 'thisMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: firstDay.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    default:
      return { from: null, to: null };
  }
}

export function OperationsProvider({ children }) {
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
  
  const loadPendingRef = useRef();
  const loadReceivedRef = useRef();
  const searchTimeoutRef = useRef();

  const loadPending = useCallback(async (page = 0, append = false) => {
    try {
      setError(null);
      const data = await receptionApi.getPendingPage(page, DEFAULT_PAGE_SIZE);
      if (append) {
        setPending(prev => [...prev, ...data.content]);
      } else {
        setPending(data.content);
      }
      setPendingPage(data.page);
      setPendingTotalPages(data.totalPages);
      setPendingTotalElements(data.totalElements);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadReceived = useCallback(async (page = 0, append = false) => {
    try {
      setError(null);
      let from = null;
      let to = null;
      
      if (dateFilter === 'custom') {
        from = customDateFrom;
        to = customDateTo;
      } else if (dateFilter) {
        const range = getDateRange(dateFilter);
        from = range.from;
        to = range.to;
      }
      
      const data = await receptionApi.getReceivedPage(page, DEFAULT_PAGE_SIZE, searchQuery || undefined, from, to);
      if (append) {
        setReceived(prev => [...prev, ...data.content]);
      } else {
        setReceived(data.content);
      }
      setReceivedPage(data.page);
      setReceivedTotalPages(data.totalPages);
      setReceivedTotalElements(data.totalElements);
    } catch (err) {
      setError(err.message);
    }
  }, [searchQuery, dateFilter, customDateFrom, customDateTo]);

  loadPendingRef.current = loadPending;
  loadReceivedRef.current = loadReceived;

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await receptionApi.getStatistics();
      setPendingTotalElements(stats.pendingCount || 0);
      setReceivedTodayCount(stats.receivedTodayCount || 0);
    } catch (err) {
      // Silently fail for statistics
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadPending(0, false), loadReceived(0, false), loadStatistics()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadPending, loadReceived, loadStatistics]);

  const handleReceive = useCallback(async (id) => {
    if (!confirm('Confirm that you have physically verified and received this letter?')) return;
    setReceivingId(id);
    try {
      const updatedDelivery = await receptionApi.receiveDelivery(id, 'Physical letter verified at reception');
      setSuccess('Receipted successfully.');
      
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

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      try {
        await loadAll();
      } catch (e) {
      }
    })();
    return () => { active = false; };
  }, [loadAll]);

  useEffect(() => {
    const unsubscribe = subscribe('/topic/deliveries', (event) => {
      const { type, deliveryId, status } = event;

      if (type === 'DELIVERY_CREATED') {
        if (activeTab === 'pending' && pendingPage === 0) {
          loadPendingRef.current(0, false);
        } else {
          setPendingTotalElements(prev => prev + 1);
        }
      }

      if (type === 'DELIVERY_STATUS_CHANGED' && status === 'RECEIVED') {
        setPending(prev => prev.filter(d => d.id !== deliveryId));
        setPendingTotalElements(prev => Math.max(0, prev - 1));
        setReceivedTodayCount(prev => prev + 1);
        
        if (activeTab === 'received' && receivedPage === 0) {
          loadReceivedRef.current(0, false);
        } else {
          setReceivedTotalElements(prev => prev + 1);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, activeTab, pendingPage, receivedPage]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setReceivedPage(0);
      loadReceivedRef.current(0, false);
    }, 300);
  }, []);

  const handleDateFilterChange = useCallback((filter) => {
    setDateFilter(filter);
    setShowCustomDate(filter === 'custom');
    if (filter !== 'custom') {
      setCustomDateFrom('');
      setCustomDateTo('');
    }
    setReceivedPage(0);
    loadReceivedRef.current(0, false);
  }, []);

  const handleCustomDateChange = useCallback((from, to) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setReceivedPage(0);
      loadReceivedRef.current(0, false);
    }, 300);
  }, []);

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

  const value = {
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
    loadAll,
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
  };

  return (
    <ReceptionContext.Provider value={value}>
      {children}
    </ReceptionContext.Provider>
  );
}

export function useOperations() {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error('useOperations must be used within a OperationsProvider');
  }
  return context;
}