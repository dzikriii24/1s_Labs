export type UserRole = 'super_admin' | 'marketing' | 'pengguna' | 'admin' | 'customer' | string;

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  email_verified: boolean;
  status?: string;
  createdAt?: string;
  activeServicesCount?: number;
  pendingOrdersCount?: number;
}

export interface CompanyEmailAccount {
  email: string;
  user: string;
  domain: string;
  login?: string;
  diskused: string | number;
  diskquota: string | number;
  humandiskused: string;
  humandiskquota: string;
  diskusedpercent: number;
  suspended_login: boolean;
  suspended_incoming: boolean;
  mtime?: string | null;
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'super_admin' | 'marketing' | 'pengguna' | 'admin' | 'customer';
  status: 'active' | 'suspended';
  email_verified: boolean | number;
  created_at: string;
  updated_at?: string;
}

export interface AdminUserStats {
  total: number;
  super_admin_count: number;
  marketing_count: number;
  pengguna_count: number;
  active_count: number;
  suspended_count: number;
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

export interface FreePlanClaim {
  id: number;
  user_id?: number;
  subdomain: string;
  domain: string;
  service_code?: string;
  service_id?: number;
  claimed_at: string;
  hosting_expires_at: string;
  domain_expires_at: string;
  is_hosting_expired?: boolean;
  is_domain_expired?: boolean;
  status: 'active' | 'expired' | 'suspended';
  service_status?: string;
  provisioning_status?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  document_root?: string;
}

export interface DomainRecord {
  id: number;
  user_id: number;
  service_id?: number;
  service_code?: string;
  service_status?: string;
  plan_name?: string;
  domain: string;
  domain_type: 'free_subdomain' | 'custom_domain' | 'addon_domain';
  root_domain?: string;
  subdomain_prefix?: string;
  document_root: string;
  status: 'active' | 'pending_dns' | 'suspended' | 'expired';
  is_free_plan: boolean | number;
  ssl_status: 'active' | 'pending' | 'expired' | 'none';
  dns_status: 'connected' | 'pending' | 'error';
  registered_at: string;
  expires_at: string;
  auto_renew: boolean | number;
  days_remaining?: number;
  is_expiring_soon?: boolean;
  owner_name?: string;
  owner_email?: string;
  dns_report?: {
    connected: boolean;
    ip?: string | null;
    message: string;
  };
  dns_instructions?: {
    server_ip: string;
    nameservers: string[];
    a_record: { type: string; name: string; target: string; ttl: number };
    cname_record: { type: string; name: string; target: string; ttl: number };
  };
}

export interface NodeJsApp {
  id: number;
  user_id: number;
  service_id?: number;
  domain_id?: number;
  app_name: string;
  app_root: string;
  full_app_root?: string;
  app_uri: string;
  domain: string;
  app_url: string;
  nodejs_version: string;
  app_mode: 'production' | 'development';
  startup_file: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  health_status: 'healthy' | 'degraded' | 'error' | 'unknown';
  last_health_check?: string;
  last_response_time_ms?: number;
  last_http_status?: number;
  last_error?: string;
  last_restart_at?: string;
  deployment_count: number;
  env_vars_count?: number;
  env_vars_masked?: Record<string, string>;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
  deployments?: {
    id: number;
    deployment_number: number;
    source_type: string;
    status: string;
    file_size_bytes?: number;
    deployed_at: string;
  }[];
}

export interface LaravelDeployment {
  id: number;
  app_id: number;
  deployment_number: number;
  source_type: string;
  status: string;
  file_size_bytes?: number;
  logs?: string;
  deployed_at: string;
}

export interface LaravelApp {
  id: number;
  user_id: number;
  service_id?: number;
  domain_id?: number;
  app_name: string;
  app_root: string;
  full_app_root?: string;
  app_uri: string;
  domain: string;
  app_url: string;
  php_version: string;
  app_mode: 'production' | 'development';
  status: 'running' | 'stopped' | 'error';
  health_status: 'healthy' | 'unhealthy' | 'unknown';
  last_health_check?: string;
  last_response_time_ms?: number;
  last_http_status?: number;
  last_error?: string;
  last_restart_at?: string;
  deployment_count: number;
  created_at: string;
  updated_at?: string;
  owner_name?: string;
  owner_email?: string;
  deployments?: LaravelDeployment[];
}

export interface PythonApp {
  app_name: string;
  domain?: string;
  app_uri?: string;
  app_url?: string;
  version: string;
  app_status: 'started' | 'stopped' | string;
  status?: 'running' | 'stopped' | string;
  startup_file?: string;
  entry_point?: string;
  app_version?: number;
  config_files?: string[];
  env_vars?: Record<string, string>;
  virtualenv?: {
    activate_path: string;
  };
  health_status?: 'healthy' | 'error' | 'unknown';
  last_response_time_ms?: number;
  created_at?: string;
}

export interface OccupiedEndpoint {
  id: number;
  app_name: string;
  domain: string;
  app_uri: string;
  app_url: string;
  platform: 'nodejs' | 'laravel';
  status: string;
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
    status: 'healthy' | 'warning' | 'critical' | 'optimal' | 'high_usage' | 'emergency';
    uptime: string;
    timestamp: string;
    serverIp?: string;
    ip?: string;
    hostname: string;
    os?: string;
    cpanel_version?: string;
    load_average?: string;
    services: { name: string; value: string; status: number; type: string }[];
  };
  resources: {
    cpu: { usage: number; maximum: number; percent: number; used?: number; limit?: number };
    memory: {
      usageBytes: number;
      maximumBytes: number;
      percent: number;
      used_mb?: number;
      limit_mb?: number;
      used_formatted?: string;
      limit_formatted?: string;
    };
    entry_processes?: { used: number; limit: number; percent: number };
    entryProcesses: { usage: number; maximum: number; percent: number; used?: number; limit?: number };
    processes?: { used: number; limit: number; percent: number };
    numberProcesses: { usage: number; maximum: number; percent: number; used?: number; limit?: number };
    iops: { usage: number; maximum: number; used?: number; limit?: number };
    io: { usageBytes: number; maximumBytes: number; usage_formatted?: string; limit_formatted?: string; used_kbps?: number; percent?: number };
    disk?: { used_formatted?: string; database_formatted?: string; used_bytes?: number };
    inodes?: { used_formatted?: string; used?: number };
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
  adaptive?: {
    status: {
      level: string;
      badge: 'optimal' | 'warning' | 'high_usage' | 'critical' | 'emergency';
      dominantPct: number;
      hysteresisActive: boolean;
      cooldownRemainingSec?: number;
    };
    settings: any;
    topConsumers: {
      cpu: ServerProcessItem[];
      memory: ServerProcessItem[];
    };
    prediction: {
      trend: string;
      risk: string;
    };
    history: any[];
    recentLogs: any[];
  };
}

export interface ServerProcessItem {
  pid: number;
  ppid?: number;
  cpu: number;
  mem?: number;
  memory?: number;
  rss_mb?: number;
  vsz_mb?: number;
  threads?: number;
  status?: string;
  elapsed?: string;
  elapsed_time?: string;
  time?: string;
  user?: string;
  command: string;
  args?: string;
  appName?: string;
  category?: 'critical' | 'background' | 'idle_unnecessary';
  prunable?: boolean;
  safetyReason?: string;
  isDuplicateWorker?: boolean;
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

export interface InquiryItem {
  id: number;
  inquiry_type: 'consultation' | 'website_development' | 'website_maintenance' | 'custom_software' | 'hosting' | 'other';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service_interested?: string;
  current_website_url?: string;
  budget_range?: string;
  message: string;
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingScheduleItem {
  id: number;
  company_name: string | null;
  contact_person: string;
  email: string;
  phone: string | null;
  meeting_date: string;
  meeting_time: string;
  platform: string;
  notes: string | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'rescheduled' | 'cancelled';
  admin_notes: string | null;
  source_campaign_id?: number | null;
  created_at: string;
  updated_at?: string;
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

export interface MarketingCompany {
  id: number;
  name: string;
  normalized_name: string;
  category: string;
  business_type?: string | null;
  business_scale?: string | null;
  industry?: string | null;
  description?: string | null;
  country?: string | null;
  is_international?: boolean | number;
  currency?: string | null;
  language?: string | null;
  timezone?: string | null;
  province?: string | null;
  city?: string | null;
  full_address?: string | null;
  website_url?: string | null;
  normalized_domain?: string | null;
  google_maps_url?: string | null;
  phone?: string | null;
  normalized_phone?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  email_status?: 'VERIFIED' | 'UNVERIFIED' | 'INVALID' | 'NO_EMAIL';
  email_verified_at?: string | null;
  email_source_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  contact_page_url?: string | null;
  social_media_url?: string | null;
  has_website: boolean | number;
  website_status?: string | null;
  ssl_status?: string | null;
  is_mobile_responsive?: boolean | number | null;
  performance_score?: number | null;
  last_website_checked?: string | null;
  digital_presence_findings?: string | null;
  lead_score: number;
  lead_grade: 'cold' | 'warm' | 'hot' | string;
  lead_score_breakdown?: string[] | string | null;
  potential_needs_json?: string[] | string | null;
  recommended_services_json?: string[] | string | null;
  status: string;
  outreach_eligibility: 'eligible' | 'ineligible' | 'needs_review' | string;
  outreach_ineligible_reason?: string | null;
  primary_source_name?: string | null;
  is_priority?: boolean | number;
  is_archived?: boolean | number;
  is_deleted?: boolean | number;
  deleted_at?: string | null;
  admin_notes?: string | null;
  tags?: string | null;
  contacts_count?: number;
  first_discovered_at: string;
  last_discovered_at: string;
  enrichment_count: number;
  last_enriched_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingContact {
  id: number;
  company_id: number;
  company_name?: string;
  company_website?: string;
  company_city?: string;
  full_name: string;
  position?: string | null;
  role_category: string;
  email?: string | null;
  email_status?: 'VERIFIED' | 'UNVERIFIED' | 'INVALID' | 'NO_EMAIL';
  email_verified_at?: string | null;
  email_source_url?: string | null;
  phone?: string | null;
  channel?: string | null;
  profile_url?: string | null;
  source_url?: string | null;
  contact_type?: string;
  contact_value?: string | null;
  confidence_score?: number;
  source_name?: string;
  notes?: string | null;
  is_primary: boolean | number;
  outreach_eligible: boolean | number;
  verification_status: 'verified' | 'unverified' | 'unknown' | 'bounced' | 'Verified' | 'Likely Correct' | 'Invalid' | string;
  created_at: string;
}

export interface MarketingSource {
  id: number;
  name: string;
  url?: string | null;
  source_type: string;
  data_category?: string | null;
  collection_method: string;
  permission_notes?: string | null;
  schedule_cron: string;
  rate_limit_per_minute: number;
  max_records_per_run: number;
  is_active: boolean | number;
  health_status: 'healthy' | 'degraded' | 'failing' | 'idle';
  total_records_collected: number;
  last_successful_run?: string | null;
  last_failed_run?: string | null;
  last_error_message?: string | null;
}

export interface MarketingJob {
  id: number;
  source_id: number;
  target_sector?: string | null;
  target_province?: string | null;
  target_city?: string | null;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  records_found: number;
  records_saved: number;
  records_duplicate: number;
  records_enriched: number;
  error_summary?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface MarketingCampaign {
  id: number;
  name: string;
  template_id?: number | null;
  target_industry?: string | null;
  target_province?: string | null;
  target_category?: string | null;
  target_lead_score_min: number;
  subject: string;
  body_html: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  bounced_count: number;
  responded_count: number;
  interested_count: number;
  unsubscribed_count: number;
  created_at: string;
}

export interface MarketingEmailTemplate {
  id: number;
  name: string;
  category: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  variables_json?: string[] | string | null;
  is_default: boolean | number;
}

export interface MarketingEmailCandidate {
  id: number;
  name: string;
  email: string;
  business_scale?: string | null;
  category?: string | null;
  country?: string | null;
  city?: string | null;
  province?: string | null;
  is_international?: boolean | number;
  company_status: string;
  last_contacted_at?: string | null;
  contacted_times: number;
  email_sent_count: number;
  last_sent_at?: string | null;
  contact_person_name?: string | null;
  contact_person_position?: string | null;
  contact_person_email?: string | null;
  contact_person_id?: number | null;
}

export interface MarketingEmailLogItem {
  id: number;
  campaign_id?: number | null;
  campaign_name?: string | null;
  company_id?: number | null;
  current_company_name?: string | null;
  company_name?: string | null;
  country?: string | null;
  is_international?: boolean | number;
  contact_id?: number | null;
  contact_position?: string | null;
  recipient_name?: string | null;
  recipient_email: string;
  subject: string;
  body_html?: string | null;
  message_id?: string | null;
  status: 'sent' | 'failed' | 'rejected' | string;
  error_details?: string | null;
  sent_at: string;
}

export interface MarketingCampaignRecipient {
  id: number;
  campaign_id: number;
  company_id: number;
  contact_id?: number | null;
  recipient_email: string;
  recipient_name?: string | null;
  company_name?: string | null;
  comp_name?: string | null;
  city?: string | null;
  province?: string | null;
  is_international?: boolean | number;
  country?: string | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped' | 'unsubscribed';
  error_message?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface MarketingEmailReply {
  id: number;
  campaign_id?: number | null;
  company_id?: number | null;
  company_name?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  from_email: string;
  from_name?: string | null;
  subject: string;
  body_text: string;
  body_html?: string | null;
  received_at: string;
  classification: string;
  ai_summary?: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  status: 'unread' | 'read' | 'assigned' | 'replied' | 'closed';
  admin_notes?: string | null;
}

export interface MarketingChatMessage {
  id: string;
  db_id?: number;
  direction: 'outgoing' | 'incoming';
  sender_name?: string;
  sender_email?: string;
  recipient_email?: string;
  subject?: string;
  body: string;
  body_html?: string;
  timestamp: string;
  status?: string;
  classification?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  ai_summary?: string;
  admin_notes?: string;
}

export interface MarketingConversationThread {
  customer_email: string;
  customer_name?: string;
  company_id?: number | null;
  company_name?: string | null;
  company_category?: string | null;
  company_phone?: string | null;
  company_status?: string;
  unread_count: number;
  last_message_text: string;
  last_message_at: string;
  last_direction: 'outgoing' | 'incoming';
  classification: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  ai_summary?: string | null;
  message_count: number;
  messages: MarketingChatMessage[];
}

export interface MarketingFollowup {
  id: number;
  company_id: number;
  company_name?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
  company_city?: string | null;
  title: string;
  notes?: string | null;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'cancelled';
  completed_at?: string | null;
}

export interface MarketingSuppression {
  id: number;
  email?: string | null;
  email_status?: 'VERIFIED' | 'UNVERIFIED' | 'INVALID' | 'NO_EMAIL';
  email_verified_at?: string | null;
  email_source_url?: string | null;
  domain?: string | null;
  reason: string;
  notes?: string | null;
  source: string;
  suppressed_at: string;
}

export interface MarketingAiLog {
  id: number;
  model: string;
  purpose: string;
  company_id?: number | null;
  status: string;
  latency_ms: number;
  input_snapshot?: string | null;
  created_at: string;
}

export interface MarketingStatsResponse {
  success: boolean;
  counts?: {
    total_prospects?: number;
    total_small_business?: number;
    total_indonesia?: number;
    total_international?: number;
    without_contacts?: number;
    without_contacts_indonesia?: number;
    with_contacts?: number;
    with_contacts_indonesia?: number;
    with_whatsapp_count?: number;
    with_whatsapp_indonesia?: number;
    high_potential_count?: number;
    high_potential_indonesia?: number;
    contacted_count?: number;
    not_contacted_count?: number;
    contacted_indonesia?: number;
    not_contacted_indonesia?: number;
    [key: string]: any;
  };
  stats: {
    total_prospects: number;
    total_small_business?: number;
    total_indonesia?: number;
    without_contacts?: number;
    with_contacts?: number;
    with_whatsapp_count?: number;
    high_potential_count?: number;
    contacted_count?: number;
    not_contacted_count?: number;
    total_umkm: number;
    total_companies: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    verified_count: number;
    with_email_count: number;
    outreach_eligible_count: number;
    emails_sent_today: number;
    remaining_quota_today: number;
    max_daily_quota: number;
    total_sent: number;
    total_failed: number;
    total_responded: number;
    total_interested: number;
    total_consultations: number;
    total_converted: number;
  };
  quota: {
    date: string;
    sent_count: number;
    max_limit: number;
    remaining_quota: number;
    is_quota_exhausted: boolean;
  };
  todaysDiscovery: MarketingCompany[];
  aiActivities: MarketingAiLog[];
  charts: {
    bySource: { source: string; count: number }[];
    bySector: { sector: string; count: number }[];
    byProvince: { province: string; count: number }[];
    dailyGrowth: { date: string; count: number }[];
    funnel: { stage: string; count: number }[];
  };
}

// ==========================================
// HR & RECRUITMENT MANAGEMENT TYPES
// ==========================================
export type HRPromotedStatus =
  | 'new_candidate'
  | 'contacted'
  | 'responded'
  | 'screening'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offered'
  | 'rejected'
  | 'on_hold';

export type HREmailStatus =
  | 'not_contacted'
  | 'sent'
  | 'delivered'
  | 'replied'
  | 'bounced'
  | 'failed';

export interface HRPosition {
  id: number;
  name: string;
  department: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  location?: string;
  description?: string;
  requirements?: string;
  status: 'active' | 'inactive' | 'closed';
  candidates_count?: number;
  new_candidates_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface HRCandidate {
  id: number;
  position_id: number;
  position_name?: string;
  department?: string;
  position_employment_type?: string;
  full_name: string;
  email: string;
  phone?: string;
  source: string;
  recruitment_status: HRPromotedStatus;
  email_status: HREmailStatus;
  notes?: string;
  rating?: number;
  resume_url?: string;
  portfolio_url?: string;
  last_activity_at: string;
  created_at: string;
  updated_at?: string;
}

export interface HRCandidateActivity {
  id: number;
  candidate_id: number;
  activity_type: string;
  title: string;
  description?: string;
  metadata_json?: any;
  created_by?: string;
  created_at: string;
}

export interface HREmailTemplate {
  id: number;
  template_key: string;
  name: string;
  category: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables_json?: string;
  is_default: number | boolean;
  created_at: string;
  updated_at?: string;
}

export interface HREmailLog {
  id: number;
  campaign_id?: number;
  candidate_id?: number;
  candidate_name?: string;
  recipient_email: string;
  recipient_name?: string;
  sender_email: string;
  subject: string;
  body_html?: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  message_id?: string;
  error_message?: string;
  sent_at: string;
}

export interface HREmailReply {
  id: number;
  candidate_id?: number;
  from_email: string;
  from_name?: string;
  subject: string;
  body_text: string;
  body_html?: string;
  received_at: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  message_id?: string;
  in_reply_to?: string;
}

export interface HRConversationThread {
  from_email: string;
  from_name?: string;
  last_message_date: string;
  last_subject: string;
  last_preview: string;
  unread_count: number;
  total_messages: number;
  candidate_id?: number;
  candidate_name?: string;
  position_name?: string;
  recruitment_status?: HRPromotedStatus;
  email_status?: HREmailStatus;
}

export interface HRInterviewSlotCandidate {
  id: number;
  queue_number: number;
  candidate_name: string;
  status: string;
  queue_status?: string;
  estimated_start_time?: string;
  estimated_end_time?: string;
}

export interface HRInterviewSlot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  timezone: string;
  meeting_link?: string;
  max_capacity?: number;
  booked_count?: number;
  remaining_capacity?: number;
  duration_per_candidate?: number;
  next_queue_number?: number;
  estimated_start_time?: string;
  estimated_end_time?: string;
  is_booked: number | boolean;
  is_active: number | boolean;
  candidates?: HRInterviewSlotCandidate[];
}

export interface HRInterview {
  id: number;
  candidate_id: number;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  position_id?: number;
  position_name?: string;
  department?: string;
  slot_id?: number;
  queue_number?: number;
  estimated_start_time?: string;
  estimated_end_time?: string;
  queue_status?: 'waiting' | 'in_progress' | 'completed' | string;
  scheduling_token: string;
  token_expires_at: string;
  interview_date?: string;
  interview_time?: string;
  timezone: string;
  meeting_platform: string;
  meeting_link?: string;
  instructions?: string;
  status: 'pending_selection' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'rescheduled' | 'cancelled';
  cancellation_reason?: string;
  interviewer_notes?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
}

export interface HRNotification {
  id: number;
  type: string;
  candidate_id?: number;
  interview_id?: number;
  title: string;
  message: string;
  is_read: number | boolean;
  created_at: string;
}

export interface HRStatsResponse {
  success: boolean;
  stats: {
    total_candidates: number;
    new_candidates: number;
    emails_sent: number;
    candidates_replied: number;
    interview_scheduled: number;
    interview_completed: number;
    candidates_accepted: number;
    candidates_rejected: number;
  };
  timeline: { date: string; count: number }[];
  status_breakdown: { status: HRPromotedStatus; count: number }[];
  recent_emails: any[];
  upcoming_interviews: HRInterview[];
  recent_activities: any[];
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

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    if (retries > 0 && (!options.method || options.method === 'GET')) {
      await new Promise(r => setTimeout(r, 1200));
      return request<T>(endpoint, options, retries - 1);
    }
    throw new Error('Gagal terhubung ke jaringan server. Periksa koneksi internet Anda.');
  }

  // Handle transient 502/503/504 errors during Passenger/LiteSpeed restart
  if ([502, 503, 504].includes(response.status) && retries > 0) {
    await new Promise(r => setTimeout(r, 1200));
    return request<T>(endpoint, options, retries - 1);
  }

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

    if (response.status === 503) {
      throw new Error('Server backend sedang memuat ulang proses (503 Service Unavailable). Silakan tunggu beberapa detik dan coba lagi.');
    }
    if (response.status === 502) {
      throw new Error('Gateway server sedang sibuk (502 Bad Gateway). Silakan coba lagi.');
    }
    if (response.status === 504) {
      throw new Error('Batas waktu koneksi server terlampaui (504 Gateway Timeout).');
    }

    const cleanText = rawText.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    throw new Error(cleanText ? `Server (${response.status}): ${cleanText.slice(0, 120)}` : `Gagal menghubungi server (Status ${response.status})`);
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

    sync: (serviceCode: string) =>
      request<{ success: boolean; message: string; syncedCount: number }>(`/services/${serviceCode}/databases/sync`, {
        method: 'POST'
      }),

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

    // Intelligent Resource Management & Adaptive Optimization
    runOptimization: (dryRun?: boolean) =>
      request<{ success: boolean; message: string; result: any }>('/admin/server/optimization/run', {
        method: 'POST',
        body: JSON.stringify({ dryRun })
      }),

    getOptimizationSettings: () =>
      request<{ success: boolean; settings: any }>('/admin/server/optimization/settings'),

    updateOptimizationSettings: (settings: any) =>
      request<{ success: boolean; message: string; settings: any }>('/admin/server/optimization/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      }),

    getOptimizationLogs: () =>
      request<{ success: boolean; count: number; logs: any[] }>('/admin/server/optimization/logs'),

    getDatabaseAudit: () =>
      request<{ success: boolean; audit: any }>('/admin/server/database/audit'),

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
      }),

    // Free Plan, Domains & Node.js Management
    getFreePlanClaims: () =>
      request<{ success: boolean; claims: FreePlanClaim[] }>('/admin/freeplan/claims'),

    runInfrastructureCron: () =>
      request<{ success: boolean; message: string; results: any }>('/admin/infrastructure/run-cron', {
        method: 'POST'
      }),

    adminSuspendDomain: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/domains/${id}/suspend`, { method: 'POST' }),

    adminUnsuspendDomain: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/domains/${id}/unsuspend`, { method: 'POST' }),

    adminSuspendHosting: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hosting/${id}/suspend`, { method: 'POST' }),

    adminUnsuspendHosting: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hosting/${id}/unsuspend`, { method: 'POST' }),

    getAdminNodeJsApps: () =>
      request<{ success: boolean; applications: NodeJsApp[] }>('/admin/nodejs/apps'),

    getAdminLaravelApps: () =>
      request<{ success: boolean; applications: LaravelApp[] }>('/admin/laravel/apps')
  },

