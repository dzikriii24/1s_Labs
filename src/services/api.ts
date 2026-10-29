export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: 'customer' | 'admin';
  createdAt?: string;
  activeServicesCount?: number;
  pendingOrdersCount?: number;
}

export interface HostingPlan {
  id: number;
  slug: string;
  name: string;
  target: string;
  price: string;
  period: string;
  billing_cycle_months: number;
  description: string;
  storage_gb: number;
  databases_count: number;
  bandwidth: string;
  ssl_type: string;
  backup_frequency: string;
  email_accounts: string;
  is_recommended: boolean | number;
  is_active: boolean | number;
  display_order: number;
  features: string[];
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  plan_id: number;
  plan_name_snapshot: string;
  price_snapshot: string;
  period_snapshot: string;
  type: 'new' | 'renewal';
  related_service_id?: number | null;
  status: 'unpaid' | 'pending_verification' | 'paid' | 'cancelled' | 'expired';
  customer_notes?: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_id?: number;
  payment_number?: string;
  payment_status?: string;
  payment_amount?: string;
  proof_image?: string | null;
  sender_bank_or_wallet?: string | null;
  sender_account_name?: string | null;
  payment_notes?: string | null;
  rejection_reason?: string | null;
  verified_at?: string | null;
  service_id?: number;
  service_code?: string;
  domain?: string | null;
  service_status?: string;
}

export interface ServiceEvent {
  id: number;
  event_type: string;
  title: string;
  description: string;
  actor_type: 'system' | 'admin' | 'customer';
  created_at: string;
}

export interface HostingService {
  id: number;
  service_code: string;
  user_id: number;
  plan_id: number;
  order_id: number;
  domain: string | null;
  domain_type: 'new' | 'existing';
  status: 'awaiting_domain' | 'pending_provisioning' | 'active' | 'suspended' | 'expired' | 'cancelled';
  server_ip: string;
  nameservers: string;
  cpanel_username?: string | null;
  cpanel_url?: string | null;
  activated_at?: string | null;
  expires_at?: string | null;
  disk_usage_mb: number;
  disk_limit_mb: number;
  bandwidth_usage_mb: number;
  admin_notes?: string | null;
  created_at: string;
  plan_name: string;
  plan_slug: string;
  plan_price: string;
  plan_period?: string;
  storage_gb: number;
  databases_count: number;
  bandwidth: string;
  ssl_type: string;
  backup_frequency: string;
  email_accounts?: string;
  days_remaining: number;
  is_expiring_soon?: boolean;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_number?: string;
  order_date?: string;
  invoice_number?: string;
  plan_features?: string[];
  events?: ServiceEvent[];
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  payment_id?: number | null;
  user_id: number;
  service_id?: number | null;
  amount: string;
  status: 'unpaid' | 'paid' | 'cancelled';
  plan_name: string;
  domain?: string | null;
  period: string;
  paid_at?: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_number?: string;
  order_created_at?: string;
  payment_number?: string;
  payment_method?: string;
  verified_at?: string | null;
  service_code?: string;
  current_service_domain?: string | null;
}

export interface QRISInfo {
  imageUrl: string;
  merchantName: string;
  supportedApps: string[];
  whatsappSupport: string;
  instructions: string[];
}

export interface AdminStats {
  totalCustomers: number;
  totalOrders: number;
  pendingPayments: number;
  paidPayments: number;
  totalRevenue: number;
  activeServices: number;
  awaitingServices: number;
  expiringServices: number;
}

// === HOSTING MANAGEMENT INTERFACES ===
export interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  sizeFormatted: string;
  extension: string | null;
  mtime: string;
  mode: string;
}

export interface FileListResponse {
  success: boolean;
  currentPath: string;
  items: FileItem[];
  totalUsageBytes: number;
  totalUsageFormatted: string;
}

export interface FileContentResponse {
  success: boolean;
  path: string;
  name: string;
  size: number;
  sizeFormatted: string;
  content: string;
}

export interface FtpAccount {
  id: number;
  username: string;
  homedir: string;
  quota_mb: number;
  created_at: string;
}

export interface FtpListResponse {
  success: boolean;
  accounts: FtpAccount[];
  connectionInfo: {
    host: string;
    port: number;
    protocol: string;
    encryption: string;
    recommendedClient: string;
  };
}

export interface HostingDatabase {
  id: number;
  db_name: string;
  db_user: string;
  db_host: string;
  created_at: string;
  tableCount: number;
  sizeBytes: number;
  sizeFormatted: string;
}

export interface DatabaseListResponse {
  success: boolean;
  databases: HostingDatabase[];
  quota: {
    allowed: number;
    used: number;
  };
  connectionDefault: {
    host: string;
    port: number;
    type: string;
  };
}

