import React, { useEffect, useState } from 'react';
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';
import { api, EmailLogItem } from '../../../services/api';

interface EmailManagementViewProps {
  onNavigate?: (tab: string) => void;
}

export const EmailManagementView: React.FC<EmailManagementViewProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getEmailLogs({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load email delivery logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const recipient = log.recipient || (log as any).recipient_email || '';
    const subject = log.subject || '';
    const templateName = log.template_name || log.email_type || '';
    return (
      recipient.toLowerCase().includes(q) ||
      subject.toLowerCase().includes(q) ||
      templateName.toLowerCase().includes(q)
    );
  });

  const totalEmails = logs.length;
  const sentEmails = logs.filter((l) => l.status === 'sent').length;
  const failedEmails = logs.filter((l) => l.status === 'failed').length;
  const successRate = totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Log Pengiriman Email & Audit SMTP
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Audit komunikasi outbound SMTP dari info@1slabs.my.id melalui Brevo Relay. Pantau status pengiriman dan timestamp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('email-templates')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Editor Template Email</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh log email"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-xs font-mono uppercase text-zinc-400 font-semibold">Total Email Keluar</div>
          <div className="text-2xl font-bold font-mono text-zinc-900 mt-2">{totalEmails}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Via info@1slabs.my.id</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="text-xs font-mono uppercase text-emerald-600 font-semibold">Terkirim Sukses</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{sentEmails}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">SMTP 250 Accepted</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-red-200 shadow-xs">
          <div className="text-xs font-mono uppercase text-red-600 font-semibold">Gagal Dikirim</div>
          <div className="text-2xl font-bold font-mono text-red-600 mt-2">{failedEmails}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Bounce / Handshake error</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
          <div className="text-xs font-mono uppercase text-zinc-400 font-semibold">Tingkat Keberhasilan</div>
          <div className="text-2xl font-bold font-mono text-zinc-900 mt-2">{successRate}%</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Delivery reliability</div>
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
            placeholder="Cari email penerima, subjek, atau tipe template..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'sent', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {st === 'all' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-100">
              <tr>
                <th className="py-3.5 px-5">Penerima</th>
                <th className="py-3.5 px-4">Subjek Email</th>
                <th className="py-3.5 px-4">Kategori Template</th>
                <th className="py-3.5 px-4">Status Pengiriman</th>
                <th className="py-3.5 px-4">Waktu Dikirim</th>
                <th className="py-3.5 px-5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Mengambil log pengiriman email...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-sans">
                    Tidak ditemukan log email yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const recipient = log.recipient || (log as any).recipient_email;
                  const templateName = log.template_name || log.email_type || 'System';
                  const timestamp = log.sent_at || log.created_at;

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-zinc-900">
                        {recipient}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm truncate text-zinc-900 font-medium">
                        {log.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          {templateName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                        {timestamp
                          ? new Date(timestamp).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                        >
                          Inspeksi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-zinc-900">Inspeksi Pengiriman Email</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Penerima</span>
                  <span className="text-zinc-900 font-bold">{selectedLog.recipient || (selectedLog as any).recipient_email}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Subjek</span>
                  <span className="text-zinc-800">{selectedLog.subject}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Kategori Template</span>
                  <span className="text-zinc-800">{selectedLog.template_name || selectedLog.email_type}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Status Pengiriman</span>
                  <span className={selectedLog.status === 'sent' ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                    {selectedLog.status.toUpperCase()}
                  </span>
                </div>
                {selectedLog.last_error && (
                  <div>
                    <span className="text-red-600 text-[10px] uppercase font-bold block">Pesan Error SMTP</span>
                    <span className="text-red-700 font-bold break-all">{selectedLog.last_error}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Waktu Dispatch</span>
                  <span className="text-zinc-600">{new Date(selectedLog.sent_at || selectedLog.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-zinc-100 mt-5">
              <button
                onClick={() => setSelectedLog(null)}
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
