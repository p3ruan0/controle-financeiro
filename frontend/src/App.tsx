import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationModal } from './components/NotificationModal';
import { TransactionModal } from './components/TransactionModal';
import { ReceivableModal } from './components/ReceivableModal';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Payables } from './pages/Payables';
import { Receivables } from './pages/Receivables';
import { FixedExpenses } from './pages/FixedExpenses';
import { VariableExpenses } from './pages/VariableExpenses';
import { Calendar } from './pages/Calendar';
import { Reports } from './pages/Reports';
import { Categories } from './pages/Categories';
import { Settings } from './pages/Settings';
import { AcceptInvitation } from './pages/AcceptInvitation';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminCompanies } from './pages/admin/AdminCompanies';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSessions } from './pages/admin/AdminSessions';
import { AdminInvitations } from './pages/admin/AdminInvitations';

import { api } from './services/api';
import { Category, DashboardAlert } from './types';
import { ShieldAlert } from 'lucide-react';


const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Você não tem permissão de Administrador para acessar esta área. Contate o administrador master da plataforma.
        </p>
      </div>
    );
  }
  return <>{children}</>;
};

// Layout wrapper for authenticated routes
const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Quick action modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);

  // Trigger to refresh dashboard when a quick action is saved
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchAppData = async () => {
    if (!isAuthenticated) return;
    try {
      const [dashRes, catRes] = await Promise.all([
        api.get<any>('/dashboard'),
        api.get<{ categories: Category[] }>('/categories'),
      ]);
      if (dashRes.alerts) setAlerts(dashRes.alerts);
      if (catRes.categories) setCategories(catRes.categories);
    } catch (err) {
      console.error('Erro ao carregar dados do app:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppData();
    }
  }, [isAuthenticated, refreshCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleOpenQuickModal = (type: 'ENTRADA' | 'SAIDA' | 'CONTA_PAGAR' | 'VALOR_RECEBER') => {
    if (type === 'ENTRADA') {
      setTransactionModalType('ENTRADA');
      setIsTransactionModalOpen(true);
    } else if (type === 'SAIDA' || type === 'CONTA_PAGAR') {
      setTransactionModalType('SAIDA');
      setIsTransactionModalOpen(true);
    } else if (type === 'VALOR_RECEBER') {
      setIsReceivableModalOpen(true);
    }
  };

  const handleSaveQuickTransaction = async (data: any) => {
    await api.post('/transactions', data);
    setRefreshCount(prev => prev + 1);
  };

  const handleSaveQuickReceivable = async (data: any) => {
    await api.post('/receivables', data);
    setRefreshCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenQuickModal={handleOpenQuickModal}
          alerts={alerts}
          onOpenAlertsModal={() => setIsNotificationOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard onOpenQuickModal={handleOpenQuickModal} refreshTrigger={refreshCount} />} />
            <Route path="/lancamentos" element={<Transactions />} />
            <Route path="/contas-a-pagar" element={<Payables />} />
            <Route path="/contas-a-receber" element={<Receivables />} />
            <Route path="/gastos-fixos" element={<FixedExpenses />} />
            <Route path="/gastos-variaveis" element={<VariableExpenses />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/categorias" element={<Categories />} />
            <Route path="/configuracoes" element={<Settings />} />

            {/* Rotas Administrativas Protegidas */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/clientes"
              element={
                <AdminRoute>
                  <AdminCompanies />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/sessoes"
              element={
                <AdminRoute>
                  <AdminSessions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/convites"
              element={
                <AdminRoute>
                  <AdminInvitations />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        alerts={alerts}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveQuickTransaction}
        initialType={transactionModalType}
        categories={categories}
      />

      <ReceivableModal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
        onSave={handleSaveQuickReceivable}
        categories={categories}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/convite/:token" element={<AcceptInvitation />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

