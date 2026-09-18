import { useState, useCallback, useEffect } from 'react';
import { deliveryApi } from '../api';
import { useStomp } from './useStomp';

export function useDelivery() {
  const [lastCreatedDelivery, setLastCreatedDelivery] = useState(null);
  const [trackedDelivery, setTrackedDelivery] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const createDelivery = useCallback(async (payload) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const delivery = await deliveryApi.createDelivery(payload);
      setLastCreatedDelivery(delivery);
      setSuccess('Delivery created successfully');
      return delivery;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackDelivery = useCallback(async (trackingNumber) => {
    setIsLoading(true);
    setError(null);
    try {
      const delivery = await deliveryApi.trackDelivery(trackingNumber);
      setTrackedDelivery(delivery);
      return delivery;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
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
          if (lastCreatedDelivery?.id === deliveryId) {
            setLastCreatedDelivery(delivery);
          }
          if (trackedDelivery?.id === deliveryId) {
            setTrackedDelivery(delivery);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe, lastCreatedDelivery, trackedDelivery]);

  return {
    lastCreatedDelivery,
    trackedDelivery,
    isLoading,
    error,
    success,
    isConnected,
    createDelivery,
    trackDelivery,
  };
}