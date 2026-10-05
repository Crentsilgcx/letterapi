import { useContext } from 'react';
import { ReceptionContext } from '../context/OperationsContext';

export function useOperations() {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error('useOperations must be used within a OperationsProvider');
  }
  return context;
}