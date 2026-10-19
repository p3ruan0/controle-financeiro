import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DashboardAlert } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDataSync } from './useDataSync';

export function useAlertsData() {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await api.get<{ alerts?: DashboardAlert[] }>('/dashboard');
      if (res.alerts) {
        setAlerts(res.alerts);
      }
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
    } else {
      setAlerts([]);
    }
  }, [isAuthenticated, fetchAlerts]);

  // Reactively re-fetch alerts whenever transactions, receivables, or alerts change
  useDataSync(['alerts', 'all'], () => {
    fetchAlerts();
  });

  return {
    alerts,
    alertCount: alerts.length,
    isLoading,
    refetch: fetchAlerts,
  };
}
