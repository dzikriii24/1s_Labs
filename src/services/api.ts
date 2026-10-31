export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: 'customer' | 'admin';
  email_verified: boolean;
  status?: string;
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
  domain?: string | null;
  domain_type?: 'new' | 'existing';
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
  billing_start_date?: string | null;
  billing_end_date?: string | null;
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
  monthlyRevenue?: number;
  activeServices: number;
  awaitingServices: number;
  expiringServices: number;
  recentPendingPayments?: any[];
}

export interface AdminAnalyticsOverview {
  range: string;
  serviceCode: string;
  summary: {
    totalPageviews: number;
    uniqueVisitors: number;
    totalClicks: number;
    totalSessions: number;
    bounceRate: number;
    clickRate: number;
  };
  timeline: { date: string; views: number; visitors: number; clicks: number }[];
  topPages: { page_path: string; page_title: string; views: number; visitors: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  referrers: { source: string; count: number }[];
  recentEvents: any[];
  trackedServices: { service_code: string; domain: string }[];
}

export interface CustomerDetail {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  email_verified: number | boolean;
  status: string;
  created_at: string;
  updated_at?: string;
  total_spent: number;
  orders_count: number;
  services_count: number;
  orders: Order[];
  payments: any[];
  services: HostingService[];
  invoices: Invoice[];
  email_logs: any[];
}

export interface HostingOverviewStats {
  totalServices: number;
  activeServices: number;
  awaitingDomain: number;
  pendingProvisioning: number;
  suspendedServices: number;
  expiredServices: number;
  upcomingExpirations: number;
  totalRevenue: number;
}

export interface ServerMonitoringData {
  server: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    timestamp: string;
    serverIp: string;
    hostname: string;
    services: { name: string; value: string; status: number; type: string }[];
  };
  resources: {
    cpu: { usage: number; maximum: number; percent: number };
    memory: { usageBytes: number; maximumBytes: number; percent: number };
    entryProcesses: { usage: number; maximum: number; percent: number };
    numberProcesses: { usage: number; maximum: number; percent: number };
    iops: { usage: number; maximum: number };
    io: { usageBytes: number; maximumBytes: number };
    diskUsageBytes: number;
    databaseDiskBytes: number;
    postgresDiskBytes: number;
    bandwidthBytes: number;
  };
  accountStats: {
    addonDomains: number;
    subdomains: number;
    aliases: number;
    emailAccounts: number;
    ftpAccounts: number;
    mysqlDatabases: number;
    postgresDatabases: number;
  };
  alerts: { level: 'warning' | 'critical'; resource: string; message: string }[];
}

export interface ServerProcessItem {
  pid: number;
  cpu: number;
  mem: number;
  elapsed: string;
  command: string;
}

export interface DomainItem {
  service_id: number;
  service_code: string;
  domain: string;
  customer_name: string;
  customer_email: string;
  service_status: string;
  server_ip: string;
  ssl_status: 'active' | 'self_signed' | 'expired' | 'not_installed' | 'failed';
  ssl_details?: any;
  autossl_problem?: string | null;
  expires_at?: string;
}

export interface FinanceOverviewData {
  totalRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  outstandingInvoicesCount: number;
  outstandingAmount: number;
  timeline: { month: string; revenue: number; transaction_count: number }[];
  serviceBreakdown: { service_name: string; revenue: number; total_orders: number }[];
}

export interface InvoiceLineItem {
  section?: string;
  category?: string;
  name: string;
  item_name?: string;
  description: string;
  qty?: number;
  quantity?: number;
  unit_price: number;
  total_price: number;
  proof_url?: string;
  payment_proof_url?: string;
}

export interface PaymentProofItem {
  filename: string;
  originalName: string;
  sizeBytes: number;
  sizeFormatted: string;
  ext: string;
  isPdf: boolean;
  isImage: boolean;
  url: string;
  previewUrl: string;
  uploadedAt: string;
  linkedInvoices: string[];
}

export interface ServiceReportItem {
  id: number;
  report_number: string;
  report_type: string;
  title: string;
  customer_name: string;
  customer_email?: string;
  service_id?: number | null;
  period_start?: string;
  period_end?: string;
  status: string;
  work_summary: string;
  work_details: any[];
  notes?: string;
  created_at: string;
}

