import React, { useEffect, useState } from 'react';
import {
  Layers,
  Edit,
  Check,
  X,
  HardDrive,
  Database,
  Cloud,
  ShieldCheck,
  RefreshCw,
  Plus,
  Sparkles
} from 'lucide-react';
import { api, HostingPlan } from '../../../services/api';
import notify from '../../../lib/notify';

export const HostingPlansView: React.FC = () => {
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<HostingPlan | null>(null);

  // Edit fields
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [price, setPrice] = useState('');
  const [period, setPeriod] = useState('/ tahun');
  const [description, setDescription] = useState('');
  const [storage, setStorage] = useState('30');
  const [databases, setDatabases] = useState('10');
  const [bandwidth, setBandwidth] = useState('Unmetered Monthly Bandwidth');
  const [ssl, setSsl] = useState('Free SSL Certificate (Auto-SSL)');
  const [backup, setBackup] = useState('Weekly Cloud');
  const [email, setEmail] = useState('Akun Email Domain Mandiri');
  const [features, setFeatures] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getPlans();
      if (res.success) {
        setPlans(res.plans || []);
      }
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openEditModal = (p: HostingPlan) => {
    setSelectedPlan(p);
    setName(p.name || '');
    setTarget(p.target || '');
    setPrice(String(p.price || 0));
    setPeriod(p.period || '/ tahun');
    setDescription(p.description || '');
    setStorage(String(p.storage_gb || 30));
    setDatabases(String(p.databases_count || 10));
    setBandwidth(p.bandwidth || 'Unmetered Monthly Bandwidth');
    setSsl(p.ssl_type || 'Free SSL Certificate (Auto-SSL)');
    setBackup(p.backup_frequency || 'Weekly Cloud');
    setEmail(p.email_accounts || 'Akun Email Domain Mandiri');
    setFeatures(Array.isArray(p.features) ? p.features.join('\n') : '');
    setIsRecommended(!!p.is_recommended);
    setIsActive(p.is_active !== undefined ? !!p.is_active : true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const featArr = features.split('\n').map((f) => f.trim()).filter(Boolean);
      const res = await api.admin.updatePlan(selectedPlan.id, {
        name,
        target,
        price: Number(price),
        period,
        description,
        storage_gb: Number(storage),
        databases_count: Number(databases),
        bandwidth,
        ssl_type: ssl,
        backup_frequency: backup,
        email_accounts: email,
        features: featArr,
        is_recommended: isRecommended,
        is_active: isActive
      });

      if (res.success) {
        notify.success(res.message || 'Paket hosting berhasil diperbarui.');
        setSelectedPlan(null);
        await fetchPlans();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan perubahan paket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Konfigurasi Paket Hosting (Hosting Plans)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Kelola paket hosting publik, harga tahunan, kuota SSD NVMe, alokasi database MySQL, dan fitur unggulan.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchPlans}
          disabled={loading}
          className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          title="Refresh paket"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Plans Grid */}
      {loading && plans.length === 0 ? (
        <div className="py-16 text-center text-zinc-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
          Memuat daftar paket hosting...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl bg-white border p-6 flex flex-col justify-between transition-all shadow-xs ${
                plan.is_recommended
                  ? 'border-purple-500 ring-2 ring-purple-500/20'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {plan.is_recommended ? (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider shadow-xs">
                  <Sparkles className="w-3 h-3" /> Recommended Tier
                </div>
              ) : null}

              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">{plan.target}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      plan.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {plan.is_active ? 'Active' : 'Archived'}
                  </span>
                </div>

                <div className="mt-4 pb-4 border-b border-zinc-100">
                  <div className="text-2xl font-black font-mono text-zinc-900">
                    Rp{Number(plan.price).toLocaleString('id-ID')}
                    <span className="text-xs font-normal text-zinc-500 font-sans ml-1">{plan.period}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{plan.description}</p>
                </div>

                {/* Specs */}
                <div className="py-4 space-y-2.5 text-xs text-zinc-700">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-purple-600" />
                    <span>
                      <strong className="text-zinc-900">{plan.storage_gb} GB</strong> SSD NVMe Storage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span>
                      <strong className="text-zinc-900">{plan.databases_count}</strong> Database MySQL
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-purple-600" />
                    <span>{plan.bandwidth}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>{plan.ssl_type}</span>
                  </div>
                </div>

                {/* Features list */}
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100">
                    <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold mb-2">Fitur Unggulan</div>
                    <ul className="space-y-1.5 text-xs text-zinc-600">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-end">
                <button
                  onClick={() => openEditModal(plan)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Konfigurasi Paket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Edit Paket Hosting: {selectedPlan.name}</h3>
                <p className="text-xs text-zinc-500">Perbarui harga, kapasitas resource cPanel, dan teks fitur publik.</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Paket</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Target Pengguna</label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga Tahunan (IDR)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Label Periode</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Kuota Penyimpanan SSD (GB)</label>
                  <input
                    type="number"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Alokasi Database MySQL</label>
                  <input
                    type="number"
                    value={databases}
                    onChange={(e) => setDatabases(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Daftar Fitur (Satu fitur per baris)
                </label>
                <textarea
                  rows={4}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={isRecommended}
                    onChange={(e) => setIsRecommended(e.target.checked)}
                    className="rounded border-zinc-300 text-purple-600 focus:ring-0"
                  />
                  Tandai sebagai Paket Rekomendasi
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-zinc-300 text-purple-600 focus:ring-0"
                  />
                  Tampilkan di Publik (Aktif)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
