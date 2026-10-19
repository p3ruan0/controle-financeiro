import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { Category } from '../types';
import { dataSync } from '../services/dataSync';
import { useAuth } from './AuthContext';

interface CategoriesContextType {
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  createCategory: (data: { name: string; type: 'ENTRADA' | 'SAIDA'; color?: string; icon?: string }) => Promise<Category>;
  updateCategory: (id: string, data: Partial<{ name: string; type: 'ENTRADA' | 'SAIDA'; color: string; icon: string }>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id?: string | null) => Category | undefined;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<{ categories: Category[] }>('/categories');
      setCategories(res.categories || []);
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err);
      setError(err.message || 'Erro ao carregar categorias.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load initial categories when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [isAuthenticated, fetchCategories]);

  // Reactive subscription: whenever categories are invalidated anywhere, refetch immediately
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = dataSync.subscribe('categories', () => {
      fetchCategories();
    });

    return () => unsubscribe();
  }, [isAuthenticated, fetchCategories]);

  const createCategory = useCallback(async (data: { name: string; type: 'ENTRADA' | 'SAIDA'; color?: string; icon?: string }) => {
    const res = await api.post<{ category: Category; message: string }>('/categories', data);
    // State will be updated reactively via dataSync and/or immediate refetch
    await fetchCategories();
    return res.category;
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id: string, data: Partial<{ name: string; type: 'ENTRADA' | 'SAIDA'; color: string; icon: string }>) => {
    const res = await api.put<{ category: Category; message: string }>(`/categories/${id}`, data);
    await fetchCategories();
    return res.category;
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    await api.delete(`/categories/${id}`);
    await fetchCategories();
  }, [fetchCategories]);

  const getCategoryById = useCallback((id?: string | null) => {
    if (!id) return undefined;
    return categories.find(c => c.id === id);
  }, [categories]);

  const incomeCategories = useMemo(
    () => categories.filter(c => c.type === 'ENTRADA'),
    [categories]
  );

  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === 'SAIDA'),
    [categories]
  );

  const value = useMemo(
    () => ({
      categories,
      incomeCategories,
      expenseCategories,
      isLoading,
      error,
      refreshCategories: fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      getCategoryById,
    }),
    [
      categories,
      incomeCategories,
      expenseCategories,
      isLoading,
      error,
      fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      getCategoryById,
    ]
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = (): CategoriesContextType => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories deve ser utilizado dentro de um CategoriesProvider');
  }
  return context;
};
