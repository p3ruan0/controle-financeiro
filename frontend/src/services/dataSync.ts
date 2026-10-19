/**
 * Data Synchronization & Invalidation Engine
 * 
 * Provides a centralized pub/sub event bus and dependency graph
 * to ensure single source of truth and automatic cross-page synchronization
 * without requiring manual F5 or page reloads.
 */

export type SyncEntity =
  | 'categories'
  | 'transactions'
  | 'receivables'
  | 'fixed-expenses'
  | 'dashboard'
  | 'calendar'
  | 'reports'
  | 'alerts'
  | 'user-profile'
  | 'admin-users'
  | 'admin-companies'
  | 'admin-dashboard'
  | 'admin-sessions'
  | 'admin-invitations'
  | 'admin-audit-logs'
  | 'all';

// Cascading dependency graph: when key changes, all dependents are automatically invalidated
const DEPENDENCY_GRAPH: Record<SyncEntity, SyncEntity[]> = {
  transactions: ['transactions', 'dashboard', 'calendar', 'reports', 'alerts'],
  receivables: ['receivables', 'transactions', 'dashboard', 'calendar', 'reports', 'alerts'],
  categories: ['categories', 'transactions', 'receivables', 'fixed-expenses', 'dashboard', 'reports'],
  'fixed-expenses': ['fixed-expenses', 'transactions', 'dashboard', 'calendar', 'reports', 'alerts'],
  dashboard: ['dashboard', 'alerts'],
  calendar: ['calendar'],
  reports: ['reports'],
  alerts: ['alerts'],
  'user-profile': ['user-profile'],
  'admin-users': ['admin-users', 'admin-dashboard', 'admin-sessions'],
  'admin-companies': ['admin-companies', 'admin-users', 'admin-dashboard'],
  'admin-dashboard': ['admin-dashboard'],
  'admin-sessions': ['admin-sessions', 'admin-dashboard'],
  'admin-invitations': ['admin-invitations', 'admin-users', 'admin-dashboard'],
  'admin-audit-logs': ['admin-audit-logs'],
  all: [
    'categories',
    'transactions',
    'receivables',
    'fixed-expenses',
    'dashboard',
    'calendar',
    'reports',
    'alerts',
    'user-profile',
    'admin-users',
    'admin-companies',
    'admin-dashboard',
    'admin-sessions',
    'admin-invitations',
    'admin-audit-logs',
  ],
};

type SyncListener = (invalidatedEntities: Set<SyncEntity>) => void;

class DataSyncManager {
  private listeners: Map<SyncEntity, Set<SyncListener>> = new Map();
  private debounceTimers: Map<SyncEntity, any> = new Map();

  /**
   * Subscribe to changes on one or more entities
   * @returns Unsubscribe function
   */
  subscribe(
    entities: SyncEntity | SyncEntity[],
    callback: SyncListener
  ): () => void {
    const list = Array.isArray(entities) ? entities : [entities];

    list.forEach(entity => {
      if (!this.listeners.has(entity)) {
        this.listeners.set(entity, new Set());
      }
      this.listeners.get(entity)!.add(callback);
    });

    return () => {
      list.forEach(entity => {
        this.listeners.get(entity)?.delete(callback);
      });
    };
  }

  /**
   * Emit an invalidation event for one or more entities.
   * Automatically resolves cascading dependencies and notifies all subscribers.
   */
  emit(entities: SyncEntity | SyncEntity[]): void {
    const directList = Array.isArray(entities) ? entities : [entities];
    const affected = new Set<SyncEntity>();

    // Resolve cascading dependencies
    directList.forEach(e => {
      affected.add(e);
      const dependents = DEPENDENCY_GRAPH[e] || [];
      dependents.forEach(dep => affected.add(dep));
    });

    // Notify all unique subscribers
    const notifiedCallbacks = new Set<SyncListener>();

    affected.forEach(entity => {
      const entityListeners = this.listeners.get(entity);
      if (entityListeners) {
        entityListeners.forEach(listener => notifiedCallbacks.add(listener));
      }
    });

    // Also check subscribers of 'all'
    const allListeners = this.listeners.get('all');
    if (allListeners) {
      allListeners.forEach(listener => notifiedCallbacks.add(listener));
    }

    notifiedCallbacks.forEach(listener => {
      try {
        listener(affected);
      } catch (err) {
        console.error('Erro ao executar listener do DataSync:', err);
      }
    });
  }

  /**
   * Debounced emit for rapid consecutive changes (e.g., typing or batch operations)
   */
  emitDebounced(entity: SyncEntity, delay = 100): void {
    if (this.debounceTimers.has(entity)) {
      clearTimeout(this.debounceTimers.get(entity));
    }
    const timer = setTimeout(() => {
      this.emit(entity);
      this.debounceTimers.delete(entity);
    }, delay);
    this.debounceTimers.set(entity, timer);
  }
}

export const dataSync = new DataSyncManager();
