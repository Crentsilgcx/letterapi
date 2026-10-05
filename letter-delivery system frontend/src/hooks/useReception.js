import { useContext } from 'react';
import { ReceptionStaffContext } from '../context/ReceptionStaffContext';

export function useReception() {
  const context = useContext(ReceptionStaffContext);
  if (!context) {
    throw new Error('useReception must be used within a ReceptionProvider');
  }
  return context;
}