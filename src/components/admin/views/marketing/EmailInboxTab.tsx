import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  CalendarCheck,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Building2,
  Calendar
} from 'lucide-react';
import { api, MarketingEmailReply } from '../../../../services/api';

export const EmailInboxTab: React.FC = () => {
  const [replies, setReplies] = useState<MarketingEmailReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<MarketingEmailReply | null>(null);

  // Status update
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchInbox = async () => {
    setIsLoading(true);
    try {
      const res = await api.marketing.getInbox();
      if (res.success) {
        setReplies(res.replies);
        if (res.replies.length > 0 && !selectedReply) {
          setSelectedReply(res.replies[0]);
          setAdminNotes(res.replies[0].admin_notes || '');
          setSelectedClass(res.replies[0].classification);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load email inbox', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleSelectReply = (r: MarketingEmailReply) => {
    setSelectedReply(r);
    setAdminNotes(r.admin_notes || '');
    setSelectedClass(r.classification);
  };

  const handleSaveStatus = async () => {
    if (!selectedReply) return;
    setIsUpdating(true);
    try {
      await api.marketing.updateInboxStatus(selectedReply.id, {
        classification: selectedClass,
        status: 'read',
        admin_notes: adminNotes
      });
      alert('Status balasan email berhasil disimpan!');
      fetchInbox();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickAction = async (classification: string, message: string) => {
    if (!selectedReply) return;
    if (!window.confirm(message)) return;

    try {
      await api.marketing.updateInboxStatus(selectedReply.id, {
        classification,
        status: 'read'
      });
      fetchInbox();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
            <Inbox className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Email Inbox & Responses
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pantau balasan prospek, analisis sentimen Gemini AI, dan klasifikasi minat secara otomatis.
            </p>
          </div>
        </div>

        <button
          onClick={fetchInbox}
          className="p-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer self-start"
          title="Refresh Inbox"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500 text-xs font-mono bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-900 mb-2" />
          Memuat kotak masuk balasan...
        </div>
      ) : replies.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-xs bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-2">
          <Inbox className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="font-semibold text-zinc-800">Belum ada balasan email masuk dari prospek.</p>
          <p className="text-[11px] text-zinc-400">Saat prospek membalas email penawaran, email akan otomatis dicocokkan ke database prospek.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thread List */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs lg:col-span-1 space-y-2 max-h-[650px] overflow-y-auto">
            <h4 className="text-[11px] font-mono uppercase text-zinc-500 font-bold px-1 mb-2">
              Daftar Balasan ({replies.length})
            </h4>
            {replies.map((r) => {
              const isSelected = selectedReply?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectReply(r)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/80 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold truncate max-w-[150px] ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                      {r.from_name || r.from_email}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {new Date(r.received_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className={`text-[11px] font-medium truncate mb-1.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {r.subject}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        isSelected
                          ? 'bg-zinc-800 text-zinc-200'
                          : r.classification === 'Interested' || r.classification === 'Consultation Requested'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.classification === 'Unsubscribe' || r.classification === 'Not Interested'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {r.classification}
                    </span>
                    {r.company_name && (
                      <span className={`truncate max-w-[120px] ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {r.company_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thread Detail & AI Intent */}
          {selectedReply && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-6">
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-zinc-900">{selectedReply.from_name || selectedReply.from_email}</span>
                    <span className="text-xs text-zinc-500 font-mono">&lt;{selectedReply.from_email}&gt;</span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900">{selectedReply.subject}</h4>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Perusahaan: <strong className="text-zinc-800 font-medium">{selectedReply.company_name || 'N/A'}</strong> • {new Date(selectedReply.received_at).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-xl font-semibold ${
                      selectedReply.sentiment === 'positive'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedReply.sentiment === 'negative'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}
                  >
                    Sentimen: {selectedReply.sentiment}
                  </span>
                </div>
              </div>

              {/* Gemini AI Summary Box */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Ringkasan Analisis Gemini AI
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  {selectedReply.ai_summary || 'Prospek merespons email outreach. Siapkan follow up untuk penjadwalan konsultasi online meeting.'}
                </p>
              </div>

              {/* Email Body */}
              <div className="bg-zinc-50/70 p-4 rounded-2xl border border-zinc-200 text-xs text-zinc-800 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedReply.body_text}
              </div>

              {/* Quick Response Actions */}
              <div className="space-y-3 pt-2">
                <h5 className="text-[11px] font-mono uppercase text-zinc-500 font-bold">Tindakan Cepat & Update CRM</h5>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickAction('Consultation Requested', 'Tandai prospek meminta jadwal konsultasi meeting?')}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" /> Jadwalkan Konsultasi VMeet
                  </button>

                  <button
                    onClick={() => handleQuickAction('Interested', 'Tandai prospek tertarik dengan layanan 1sLabs?')}
                    className="px-3.5 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tandai Tertarik
                  </button>

                  <button
                    onClick={() => handleQuickAction('Unsubscribe', 'Hentikan outreach dan masukkan ke Global Suppression List?')}
                    className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Stop Contact / Unsubscribe
                  </button>
                </div>

                <div className="pt-3 border-t border-zinc-200 space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Catatan Internal Admin</label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    placeholder="Tulis catatan tindak lanjut diskusi dengan prospek..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveStatus}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isUpdating ? 'Menyimpan...' : 'Simpan Catatan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
