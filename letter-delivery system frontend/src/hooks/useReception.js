import { useState, useCallback, useEffect } from 'react';
import { receptionApi } from '../api';
import { useStomp } from './useStomp';

export function useReception() {
  const [pending, setPending] = useState([]);
  const [received, setReceived] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [receivingId, setReceivingId] = useState(null);

  const loadPending = useCallback(async () => {
    try {
      setError(null);
      const data = await receptionApi.getPending();
      setPending(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadReceived = useCallback(async () => {
    try {
      setError(null);
      const data = await receptionApi.getReceived();
      setReceived(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadPending(), loadReceived()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadPending, loadReceived]);

  const handleReceive = useCallback(async (id) => {
    if (!confirm('Confirm that you have physically verified and received this letter?')) return;
    setReceivingId(id);
    try {
      const updatedDelivery = await receptionApi.receiveDelivery(id, 'Physical letter verified at reception');
      setSuccess('Receipted successfully.');
      
      setPending(prev => prev.filter(d => d.id !== id));
      setReceived(prev => {
        const exists = prev.some(d => d.id === id);
        if (exists) return prev;
        return [updatedDelivery, ...prev];
      });
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

  const { isConnected, error: wsConnError, subscribe } = useStomp();

  useEffect(() => {
    if (wsConnError) setError(wsConnError);
  }, [wsConnError]);

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
    if (!isConnected) return;

    // The public topic only carries ids/status, so reload full details from the authenticated API.
    const unsubscribe = subscribe('/topic/deliveries', (event) => {
      const { type, deliveryId, status } = event;

      if (type === 'DELIVERY_CREATED') {
        loadPending();
      }

      if (type === 'DELIVERY_STATUS_CHANGED' && status === 'RECEIVED') {
        setPending(prev => prev.filter(d => d.id !== deliveryId));
        loadReceived();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe, loadPending, loadReceived]);

  return {
    pending,
    received,
    isLoading,
    error,
    success,
    receivingId,
    isConnected,
    wsError: error,
    loadAll,
    handleReceive,
    clearMessages,
  };
}