export interface TableItem {
  name: string;
  rows: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface TableRecordsResponse {
  success: boolean;
  tableName: string;
  columns: { name: string; type: string; isNullable: boolean; key: string }[];
  records: any[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface DatabaseBackup {
  id: number;
  service_id: number;
  database_id: number;
  database_name: string;
  backup_type: 'daily_auto' | 'manual';
  filename: string;
  file_path: string;
  file_size: number;
  file_size_formatted: string;
  status: 'completed' | 'failed' | 'restoring';
  created_at: string;
}

const API_BASE = '/api';


function getAuthToken(): string | null {
  return localStorage.getItem('oneslabs_token');
}

export function setAuthSession(token: string, user: User) {
  localStorage.setItem('oneslabs_token', token);
  localStorage.setItem('oneslabs_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('oneslabs_token');
  localStorage.removeItem('oneslabs_user');
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('oneslabs_user');
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const rawText = await response.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    if (response.status === 401) {
      clearAuthSession();
      window.location.href = '/login?expired=1';
      throw new Error('Sesi login telah kedaluwarsa. Silakan masuk kembali.');
    }
    throw new Error(rawText ? `Server (${response.status}): ${rawText.slice(0, 150)}` : `Gagal menghubungi server (Status ${response.status})`);
  }

  if (!response.ok || data.success === false) {
    if (response.status === 401) {
      clearAuthSession();
      window.location.href = '/login?expired=1';
    }
    throw new Error(data.message || `Permintaan gagal (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),

    register: (payload: { name: string; email: string; password: string; confirmPassword?: string; phone?: string }) =>
      request<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getMe: () =>
      request<{ success: boolean; user: User }>('/auth/me'),

    updateProfile: (payload: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) =>
      request<{ success: boolean; user: User; message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
  },

  // Plans
  plans: {
    getAll: () =>
      request<{ success: boolean; plans: HostingPlan[] }>('/plans'),

    getBySlugOrId: (idOrSlug: string | number) =>
      request<{ success: boolean; plan: HostingPlan }>(`/plans/${idOrSlug}`)
  },

  // Orders
  orders: {
    create: (payload: { plan_id: number; type?: 'new' | 'renewal'; related_service_id?: number; customer_notes?: string }) =>
      request<{ success: boolean; order: { orderNumber: string; paymentNumber: string; amount: string; planName: string } }>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getAll: (params?: { status?: string }) => {
      const q = params?.status ? `?status=${params.status}` : '';
      return request<{ success: boolean; orders: Order[] }>(`/orders${q}`);
    },

    getByNumber: (orderNumber: string) =>
      request<{ success: boolean; order: Order }>(`/orders/${orderNumber}`),

    cancel: (orderNumber: string) =>
      request<{ success: boolean; message: string }>(`/orders/${orderNumber}/cancel`, {
        method: 'POST'
      })
  },

  // Payments
  payments: {
    getQrisInfo: () =>
      request<{ success: boolean; qris: QRISInfo }>('/payments/qris-info'),

    confirm: (orderNumber: string, formData: FormData) =>
      request<{ success: boolean; message: string; status: string }>(`/payments/${orderNumber}/confirm`, {
        method: 'POST',
        body: formData
      })
  },

  // Hosting Services
  services: {
    getAll: () =>
      request<{ success: boolean; services: HostingService[] }>('/services'),

    getByCode: (serviceCode: string) =>
      request<{ success: boolean; service: HostingService }>(`/services/${serviceCode}`),

    setupDomain: (serviceCode: string, payload: { domain: string; domain_type: 'new' | 'existing' }) =>
      request<{ success: boolean; message: string; domain: string; status: string }>(`/services/${serviceCode}/setup-domain`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    changeDomain: (serviceCode: string, payload: { domain: string }) =>
      request<{ success: boolean; message: string; domain: string }>(`/services/${serviceCode}/change-domain`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },

  // Hosting File Manager
  files: {
    list: (serviceCode: string, path = '') =>
      request<FileListResponse>(`/services/${serviceCode}/files?path=${encodeURIComponent(path)}`),

    getContent: (serviceCode: string, path: string) =>
      request<FileContentResponse>(`/services/${serviceCode}/files/content?path=${encodeURIComponent(path)}`),

    saveContent: (serviceCode: string, path: string, content: string) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/files/content`, {
        method: 'POST',
        body: JSON.stringify({ path, content })
      }),

    mkdir: (serviceCode: string, path: string, name: string) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/files/mkdir`, {
        method: 'POST',
        body: JSON.stringify({ path, name })
      }),

    create: (serviceCode: string, path: string, name: string, content = '') =>
      request<{ success: boolean; message: string; file: { path: string; name: string } }>(`/services/${serviceCode}/files/create`, {
        method: 'POST',
        body: JSON.stringify({ path, name, content })
      }),

    rename: (serviceCode: string, oldPath: string, newName: string) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/files/rename`, {
        method: 'POST',
        body: JSON.stringify({ oldPath, newName })
      }),

    delete: (serviceCode: string, path: string) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/files/delete`, {
        method: 'POST',
        body: JSON.stringify({ path })
      }),

    upload: (serviceCode: string, path: string, formData: FormData) =>
      request<{ success: boolean; message: string; uploadedFiles: any[] }>(`/services/${serviceCode}/files/upload?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        body: formData
      })
  },

