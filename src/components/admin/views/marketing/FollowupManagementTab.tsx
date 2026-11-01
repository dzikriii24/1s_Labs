import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  ChevronRight,
  Filter,
  CalendarCheck
} from 'lucide-react';
import { api, MarketingFollowup } from '../../../../services/api';

export const FollowupManagementTab: React.FC = () => {
  const [followups, setFollowups] = useState<MarketingFollowup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Follow-up form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFollowups = async () => {
    setIsLoading(true);
    try {
      const res = await api.marketing.getFollowups();
      if (res.success) {
        setFollowups(res.followups);
      }
    } catch (err: any) {
      console.warn('Failed to load follow-ups', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleMarkComplete = async (id: number) => {
    try {
      await api.marketing.updateFollowup(id, { status: 'completed' });
      fetchFollowups();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.marketing.createFollowup({
        company_id: parseInt(companyId, 10),
        title,
        notes,
        due_date: dueDate,
        priority
      });
      setIsFormOpen(false);
      setTitle('');
      setNotes('');
      setCompanyId('');
      fetchFollowups();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
            <CalendarCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Follow-up Management & Reminders
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola jadwal tindak lanjut komunikasi dengan prospek yang tertarik atau meminta jadwal konsultasi meeting.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengingat Follow-up</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreateSubmit} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-zinc-900 uppercase">Formulir Follow-up Baru</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="ID Perusahaan (Company ID) *"
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              required
              className="px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <input
              type="text"
              placeholder="Judul Pengingat (e.g. Kirim Penawaran Web) *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <input
              type="datetime-local"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className="px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Catatan kebutuhan prospek..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengingat'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
        <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-700" /> Daftar Pengingat Follow-up
        </h4>

        {isLoading ? (
          <div className="py-12 text-center text-zinc-500 text-xs font-mono">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-900 mb-2" />
            Memuat daftar follow-up...
          </div>
        ) : followups.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs space-y-1">
            <p className="font-semibold text-zinc-800">Belum ada jadwal follow-up yang tercatat.</p>
            <p className="text-[11px] text-zinc-400">Buat pengingat untuk prospek yang tertarik agar tidak terlewat.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {followups.map(f => (
              <div
                key={f.id}
                className="p-4 bg-zinc-50/70 border border-zinc-200 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-zinc-900">{f.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        f.priority === 'urgent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : f.priority === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {f.priority}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        f.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600">
                    Perusahaan: <strong className="text-zinc-900 font-semibold">{f.company_name || `#${f.company_id}`}</strong>
                    {f.notes && <span> — {f.notes}</span>}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                    Tenggat: {new Date(f.due_date).toLocaleString('id-ID')}
                  </div>
                </div>

                {f.status !== 'completed' && (
                  <button
                    onClick={() => handleMarkComplete(f.id)}
                    className="px-3.5 py-1.5 border border-zinc-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-zinc-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
