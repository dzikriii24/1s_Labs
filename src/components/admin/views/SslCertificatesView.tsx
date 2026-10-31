import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Lock,
  Globe,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../../../services/api';
import notify from '../../../lib/notify';

export const SslCertificatesView: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [autoSslRunning, setAutoSslRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const fetchSslData = async () => {
    setLoading(true);
    try {
      const [certsRes, problemsRes, statusRes] = await Promise.all([
        api.admin.getSslCertificates(),
        api.admin.getAutoSslProblems(),
        api.admin.getAutoSslStatus()
      ]);

      if (certsRes.success) setCerts(certsRes.certificates || []);
      if (problemsRes.success) setProblems(problemsRes.problems || []);
      if (statusRes.success) setAutoSslRunning(statusRes.in_progress || false);
    } catch (err) {
      console.error('Failed to load SSL certificates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSslData();
  }, []);

  const handleTriggerAutoSsl = async () => {
    const ok = await notify.confirm({
      title: 'Perpanjangan AutoSSL',
      text: 'Jalankan perpanjangan sertifikat AutoSSL untuk semua domain di server?',
      confirmButtonText: 'Jalankan AutoSSL'
    });
    if (!ok) return;

    setTriggering(true);
    try {
      const res = await api.admin.runAutoSsl();
      notify.success(res.message || 'Pemeriksaan AutoSSL berhasil diinisiasi.');
      setAutoSslRunning(true);
      await fetchSslData();
    } catch (err: any) {
      notify.error(err.message || 'Gagal memulai AutoSSL.');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Sertifikat SSL / TLS & AutoSSL Manager
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Pengelolaan sertifikat SSL host cPanel UAPI, enkripsi Let&apos;s Encrypt / Sectigo, cakupan SAN, dan perpanjangan otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerAutoSsl}
            disabled={triggering || autoSslRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {triggering || autoSslRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{autoSslRunning ? 'AutoSSL Sedang Berjalan...' : 'Jalankan AutoSSL Sekarang'}</span>
          </button>

          <button
            onClick={fetchSslData}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh status SSL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* AutoSSL Status Notice */}
      {autoSslRunning && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong className="text-blue-950 font-bold">AutoSSL cPanel Sedang Aktif:</strong> Server sedang melakukan validasi DNS dan menerbitkan sertifikat Let&apos;s Encrypt untuk domain pelanggan. Proses ini membutuhkan waktu 1-3 menit.
          </div>
        </div>
      )}

      {/* Problems Box if any */}
      {problems.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Isu Validasi AutoSSL Terdeteksi ({problems.length})
          </div>
          <div className="space-y-1.5 text-xs text-red-900">
            {problems.map((prob, i) => (
              <div key={i} className="p-2 bg-white rounded-xl border border-red-200">
                <span className="font-mono font-bold">{prob.domain || prob.name}: </span>
                <span>{prob.error || prob.reason || JSON.stringify(prob)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Sertifikat Virtual Host Terpasang ({certs.length})
          </h2>
        </div>

        {loading && certs.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
            Mengambil data sertifikat SSL cPanel...
          </div>
        ) : certs.length === 0 ? (
          <div className="p-8 text-center bg-white border border-zinc-200 rounded-2xl text-zinc-400 text-sm">
            Tidak ditemukan sertifikat SSL terpasang pada host cPanel ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.map((cert, idx) => {
              const isSelfSigned =
                cert.is_self_signed ||
                (cert.issuer_organization_name &&
                  cert.issuer_organization_name.toLowerCase().includes('self'));
              const isExpired = cert.not_after && new Date(cert.not_after * 1000) < new Date();
              const domainsCovered = cert.domains || (cert.domain ? [cert.domain] : []);

              return (
                <div
                  key={idx}
                  className="p-5 bg-white border border-zinc-200 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs hover:border-zinc-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-purple-600" />
                          <h3 className="text-base font-bold text-zinc-900">
                            {cert.servername || cert.domain || 'Hosted Domain'}
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                          IP Host: {cert.ip || '103.119.237.132'}
                        </p>
                      </div>

                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                          <XCircle className="w-3 h-3" /> Kedaluwarsa
                        </span>
                      ) : isSelfSigned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Self-Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Aktif (Valid)
                        </span>
                      )}
                    </div>

                    <div className="mt-4 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Penerbit (Issuer):</span>
                        <span className="text-zinc-900 font-bold truncate max-w-[200px]">
                          {cert.issuer_organization_name || cert.issuer || 'Let\'s Encrypt'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Kedaluwarsa:</span>
                        <span className="text-zinc-700 font-mono font-semibold">
                          {cert.not_after
                            ? new Date(cert.not_after * 1000).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'}
                        </span>
                      </div>
                    </div>

                    {domainsCovered.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase mb-1.5">
                          Domain SAN Terlindungi ({domainsCovered.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {domainsCovered.slice(0, 6).map((d: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md text-[11px] font-mono border border-zinc-200"
                            >
                              {d}
                            </span>
                          ))}
                          {domainsCovered.length > 6 && (
                            <span className="px-2 py-0.5 bg-zinc-50 text-zinc-400 rounded-md text-[11px] font-mono">
                              +{domainsCovered.length - 6} lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-end">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors cursor-pointer"
                    >
                      Rincian Sertifikat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cert Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-zinc-900">
                Sertifikat SSL: {selectedCert.servername || selectedCert.domain}
              </h3>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
              <div><strong className="text-zinc-900">Domain:</strong> {selectedCert.servername || selectedCert.domain}</div>
              <div><strong className="text-zinc-900">Issuer:</strong> {selectedCert.issuer_organization_name || selectedCert.issuer}</div>
              <div><strong className="text-zinc-900">Algorithm:</strong> {selectedCert.signature_algorithm || 'sha256WithRSAEncryption'}</div>
              <div>
                <strong className="text-zinc-900">Valid From:</strong>{' '}
                {selectedCert.not_before ? new Date(selectedCert.not_before * 1000).toLocaleString('id-ID') : '-'}
              </div>
              <div>
                <strong className="text-zinc-900">Valid Until:</strong>{' '}
                {selectedCert.not_after ? new Date(selectedCert.not_after * 1000).toLocaleString('id-ID') : '-'}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100 mt-5">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