  // Free Plan User API
  freePlan: {
    getStatus: () =>
      request<{ success: boolean; eligible: boolean; alreadyClaimed: boolean; claim: FreePlanClaim | null }>('/freeplan/status'),

    checkSubdomain: (subdomain: string) =>
      request<{ success: boolean; available: boolean; subdomain?: string; domain?: string; message: string }>(`/freeplan/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`),

    claim: (subdomain: string, agreeTerms: boolean = true) =>
      request<{ success: boolean; message: string; data: any }>('/freeplan/claim', {
        method: 'POST',
        body: JSON.stringify({ subdomain, agreeTerms })
      })
  },

  // Domain Management API
  domains: {
    list: () =>
      request<{ success: boolean; domains: DomainRecord[] }>('/domains'),

    getDetail: (id: number) =>
      request<{ success: boolean; domain: DomainRecord }>(`/domains/${id}`),

    check: (domain: string, domainType: string = 'custom_domain') =>
      request<{ success: boolean; available: boolean; domain?: string; message: string }>('/domains/check', {
        method: 'POST',
        body: JSON.stringify({ domain, domain_type: domainType })
      }),

    addCustom: (domain: string, serviceId?: number) =>
      request<{ success: boolean; message: string; data: any }>('/domains/custom', {
        method: 'POST',
        body: JSON.stringify({ domain, service_id: serviceId })
      }),

    renew: (id: number) =>
      request<{ success: boolean; message: string; renewal: any }>(`/domains/${id}/renew`, {
        method: 'POST'
      })
  },

