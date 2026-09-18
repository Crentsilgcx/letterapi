import { useState, useCallback, useEffect } from 'react';
import { deliveryApi } from '../api';
import { useStomp } from './useStomp';

export function useDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadDeliveries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await deliveryApi.getDeliveries();
      setDeliveries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDelivery = useCallback(async (payload) => {
    setError(null);
    setSuccess(null);
    try {
      const delivery = await deliveryApi.createDelivery(payload);
      setSuccess('Delivery created successfully');
      return delivery;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const trackDelivery = useCallback(async (trackingNumber) => {
    setError(null);
    try {
      return await deliveryApi.trackDelivery(trackingNumber);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const { isConnected, error: wsConnError, subscribe } = useStomp();

  useEffect(() => {
    if (wsConnError) setError(wsConnError);
  }, [wsConnError]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('/topic/reception/deliveries', (event) => {
      const { type, payload } = event;

      if (type === 'DELIVERY_STATUS_CHANGED' && payload) {
        const { deliveryId, newStatus, delivery } = payload;
        if (delivery) {
          setDeliveries(prev => {
            const exists = prev.some(d => d.id === deliveryId);
            if (!exists) return prev;
            return prev.map(d => d.id === deliveryId ? delivery : d);
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe]);

  return {
    deliveries,
    isLoading,
    error,
    success,
    isConnected,
    loadDeliveries,
    createDelivery,
    trackDelivery,
  };
}