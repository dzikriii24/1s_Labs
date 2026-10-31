import React, { useEffect, useState, useRef } from 'react';
import {
  FolderArchive,
  Upload,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  Plus,
  ShieldCheck,
  HardDrive,
  FileCheck,
  CheckCircle2,
  FolderUp,
  Grid,
  List
} from 'lucide-react';
import { api, PaymentProofItem } from '../../../services/api';
import notify from '../../../lib/notify';

interface PaymentProofsVaultViewProps {
  onSelectProof?: (url: string, item: PaymentProofItem) => void;
  isPickerMode?: boolean;
}

export const PaymentProofsVaultView: React.FC<PaymentProofsVaultViewProps> = ({
  onSelectProof,
  isPickerMode = false
}) => {
  const [proofs, setProofs] = useState<PaymentProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf' | 'linked'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [uploading, setUploading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getProofs();
      if (res.success && res.proofs) {
        setProofs(res.proofs);
      }
    } catch (err) {
      console.error('Failed to load payment proofs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleCopyLink = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopyFeedback(id);
    setTimeout(() => {
      setCopyFeedback(null);
    }, 2500);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    // Filter allowed extensions
    const allowed = fileArray.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext || '');
    });

    if (allowed.length === 0) {
      notify.warning('Harap unggah berkas bukti pembayaran dengan format JPG, PNG, WebP, atau PDF.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.admin.uploadProofs(allowed);
      notify.success(res.message || `Berhasil mengunggah ${allowed.length} berkas bukti pembayaran.`);
      await fetchProofs();
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengunggah berkas bukti pembayaran.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    const ok = await notify.confirm({
      title: 'Hapus Berkas',
      text: `Hapus berkas bukti "${filename}" dari brankas secara permanen?`,
      confirmButtonText: 'Ya, Hapus',
      isDanger: true
    });
    if (!ok) return;

    try {
      const res = await api.admin.deleteProof(filename);
      notify.success(res.message || 'Berkas berhasil dihapus.');
      await fetchProofs();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghapus berkas bukti.');
    }
  };

  // Filtered proofs
  const filtered = proofs.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      p.filename.toLowerCase().includes(q) ||
      p.originalName.toLowerCase().includes(q) ||
      p.linkedInvoices.some((inv) => inv.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterType === 'image') return p.isImage;
    if (filterType === 'pdf') return p.isPdf;
    if (filterType === 'linked') return p.linkedInvoices.length > 0;
    return true;
  });

  // Calculate metrics
  const totalBytes = proofs.reduce((acc, p) => acc + p.sizeBytes, 0);
  const totalStorageFormatted =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(totalBytes / 1024)} KB`;
  const pdfCount = proofs.filter((p) => p.isPdf).length;
  const imageCount = proofs.filter((p) => p.isImage).length;
  const linkedCount = proofs.filter((p) => p.linkedInvoices.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      {!isPickerMode && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900">
                  Brankas Bukti Pembayaran (Payment Proof Vault)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cloud Storage
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Repositori terpusat berkas bukti transfer & QRIS (JPG, PNG, WebP, PDF). Salin tautan langsung untuk disematkan pada faktur atau bagikan ke pelanggan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Upload className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
              Unggah File
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Unggah satu folder bukti pembayaran sekaligus"
            >
              <FolderUp className="w-3.5 h-3.5" />
              Unggah Folder
            </button>
            <button
              onClick={fetchProofs}
              disabled={loading}
              className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Segarkan daftar berkas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Hidden File & Folder Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Metrics Row */}
      {!isPickerMode && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase font-bold">Total Berkas</span>
              <FileCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900">{proofs.length}</div>
            <span className="text-[10px] text-zinc-400">Berkas tersimpan</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase font-bold">Total Ukuran</span>
              <HardDrive className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900">{totalStorageFormatted}</div>
            <span className="text-[10px] text-zinc-400">Penggunaan disk</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase font-bold">Gambar vs PDF</span>
              <ImageIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900">
              {imageCount} <span className="text-xs font-normal text-zinc-400">/</span> {pdfCount} <span className="text-[11px] font-normal text-zinc-400">PDF</span>
            </div>
            <span className="text-[10px] text-zinc-400">Komposisi berkas</span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase font-bold">Terkait Faktur</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700">{linkedCount}</div>
            <span className="text-[10px] text-zinc-400">Digunakan di invoice</span>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
          dragOver
            ? 'border-purple-500 bg-purple-50/50 scale-[0.99]'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mx-auto">
            <Upload className={`w-6 h-6 ${uploading ? 'animate-bounce' : ''}`} />
          </div>
          <h3 className="text-xs font-bold text-zinc-900">
            {uploading ? 'Sedang Mengunggah Berkas...' : 'Tarik & Lepas Berkas atau Folder Bukti Pembayaran di Sini'}
          </h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Mendukung berkas gambar (JPG, PNG, WebP) dan dokumen PDF. Anda dapat memilih beberapa file sekaligus atau satu folder utuh.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Pilih Berkas
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Pilih Folder
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama berkas, ekstensi, atau nomor invoice..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Semua Berkas' },
              { id: 'image', label: 'Gambar' },
              { id: 'pdf', label: 'PDF' },
              { id: 'linked', label: 'Terkait Faktur' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterType === f.id
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center border border-zinc-200 rounded-xl p-0.5 bg-zinc-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title="Tampilan Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Proof Files Content */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
          <p className="text-xs font-medium">Memuat berkas bukti pembayaran dari brankas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
          <FolderArchive className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
          <p className="text-xs font-semibold text-zinc-700 mb-1">
            Belum ada berkas bukti pembayaran yang cocok.
          </p>
          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
            Unggah bukti transfer atau QRIS melalui tombol di atas untuk menyimpannya di brankas digital.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.filename}
              className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Preview Thumbnail Container */}
              <div className="relative h-40 bg-zinc-100 flex items-center justify-center overflow-hidden border-b border-zinc-100">
                {item.isImage ? (
                  <img
                    src={item.url}
                    alt={item.originalName}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.retried && item.url.includes('/uploads/proofs/')) {
                        img.dataset.retried = 'true';
                        img.src = item.url.replace('/uploads/proofs/', '/api/uploads/proofs/');
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileText className="w-12 h-12 text-red-500 mx-auto mb-1" />
                    <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">
                      DOKUMEN PDF
                    </span>
                  </div>
                )}

                {/* Top Badge Overlay */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shadow-xs ${
                      item.isPdf
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-900 text-white'
                    }`}
                  >
                    {item.ext}
                  </span>
                </div>

                {/* Action Hover Overlay */}
                <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <a
                    href={item.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-semibold shadow-xs"
                    title="Buka di Halaman Viewer Khusus"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={item.url}
                    download={item.originalName}
                    className="p-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-semibold shadow-xs"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(item.filename)}
                    className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold shadow-xs"
                    title="Hapus Berkas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta & Controls */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-mono text-xs font-bold text-zinc-900 truncate" title={item.originalName}>
                    {item.originalName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mt-1">
                    <span>{item.sizeFormatted}</span>
                    <span>{new Date(item.uploadedAt).toLocaleDateString('id-ID')}</span>
                  </div>

                  {/* Linked Invoices */}
                  {item.linkedInvoices.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold">Faktur:</span>
                      {item.linkedInvoices.map((invNo) => (
                        <span
                          key={invNo}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          {invNo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                  {onSelectProof ? (
                    <button
                      type="button"
                      onClick={() => onSelectProof(item.url, item)}
                      className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Gunakan pada Faktur Ini
                    </button>
                  ) : null}

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.url, `direct-${item.filename}`)}
                      className="py-1 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Salin tautan gambar/file langsung"
                    >
                      {copyFeedback === `direct-${item.filename}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copyFeedback === `direct-${item.filename}` ? 'Tersalin' : 'Salin URL'}</span>
                    </button>

                    <a
                      href={item.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Buka halaman pratinjau resmi"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Viewer ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-5 font-semibold">Berkas Bukti</th>
                  <th className="py-3 px-4 font-semibold">Tipe</th>
                  <th className="py-3 px-4 font-semibold">Ukuran</th>
                  <th className="py-3 px-4 font-semibold">Tanggal Unggah</th>
                  <th className="py-3 px-4 font-semibold">Terkait Faktur</th>
                  <th className="py-3 px-5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {filtered.map((item) => (
                  <tr key={item.filename} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center space-x-3">
                        {item.isImage ? (
                          <img
                            src={item.url}
                            alt={item.originalName}
                            className="w-9 h-9 object-cover rounded-lg border border-zinc-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-zinc-900 block truncate max-w-xs">
                            {item.originalName}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            /uploads/proofs/{item.filename}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          item.isPdf
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                        }`}
                      >
                        {item.ext}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-zinc-600">{item.sizeFormatted}</td>
                    <td className="py-3 px-4 font-mono text-xs text-zinc-500">
                      {new Date(item.uploadedAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      {item.linkedInvoices.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.linkedInvoices.map((inv) => (
                            <span
                              key={inv}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200"
                            >
                              {inv}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">Belum disematkan</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectProof && (
                          <button
                            type="button"
                            onClick={() => onSelectProof(item.url, item)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Pilih
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(item.url, `tbl-${item.filename}`)}
                          className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Salin Link Berkas"
                        >
                          {copyFeedback === `tbl-${item.filename}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copyFeedback === `tbl-${item.filename}` ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <a
                          href={item.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Pratinjau Resmi"
                        >
                          <Eye className="w-3 h-3" />
                          Viewer ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.filename)}
                          className="p-1 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Hapus berkas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
