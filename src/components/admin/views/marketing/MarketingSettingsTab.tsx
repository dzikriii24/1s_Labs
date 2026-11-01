import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Mail,
  Bot
} from 'lucide-react';
import { api, MarketingSuppression } from '../../../../services/api';

export const MarketingSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [suppressions, setSuppressions] = useState<MarketingSuppression[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // New suppression input
  const [newSuppEmail, setNewSuppEmail] = useState('');
  const [newSuppReason, setNewSuppReason] = useState('manual');

  const fetchSettingsAndSupp = async () => {
    setIsLoading(true);
    try {
      const [setRes, suppRes] = await Promise.all([
        api.marketing.getSettings(),
        api.marketing.getSuppressions()
      ]);
      if (setRes.success) setSettings(setRes.settings);
      if (suppRes.success) setSuppressions(suppRes.suppressions);
    } catch (err: any) {
      console.warn('Failed to load marketing settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndSupp();
  }, []);

  const handleSettingChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await api.marketing.saveSettings(settings);
      setMessage('Pengaturan marketing & kuota berhasil disimpan.');
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppEmail) return;
    try {
      await api.marketing.addSuppression({ email: newSuppEmail, reason: newSuppReason });
      setNewSuppEmail('');
      fetchSettingsAndSupp();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSuppression = async (id: number) => {
    if (!window.confirm('Hapus email dari suppression list?')) return;
    try {
      await api.marketing.deleteSuppression(id);
      fetchSettingsAndSupp();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs font-mono bg-white border border-zinc-200 rounded-2xl shadow-xs">
        <RefreshCw className="w-7 h-7 animate-spin text-zinc-900 mx-auto mb-2" />
        Memuat konfigurasi sistem marketing...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Marketing Settings & Compliance
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Konfigurasi batas kuota harian, jadwal discovery, model AI Gemini, dan daftar suppression (opt-out).
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-700" /> Parameter Operasional & Kuota
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Batas Maksimal Pengiriman Email per Hari (Daily Quota)
            </label>
            <input
              type="number"
              max={100}
              min={1}
              value={settings.daily_email_limit || '100'}
              onChange={e => handleSettingChange('daily_email_limit', e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="text-[11px] text-zinc-500 block mt-1">
              Sistem backend menegakkan batas maksimal 100 email per hari di zona waktu Asia/Jakarta.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Jadwal Discovery Otomatis Harian (Cron)
            </label>
            <input
              type="text"
              value={settings.discovery_cron || '0 6 * * *'}
              onChange={e => handleSettingChange('discovery_cron', e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="text-[11px] text-zinc-500 block mt-1">
              Default: 0 6 * * * (Setiap hari pukul 06.00 WIB).
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Model Gemini AI
            </label>
            <select
              value={settings.gemini_model || 'gemini-3.8-flash'}
              onChange={e => handleSettingChange('gemini_model', e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Rekomendasi Utama)</option>
              <option value="gemini-flash-latest">gemini-flash-latest</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Email Notifikasi Admin
            </label>
            <input
              type="email"
              value={settings.admin_notification_email || 'dzikrirabbani2401@gmail.com'}
              onChange={e => handleSettingChange('admin_notification_email', e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>

        {/* Lead Scoring Weights */}
        <div className="pt-4 border-t border-zinc-200">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">
            Konfigurasi Bobot Lead Scoring (Total Max 100)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">Belum Punya Website (+)</label>
              <input
                type="number"
                value={settings.lead_score_no_website || '25'}
                onChange={e => handleSettingChange('lead_score_no_website', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">Website Tidak Responsif (+)</label>
              <input
                type="number"
                value={settings.lead_score_not_responsive || '20'}
                onChange={e => handleSettingChange('lead_score_not_responsive', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">Website Error 4xx/5xx (+)</label>
              <input
                type="number"
                value={settings.lead_score_error || '20'}
                onChange={e => handleSettingChange('lead_score_error', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">Website Lambat &gt;3.5s (+)</label>
              <input
                type="number"
                value={settings.lead_score_slow || '15'}
                onChange={e => handleSettingChange('lead_score_slow', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">SSL Tidak Valid (+)</label>
              <input
                type="number"
                value={settings.lead_score_ssl_invalid || '10'}
                onChange={e => handleSettingChange('lead_score_ssl_invalid', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 block mb-1">Kebutuhan Digital AI (+)</label>
              <input
                type="number"
                value={settings.lead_score_digital_need || '10'}
                onChange={e => handleSettingChange('lead_score_digital_need', e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* Global Suppression List */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" /> Global Suppression & Do-Not-Contact List
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Alamat email atau domain yang telah berhenti berlangganan (unsubscribe) atau meminta tidak dihubungi. Sistem secara otomatis memblokir pengiriman email ke alamat ini.
            </p>
          </div>
        </div>

        {/* Add Suppression Form */}
        <form onSubmit={handleAddSuppression} className="flex gap-2">
          <input
            type="email"
            placeholder="Tambah email ke suppression list (e.g. user@company.com)..."
            value={newSuppEmail}
            onChange={e => setNewSuppEmail(e.target.value)}
            required
            className="flex-1 px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Blokir Email
          </button>
        </form>

        {suppressions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">Belum ada email yang di-suppress.</p>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Email / Domain</th>
                  <th className="py-2.5 px-4">Alasan</th>
                  <th className="py-2.5 px-4">Sumber</th>
                  <th className="py-2.5 px-4">Tanggal Opt-Out</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {suppressions.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-rose-700 font-semibold">{s.email || s.domain}</td>
                    <td className="py-2.5 px-4 text-zinc-800 capitalize font-medium">{s.reason}</td>
                    <td className="py-2.5 px-4 text-zinc-500 text-[11px]">{s.source}</td>
                    <td className="py-2.5 px-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(s.suppressed_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSuppression(s.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus dari daftar blokir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
