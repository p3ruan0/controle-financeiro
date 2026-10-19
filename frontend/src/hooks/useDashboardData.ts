import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDataSync } from './useDataSync';

export function useDashboardData(month: number, year: number) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isAuthenticated) return;
    try {
      if (!isSilent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const res = await api.get<DashboardData>(`/dashboard?month=${month}&year=${year}`);
      setData(res);
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError(err.message || 'Erro ao carregar dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, month, year]);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // Reactive subscription: whenever transactions, receivables, categories, or fixed-expenses
  // are created/updated/deleted anywhere in the application, dashboard auto-updates silently!
  useDataSync(['dashboard', 'all'], () => {
    fetchDashboard(true);
  });

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch: () => fetchDashboard(false),
  };
}