  // Node.js Application Manager API
  nodejs: {
    getVersions: () =>
      request<{ success: boolean; versions: string[]; default: string }>('/nodejs/versions'),

    getOccupiedEndpoints: () =>
      request<{
        success: boolean;
        endpoints: OccupiedEndpoint[];
      }>('/nodejs/occupied-endpoints'),

    listApps: () =>
      request<{ success: boolean; applications: NodeJsApp[] }>('/nodejs/apps'),

    getApp: (id: number) =>
      request<{ success: boolean; application: NodeJsApp }>(`/nodejs/apps/${id}`),

    createApp: (payload: {
      app_name: string;
      domain: string;
      app_uri?: string;
      nodejs_version?: string;
      app_mode?: string;
      startup_file?: string;
      env_vars?: Record<string, string>;
    }) =>
      request<{ success: boolean; message: string; application: any }>('/nodejs/apps', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    action: (id: number, action: 'start' | 'stop' | 'restart') =>
      request<{ success: boolean; message: string }>(`/nodejs/apps/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      }),

    checkHealth: (id: number) =>
      request<{ success: boolean; url: string; health: any }>(`/nodejs/apps/${id}/health`),

    getLogs: (id: number) =>
      request<{ success: boolean; app_name: string; logs: string }>(`/nodejs/apps/${id}/logs`),

    updateEnv: (id: number, env_vars: Record<string, string>) =>
      request<{ success: boolean; message: string }>(`/nodejs/apps/${id}/env`, {
        method: 'POST',
        body: JSON.stringify({ env_vars })
      }),

    deleteApp: (id: number) =>
      request<{ success: boolean; message: string }>(`/nodejs/apps/${id}`, {
        method: 'DELETE'
      }),

    updateConfig: (id: number, payload: {
      nodejs_version?: string;
      app_mode?: 'production' | 'development';
      startup_file?: string;
      env_vars?: Record<string, string>;
    }) =>
      request<{ success: boolean; message: string; application: NodeJsApp }>(`/nodejs/apps/${id}/config`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    runNpmInstall: (id: number) =>
      request<{ success: boolean; message: string; output: string }>(`/nodejs/apps/${id}/npm-install`, {
        method: 'POST'
      }),

    files: {
      list: (appId: number, path: string = '/') =>
        request<FileListResponse>(`/nodejs/apps/${appId}/files?path=${encodeURIComponent(path)}`),

      getContent: (appId: number, path: string) =>
        request<FileContentResponse>(`/nodejs/apps/${appId}/files/read?path=${encodeURIComponent(path)}`),

      saveContent: (appId: number, path: string, content: string, restart: boolean = false) =>
        request<{ success: boolean; message: string }>(`/nodejs/apps/${appId}/files/write`, {
          method: 'POST',
          body: JSON.stringify({ path, content, restart })
        }),

      createFile: (appId: number, path: string, name: string, content: string = '') =>
        request<{ success: boolean; message: string }>(`/nodejs/apps/${appId}/files/create-file`, {
          method: 'POST',
          body: JSON.stringify({ path, name, content })
        }),

      createFolder: (appId: number, path: string, name: string) =>
        request<{ success: boolean; message: string }>(`/nodejs/apps/${appId}/files/create-folder`, {
          method: 'POST',
          body: JSON.stringify({ path, name })
        }),

      delete: (appId: number, path: string) =>
        request<{ success: boolean; message: string }>(`/nodejs/apps/${appId}/files`, {
          method: 'DELETE',
          body: JSON.stringify({ path })
        }),

      rename: (appId: number, oldPath: string, newPath: string) =>
        request<{ success: boolean; message: string }>(`/nodejs/apps/${appId}/files/rename`, {
          method: 'POST',
          body: JSON.stringify({ oldPath, newPath })
        }),

      getDownloadUrl: (appId: number, path: string) => {
        const token = getAuthToken();
        return `/api/nodejs/apps/${appId}/files/download?path=${encodeURIComponent(path)}${token ? `&token=${token}` : ''}`;
      },

      uploadWithProgress: (
        appId: number,
        path: string,
        formData: FormData,
        onProgress?: (loaded: number, total: number) => void,
        signal?: AbortSignal
      ): Promise<{ success: boolean; message: string }> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const token = getAuthToken();
          const url = `${API_BASE}/nodejs/apps/${appId}/files/upload?path=${encodeURIComponent(path)}`;

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

          if (signal) {
            signal.addEventListener('abort', () => {
              xhr.abort();
              reject(new Error('Unggahan dibatalkan.'));
            });
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
            reject(new Error('Terjadi kesalahan jaringan saat mengunggah file.'));
          };

          xhr.send(formData);
        });
      }
    },

    deployZip: async (id: number, file: File): Promise<{ success: boolean; message: string; deployment_number: number }> => {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('source_zip', file);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/nodejs/apps/${id}/deploy`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengunggah dan mendepoloy file ZIP.');
      }
      return data;
    }
  },