export interface EmailLogItem {
  id: number;
  recipient: string;
  subject: string;
  template_name: string;
  email_type?: string;
  status: string;
  attempts: number;
  last_error?: string | null;
  metadata_json?: any;
  created_at: string;
  sent_at?: string | null;
}

export interface EmailTemplateItem {
  template_key: string;
  name: string;
  category: string;
  subject: string;
  heading?: string;
  body_html: string;
  body_text?: string;
  button_text?: string;
  button_url?: string;
  footer_text?: string;
  brand_color?: string;
  is_customized: boolean;
  version: number;
  variables: string[];
}

export interface ActivityLogItem {
  id: number;
  actor_id?: number;
  actor_name: string;
  actor_role: string;
  admin_email?: string;
  action: string;
  target: string;
  details?: any;
  ip_address?: string;
  result: string;
  created_at: string;
}

export interface AdminNotificationItem {
  id: string;
  type: string;
  level: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
  link?: string;
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

export interface AnalyticsSummary {
  total_pageviews: number;
  unique_visitors: number;
  total_clicks: number;
  click_rate: number;
}

export interface AnalyticsTopPage {
  page_path: string;
  page_title: string;
  views: number;
  visitors: number;
}

export interface AnalyticsTopClick {
  element_text: string;
  element_tag: string;
  page_path: string;
  count: number;
}

export interface AnalyticsEvent {
  id: number;
  event_type: 'pageview' | 'click';
  page_path: string;
  page_title: string;
  element_text: string | null;
  device: string;
  browser: string;
  created_at: string;
}

export interface AnalyticsTimelineItem {
  date: string;
  views: number;
  visitors: number;
  clicks: number;
}

export interface AnalyticsResponse {
  success: boolean;
  serviceCode: string;
  domain: string;
  range: string;
  summary: AnalyticsSummary;
  topPages: AnalyticsTopPage[];
  topClicks: AnalyticsTopClick[];
  devices: { device: string; count: number }[];
  recentActivity: AnalyticsEvent[];
  timeline: AnalyticsTimelineItem[];
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

export function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'undefined') {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
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

    register: (payload: { name: string; email: string; password: string; confirmPassword?: string; phone: string }) =>
      request<{ success: boolean; token: string; user: User; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    verifyEmail: (token: string) =>
      request<{ success: boolean; message: string; user?: User }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

    resendVerification: (email?: string) =>
      request<{ success: boolean; message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    resetPassword: (payload: { token: string; newPassword: string; confirmPassword?: string }) =>
      request<{ success: boolean; message: string }>('/auth/reset-password', {
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
    checkDomain: (domain: string) =>
      request<{ success: boolean; available: boolean; domain: string; message: string }>('/orders/check-domain', {
        method: 'POST',
        body: JSON.stringify({ domain })
      }),

    create: (payload: { plan_id: number; domain: string; domain_type?: 'new' | 'existing'; type?: 'new' | 'renewal'; related_service_id?: number; customer_notes?: string }) =>
      request<{ success: boolean; order: { orderNumber: string; paymentNumber: string; amount: string; planName: string; domain: string } }>('/orders', {
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
      }),

    getAnalytics: (serviceCode: string, range = '30d') =>
      request<AnalyticsResponse>(`/analytics/service/${serviceCode}?range=${range}`)
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
      }),

    uploadWithProgress: (
      serviceCode: string,
      path: string,
      formData: FormData,
      onProgress?: (loaded: number, total: number) => void,
      signal?: AbortSignal
    ): Promise<{ success: boolean; message: string; uploadedFiles: any[] }> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const token = getAuthToken();
        const url = `${API_BASE}/services/${serviceCode}/files/upload?path=${encodeURIComponent(path)}`;

        xhr.open('POST', url, true);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (onProgress && xhr.upload) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              onProgress(event.loaded, event.total);
            }
          };
        }

        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && json.success) {
              resolve(json);
            } else {
              reject(new Error(json.message || `Upload gagal dengan status HTTP ${xhr.status}`));
            }
          } catch {
            reject(new Error(`Respon server tidak valid (${xhr.status})`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Koneksi terputus saat mengunggah. Periksa jaringan Anda.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Waktu upload habis (timeout).'));
        };

        if (signal) {
          signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Upload dibatalkan.'));
          });
        }

        xhr.send(formData);
      });
    },

    extract: (serviceCode: string, path: string) =>
      request<{ success: boolean; message: string }>(`/services/${serviceCode}/files/extract`, {
        method: 'POST',
        body: JSON.stringify({ path })
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

    getPayments: (params?: { status?: string; search?: string }) =>
      request<{ success: boolean; payments: any[] }>(`/admin/payments${buildQueryString(params)}`),

    verifyPayment: (paymentId: number, payload: { action: 'approve' | 'reject'; reason?: string; admin_notes?: string }) =>
      request<{ success: boolean; message: string; result: any }>(`/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getServices: (params?: { status?: string; search?: string }) =>
      request<{ success: boolean; services: HostingService[] }>(`/admin/services${buildQueryString(params)}`),

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

    getCustomers: (params?: { search?: string; status?: string; sort?: string; order?: string }) =>
      request<{ success: boolean; customers: any[] }>(`/admin/customers${buildQueryString(params)}`),

    getCustomerDetail: (id: number) =>
      request<{ success: boolean; customer: CustomerDetail }>(`/admin/customers/${id}`),

    updateCustomerStatus: (id: number, status: string) =>
      request<{ success: boolean; message: string }>(`/admin/customers/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),

    // Hosting
    getHostingOverview: () =>
      request<{ success: boolean; overview: HostingOverviewStats }>('/admin/hosting/overview'),

    getHostingDetail: (id: number) =>
      request<{ success: boolean; service: any }>(`/admin/hosting/${id}`),

    getAllOrders: (params?: { status?: string; search?: string }) =>
      request<{ success: boolean; orders: Order[] }>(`/admin/orders${buildQueryString(params)}`),

    // Analytics
    getAnalyticsOverview: (params?: { range?: string; serviceCode?: string; startDate?: string; endDate?: string }) =>
      request<{ success: boolean } & AdminAnalyticsOverview>(`/admin/analytics/overview${buildQueryString(params)}`),

    // Server Monitoring & Processes
    getServerMonitoring: () =>
      request<{ success: boolean } & ServerMonitoringData>('/admin/server/monitoring'),

    getServerProcesses: () =>
      request<{ success: boolean; count: number; processes: ServerProcessItem[] }>('/admin/server/processes'),

    getLiveProcesses: () =>
      request<{ success: boolean; count: number; processes: ServerProcessItem[] }>('/admin/server/processes'),

    killServerProcess: (pid: number, reason?: string) =>
      request<{ success: boolean; message: string; result: any }>('/admin/server/kill-process', {
        method: 'POST',
        body: JSON.stringify({ pid, reason })
      }),

    terminateProcess: (pid: number, reason?: string) =>
      request<{ success: boolean; message: string; result: any }>('/admin/server/kill-process', {
        method: 'POST',
        body: JSON.stringify({ pid, reason })
      }),

    // Domains & SSL
    getDomains: () =>
      request<{ success: boolean; domains: DomainItem[] }>('/admin/domains'),

    getSslCertificates: () =>
      request<{ success: boolean; isInProgress: boolean; certificates: any[]; problems: any[] }>('/admin/ssl/certificates'),

    startAutoSslCheck: (domain?: string) =>
      request<{ success: boolean; message: string; result: any }>('/admin/ssl/start-check', {
        method: 'POST',
        body: JSON.stringify({ domain })
      }),

    runAutoSsl: () =>
      request<{ success: boolean; message: string; result: any }>('/admin/ssl/start-check', {
        method: 'POST'
      }),

    verifyDomainDns: (domain: string) =>
      request<{ success: boolean; domain: string; isPointed: boolean; resolvedIps: string[]; serverIp: string; message: string }>('/admin/ssl/verify-domain', {
        method: 'POST',
        body: JSON.stringify({ domain })
      }),

    // Finance & Invoices
    getFinanceOverview: () =>
      request<{ success: boolean; revenue: FinanceOverviewData }>('/admin/finance/overview'),

    getInvoices: (params?: { status?: string; search?: string }) =>
      request<{ success: boolean; invoices: Invoice[] }>(`/admin/invoices${buildQueryString(params)}`),

    createInvoice: (payload: {
      invoiceNumber?: string;
      invoice_number?: string;
      customerId?: number;
      customer_id?: number;
      customerName?: string;
      customer_name?: string;
      customerEmail?: string;
      customer_email?: string;
      customerPhone?: string;
      customer_phone?: string;
      customerAddress?: string;
      customer_address?: string;
      dueDate?: string;
      due_date?: string;
      notes?: string;
      items: any[];
      discount?: number;
      discount_amount?: number;
      tax?: number;
      tax_amount?: number;
      dpAmount?: number;
      dp_amount?: number;
      balanceDue?: number;
      balance_due?: number;
      paymentProofUrl?: string;
      payment_proof_url?: string;
      status?: string;
      period?: string;
      domain?: string;
    }) =>
      request<{ success: boolean; message: string; invoice: any }>('/admin/invoices/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateInvoice: (id: number, payload: any) =>
      request<{ success: boolean; message: string; invoice?: any }>(`/admin/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    updateInvoiceStatus: (id: number, status: string) =>
      request<{ success: boolean; message: string }>(`/admin/invoices/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),

    sendInvoiceEmail: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/invoices/${id}/send-email`, {
        method: 'POST'
      }),

    // Payment Proofs Vault
    getProofs: () =>
      request<{ success: boolean; totalCount: number; proofs: PaymentProofItem[] }>('/admin/proofs'),

    uploadProofs: (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      return request<{ success: boolean; message: string; uploaded: PaymentProofItem[] }>('/admin/proofs/upload', {
        method: 'POST',
        body: formData
      });
    },

    deleteProof: (filename: string) =>
      request<{ success: boolean; message: string }>(`/admin/proofs/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      }),

    // Service Reports
    getServiceReports: () =>
      request<{ success: boolean; reports: ServiceReportItem[] }>('/admin/reports'),

    createServiceReport: (payload: {
      reportType: string;
      title: string;
      customerName: string;
      customerEmail?: string;
      serviceId?: number;
      periodStart?: string;
      periodEnd?: string;
      status?: string;
      workSummary: string;
      workDetails?: any[];
      notes?: string;
    }) =>
      request<{ success: boolean; message: string; reportNumber: string }>('/admin/reports', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    // Email Management & Templates
    getEmailLogs: (params?: { status?: string; search?: string; limit?: number }) =>
      request<{ success: boolean; stats: any; logs: EmailLogItem[] }>(`/admin/emails/logs${buildQueryString(params)}`),

    getEmailTemplates: () =>
      request<{ success: boolean; templates: EmailTemplateItem[] }>('/admin/emails/templates'),

    updateEmailTemplate: (key: string, payload: Partial<EmailTemplateItem>) =>
      request<{ success: boolean; message: string }>(`/admin/emails/templates/${key}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    resetEmailTemplate: (key: string) =>
      request<{ success: boolean; message: string }>(`/admin/emails/templates/${key}/reset`, {
        method: 'POST'
      }),

    sendTestEmail: (recipient: string, templateKey: string) =>
      request<{ success: boolean; message: string }>('/admin/emails/test-send', {
        method: 'POST',
        body: JSON.stringify({ recipient, templateKey })
      }),

    // Activity Logs & Notifications
    getActivityLogs: (params?: { action?: string; search?: string; limit?: number }) =>
      request<{ success: boolean; logs: ActivityLogItem[] }>(`/admin/activity-logs${buildQueryString(params)}`),

    getNotifications: () =>
      request<{ success: boolean; unreadCount: number; notifications: AdminNotificationItem[] }>('/admin/notifications'),

    // System Settings
    getSystemSettings: () =>
      request<{ success: boolean; settings: Record<string, any>; raw: any[] }>('/admin/system/settings'),

    updateSystemSettings: (settings: Record<string, any>) =>
      request<{ success: boolean; message: string }>('/admin/system/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings })
      })
  }
};
