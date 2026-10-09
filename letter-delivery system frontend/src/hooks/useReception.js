import { useContext } from 'react';
import { ReceptionContext } from '../contexts/ReceptionContext';

export function useReception() {
  const context = useContext(ReceptionContext);
  if (!context) {
    throw new Error('useReception must be used within a ReceptionProvider');
  }
  return context;
}