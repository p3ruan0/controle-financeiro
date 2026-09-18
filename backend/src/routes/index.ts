import { Router } from 'express';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  acceptInvitation,
} from '../controllers/authController';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  markAsPaidOrReceived,
} from '../controllers/transactionController';
import {
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  generateUpcomingTransactions,
} from '../controllers/fixedExpenseController';
import {
  getReceivables,
  createReceivable,
  updateReceivable,
  markAsReceived,
  deleteReceivable,
} from '../controllers/receivableController';
import { getDashboardData } from '../controllers/dashboardController';
import {
  getFinancialReport,
  exportExcel,
  exportCsv,
  exportPdf,
} from '../controllers/reportController';
import { getCalendarEvents } from '../controllers/calendarController';
import { loadDemoData, clearUserData } from '../controllers/demoController';

import {
  getAdminDashboard,
  getUsers,
  getUserDetails,
  createUser,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
  adminResetPassword,
  getCompanies,
  createCompany,
  updateCompany,
  toggleCompanyStatus,
  getCompanyUsers,
  getAuditLogs,
  getActiveSessions,
  terminateSession,
  terminateUserSessions,
  getInvitations,
  resendInvitation,
  cancelInvitation,
} from '../controllers/adminController';

const router = Router();

// --- HEALTH CHECK ---
router.get('/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// --- AUTH ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);
router.put('/auth/profile', authenticate, updateProfile);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/accept-invitation', acceptInvitation);

// --- DASHBOARD ---
router.get('/dashboard', authenticate, getDashboardData);

// --- CATEGORIES ---
router.get('/categories', authenticate, getCategories);
router.post('/categories', authenticate, createCategory);
router.put('/categories/:id', authenticate, updateCategory);
router.delete('/categories/:id', authenticate, deleteCategory);

// --- TRANSACTIONS ---
router.get('/transactions', authenticate, getTransactions);
router.get('/transactions/:id', authenticate, getTransactionById);
router.post('/transactions', authenticate, createTransaction);
router.put('/transactions/:id', authenticate, updateTransaction);
router.delete('/transactions/:id', authenticate, deleteTransaction);
router.patch('/transactions/:id/pay', authenticate, markAsPaidOrReceived);

// --- FIXED EXPENSES ---
router.get('/fixed-expenses', authenticate, getFixedExpenses);
router.post('/fixed-expenses', authenticate, createFixedExpense);
router.put('/fixed-expenses/:id', authenticate, updateFixedExpense);
router.delete('/fixed-expenses/:id', authenticate, deleteFixedExpense);
router.post('/fixed-expenses/generate', authenticate, generateUpcomingTransactions);

// --- RECEIVABLES ---
router.get('/receivables', authenticate, getReceivables);
router.post('/receivables', authenticate, createReceivable);
router.put('/receivables/:id', authenticate, updateReceivable);
router.delete('/receivables/:id', authenticate, deleteReceivable);
router.patch('/receivables/:id/receive', authenticate, markAsReceived);

// --- CALENDAR ---
router.get('/calendar', authenticate, getCalendarEvents);

// --- REPORTS & EXPORT ---
router.get('/reports', authenticate, getFinancialReport);
router.get('/reports/export/excel', authenticate, exportExcel);
router.get('/reports/export/csv', authenticate, exportCsv);
router.get('/reports/export/pdf', authenticate, exportPdf);

// --- DEMO SEED / CLEAR ---
router.post('/demo/load', authenticate, loadDemoData);
router.post('/demo/clear', authenticate, clearUserData);

// ==========================================
// --- PAINEL ADMINISTRATIVO (ADMIN & SUPER ADMIN) ---
// ==========================================
router.get('/admin/dashboard', authenticate, requireAdmin, getAdminDashboard);

// Usuários e Acessos
router.get('/admin/users', authenticate, requireAdmin, getUsers);
router.post('/admin/users', authenticate, requireAdmin, createUser);
router.get('/admin/users/:id', authenticate, requireAdmin, getUserDetails);
router.put('/admin/users/:id', authenticate, requireAdmin, updateUser);
router.patch('/admin/users/:id/block', authenticate, requireAdmin, blockUser);
router.patch('/admin/users/:id/unblock', authenticate, requireAdmin, unblockUser);
router.delete('/admin/users/:id', authenticate, requireAdmin, deleteUser);
router.post('/admin/users/:id/reset-password', authenticate, requireAdmin, adminResetPassword);

// Clientes / Empresas
router.get('/admin/companies', authenticate, requireAdmin, getCompanies);
router.post('/admin/companies', authenticate, requireAdmin, createCompany);
router.put('/admin/companies/:id', authenticate, requireAdmin, updateCompany);
router.patch('/admin/companies/:id/status', authenticate, requireAdmin, toggleCompanyStatus);
router.get('/admin/companies/:id/users', authenticate, requireAdmin, getCompanyUsers);

// Logs de Auditoria
router.get('/admin/audit-logs', authenticate, requireAdmin, getAuditLogs);

// Controle de Sessões
router.get('/admin/sessions', authenticate, requireAdmin, getActiveSessions);
router.delete('/admin/sessions/:id', authenticate, requireAdmin, terminateSession);
router.delete('/admin/users/:userId/sessions', authenticate, requireAdmin, terminateUserSessions);

// Convites
router.get('/admin/invitations', authenticate, requireAdmin, getInvitations);
router.post('/admin/invitations/:id/resend', authenticate, requireAdmin, resendInvitation);
router.delete('/admin/invitations/:id', authenticate, requireAdmin, cancelInvitation);

export default router;
