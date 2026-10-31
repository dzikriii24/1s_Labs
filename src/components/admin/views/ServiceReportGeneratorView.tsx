import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  User,
  Check,
  Building,
  ShieldCheck,
  Mail,
  ArrowRight,
  Download
} from 'lucide-react';
import { api, ServiceReportItem } from '../../../services/api';
import notify from '../../../lib/notify';

export const ServiceReportGeneratorView: React.FC = () => {
  const [reports, setReports] = useState<ServiceReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Active view tab: 'list' or 'create'
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [submitting, setSubmitting] = useState(false);

  // Streamlined Essential Inputs
  const [customerName, setCustomerName] = useState('Kim Holiday Travel');
  const [customerEmail, setCustomerEmail] = useState('kimholidaytravel1@gmail.com');
  const [projectTitle, setProjectTitle] = useState('Aktivasi Hosting & Deployment Web Kim Holiday Travel');
  const [reportType, setReportType] = useState('hosting_activation');
  const [servicePeriod, setServicePeriod] = useState('30 Oktober 2026 – 30 Oktober 2027');
  const [executiveSummary, setExecutiveSummary] = useState(
    'Layanan hosting cloud berkecepatan tinggi telah berhasil di-provisioning dan dihubungkan dengan domain utama kimholidaytravel.id pada server 103.119.237.132 dengan sertifikat AutoSSL aktif.'
  );
  const [deliverablesText, setDeliverablesText] = useState(
    'Konfigurasi akun cPanel & database MySQL pool\nPemasangan dan aktivasi sertifikat AutoSSL Let\'s Encrypt\nKonfigurasi DNS A-Record & Nameservers 1sLabs\nPenyelarasan sandboxing file manager & FTP deployment\nVerifikasi uptime & monitoring performa server'
  );

  // Selected for official preview modal
  const [selectedReport, setSelectedReport] = useState<ServiceReportItem | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getServiceReports();
      if (res.success && res.reports) {
        setReports(res.reports);
      }
    } catch (err) {
      console.error('Failed to load service reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const deliverablesList = deliverablesText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim() || !projectTitle.trim()) {
      notify.warning('Email pelanggan dan judul layanan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.admin.createServiceReport({
        customer_name: customerName.trim() || 'Pelanggan 1sLabs',
        customer_email: customerEmail.trim(),
        project_title: projectTitle.trim(),
        report_type: reportType,
        service_period: servicePeriod.trim(),
        executive_summary: executiveSummary.trim(),
        scope_of_work: 'Standard operational scope and infrastructure deliverables.',
        deliverables_json: deliverablesList,
        status: 'delivered',
        notes: `Diterbitkan secara digital oleh 1sLabs Engineering Platform.`
      });

      if (res.success) {
        notify.success(res.message || 'Laporan resmi layanan berhasil dibuat!');
        setActiveTab('list');
        await fetchReports();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal membuat laporan layanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.report_number && r.report_number.toLowerCase().includes(q)) ||
      (r.project_title && r.project_title.toLowerCase().includes(q)) ||
      (r.customer_email && r.customer_email.toLowerCase().includes(q)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Laporan Layanan & Dokumentasi Teknis (Service Reports)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Generator dokumen serah terima teknis resmi, aktivasi hosting cPanel, dan berita acara operasional berstandar faktur resmi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'list' ? (
            <button
              onClick={() => setActiveTab('create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Dokumen Baru
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('list')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Kembali ke Daftar
            </button>
          )}

          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh laporan"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: DOKUMEN GENERATOR (INPUT YANG PENTING-PENTING + LIVE PREVIEW KAYA INVOICEPAGE) */}
      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Input Sederhana */}
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Input Data Penting Dokumen</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Perubahan langsung terlihat pada pratinjau dokumen di sebelah kanan.
              </p>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Pelanggan / Klien *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Kim Holiday Travel"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Pelanggan *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="kimholidaytravel1@gmail.com"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Judul Layanan / Proyek *</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Aktivasi Hosting & Deployment Web"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Kategori Laporan</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                  >
                    <option value="hosting_activation">Aktivasi Hosting</option>
                    <option value="maintenance">Laporan Pemeliharaan</option>
                    <option value="handover">Berita Acara Serah Terima</option>
                    <option value="technical_audit">Audit Keamanan & SSL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Periode Layanan</label>
                  <input
                    type="text"
                    value={servicePeriod}
                    onChange={(e) => setServicePeriod(e.target.value)}
                    placeholder="Tahunan 2026/2027"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Ringkasan Eksekutif (Ringkas)</label>
                <textarea
                  rows={3}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  placeholder="Tuliskan ringkasan hasil pekerjaan..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Butir Serah Terima & Deliverables (Satu baris per poin)
                </label>
                <textarea
                  rows={4}
                  value={deliverablesText}
                  onChange={(e) => setDeliverablesText(e.target.value)}
                  placeholder="Contoh:&#10;• Pemasangan AutoSSL Let's Encrypt&#10;• Inisialisasi Database MySQL Pool"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Simpan & Terbitkan Laporan Resmi
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Pratinjau KAYA InvoicePage.tsx */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
            {/* Watermark Resmikaya InvoicePage */}
            <div className="absolute right-10 top-24 pointer-events-none opacity-5 select-none">
              <span className="text-8xl font-black tracking-widest text-zinc-900 rotate-[-15deg] block border-8 border-zinc-900 px-6 py-2 rounded-3xl">
                RESMI
              </span>
            </div>

            {/* Header Branding & Meta */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-zinc-200">
              <div>
                <img
                  src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                  alt="1sLabs Logo"
                  className="h-10 w-auto object-contain mb-2"
                />
                <p className="text-xs text-zinc-500 font-medium">
                  High-Performance Web Hosting & Infrastructure Platform
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Bandung, Jawa Barat, Indonesia &bull; info@1slabs.my.id
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>TERVERIFIKASI / VERIFIED</span>
                </span>
                <h2 className="text-base font-bold font-mono text-zinc-900">
                  DOC-202610-SRV
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                  Kategori: {reportType.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            {/* Customer & Period Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-zinc-200 text-xs">
              <div>
                <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Klien / Instansi Penerima:
                </span>
                <p className="font-bold text-sm text-zinc-900">
                  {customerName || 'Nama Klien'}
                </p>
                <p className="text-zinc-600 mt-0.5 font-mono">{customerEmail || 'email@klien.com'}</p>
                <p className="text-zinc-500 mt-1">Platform Cloud Hosting 1sLabs</p>
              </div>

              <div className="sm:text-right">
                <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Periode & Tanggal Dokumen:
                </span>
                <p className="font-bold text-xs text-zinc-900">
                  {servicePeriod || 'Tahun 2026/2027'}
                </p>
                <p className="text-zinc-500 mt-0.5">
                  Diterbitkan: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </p>
                <p className="text-zinc-500 mt-0.5 font-mono">Status: Delivered & Active</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="py-6 border-b border-zinc-200 text-xs space-y-2">
              <span className="font-bold text-zinc-400 uppercase tracking-wider block">
                Ringkasan Eksekutif Layanan (Executive Summary)
              </span>
              <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                {executiveSummary || 'Ringkasan lingkup pekerjaan dan status performa teknis.'}
              </p>
            </div>

            {/* Deliverables Checklist Table */}
            <div className="py-6 border-b border-zinc-200 space-y-3">
              <span className="font-bold text-zinc-400 uppercase tracking-wider block text-xs">
                Butir Serah Terima & Spesifikasi Teknis (Deliverables)
              </span>

              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                <div className="grid grid-cols-12 bg-zinc-50 p-3 text-[11px] font-mono uppercase text-zinc-500 font-bold border-b border-zinc-200">
                  <div className="col-span-8">Komponen Infrastruktur / Pekerjaan</div>
                  <div className="col-span-4 text-right">Status Verifikasi</div>
                </div>

                <div className="divide-y divide-zinc-100">
                  {deliverablesList.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 p-3 items-center text-xs">
                      <div className="col-span-8 flex items-center space-x-2 text-zinc-900 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                      <div className="col-span-4 text-right">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Signatures & Verification Stamp */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-xs">
              <div>
                <span className="text-zinc-400 block mb-1">Diverifikasi & Diterbitkan Oleh:</span>
                <p className="font-bold text-zinc-900">1sLabs Engineering Platform</p>
                <p className="text-zinc-500 text-[11px]">System Infrastructure Team</p>
                <div className="mt-6 border-b border-zinc-300 w-36"></div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">Digital Signature Key Verified</p>
              </div>

              <div className="text-right">
                <span className="text-zinc-400 block mb-1">Pihak Penerima (Client):</span>
                <p className="font-bold text-zinc-900">{customerName}</p>
                <p className="text-zinc-500 text-[11px]">Authorized Representative</p>
                <div className="mt-6 border-b border-zinc-300 w-36 ml-auto"></div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">Confirmed & Accepted</p>
              </div>
            </div>

            {/* Top/Bottom Action Bar for Printing */}
            <div className="mt-8 pt-4 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Pratinjau dokumen otomatis sesuai standar format PDF resmi</span>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak atau Simpan PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: DAFTAR LAPORAN DOKUMEN */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor dokumen, nama klien, atau judul layanan..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
                  <tr>
                    <th className="py-3.5 px-5">Nomor Laporan</th>
                    <th className="py-3.5 px-4">Judul Layanan</th>
                    <th className="py-3.5 px-4">Klien</th>
                    <th className="py-3.5 px-4">Tipe Dokumen</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Tanggal Dibuat</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {loading && reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                        Memuat daftar dokumen service reports...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                        Belum ada dokumen laporan layanan yang diterbitkan.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-zinc-900">
                          {r.report_number || `REP-${r.id}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-zinc-900 block">{r.project_title}</span>
                          <span className="text-[11px] text-zinc-400">{r.service_period || 'Periode Resmi'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-zinc-900">{r.customer_name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">{r.customer_email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs capitalize text-zinc-700">
                          {r.report_type ? r.report_type.replace('_', ' ') : 'General'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400 text-xs">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                          >
                            Buka Dokumen
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU DOKUMEN RESMI (KAYA INVOICEPAGE.TSX) */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-8 sm:p-12 animate-in fade-in zoom-in-95 relative">
            <div className="flex justify-between items-center pb-6 border-b border-zinc-200 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                  alt="1sLabs Logo"
                  className="h-9 w-auto"
                />
                <div>
                  <h3 className="text-base font-bold text-zinc-900">1sLabs Verified Technical Document</h3>
                  <p className="text-xs text-zinc-500">Nomor: {selectedReport.report_number || `REP-${selectedReport.id}`}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Document Body */}
            <div className="space-y-6 text-xs text-zinc-800">
              <div className="flex justify-between items-start border-b border-zinc-100 pb-5">
                <div>
                  <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Klien:</span>
                  <p className="font-bold text-sm text-zinc-900">{selectedReport.customer_name}</p>
                  <p className="text-zinc-600 font-mono">{selectedReport.customer_email}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">Periode:</span>
                  <p className="font-bold text-zinc-900">{selectedReport.service_period || 'Annual 2026/2027'}</p>
                  <p className="text-zinc-500">{selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Judul Proyek / Layanan:
                </span>
                <p className="font-bold text-sm text-zinc-900">{selectedReport.project_title}</p>
              </div>

              {selectedReport.executive_summary && (
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider block mb-1 text-[11px]">
                    Ringkasan Eksekutif:
                  </span>
                  <p className="text-zinc-700 leading-relaxed">{selectedReport.executive_summary}</p>
                </div>
              )}

              {selectedReport.deliverables_json && (
                <div>
                  <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Daftar Butir Serah Terima & Spesifikasi Teknis:
                  </span>
                  <div className="border border-zinc-200 rounded-2xl divide-y divide-zinc-100">
                    {Array.isArray(selectedReport.deliverables_json)
                      ? selectedReport.deliverables_json.map((del: string, i: number) => (
                          <div key={i} className="p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium text-zinc-900">{del}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              VERIFIED
                            </span>
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-5 border-t border-zinc-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak atau Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