  // Laravel Application Manager API
  laravel: {
    getVersions: () =>
      request<{ success: boolean; versions: string[]; default: string }>('/laravel/versions'),

    getOccupiedEndpoints: () =>
      request<{
        success: boolean;
        endpoints: OccupiedEndpoint[];
      }>('/laravel/occupied-endpoints'),

    listApps: () =>
      request<{ success: boolean; applications: LaravelApp[] }>('/laravel/apps'),

    getApp: (id: number) =>
      request<{ success: boolean; application: LaravelApp }>(`/laravel/apps/${id}`),

    createApp: (payload: {
      app_name: string;
      domain: string;
      app_uri?: string;
      php_version?: string;
      app_mode?: string;
      env_vars?: Record<string, string>;
    }) =>
      request<{ success: boolean; message: string; application: any }>('/laravel/apps', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    deployZip: async (id: number, zipFile: File): Promise<{ success: boolean; message: string; deployment?: any }> => {
      const formData = new FormData();
      formData.append('zipFile', zipFile);
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/laravel/apps/${id}/deploy`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengunggah dan mendeploy file ZIP Laravel.');
      }
      return data;
    },

    runArtisan: (id: number, command: string) =>
      request<{ success: boolean; command: string; output: string; error?: string }>(`/laravel/apps/${id}/artisan`, {
        method: 'POST',
        body: JSON.stringify({ command })
      }),

    getEnv: (id: number) =>
      request<{ success: boolean; content: string }>(`/laravel/apps/${id}/env`),

    updateEnv: (id: number, content: string) =>
      request<{ success: boolean; message: string }>(`/laravel/apps/${id}/env`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      }),

    getLogs: (id: number) =>
      request<{ success: boolean; logs: string }>(`/laravel/apps/${id}/logs`),

    checkHealth: (id: number) =>
      request<{
        success: boolean;
        health: {
          healthy: boolean;
          status: number;
          statusText: string;
          responseTimeMs: number;
          checkedAt: string;
          url: string;
        };
      }>(`/laravel/apps/${id}/health-check`, {
        method: 'POST'
      }),

    deleteApp: (id: number) =>
      request<{ success: boolean; message: string }>(`/laravel/apps/${id}`, {
        method: 'DELETE'
      }),

    action: (id: number, action: 'start' | 'stop' | 'restart') =>
      request<{ success: boolean; message: string }>(`/laravel/apps/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      }),

    runComposerInstall: (id: number) =>
      request<{ success: boolean; message: string; output: string }>(`/laravel/apps/${id}/composer-install`, {
        method: 'POST'
      }),

    files: {
      list: (appId: number, path: string = '/') =>
        request<FileListResponse>(`/laravel/apps/${appId}/files?path=${encodeURIComponent(path)}`),

      getContent: (appId: number, path: string) =>
        request<FileContentResponse>(`/laravel/apps/${appId}/files/read?path=${encodeURIComponent(path)}`),

      saveContent: (appId: number, path: string, content: string, restart: boolean = false) =>
        request<{ success: boolean; message: string }>(`/laravel/apps/${appId}/files/write`, {
          method: 'POST',
          body: JSON.stringify({ path, content, restart })
        }),

      createFile: (appId: number, path: string, name: string, content: string = '') =>
        request<{ success: boolean; message: string }>(`/laravel/apps/${appId}/files/create-file`, {
          method: 'POST',
          body: JSON.stringify({ path, name, content })
        }),

      createFolder: (appId: number, path: string, name: string) =>
        request<{ success: boolean; message: string }>(`/laravel/apps/${appId}/files/create-folder`, {
          method: 'POST',
          body: JSON.stringify({ path, name })
        }),

      delete: (appId: number, path: string) =>
        request<{ success: boolean; message: string }>(`/laravel/apps/${appId}/files`, {
          method: 'DELETE',
          body: JSON.stringify({ path })
        }),

      rename: (appId: number, oldPath: string, newPath: string) =>
        request<{ success: boolean; message: string }>(`/laravel/apps/${appId}/files/rename`, {
          method: 'POST',
          body: JSON.stringify({ oldPath, newPath })
        }),

      getDownloadUrl: (appId: number, path: string) => {
        const token = getAuthToken();
        return `/api/laravel/apps/${appId}/files/download?path=${encodeURIComponent(path)}${token ? `&token=${token}` : ''}`;
      },

      uploadWithProgress: (
        appId: number,
        path: string,
        formData: FormData,
        onProgress?: (loaded: number, total: number) => void,
        signal?: AbortSignal
      ): Promise<{ success: boolean; message: string }> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const token = getAuthToken();
          const url = `${API_BASE}/laravel/apps/${appId}/files/upload?path=${encodeURIComponent(path)}`;

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

          if (signal) {
            signal.addEventListener('abort', () => {
              xhr.abort();
              reject(new Error('Unggahan dibatalkan.'));
            });
          }

          xhr.onload = () => {
            try {
              const json = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300 && json.success) {
                resolve(json);
              } else {
                reject(new Error(json.message || 'Gagal mengunggah file ke direktori Laravel.'));
              }
            } catch (e) {
              reject(new Error('Respon server tidak valid saat upload.'));
            }
          };

          xhr.onerror = () => reject(new Error('Koneksi jaringan terputus saat mengunggah.'));
          xhr.send(formData);
        });
      }
    }
  },

  // Python Application Manager API (CloudLinux Selector)
  python: {
    getVersions: () =>
      request<{ success: boolean; versions: string[]; default: string }>('/python/versions'),

    getOccupiedEndpoints: () =>
      request<{
        success: boolean;
        endpoints: OccupiedEndpoint[];
      }>('/python/occupied-endpoints'),

    getApps: () =>
      request<{ success: boolean; apps: PythonApp[] }>('/python/apps'),

    createApp: (data: {
      appName: string;
      targetDomain: string;
      appUri?: string;
      pythonVersion?: string;
      startupFile?: string;
      entryPoint?: string;
    }) =>
      request<{ success: boolean; message: string; data: any }>('/python/apps', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    action: (appName: string, action: 'start' | 'stop' | 'restart') =>
      request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      }),

    restartApp: (appName: string) =>
      request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/restart`, { method: 'POST' }),

    startApp: (appName: string) =>
      request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/start`, { method: 'POST' }),

    stopApp: (appName: string) =>
      request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/stop`, { method: 'POST' }),

    destroyApp: (appName: string) =>
      request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}`, { method: 'DELETE' }),

    installModules: (appName: string, requirementsFile: string = 'requirements.txt') =>
      request<{ success: boolean; message: string; data: any }>(`/python/apps/${encodeURIComponent(appName)}/install-modules`, {
        method: 'POST',
        body: JSON.stringify({ requirementsFile })
      }),

    checkHealth: (appName: string) =>
      request<{
        success: boolean;
        health: {
          healthy: boolean;
          status: number;
          statusText: string;
          responseTimeMs: number;
          checkedAt: string;
          url: string;
        };
      }>(`/python/apps/${encodeURIComponent(appName)}/health-check`, {
        method: 'POST'
      }),

    getLogs: (appName: string) =>
      request<{ success: boolean; logs: string }>(`/python/apps/${encodeURIComponent(appName)}/logs`),

    getEnv: (appName: string) =>
      request<{ success: boolean; content: string }>(`/python/apps/${encodeURIComponent(appName)}/env`),

    updateEnv: (appName: string, content: string) =>
      request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/env`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      }),

    files: {
      list: (appName: string, path: string = '/') =>
        request<FileListResponse>(`/python/apps/${encodeURIComponent(appName)}/files?path=${encodeURIComponent(path)}`),

      getContent: (appName: string, path: string) =>
        request<FileContentResponse>(`/python/apps/${encodeURIComponent(appName)}/files/read?path=${encodeURIComponent(path)}`),

      saveContent: (appName: string, path: string, content: string, restart: boolean = false) =>
        request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/files/write`, {
          method: 'POST',
          body: JSON.stringify({ path, content, restart })
        }),

      createFile: (appName: string, path: string, name: string, content: string = '') =>
        request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/files/create-file`, {
          method: 'POST',
          body: JSON.stringify({ path, name, content })
        }),

      createFolder: (appName: string, path: string, name: string) =>
        request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/files/create-folder`, {
          method: 'POST',
          body: JSON.stringify({ path, name })
        }),

      delete: (appName: string, path: string) =>
        request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/files`, {
          method: 'DELETE',
          body: JSON.stringify({ path })
        }),

      rename: (appName: string, oldPath: string, newPath: string) =>
        request<{ success: boolean; message: string }>(`/python/apps/${encodeURIComponent(appName)}/files/rename`, {
          method: 'POST',
          body: JSON.stringify({ oldPath, newPath })
        }),

      getDownloadUrl: (appName: string, path: string) => {
        const token = getAuthToken();
        return `/api/python/apps/${encodeURIComponent(appName)}/files/download?path=${encodeURIComponent(path)}${token ? `&token=${token}` : ''}`;
      },

      uploadWithProgress: (
        appName: string,
        path: string,
        formData: FormData,
        onProgress?: (loaded: number, total: number) => void,
        signal?: AbortSignal
      ): Promise<{ success: boolean; message: string }> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const token = getAuthToken();

          xhr.open('POST', `/api/python/apps/${encodeURIComponent(appName)}/files/upload`);
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                onProgress(event.loaded, event.total);
              }
            };
          }

          if (signal) {
            signal.addEventListener('abort', () => {
              xhr.abort();
              reject(new Error('Unggahan dibatalkan.'));
            });
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText);
                resolve(res);
              } catch {
                resolve({ success: true, message: 'File berhasil diunggah' });
              }
            } else {
              try {
                const res = JSON.parse(xhr.responseText);
                reject(new Error(res.message || `Unggahan gagal (${xhr.status})`));
              } catch {
                reject(new Error(`Unggahan gagal dengan status ${xhr.status}`));
              }
            }
          };

          xhr.onerror = () => reject(new Error('Terjadi kesalahan jaringan saat mengunggah file.'));
          formData.append('path', path);
          xhr.send(formData);
        });
      }
    }
  },

  // Contact Inquiries & Consultation API
  inquiries: {
    submit: (payload: {
      name: string;
      email: string;
      phone?: string;
      company?: string;
      inquiry_type?: string;
      service_interested?: string;
      current_website_url?: string;
      budget_range?: string;
      message: string;
    }) =>
      request<{ success: boolean; message: string; inquiry_id: number }>('/inquiries', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    adminList: (params?: { status?: string; type?: string; search?: string; page?: number; limit?: number }) =>
      request<{ success: boolean; inquiries: any[]; total: number; page: number; limit: number }>(`/inquiries/admin${buildQueryString(params)}`),

    adminUpdate: (id: number, payload: { status?: string; admin_notes?: string }) =>
      request<{ success: boolean; message: string }>(`/inquiries/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),

    adminDelete: (id: number) =>
      request<{ success: boolean; message: string }>(`/inquiries/admin/${id}`, {
        method: 'DELETE'
      })
  },

  meetings: {
    schedule: (payload: {
      company_name?: string;
      contact_person: string;
      email: string;
      phone?: string;
      meeting_date: string;
      meeting_time: string;
      platform?: string;
      notes?: string;
      source_campaign_id?: number;
    }) =>
      request<{ success: boolean; message: string; scheduleId: number; data: any }>('/meetings/schedule', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    adminList: (params?: { status?: string; search?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) =>
      request<{
        success: boolean;
        meetings: MeetingScheduleItem[];
        stats: {
          total: number;
          scheduled: number;
          confirmed: number;
          completed: number;
          cancelled: number;
          today_meetings: number;
        };
      }>(`/meetings/admin${buildQueryString(params)}`),

    adminUpdate: (id: number, payload: { status?: string; meeting_date?: string; meeting_time?: string; platform?: string; admin_notes?: string }) =>
      request<{ success: boolean; message: string }>(`/meetings/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),

    adminDelete: (id: number) =>
      request<{ success: boolean; message: string }>(`/meetings/admin/${id}`, {
        method: 'DELETE'
      })
  },

  // Marketing Intelligence & Automation API
  marketing: {
    getStats: () =>
      request<MarketingStatsResponse>('/admin/marketing/stats'),

    getLeadDashboard: () =>
      request<{
        success: boolean;
        stats: {
          total_companies: number;
          total_umkm: number;
          total_corporate: number;
          new_today: number;
          emails_found: number;
          emails_verified: number;
          emails_unverified: number;
          emails_invalid: number;
          emails_no_email: number;
          contact_ready: number;
          emails_sent: number;
          replies_received: number;
          do_not_contact: number;
        };
        quota: {
          date: string;
          sent_count: number;
          max_limit: number;
          remaining_quota: number;
          is_quota_exhausted: boolean;
        };
        byProvince: Array<{ province: string; count: number; verified_emails: number }>;
        byCategory: Array<{ category: string; count: number; verified_emails: number }>;
        bySource: Array<{ source: string; count: number; verified_emails: number }>;
        recentJobs: any[];
      }>('/admin/marketing/lead-dashboard'),

    getCompanies: (params?: {
      search?: string;
      category?: string;
      industry?: string;
      province?: string;
      city?: string;
      status?: string;
      outreach_eligibility?: string;
      lead_grade?: string;
      has_website?: string | boolean;
      email_status?: string;
      scope?: string;
      business_scale?: string;
      missing_field?: string;
      contact_filter?: string;
      contacted_status?: string;
      is_new?: string | boolean;
      is_priority?: string | boolean;
      is_archived?: string | boolean;
      is_deleted?: string | boolean;
      sortBy?: string;
      sortDir?: string;
      page?: number;
      limit?: number;
    }) =>
      request<{ success: boolean; data: MarketingCompany[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/admin/marketing/companies${buildQueryString(params)}`
      ),

    getCompany: (id: number) =>
      request<{
        success: boolean;
        company: MarketingCompany;
        contacts: MarketingContact[];
        audits: any[];
        sources: any[];
        emailLogs: any[];
        followups: any[];
      }>(`/admin/marketing/companies/${id}`),

    createCompany: (payload: Partial<MarketingCompany>) =>
      request<{ success: boolean; message: string; data: MarketingCompany }>('/admin/marketing/companies', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateCompany: (id: number, payload: Partial<MarketingCompany>) =>
      request<{ success: boolean; message: string; company?: MarketingCompany }>(`/admin/marketing/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    deleteCompany: (id: number, permanent = false) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/companies/${id}?permanent=${permanent}`, {
        method: 'DELETE'
      }),

    restoreCompany: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/companies/${id}/restore`, {
        method: 'POST'
      }),

    togglePriority: (id: number) =>
      request<{ success: boolean; is_priority: boolean; message: string }>(`/admin/marketing/companies/${id}/priority`, {
        method: 'POST'
      }),

    toggleArchive: (id: number) =>
      request<{ success: boolean; is_archived: boolean; message: string }>(`/admin/marketing/companies/${id}/archive`, {
        method: 'POST'
      }),

    importCompanies: (rows: any[], options?: any) =>
      request<{ success: boolean; message: string; imported: number; duplicates: number; errors: any[] }>('/admin/marketing/companies/import', {
        method: 'POST',
        body: JSON.stringify({ rows, ...options })
      }),

    enrichCompany: (id: number) =>
      request<{ success: boolean; message: string; enriched: any }>(`/admin/marketing/companies/${id}/enrich`, {
        method: 'POST'
      }),

    recoverCompanyContact: (id: number) =>
      request<{ success: boolean; result: any }>(`/admin/marketing/companies/${id}/recover-contact`, {
        method: 'POST'
      }),

    runBatchContactRecovery: (payload: { companyIds?: number[]; filter?: string; limit?: number }) =>
      request<{ success: boolean; result: any }>('/admin/marketing/recovery/run', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getRecoveryStats: () =>
      request<{ success: boolean; stats: any }>('/admin/marketing/recovery/stats'),

    // Lead Acquisition & Email Discovery APIs
    runEmailDiscovery: (payload: { limit?: number; status?: string; email_status?: string; province?: string }) =>
      request<{
        success: boolean;
        results: {
          totalProcessed: number;
          verifiedCount: number;
          unverifiedCount: number;
          invalidCount: number;
          noEmailCount: number;
          failedCount: number;
          details: any[];
        };
      }>('/admin/marketing/email-discovery/run', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    discoverCompanyEmail: (companyId: number) =>
      request<{
        success: boolean;
        result: {
          companyId: number;
          companyName: string;
          website: string;
          success: boolean;
          chosenEmail?: string;
          emailStatus: 'VERIFIED' | 'UNVERIFIED' | 'INVALID' | 'NO_EMAIL';
          validationReason?: string;
          sourceUrl?: string;
          totalDiscovered: number;
          allDiscovered: string[];
          mxRecords?: any[];
          message?: string;
        };
      }>(`/admin/marketing/email-discovery/${companyId}`, {
        method: 'POST'
      }),

    validateEmailTechnical: (email: string) =>
      request<{
        success: boolean;
        result: {
          email: string;
          valid: boolean;
          status: 'VERIFIED' | 'UNVERIFIED' | 'INVALID';
          reason: string;
          domain?: string;
          mxRecords?: any[];
          suppressed?: boolean;
        };
      }>('/admin/marketing/email-discovery/validate-single', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),

    bulkUpdateCompanyStatus: (companyIds: number[], status?: string, outreach_eligibility?: string) =>
      request<{ success: boolean; message: string }>('/admin/marketing/companies/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ companyIds, status, outreach_eligibility })
      }),

    bulkDeleteCompanies: (companyIds: number[], permanent = false) =>
      request<{ success: boolean; message: string }>('/admin/marketing/companies/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ companyIds, permanent })
      }),

    mergeCompanies: (primaryCompanyId: number, duplicateCompanyId: number) =>
      request<{ success: boolean; message: string }>('/admin/marketing/companies/merge-duplicates', {
        method: 'POST',
        body: JSON.stringify({ primaryCompanyId, duplicateCompanyId })
      }),

    auditWebsite: (id: number) =>
      request<{ success: boolean; message: string; audit: any }>(`/admin/marketing/companies/${id}/audit-website`, {
        method: 'POST'
      }),

    generateEmailDraft: (companyId: number, data?: { recipient_name?: string; objective?: string; language?: string }) =>
      request<{
        success: boolean;
        draft: {
          subject: string;
          preview_text: string;
          body_text: string;
          highlights: string[];
          recipient_email: string;
          recipient_name: string;
          company_name: string;
        };
      }>(`/admin/marketing/companies/${companyId}/generate-email`, {
        method: 'POST',
        body: JSON.stringify(data || {})
      }),

    sendDirectEmail: (
      companyId: number,
      data: {
        recipient_email: string;
        recipient_name?: string;
        contact_id?: number;
        subject: string;
        message_text: string;
        allow_duplicate?: boolean;
        update_company_email?: boolean;
      }
    ) =>
      request<{ success: boolean; message: string; result?: any }>(`/admin/marketing/companies/${companyId}/send-direct-email`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    getContacts: (params?: { search?: string; role?: string; outreach_eligible?: string | boolean; page?: number; limit?: number }) =>
      request<{ success: boolean; data: MarketingContact[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/admin/marketing/contacts${buildQueryString(params)}`
      ),

    getCompanyContacts: (companyId: number) =>
      request<{ success: boolean; data: MarketingContact[] }>(`/admin/marketing/companies/${companyId}/contacts`),

    addCompanyContact: (companyId: number, payload: Partial<MarketingContact>) =>
      request<{ success: boolean; message: string; data: MarketingContact }>(`/admin/marketing/companies/${companyId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    addContact: (payload: Partial<MarketingContact>) =>
      request<{ success: boolean; message: string; contact_id: number }>('/admin/marketing/contacts', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateContact: (id: number, payload: Partial<MarketingContact>) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    deleteContact: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/contacts/${id}`, {
        method: 'DELETE'
      }),

    setPrimaryContact: (contactId: number) =>
      request<{ success: boolean; message: string; company?: MarketingCompany }>(`/admin/marketing/contacts/${contactId}/primary`, {
        method: 'POST'
      }),

    getSources: () =>
      request<{ success: boolean; sources: MarketingSource[]; jobs: MarketingJob[] }>('/admin/marketing/sources'),

    addSource: (payload: Partial<MarketingSource>) =>
      request<{ success: boolean; message: string; source_id: number }>('/admin/marketing/sources', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateSource: (id: number, payload: Partial<MarketingSource>) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/sources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    runSource: (id: number, payload?: { sector?: string; province?: string; city?: string; limit?: number }) =>
      request<{ success: boolean; message: string; result: any }>(`/admin/marketing/sources/${id}/run`, {
        method: 'POST',
        body: JSON.stringify(payload || {})
      }),

    getCampaigns: () =>
      request<{ success: boolean; campaigns: MarketingCampaign[]; templates: MarketingEmailTemplate[]; quota: any }>('/admin/marketing/campaigns'),

    getEmailCandidates: (params?: { scope?: string; status?: string; search?: string }) =>
      request<{ success: boolean; data: MarketingEmailCandidate[] }>(`/admin/marketing/campaigns/candidates${buildQueryString(params)}`),

    getEmailLogs: (params?: { page?: number; limit?: number; search?: string; status?: string; company_id?: number }) =>
      request<{ success: boolean; data: MarketingEmailLogItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/admin/marketing/email-logs${buildQueryString(params)}`
      ),

    getCampaignRecipients: (campaignId: number) =>
      request<{ success: boolean; data: MarketingCampaignRecipient[] }>(`/admin/marketing/campaigns/${campaignId}/recipients`),

    createCampaign: (payload: {
      name: string;
      template_id?: number;
      target_industry?: string;
      target_province?: string;
      target_category?: string;
      target_lead_score_min?: number;
      subject: string;
      body_html: string;
      target_company_ids?: number[];
      avoid_recently_contacted?: boolean;
    }) =>
      request<{ success: boolean; message: string; campaign_id: number; total_recipients: number; skipped_duplicates?: number }>('/admin/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateCampaign: (campaignId: number, payload: {
      name?: string;
      template_id?: number;
      target_industry?: string;
      target_province?: string;
      target_category?: string;
      target_lead_score_min?: number;
      subject?: string;
      body_html?: string;
      target_company_ids?: number[];
      avoid_recently_contacted?: boolean;
      reset_to_draft?: boolean;
    }) =>
      request<{
        success: boolean;
        message: string;
        campaign_id: number;
        total_recipients: number;
        skipped_duplicates?: number;
        status?: string;
      }>(`/admin/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    deleteCampaign: (campaignId: number) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/campaigns/${campaignId}`, {
        method: 'DELETE'
      }),

    resendCampaign: (campaignId: number, payload?: { subject?: string; body_html?: string; reset_all_recipients?: boolean }) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/campaigns/${campaignId}/resend`, {
        method: 'POST',
        body: JSON.stringify(payload || {})
      }),

    sendTestEmail: (campaignId: number, testEmail?: string) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/campaigns/${campaignId}/send-test`, {
        method: 'POST',
        body: JSON.stringify({ test_email: testEmail })
      }),

    startCampaign: (campaignId: number, recipientIds?: number[]) =>
      request<{ success: boolean; message: string; sentCount: number; failedCount: number; skippedDuplicates?: number; remainingInCampaign: number }>(
        `/admin/marketing/campaigns/${campaignId}/start`,
        { method: 'POST', body: JSON.stringify({ recipient_ids: recipientIds }) }
      ),

    getTemplates: () =>
      request<{ success: boolean; templates: MarketingEmailTemplate[] }>('/admin/marketing/templates'),

    createTemplate: (payload: Partial<MarketingEmailTemplate>) =>
      request<{ success: boolean; message: string; template_id: number }>('/admin/marketing/templates', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateTemplate: (id: number, payload: Partial<MarketingEmailTemplate>) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    syncInbox: () =>
      request<{ success: boolean; scanned: number; imported: number; message: string }>('/admin/marketing/inbox/sync', {
        method: 'POST'
      }),

    getThreads: (search?: string) =>
      request<{ success: boolean; threads: MarketingConversationThread[] }>(
        `/admin/marketing/inbox/threads${search ? `?search=${encodeURIComponent(search)}` : ''}`
      ),

    sendInboxReply: (payload: {
      recipient_email: string;
      recipient_name?: string;
      company_id?: number | null;
      subject?: string;
      message_text: string;
      in_reply_to?: string;
    }) =>
      request<{ success: boolean; message: string; data: any }>('/admin/marketing/inbox/send-reply', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getInbox: () =>
      request<{ success: boolean; replies: MarketingEmailReply[] }>('/admin/marketing/inbox'),

    updateInboxStatus: (id: number, payload: { classification?: string; status?: string; admin_notes?: string }) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/inbox/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),

    getFollowups: () =>
      request<{ success: boolean; followups: MarketingFollowup[] }>('/admin/marketing/followups'),

    createFollowup: (payload: { company_id: number; title: string; notes?: string; due_date: string; priority?: string }) =>
      request<{ success: boolean; message: string; followup_id: number }>('/admin/marketing/followups', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateFollowup: (id: number, payload: Partial<MarketingFollowup>) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/followups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),

    getSuppressions: () =>
      request<{ success: boolean; suppressions: MarketingSuppression[] }>('/admin/marketing/suppressions'),

    addSuppression: (payload: { email: string; reason?: string; notes?: string }) =>
      request<{ success: boolean; message: string }>('/admin/marketing/suppressions', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    deleteSuppression: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/marketing/suppressions/${id}`, {
        method: 'DELETE'
      }),

    getSettings: () =>
      request<{ success: boolean; settings: Record<string, string>; raw: any[] }>('/admin/marketing/settings'),

    saveSettings: (payload: Record<string, string>) =>
      request<{ success: boolean; message: string }>('/admin/marketing/settings', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getAiLogs: () =>
      request<{ success: boolean; logs: MarketingAiLog[] }>('/admin/marketing/ai-logs'),

    testAiPrompt: (prompt: string, model?: string) =>
      request<{ success: boolean; result: any }>('/admin/marketing/ai-test', {
        method: 'POST',
        body: JSON.stringify({ prompt, model })
      })
  },

  companyEmails: {
    list: () =>
      request<{
        success: boolean;
        domain: string;
        accounts: CompanyEmailAccount[];
        count: number;
        webmailUrl: string;
        cpanelUrl: string;
      }>('/admin/company-emails'),

    create: (payload: { username: string; password: string; quota?: number }) =>
      request<{
        success: boolean;
        message: string;
        data?: any;
      }>('/admin/company-emails', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    changePassword: (username: string, password: string) =>
      request<{ success: boolean; message: string }>(`/admin/company-emails/${encodeURIComponent(username)}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password })
      }),

    changeQuota: (username: string, quota: number) =>
      request<{ success: boolean; message: string }>(`/admin/company-emails/${encodeURIComponent(username)}/quota`, {
        method: 'PUT',
        body: JSON.stringify({ quota })
      }),

    delete: (username: string) =>
      request<{ success: boolean; message: string }>(`/admin/company-emails/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      })
  },

  adminUsers: {
    list: (params?: { role?: string; status?: string; search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params?.role) q.set('role', params.role);
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      const qs = q.toString() ? `?${q.toString()}` : '';
      return request<{
        success: boolean;
        users: AdminUserItem[];
        stats: AdminUserStats;
      }>(`/admin/users${qs}`);
    },

    create: (payload: { name: string; email: string; password: string; phone?: string; role: string }) =>
      request<{
        success: boolean;
        message: string;
        user?: AdminUserItem;
      }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateRole: (id: number, role: string) =>
      request<{ success: boolean; message: string; user?: AdminUserItem }>(`/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      }),

    updateStatus: (id: number, status: 'active' | 'suspended') =>
      request<{ success: boolean; message: string }>(`/admin/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),

    resetPassword: (id: number, password: string) =>
      request<{ success: boolean; message: string }>(`/admin/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password })
      }),

    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/users/${id}`, {
        method: 'DELETE'
      })
  },

  docs: {
    getAll: () =>
      request<{
        success: boolean;
        categories: any[];
        totalArticles: number;
        articles: any[];
      }>('/docs'),

    getAdminAll: () =>
      request<{
        success: boolean;
        articles: any[];
      }>('/docs/admin/all'),

    getBySlug: (slug: string) =>
      request<{
        success: boolean;
        article: any;
      }>(`/docs/${encodeURIComponent(slug)}`),

    create: (payload: {
      title: string;
      slug?: string;
      category: string;
      categoryTitle?: string;
      description?: string;
      readingTime?: string;
      keywords?: string | string[];
      content: string;
      status?: 'published' | 'draft';
    }) =>
      request<{
        success: boolean;
        message: string;
        articleId?: number;
        slug?: string;
      }>('/docs', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    update: (id: number, payload: Partial<{
      title: string;
      slug: string;
      category: string;
      categoryTitle: string;
      description: string;
      readingTime: string;
      keywords: string | string[];
      content: string;
      status: 'published' | 'draft';
    }>) =>
      request<{
        success: boolean;
        message: string;
        slug?: string;
      }>(`/docs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    delete: (id: number) =>
      request<{
        success: boolean;
        message: string;
      }>(`/docs/${id}`, {
        method: 'DELETE'
      })
  },

  hr: {
    getStats: () =>
      request<HRStatsResponse>('/admin/hr/stats'),

    getNotifications: () =>
      request<{ success: boolean; notifications: HRNotification[] }>('/admin/hr/notifications'),

    markNotificationRead: (id: number) =>
      request<{ success: boolean }>(`/admin/hr/notifications/${id}/read`, { method: 'PUT' }),

    markAllNotificationsRead: () =>
      request<{ success: boolean }>('/admin/hr/notifications/read-all', { method: 'PUT' }),

    // Positions
    getPositions: (params?: { status?: string }) =>
      request<{ success: boolean; positions: HRPosition[] }>(`/admin/hr/positions${buildQueryString(params)}`),

    createPosition: (payload: {
      name: string;
      department: string;
      employment_type: string;
      location?: string;
      description?: string;
      requirements?: string;
      status?: string;
    }) =>
      request<{ success: boolean; message: string; position: HRPosition }>('/admin/hr/positions', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updatePosition: (id: number, payload: Partial<HRPosition>) =>
      request<{ success: boolean; message: string }>(`/admin/hr/positions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    togglePositionStatus: (id: number, status: string) =>
      request<{ success: boolean; message: string }>(`/admin/hr/positions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),

    deletePosition: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hr/positions/${id}`, {
        method: 'DELETE'
      }),

    // Candidates
    getCandidates: (params?: {
      search?: string;
      position_id?: string | number;
      recruitment_status?: string;
      email_status?: string;
      sort_by?: string;
      order?: string;
      page?: number;
      limit?: number;
    }) =>
      request<{
        success: boolean;
        candidates: HRCandidate[];
        pagination: { total: number; page: number; limit: number; total_pages: number };
      }>(`/admin/hr/candidates${buildQueryString(params)}`),

    getCandidate: (id: number) =>
      request<{
        success: boolean;
        candidate: HRCandidate;
        activities: HRCandidateActivity[];
        email_logs: HREmailLog[];
        email_replies: HREmailReply[];
        interviews: HRInterview[];
      }>(`/admin/hr/candidates/${id}`),

    createCandidate: (payload: {
      full_name: string;
      email: string;
      phone?: string;
      position_id: number;
      source?: string;
      notes?: string;
      resume_url?: string;
      portfolio_url?: string;
    }) =>
      request<{ success: boolean; message: string; candidate: HRCandidate }>('/admin/hr/candidates', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateCandidate: (id: number, payload: Partial<HRCandidate>) =>
      request<{ success: boolean; message: string }>(`/admin/hr/candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    updateCandidateStatus: (id: number, payload: { recruitment_status: HRPromotedStatus; reason?: string }) =>
      request<{ success: boolean; message: string }>(`/admin/hr/candidates/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),

    deleteCandidate: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hr/candidates/${id}`, {
        method: 'DELETE'
      }),

    addCandidateNote: (id: number, note: string) =>
      request<{ success: boolean; message: string }>(`/admin/hr/candidates/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note })
      }),

    // Emails
    getEmailTemplates: () =>
      request<{ success: boolean; templates: HREmailTemplate[] }>('/admin/hr/emails/templates'),

    createEmailTemplate: (payload: Partial<HREmailTemplate>) =>
      request<{ success: boolean; message: string }>('/admin/hr/emails/templates', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    updateEmailTemplate: (id: number, payload: Partial<HREmailTemplate>) =>
      request<{ success: boolean; message: string }>(`/admin/hr/emails/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    sendEmails: (payload: {
      candidate_ids: number[];
      template_key?: string | null;
      custom_subject?: string;
      custom_body?: string;
      campaign_title?: string;
    }) =>
      request<{ success: boolean; message: string; result: any }>('/admin/hr/emails/send', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    sendEmail: (payload: {
      candidate_ids: number[];
      template_key?: string | null;
      custom_subject?: string;
      custom_body?: string;
      campaign_title?: string;
    }) =>
      request<{ success: boolean; message: string; result: any }>('/admin/hr/emails/send', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getEmailLogs: (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
      request<{
        success: boolean;
        logs: HREmailLog[];
        pagination: { total: number; page: number; limit: number; total_pages: number };
      }>(`/admin/hr/emails/logs${buildQueryString(params)}`),

    retryEmail: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hr/emails/logs/${id}/retry`, {
        method: 'POST'
      }),

    retryEmailLog: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hr/emails/logs/${id}/retry`, {
        method: 'POST'
      }),

    // HR Inbox
    getInboxThreads: (params?: { search?: string; filter?: string }) =>
      request<{ success: boolean; threads: HRConversationThread[] }>(`/admin/hr/inbox/threads${buildQueryString(params)}`),

    getThreadMessages: (email: string) =>
      request<{
        success: boolean;
        candidate: HRCandidate | null;
        messages: Array<{
          id: number;
          from_email: string;
          from_name?: string;
          subject: string;
          body_text: string;
          body_html?: string;
          message_date: string;
          status: string;
          direction: 'incoming' | 'outgoing';
        }>;
      }>(`/admin/hr/inbox/messages/${encodeURIComponent(email)}`),

    syncInbox: () =>
      request<{ success: boolean; message: string; result: any }>('/admin/hr/inbox/sync', {
        method: 'POST'
      }),

    sendInboxReply: (payload: {
      recipient_email: string;
      subject: string;
      message_text: string;
      candidate_id?: number | null;
    }) =>
      request<{ success: boolean; message: string }>('/admin/hr/inbox/reply', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    markReplyRead: (id: number) =>
      request<{ success: boolean }>(`/admin/hr/inbox/read/${id}`, {
        method: 'PATCH'
      }),

    connectCandidate: (payload: { reply_id: number; position_id?: number; full_name?: string }) =>
      request<{ success: boolean; message: string; candidate_id: number }>('/admin/hr/inbox/connect-candidate', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    // Interview Slots
    getInterviewSlots: (params?: { start_date?: string; end_date?: string }) =>
      request<{ success: boolean; slots: HRInterviewSlot[] }>(`/admin/hr/interview-slots${buildQueryString(params)}`),

    createInterviewSlot: (payload: {
      slot_date: string;
      start_time: string;
      end_time: string;
      meeting_link: string;
      max_capacity?: number;
      duration_minutes?: number;
      timezone?: string;
    }) =>
      request<{ success: boolean; message: string; slot_id: number }>('/admin/hr/interview-slots', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    deleteInterviewSlot: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hr/interview-slots/${id}`, {
        method: 'DELETE'
      }),

    toggleInterviewSlot: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hr/interview-slots/${id}/toggle`, {
        method: 'PATCH'
      }),

    // Interviews
    getInterviews: (params?: { status?: string; search?: string }) =>
      request<{ success: boolean; interviews: HRInterview[] }>(`/admin/hr/interviews${buildQueryString(params)}`),

    inviteCandidateToInterview: (payload: { candidate_id: number; send_email?: boolean }) =>
      request<{ success: boolean; message: string; interview_id: number; scheduling_url: string }>('/admin/hr/interviews/invite', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    startInterviewSession: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/hr/interviews/${id}/start-session`, {
        method: 'PATCH'
      }),

    confirmInterview: (id: number, payload: { meeting_link: string; instructions?: string }) =>
      request<{ success: boolean; message: string }>(`/admin/hr/interviews/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    rescheduleInterview: (id: number, payload: {
      interview_date: string;
      interview_time: string;
      meeting_link?: string;
      reason?: string;
    }) =>
      request<{ success: boolean; message: string }>(`/admin/hr/interviews/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    cancelInterview: (id: number, payload: { reason?: string }) =>
      request<{ success: boolean; message: string }>(`/admin/hr/interviews/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    completeInterview: (id: number, payload: {
      interviewer_notes?: string;
      rating?: number;
      advance_candidate_status?: boolean;
    }) =>
      request<{ success: boolean; message: string }>(`/admin/hr/interviews/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),

    // Public candidate scheduling endpoints
    getPublicInterview: (token: string) =>
      request<{
        success: boolean;
        is_booked_previously?: boolean;
        is_active_turn?: boolean;
        active_queue_number?: number | null;
        interview: {
          id: number;
          candidate_name: string;
          candidate_email: string;
          position_name: string;
          department: string;
          status: string;
          interview_date?: string;
          interview_time?: string;
          timezone: string;
          meeting_platform: string;
          meeting_link?: string;
          instructions?: string;
          expires_at: string;
          queue_number?: number;
          estimated_start_time?: string;
          estimated_end_time?: string;
          queue_status?: string;
        };
        slot_queue?: Array<{
          id: number;
          queue_number: number;
          candidate_name: string;
          is_you: boolean;
          status: string;
          queue_status?: string;
          estimated_start_time?: string;
          estimated_end_time?: string;
        }>;
        available_slots: HRInterviewSlot[];
      }>(`/hr/public/interview/${encodeURIComponent(token)}`),

    bookPublicInterview: (token: string, payload: { slot_id: number; candidate_notes?: string }) =>
      request<{
        success: boolean;
        message: string;
        booking: any;
      }>(`/hr/public/interview/${encodeURIComponent(token)}/book`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  }
};
