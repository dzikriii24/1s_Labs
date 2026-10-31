import React, { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  ShieldCheck,
  Bell,
  Save,
  Check,
  Server,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  Phone,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../../../services/api';

export const GeneralSettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states initialized with live default constants
  const [companyName, setCompanyName] = useState('1sLabs Technology');
  const [supportEmail, setSupportEmail] = useState('support@1slabs.my.id');
  const [primaryDomain, setPrimaryDomain] = useState('1slabs.my.id');
  const [whatsappSupport, setWhatsappSupport] = useState('6285156296580');
  const [serverHost, setServerHost] = useState('103.119.237.132');
  const [cpanelPort, setCpanelPort] = useState('2083');
  const [cpanelUrl, setCpanelUrl] = useState('https://1slabs.my.id:2083');
  const [nameserver1, setNameserver1] = useState('ns1.domainmurah.net');
  const [nameserver2, setNameserver2] = useState('ns2.domainmurah.net');
  const [smtpHost, setSmtpHost] = useState('smtp-relay.brevo.com');
  const [smtpPort, setSmtpPort] = useState('2525');
  const [autoSslNotification, setAutoSslNotification] = useState(true);
  const [resourceWarningEmail, setResourceWarningEmail] = useState(true);

  // Fetch live settings on mount
  const fetchSettings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.admin.getSystemSettings();
      if (res.success && res.settings) {
        const s = res.settings;
        if (s.company_name) setCompanyName(s.company_name);
        if (s.support_email) setSupportEmail(s.support_email);
        if (s.primary_domain) setPrimaryDomain(s.primary_domain);
        if (s.whatsapp_support) setWhatsappSupport(s.whatsapp_support);
        if (s.server_ip) setServerHost(s.server_ip);
        if (s.cpanel_port) setCpanelPort(s.cpanel_port);
        if (s.cpanel_url) setCpanelUrl(s.cpanel_url);
        if (s.nameserver_1) setNameserver1(s.nameserver_1);
        if (s.nameserver_2) setNameserver2(s.nameserver_2);
        if (s.smtp_host) setSmtpHost(s.smtp_host);
        if (s.smtp_port) setSmtpPort(s.smtp_port);
        if (s.auto_ssl_notification !== undefined) {
          setAutoSslNotification(s.auto_ssl_notification === '1' || s.auto_ssl_notification === true || s.auto_ssl_notification === 'true');
        }
        if (s.resource_warning_email !== undefined) {
          setResourceWarningEmail(s.resource_warning_email === '1' || s.resource_warning_email === true || s.resource_warning_email === 'true');
        }
      }
    } catch (err: any) {
      console.error('Failed to load system settings', err);
      setErrorMessage(err.message || 'Gagal memuat konfigurasi sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const payload: Record<string, any> = {
        company_name: companyName.trim(),
        support_email: supportEmail.trim(),
        primary_domain: primaryDomain.trim(),
        whatsapp_support: whatsappSupport.trim(),
        server_ip: serverHost.trim(),
        cpanel_port: cpanelPort.trim(),
        cpanel_url: cpanelUrl.trim(),
        nameserver_1: nameserver1.trim(),
        nameserver_2: nameserver2.trim(),
        smtp_host: smtpHost.trim(),
        smtp_port: smtpPort.trim(),
        auto_ssl_notification: autoSslNotification ? '1' : '0',
        resource_warning_email: resourceWarningEmail ? '1' : '0'
      };

      const res = await api.admin.updateSystemSettings(payload);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setErrorMessage(res.message || 'Gagal menyimpan konfigurasi.');
      }
    } catch (err: any) {
      console.error('Save settings error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white border border-zinc-200 rounded-3xl shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
        <p className="text-xs text-zinc-500 font-medium">Memuat konfigurasi sistem dan server...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Pengaturan Umum &amp; Parameter Sistem (General Settings)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Konfigurasi identitas perusahaan, integrasi cPanel server, nameserver domain, dan ambang batas peringatan sistem.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Berhasil Disimpan</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Pengaturan</span>
            </>
          )}
        </button>
      </div>

      {/* Status Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">Konfigurasi sistem berhasil diperbarui dan tersimpan di database secara permanen!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* 1. Company & Platform Identity */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            Identitas Perusahaan &amp; Platform
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Nama Brand / Perusahaan</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Email Resmi &amp; Outbound Sender</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Domain Utama Platform</label>
              <input
                type="text"
                required
                value={primaryDomain}
                onChange={(e) => setPrimaryDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Nomor WhatsApp Dukungan (Format: 628...)</label>
              <input
                type="text"
                required
                value={whatsappSupport}
                onChange={(e) => setWhatsappSupport(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 2. Server Infrastructure & Nameservers */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-600" />
            Infrastruktur Server &amp; DNS Nameserver
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">IP Server cPanel</label>
                <input
                  type="text"
                  required
                  value={serverHost}
                  onChange={(e) => setServerHost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Port cPanel SSL</label>
                <input
                  type="text"
                  required
                  value={cpanelPort}
                  onChange={(e) => setCpanelPort(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Primary Nameserver (NS1)</label>
                <input
                  type="text"
                  required
                  value={nameserver1}
                  onChange={(e) => setNameserver1(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Secondary Nameserver (NS2)</label>
                <input
                  type="text"
                  required
                  value={nameserver2}
                  onChange={(e) => setNameserver2(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">cPanel Web Interface URL</label>
              <input
                type="text"
                required
                value={cpanelUrl}
                onChange={(e) => setCpanelUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 3. SMTP Relay Configuration */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-600" />
            Integrasi SMTP Relay (Email Transaksional)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">SMTP Relay Host</label>
              <input
                type="text"
                required
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Port Brevo (Direct)</label>
              <input
                type="text"
                required
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            Kredensial rahasia (API key &amp; password) tersimpan aman di environment server (<code className="font-mono">.env</code>).
          </p>
        </div>

        {/* 4. Alert & Notification Triggers */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-600" />
            Pemicu Notifikasi &amp; Proteksi Ambang Batas
          </h3>

          <div className="space-y-3">
            <label className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-start gap-3 cursor-pointer hover:border-zinc-300 transition-all">
              <input
                type="checkbox"
                checked={autoSslNotification}
                onChange={(e) => setAutoSslNotification(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="font-bold text-zinc-900">Notifikasi Kegagalan AutoSSL (DCV Alert)</div>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  Kirim peringatan otomatis jika domain pelanggan gagal verifikasi A-Record atau sertifikat mendekati masa kedaluwarsa 14 hari.
                </p>
              </div>
            </label>

            <label className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-start gap-3 cursor-pointer hover:border-zinc-300 transition-all">
              <input
                type="checkbox"
                checked={resourceWarningEmail}
                onChange={(e) => setResourceWarningEmail(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <div className="font-bold text-zinc-900">Peringatan Kritis Resource Server (95% nproc/RAM)</div>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  Catat audit log berprioritas tinggi dan kirim notifikasi operasional ketika konsumsi LVE mendekati kapasitas penuh.
                </p>
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettingsView;