  // Hosting FTP Accounts
  ftp: {
    list: (serviceCode: string) =>
      request<FtpListResponse>(`/services/${serviceCode}/ftp`),

    create: (serviceCode: string, payload: { username: string; password?: string }) =>
      request<{ success: boolean; message: string; account: FtpAccount }>(`/services/${serviceCode}/ftp`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    changePassword: (serviceCode: string, id: number, password: string) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/ftp/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password })
      }),

    delete: (serviceCode: string, id: number) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/ftp/${id}`, {
        method: 'DELETE'
      })
  },

  // Hosting Databases
  databases: {
    list: (serviceCode: string) =>
      request<DatabaseListResponse>(`/services/${serviceCode}/databases`),

    create: (serviceCode: string, payload: { nameSuffix: string; customPassword?: string }) =>
      request<{ success: boolean; message: string; database: any }>(`/services/${serviceCode}/databases`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getTables: (serviceCode: string, dbId: number) =>
      request<{ success: boolean; database: string; tables: TableItem[] }>(`/services/${serviceCode}/databases/${dbId}/tables`),

    getTableRecords: (serviceCode: string, dbId: number, tableName: string, page = 1) =>
      request<TableRecordsResponse>(`/services/${serviceCode}/databases/${dbId}/tables/${encodeURIComponent(tableName)}/records?page=${page}`),

    delete: (serviceCode: string, dbId: number) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/databases/${dbId}`, {
        method: 'DELETE'
      }),

    executeQuery: (serviceCode: string, dbId: number, sql: string) =>
      request<{ success: boolean; message: string; result: any }>(`/services/${serviceCode}/databases/${dbId}/query`, {
        method: 'POST',
        body: JSON.stringify({ sql })
      }),

    exportDatabase: async (serviceCode: string, dbId: number, defaultName = 'database.sql') => {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/services/${serviceCode}/databases/${dbId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal mengekspor database.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    },

    importDatabase: (serviceCode: string, dbId: number, formData: FormData) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/databases/${dbId}/import`, {
        method: 'POST',
        body: formData
      }),

    getBackups: (serviceCode: string, databaseId?: number) =>
      request<{ success: boolean; backups: DatabaseBackup[] }>(
        `/services/${serviceCode}/databases/backups${databaseId ? `?database_id=${databaseId}` : ''}`
      ),

    createBackup: (serviceCode: string, dbId: number) =>
      request<{ success: boolean; message: string; backup: any }>(
        `/services/${serviceCode}/databases/${dbId}/backups/create`,
        { method: 'POST' }
      ),

    downloadBackup: async (serviceCode: string, backupId: number, defaultName = 'backup.sql') => {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/services/${serviceCode}/databases/backups/${backupId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal mengunduh file cadangan.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    },

    restoreBackup: (serviceCode: string, backupId: number) =>
      request<{ success: boolean; message: string }>(
        `/services/${serviceCode}/databases/backups/${backupId}/restore`,
        { method: 'POST' }
      ),

    deleteBackup: (serviceCode: string, backupId: number) =>
      request<{ success: boolean; message: string }>(
        `/services/${serviceCode}/databases/backups/${backupId}/delete`,
        { method: 'POST' }
      )
  },



  // Invoices
  invoices: {
    getAll: () =>
      request<{ success: boolean; invoices: Invoice[] }>('/invoices'),

    getByNumber: (invoiceNumber: string) =>
      request<{ success: boolean; invoice: Invoice; company: { name: string; tagline: string; website: string; email: string; phone: string; address: string } }>(`/invoices/${invoiceNumber}`)
  },

  // Admin Portal
  admin: {
    getStats: () =>
      request<{ success: boolean; stats: AdminStats }>('/admin/stats'),

    getPayments: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ success: boolean; payments: any[] }>(`/admin/payments${q ? `?${q}` : ''}`);
    },

    verifyPayment: (paymentId: number, payload: { action: 'approve' | 'reject'; reason?: string }) =>
      request<{ success: boolean; message: string; result: any }>(`/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getServices: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ success: boolean; services: HostingService[] }>(`/admin/services${q ? `?${q}` : ''}`);
    },

    provisionService: (serviceId: number, payload: { status?: string; cpanel_username?: string; admin_notes?: string; domain?: string; server_ip?: string; nameservers?: string }) =>
      request<{ success: boolean; message: string }>(`/admin/services/${serviceId}/provision`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    getPlans: () =>
      request<{ success: boolean; plans: HostingPlan[] }>('/admin/plans'),

    updatePlan: (planId: number, payload: any) =>
      request<{ success: boolean; message: string }>(`/admin/plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    getCustomers: () =>
      request<{ success: boolean; customers: any[] }>('/admin/customers')
  }
};
