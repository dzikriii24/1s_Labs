import React, { useState } from 'react';
import {
  Settings,
  Mail,
  ShieldCheck,
  Bell,
  Save,
  Check,
  Server,
  Lock,
  Globe
} from 'lucide-react';

export const GeneralSettingsView: React.FC = () => {
  const [companyName, setCompanyName] = useState('1sLabs Technology');
  const [supportEmail, setSupportEmail] = useState('info@1slabs.my.id');
  const [primaryDomain, setPrimaryDomain] = useState('1slabs.my.id');
  const [serverHost, setServerHost] = useState('103.119.237.132');
  const [cpanelPort, setCpanelPort] = useState('2083');
  const [smtpHost, setSmtpHost] = useState('smtp-relay.brevo.com');
  const [smtpPort, setSmtpPort] = useState('2525');
  const [autoSslNotification, setAutoSslNotification] = useState(true);
  const [resourceWarningEmail, setResourceWarningEmail] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
                Pengaturan Umum & Parameter Sistem (General Settings)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Konfigurasi identitas perusahaan, integrasi cPanel, SMTP Relay Brevo, dan ambang batas peringatan sistem.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Berhasil Disimpan' : 'Simpan Pengaturan'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Company Identity */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            Identitas Perusahaan & Platform
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Nama Brand / Perusahaan</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Email Resmi & Outbound Sender</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">Domain Utama Platform</label>
              <input
                type="text"
                value={primaryDomain}
                onChange={(e) => setPrimaryDomain(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Server & SMTP Integration */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-600" />
            Integrasi Server cPanel & SMTP Relay Brevo
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">IP Server cPanel</label>
                <input
                  type="text"
                  value={serverHost}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Port cPanel SSL</label>
                <input
                  type="text"
                  value={cpanelPort}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">SMTP Relay Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Port Brevo (Direct)</label>
                <input
                  type="text"
                  value={smtpPort}
                  disabled
                  className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 font-mono font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alert & Notification Triggers */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 lg:col-span-2 shadow-xs">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-600" />
            Pemicu Notifikasi & Proteksi Ambang Batas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSslNotification}
                onChange={(e) => setAutoSslNotification(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-purple-600"
              />
              <div>
                <div className="font-bold text-zinc-900">Notifikasi Kegagalan AutoSSL (DCV Alert)</div>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  Kirim peringatan otomatis jika domain pelanggan gagal verifikasi A-Record atau sertifikat mendekati masa kedaluwarsa 14 hari.
                </p>
              </div>
            </label>

            <label className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={resourceWarningEmail}
                onChange={(e) => setResourceWarningEmail(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-purple-600"
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
