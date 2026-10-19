import { dataSync } from './dataSync';

const BASE_URL = '/api';

function triggerAutoSync(endpoint: string, method?: string) {
  const m = (method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) {
    if (endpoint.startsWith('/transactions')) {
      dataSync.emit('transactions');
    } else if (endpoint.startsWith('/categories')) {
      dataSync.emit('categories');
    } else if (endpoint.startsWith('/receivables')) {
      dataSync.emit('receivables');
    } else if (endpoint.startsWith('/fixed-expenses')) {
      dataSync.emit('fixed-expenses');
    } else if (endpoint.startsWith('/demo')) {
      dataSync.emit('all');
    } else if (endpoint.startsWith('/auth/profile')) {
      dataSync.emit('user-profile');
    } else if (endpoint.startsWith('/admin/users')) {
      dataSync.emit('admin-users');
    } else if (endpoint.startsWith('/admin/companies')) {
      dataSync.emit('admin-companies');
    } else if (endpoint.startsWith('/admin/sessions')) {
      dataSync.emit('admin-sessions');
    } else if (endpoint.startsWith('/admin/invitations')) {
      dataSync.emit('admin-invitations');
    }
  }
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const isPublicAuthEndpoint =
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/forgot-password') ||
      endpoint.startsWith('/auth/verify-reset-code') ||
      endpoint.startsWith('/auth/reset-password') ||
      endpoint.startsWith('/auth/accept-invitation');

    if (response.status === 401 && !isPublicAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Ocorreu um erro ao processar a requisição.');
    }

    // Trigger reactive synchronization on successful state mutations
    triggerAutoSync(endpoint, options.method);

    return data as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File download helper for Excel, CSV, PDF
  async download(endpoint: string, defaultFilename: string): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
    if (!response.ok) {
      throw new Error('Falha ao realizar download do arquivo.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const api = new ApiService();
