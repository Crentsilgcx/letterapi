import { useState, useCallback, useEffect } from 'react';
import { receptionApi } from '../api';

export function useReception() {
  const [pending, setPending] = useState([]);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleReceive = useCallback(async (id) => {
    if (!confirm(' that you have physically verified and received this letter?')) return;
    setReceivingId(id);
    try {
      await receptionApi.receiveDelivery(id, 'Physical letter verified at reception');
      setSuccess('Receipted successfully.');
      await loadPending();
    } catch (err) {
      setError(err.message);
    } finally {
      setReceivingId(null);
    }
  }, [loadPending]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    pending,
    isLoading,
    error,
    success,
    receivingId,
    loadPending,
    handleReceive,
    clearMessages,
  };
}