import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  FileText,
  X,
  Plus,
  Video,
  ShieldCheck,
  Eye
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  formatTextToEmailHtml,
  htmlToFormattedText,
  cleanMojibake,
  substitutePlaceholders
} from '../../../../utils/emailFormatter';
import {
  api,
  HRCandidate,
  HRPosition,
  HRPromotedStatus,
  HREmailStatus,
  HRCandidateActivity,
  HREmailLog,
  HREmailReply,
  HRInterview
} from '../../../../services/api';
import notify from '../../../../lib/notify';

interface HRCandidatesTabProps {
  onOpenComposeModal?: (selectedCandidateIds: number[]) => void;
  preselectedCandidateId?: number | null;
}

export const HRCandidatesTab: React.FC<HRCandidatesTabProps> = ({
  onOpenComposeModal,
  preselectedCandidateId
}) => {
  const [candidates, setCandidates] = useState<HRCandidate[]>([]);
  const [positions, setPositions] = useState<HRPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState<string>('all');
  const [selectedRecStatus, setSelectedRecStatus] = useState<string>('all');
  const [selectedEmailStatus, setSelectedEmailStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('last_activity_at');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<HRCandidate | null>(null);

  // Candidate Detail Drawer / Modal
  const [detailCandidateId, setDetailCandidateId] = useState<number | null>(preselectedCandidateId || null);
  const [detailData, setDetailData] = useState<{
    candidate: HRCandidate;
    activities: HRCandidateActivity[];
    email_logs: HREmailLog[];
    email_replies: HREmailReply[];
    interviews: HRInterview[];
  } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState<'timeline' | 'emails' | 'interviews' | 'notes'>('timeline');
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position_id: '',
    source: 'linkedin',
    notes: '',
    resume_url: '',
    portfolio_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Email Modal
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Fetch Positions master data
  useEffect(() => {
    api.hr.getPositions({ status: 'active' }).then(res => {
      if (res.success) {
        setPositions(res.positions);
        if (res.positions.length > 0 && !formData.position_id) {
          setFormData(prev => ({ ...prev, position_id: String(res.positions[0].id) }));
        }
      }
    });

    api.hr.getEmailTemplates().then(res => {
      if (res.success) setTemplates(res.templates);
    });
  }, []);

  // Fetch Candidates list
  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await api.hr.getCandidates({
        search: searchQuery.trim() || undefined,
        position_id: selectedPositionId === 'all' ? undefined : selectedPositionId,
        recruitment_status: selectedRecStatus === 'all' ? undefined : selectedRecStatus,
        email_status: selectedEmailStatus === 'all' ? undefined : selectedEmailStatus,
        sort_by: sortBy,
        order: 'DESC',
        page,
        limit: 20
      });

      if (res.success) {
        setCandidates(res.candidates);
        setTotalPages(res.pagination.total_pages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      console.warn('Failed to fetch candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [searchQuery, selectedPositionId, selectedRecStatus, selectedEmailStatus, sortBy, page]);

  // Load Candidate Detail
  useEffect(() => {
    if (!detailCandidateId) {
      setDetailData(null);
      return;
    }

    const loadDetail = async () => {
      setIsDetailLoading(true);
      try {
        const res = await api.hr.getCandidate(detailCandidateId);
        if (res.success) {
          setDetailData(res);
        }
      } catch (err: any) {
        notify.error('Gagal memuat rincian kandidat.');
      } finally {
        setIsDetailLoading(false);
      }
    };

    loadDetail();
  }, [detailCandidateId]);

  // Handle select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(candidates.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Add Candidate
  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      position_id: positions.length > 0 ? String(positions[0].id) : '',
      source: 'linkedin',
      notes: '',
      resume_url: '',
      portfolio_url: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.position_id) {
      notify.error('Nama, email, dan posisi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.hr.createCandidate({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
        position_id: parseInt(formData.position_id, 10),
        source: formData.source,
        notes: formData.notes || undefined,
        resume_url: formData.resume_url || undefined,
        portfolio_url: formData.portfolio_url || undefined
      });

      if (res.success) {
        notify.success('Kandidat baru berhasil ditambahkan!');
        setIsAddModalOpen(false);
        fetchCandidates();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menambahkan kandidat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Candidate
  const handleOpenEdit = (cand: HRCandidate) => {
    setEditingCandidate(cand);
    setFormData({
      full_name: cand.full_name,
      email: cand.email,
      phone: cand.phone || '',
      position_id: String(cand.position_id),
      source: cand.source || 'other',
      notes: cand.notes || '',
      resume_url: cand.resume_url || '',
      portfolio_url: cand.portfolio_url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    setIsSubmitting(true);
    try {
      await api.hr.updateCandidate(editingCandidate.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
        position_id: parseInt(formData.position_id, 10),
        source: formData.source,
        notes: formData.notes || undefined,
        resume_url: formData.resume_url || undefined,
        portfolio_url: formData.portfolio_url || undefined
      });

      notify.success('Data kandidat berhasil diperbarui!');
      setIsEditModalOpen(false);
      fetchCandidates();
      if (detailCandidateId === editingCandidate.id) {
        // reload detail
        const res = await api.hr.getCandidate(editingCandidate.id);
        if (res.success) setDetailData(res);
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui kandidat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Candidate
  const handleDelete = async (cand: HRCandidate) => {
    const confirm = await Swal.fire({
      title: 'Hapus Kandidat?',
      text: `Apakah Anda yakin ingin menghapus data kandidat "${cand.full_name}" (${cand.email})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#18181b',
      cancelButtonColor: '#71717a',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        await api.hr.deleteCandidate(cand.id);
        notify.success('Data kandidat berhasil dihapus.');
        fetchCandidates();
        if (detailCandidateId === cand.id) {
          setDetailCandidateId(null);
        }
      } catch (err: any) {
        notify.error(err.message || 'Gagal menghapus kandidat.');
      }
    }
  };

  // Update Status from Detail Drawer
  const handleUpdateStatus = async (candId: number, newStatus: HRPromotedStatus) => {
    try {
      await api.hr.updateCandidateStatus(candId, { recruitment_status: newStatus });
      notify.success(`Status seleksi diperbarui ke: ${newStatus}`);
      fetchCandidates();
      const res = await api.hr.getCandidate(candId);
      if (res.success) setDetailData(res);
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui status.');
    }
  };

  // Add internal note in Detail Drawer
  const handleAddNote = async () => {
    if (!detailCandidateId || !newNoteText.trim()) return;
    setIsAddingNote(true);
    try {
      await api.hr.addCandidateNote(detailCandidateId, newNoteText.trim());
      notify.success('Catatan berhasil disimpan!');
      setNewNoteText('');
      const res = await api.hr.getCandidate(detailCandidateId);
      if (res.success) setDetailData(res);
    } catch (err: any) {
      notify.error('Gagal menambahkan catatan.');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Open Bulk Email Modal
  const handleOpenBulkEmail = () => {
    if (selectedIds.length === 0) {
      notify.warning('Pilih minimal satu kandidat dengan mencentang kotak seleksi.');
      return;
    }
    setEmailSubject('');
    setEmailBody('');
    setSelectedTemplateKey('');
    setIsBulkEmailModalOpen(true);
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplateKey(templateKey);
    const tmpl = templates.find(t => t.template_key === templateKey);
    if (tmpl) {
      setEmailSubject(cleanMojibake(tmpl.subject));
      setEmailBody(htmlToFormattedText(tmpl.body_html));
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedIds.length === 0) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      notify.error('Subjek dan isi email wajib diisi.');
      return;
    }

    setIsSendingBulk(true);
    try {
      const res = await api.hr.sendEmails({
        candidate_ids: selectedIds,
        template_key: selectedTemplateKey || null,
        custom_subject: emailSubject,
        custom_body: emailBody,
        campaign_title: `Pengiriman ke ${selectedIds.length} Kandidat Terpilih`
      });

      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Email Berhasil Diproses!',
          text: `Terkirim: ${res.result.sent} | Gagal: ${res.result.failed}`,
          confirmButtonColor: '#18181b'
        });
        setIsBulkEmailModalOpen(false);
        setSelectedIds([]);
        fetchCandidates();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengirim email.');
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Status Badges formatting
  const getEmailStatusBadge = (status: HREmailStatus) => {
    switch (status) {
      case 'replied':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"><CheckCircle2 className="w-3 h-3" /> Dibalas</span>;
      case 'sent':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60"><Send className="w-3 h-3" /> Terkirim</span>;
      case 'delivered':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/60"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60"><AlertCircle className="w-3 h-3" /> Gagal</span>;
      case 'bounced':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60"><AlertCircle className="w-3 h-3" /> Bounced</span>;
      case 'not_contacted':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">Belum Dikontak</span>;
    }
  };

  const getRecruitmentBadge = (status: HRPromotedStatus) => {
    switch (status) {
      case 'new_candidate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">New Candidate</span>;
      case 'contacted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">Contacted</span>;
      case 'responded':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Responded</span>;
      case 'screening':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">Screening</span>;
      case 'interview_scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">Interview Scheduled</span>;
      case 'interview_completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/60">Interview Completed</span>;
      case 'offered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Offered / Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">Rejected</span>;
      case 'on_hold':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60">On Hold</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600">{status}</span>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'linkedin':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">LinkedIn</span>;
      case 'projects_co_id':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">Projects.co.id</span>;
      case 'job_portal':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">Job Portal</span>;
      case 'referral':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">Referral</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-600 capitalize">{source}</span>;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 60) return `${mins}m lalu`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}j lalu`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}h lalu`;
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Actions */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Manajemen Kandidat & Rekrutmen
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kelola profil pelamar, status seleksi, jejak korespondensi email, dan riwayat wawancara secara komprehensif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleOpenBulkEmail}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs animate-in fade-in"
            >
              <Mail className="w-3.5 h-3.5" />
              Kirim Email ({selectedIds.length})
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Kandidat
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, nomor HP kandidat..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
            />
          </div>

          {/* Position Filter */}
          <div>
            <select
              value={selectedPositionId}
              onChange={e => {
                setSelectedPositionId(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-medium text-zinc-700"
            >
              <option value="all">Semua Posisi</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Recruitment Status Filter */}
          <div>
            <select
              value={selectedRecStatus}
              onChange={e => {
                setSelectedRecStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-medium text-zinc-700"
            >
              <option value="all">Semua Status Seleksi</option>
              <option value="new_candidate">New Candidate</option>
              <option value="contacted">Contacted</option>
              <option value="responded">Responded</option>
              <option value="screening">Screening</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="interview_completed">Interview Completed</option>
              <option value="offered">Offered / Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          {/* Email Status Filter */}
          <div>
            <select
              value={selectedEmailStatus}
              onChange={e => {
                setSelectedEmailStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-medium text-zinc-700"
            >
              <option value="all">Semua Status Email</option>
              <option value="not_contacted">Belum Dikontak</option>
              <option value="sent">Email Sent</option>
              <option value="replied">Kandidat Membalas</option>
              <option value="failed">Gagal / Bounce</option>
            </select>
          </div>
        </div>

        {/* Sub-bar: Bulk selection status & sorting */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Menampilkan <strong className="text-zinc-900">{candidates.length}</strong> dari <strong className="text-zinc-900">{totalRecords}</strong> kandidat
            </span>
            {selectedIds.length > 0 && (
              <span className="text-zinc-800 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md">
                {selectedIds.length} terpilih
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Urutkan:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="p-1 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-white"
            >
              <option value="last_activity_at">Aktivitas Terkini</option>
              <option value="created_at">Tanggal Terdaftar</option>
              <option value="full_name">Nama (A-Z)</option>
            </select>

            <button
              onClick={fetchCandidates}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600"
              title="Refresh tabel"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={candidates.length > 0 && selectedIds.length === candidates.length}
                    onChange={handleSelectAll}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                </th>
                <th className="px-4 py-3.5">Kandidat</th>
                <th className="px-4 py-3.5">Nomor Kontak</th>
                <th className="px-4 py-3.5">Posisi Dilamar</th>
                <th className="px-3 py-3.5">Sumber</th>
                <th className="px-3 py-3.5">Status Email</th>
                <th className="px-4 py-3.5">Status Seleksi</th>
                <th className="px-4 py-3.5">Aktivitas</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat data kandidat...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-zinc-400">
                    <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    Belum ada kandidat yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                candidates.map(cand => {
                  const isChecked = selectedIds.includes(cand.id);
                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-zinc-50/70 transition-colors ${isChecked ? 'bg-zinc-50/90' : ''}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(cand.id)}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div
                          onClick={() => setDetailCandidateId(cand.id)}
                          className="font-bold text-zinc-900 text-sm hover:underline cursor-pointer"
                        >
                          {cand.full_name}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          {cand.email}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600">
                        {cand.phone ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            {cand.phone}
                          </span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-zinc-800">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                          {cand.position_name || 'Posisi tidak ditentukan'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        {getSourceBadge(cand.source)}
                      </td>
                      <td className="px-3 py-3.5">
                        {getEmailStatusBadge(cand.email_status)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getRecruitmentBadge(cand.recruitment_status)}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-zinc-400">
                        {formatTimeAgo(cand.last_activity_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailCandidateId(cand.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-800 font-medium transition-colors"
                          >
                            Rincian
                          </button>
                          <button
                            onClick={() => handleOpenEdit(cand)}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cand)}
                            className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 transition-colors"
                            title="Hapus Kandidat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Tambah Kandidat Baru</h3>
                  <p className="text-[11px] text-zinc-400">Pendaftaran cepat berkas pelamar</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Contoh: Sarah Azhari"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="kandidat@email.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Posisi Dilamar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.position_id}
                    onChange={e => setFormData({ ...formData, position_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="">Pilih Posisi Master</option>
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Sumber Pelamar
                  </label>
                  <select
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="projects_co_id">Projects.co.id</option>
                    <option value="job_portal">Job Portal (Glints/Jobstreet)</option>
                    <option value="referral">Rekomendasi / Referral</option>
                    <option value="social_media">Media Sosial 1sLabs</option>
                    <option value="website">Website Resmi 1sLabs</option>
                    <option value="other">Sumber Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Catatan Internal HR (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ringkasan kualifikasi, ekspektasi gaji, atau catatan khusus..."
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-semibold tracking-wide"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kandidat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* Email Visual Preview Modal Overlay */}
      {isPreviewModalOpen && (() => {
        const sampleCandidate = candidates.find(c => selectedIds.includes(c.id)) || candidates[0];
        const samplePos = sampleCandidate ? (sampleCandidate.position_title || sampleCandidate.position_name || 'Posisi Terkait') : 'Digital Marketing Specialist';
        const sampleSubject = substitutePlaceholders(emailSubject || 'Undangan Seleksi Rekrutmen 1sLabs - {{position_name}}', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs'
        });
        const sampleBody = substitutePlaceholders(emailBody || 'Halo **{{candidate_name}}**,\n\nTerima kasih atas lamaran Anda untuk posisi **{{position_name}}** di **{{company_name}}**.', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs',
          scheduling_link: 'https://1slabs.my.id/interview/schedule/sample-token',
          meeting_link: 'https://meet.google.com/oneslabs-interview',
          interview_date: 'Senin, 10 November 2026',
          interview_time: '10:00 - 10:45 WIB'
        });
        const renderedHtml = formatTextToEmailHtml(sampleBody);

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Window Titlebar */}
              <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/90 select-none">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 font-mono">
                    Pratinjau Tampilan Email Resmi Rekrutmen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simulated Client Header */}
              <div className="px-6 py-3.5 bg-white border-b border-zinc-100 space-y-2 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      1s
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900">1sLabs Recruitment</span>
                        <span className="text-[10px] font-mono text-zinc-500">&lt;hr@1slabs.my.id&gt;</span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> DKIM & SPF Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Kepada: <strong className="text-zinc-800 font-medium">{sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi'}</strong> &bull; <span className="font-mono text-zinc-600">{sampleCandidate?.email || 'ahmad.fauzi@example.com'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400 shrink-0 font-mono mt-1 hidden sm:block">
                    Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold shrink-0">
                    Subjek:
                  </span>
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {sampleSubject}
                  </span>
                </div>
              </div>

              {/* Paper Canvas */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-zinc-100/80 flex justify-center items-start">
                <div className="w-full max-w-[620px]">
                  <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl overflow-hidden">
                    {/* Brand Header */}
                    <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                      <img
                        src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                        alt="1sLabs Logo"
                        className="h-8 sm:h-9 w-auto object-contain"
                        onError={(e: any) => {
                          e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                        }}
                      />
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-700 border border-zinc-200 font-bold uppercase tracking-wider shadow-2xs">
                        Recruitment & HR
                      </span>
                    </div>

                    {/* Email Content Body */}
                    <div className="p-6 sm:p-8">
                      <div
                        className="email-rendered-body"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    </div>

                    {/* Minimalist Footer */}
                    <div className="px-6 py-5 bg-zinc-50/70 border-t border-zinc-100 text-center text-[11px] text-zinc-400 space-y-1">
                      <p className="font-medium text-zinc-600">
                        1sLabs Technology Studio &bull; Bandung, Indonesia
                      </p>
                      <p>
                        Email ini dikirimkan secara resmi melalui sistem rekrutmen 1sLabs (<span className="font-mono text-zinc-500">hr@1slabs.my.id</span>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
                <span className="text-[11px] text-zinc-500">
                  Pratinjau akurat 100% sesuai email HTML yang akan diterima kandidat.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Kembali ke Editor
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Candidate Modal */}
      {isEditModalOpen && editingCandidate && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Edit Profil Kandidat</h3>
                  <p className="text-[11px] text-zinc-400">{editingCandidate.full_name}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none p-1">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Posisi Dilamar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.position_id}
                    onChange={e => setFormData({ ...formData, position_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Sumber Pelamar
                  </label>
                  <select
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="projects_co_id">Projects.co.id</option>
                    <option value="job_portal">Job Portal</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Catatan Internal HR
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-semibold tracking-wide"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* Email Visual Preview Modal Overlay */}
      {isPreviewModalOpen && (() => {
        const sampleCandidate = candidates.find(c => selectedIds.includes(c.id)) || candidates[0];
        const samplePos = sampleCandidate ? (sampleCandidate.position_title || sampleCandidate.position_name || 'Posisi Terkait') : 'Digital Marketing Specialist';
        const sampleSubject = substitutePlaceholders(emailSubject || 'Undangan Seleksi Rekrutmen 1sLabs - {{position_name}}', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs'
        });
        const sampleBody = substitutePlaceholders(emailBody || 'Halo **{{candidate_name}}**,\n\nTerima kasih atas lamaran Anda untuk posisi **{{position_name}}** di **{{company_name}}**.', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs',
          scheduling_link: 'https://1slabs.my.id/interview/schedule/sample-token',
          meeting_link: 'https://meet.google.com/oneslabs-interview',
          interview_date: 'Senin, 10 November 2026',
          interview_time: '10:00 - 10:45 WIB'
        });
        const renderedHtml = formatTextToEmailHtml(sampleBody);

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Window Titlebar */}
              <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/90 select-none">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 font-mono">
                    Pratinjau Tampilan Email Resmi Rekrutmen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simulated Client Header */}
              <div className="px-6 py-3.5 bg-white border-b border-zinc-100 space-y-2 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      1s
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900">1sLabs Recruitment</span>
                        <span className="text-[10px] font-mono text-zinc-500">&lt;hr@1slabs.my.id&gt;</span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> DKIM & SPF Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Kepada: <strong className="text-zinc-800 font-medium">{sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi'}</strong> &bull; <span className="font-mono text-zinc-600">{sampleCandidate?.email || 'ahmad.fauzi@example.com'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400 shrink-0 font-mono mt-1 hidden sm:block">
                    Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold shrink-0">
                    Subjek:
                  </span>
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {sampleSubject}
                  </span>
                </div>
              </div>

              {/* Paper Canvas */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-zinc-100/80 flex justify-center items-start">
                <div className="w-full max-w-[620px]">
                  <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl overflow-hidden">
                    {/* Brand Header */}
                    <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                      <img
                        src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                        alt="1sLabs Logo"
                        className="h-8 sm:h-9 w-auto object-contain"
                        onError={(e: any) => {
                          e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                        }}
                      />
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-700 border border-zinc-200 font-bold uppercase tracking-wider shadow-2xs">
                        Recruitment & HR
                      </span>
                    </div>

                    {/* Email Content Body */}
                    <div className="p-6 sm:p-8">
                      <div
                        className="email-rendered-body"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    </div>

                    {/* Minimalist Footer */}
                    <div className="px-6 py-5 bg-zinc-50/70 border-t border-zinc-100 text-center text-[11px] text-zinc-400 space-y-1">
                      <p className="font-medium text-zinc-600">
                        1sLabs Technology Studio &bull; Bandung, Indonesia
                      </p>
                      <p>
                        Email ini dikirimkan secara resmi melalui sistem rekrutmen 1sLabs (<span className="font-mono text-zinc-500">hr@1slabs.my.id</span>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
                <span className="text-[11px] text-zinc-500">
                  Pratinjau akurat 100% sesuai email HTML yang akan diterima kandidat.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Kembali ke Editor
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Candidate Detail Drawer / Modal */}
      {detailCandidateId && detailData && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white border-l border-zinc-200 shadow-2xl w-full max-w-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200 flex items-start justify-between bg-zinc-50/60 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-900">{detailData.candidate.full_name}</h3>
                  {getEmailStatusBadge(detailData.candidate.email_status)}
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  {detailData.candidate.position_name || 'Posisi di 1sLabs'} &bull; {detailData.candidate.department || '1sLabs Team'}
                </p>
                <div className="flex items-center gap-3 text-xs text-zinc-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    {detailData.candidate.email}
                  </span>
                  {detailData.candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      {detailData.candidate.phone}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setDetailCandidateId(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="px-6 py-3 border-b border-zinc-100 bg-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Ubah Status Seleksi:</span>
                <select
                  value={detailData.candidate.recruitment_status}
                  onChange={e => handleUpdateStatus(detailData.candidate.id, e.target.value as HRPromotedStatus)}
                  className="p-1 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-800 bg-white"
                >
                  <option value="new_candidate">New Candidate</option>
                  <option value="contacted">Contacted</option>
                  <option value="responded">Responded</option>
                  <option value="screening">Screening</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="interview_completed">Interview Completed</option>
                  <option value="offered">Offered / Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedIds([detailData.candidate.id]);
                    handleOpenBulkEmail();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white font-semibold text-xs inline-flex items-center gap-1 hover:bg-zinc-800"
                >
                  <Send className="w-3 h-3" />
                  Kirim Email
                </button>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-zinc-200 px-6 bg-zinc-50/40 text-xs font-semibold shrink-0">
              <button
                onClick={() => setDetailActiveTab('timeline')}
                className={`py-3 px-3 border-b-2 transition-colors ${
                  detailActiveTab === 'timeline'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Aktivitas ({detailData.activities.length})
              </button>
              <button
                onClick={() => setDetailActiveTab('emails')}
                className={`py-3 px-3 border-b-2 transition-colors ${
                  detailActiveTab === 'emails'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Riwayat Email ({detailData.email_logs.length + detailData.email_replies.length})
              </button>
              <button
                onClick={() => setDetailActiveTab('interviews')}
                className={`py-3 px-3 border-b-2 transition-colors ${
                  detailActiveTab === 'interviews'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Jadwal Interview ({detailData.interviews.length})
              </button>
              <button
                onClick={() => setDetailActiveTab('notes')}
                className={`py-3 px-3 border-b-2 transition-colors ${
                  detailActiveTab === 'notes'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Catatan Internal
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: ACTIVITY TIMELINE */}
              {detailActiveTab === 'timeline' && (
                <div className="space-y-4">
                  {detailData.activities.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-10">Belum ada aktivitas tercatat.</p>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                      {detailData.activities.map((act) => (
                        <div key={act.id} className="relative group">
                          <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-zinc-900 border-2 border-white shadow-2xs" />
                          <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-3.5 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-zinc-900">{act.title}</span>
                              <span className="text-[10px] text-zinc-400">
                                {new Date(act.created_at).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-zinc-600">{act.description}</p>
                            <span className="text-[10px] text-zinc-400 block mt-1">Oleh: {act.created_by || 'Sistem'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EMAIL HISTORY */}
              {detailActiveTab === 'emails' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Korespondensi Email Masuk & Keluar
                  </h4>
                  {detailData.email_logs.length === 0 && detailData.email_replies.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-10">Belum ada email rekrutmen yang tercatat.</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Incoming Replies */}
                      {detailData.email_replies.map(rep => (
                        <div key={`rep-${rep.id}`} className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Balasan Masuk dari Kandidat
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(rep.received_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="font-semibold text-zinc-800">{rep.subject}</p>
                          <div className="mt-2 bg-white p-3 rounded-lg border border-emerald-100 text-zinc-700 whitespace-pre-wrap font-sans text-xs">
                            {rep.body_text}
                          </div>
                        </div>
                      ))}

                      {/* Outgoing Logs */}
                      {detailData.email_logs.map(log => (
                        <div key={`log-${log.id}`} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                              <Send className="w-3.5 h-3.5 text-zinc-500" />
                              Email Keluar (hr@1slabs.my.id)
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(log.sent_at).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="font-semibold text-zinc-800">{log.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-700 font-semibold uppercase">
                              Status: {log.status}
                            </span>
                            {log.error_message && (
                              <span className="text-[10px] text-rose-600 font-medium">
                                Error: {log.error_message}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INTERVIEWS */}
              {detailActiveTab === 'interviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Riwayat & Jadwal Wawancara
                    </h4>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.hr.inviteCandidateToInterview({
                            candidate_id: detailData.candidate.id,
                            send_email: true
                          });
                          if (res.success) {
                            notify.success('Undangan interview mandiri berhasil dikirim!');
                            const r = await api.hr.getCandidate(detailData.candidate.id);
                            if (r.success) setDetailData(r);
                          }
                        } catch (err: any) {
                          notify.error(err.message || 'Gagal membuat undangan interview.');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold hover:bg-zinc-800"
                    >
                      + Buat Undangan Interview
                    </button>
                  </div>

                  {detailData.interviews.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-10">Belum ada sesi interview untuk kandidat ini.</p>
                  ) : (
                    detailData.interviews.map(intv => (
                      <div key={intv.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                            {intv.interview_date || 'Belum dipilih oleh kandidat'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-zinc-200 text-zinc-700">
                            {intv.status}
                          </span>
                        </div>
                        <p className="text-zinc-600">
                          Waktu: <strong>{intv.interview_time || '-'}</strong> ({intv.timezone})
                        </p>
                        {intv.meeting_link && (
                          <div className="pt-2">
                            <a
                              href={intv.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline font-semibold flex items-center gap-1"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Buka Ruang Google Meet &rarr;
                            </a>
                          </div>
                        )}
                        {intv.status === 'pending_selection' && (
                          <div className="pt-2 text-[11px] text-zinc-500">
                            Tautan scheduling kandidat:{' '}
                            <span className="font-mono text-[10px] bg-zinc-200/60 px-1 py-0.5 rounded">
                              /interview/schedule/{intv.scheduling_token.slice(0, 12)}...
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: NOTES */}
              {detailActiveTab === 'notes' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Tambah Catatan Internal HR
                    </label>
                    <textarea
                      rows={3}
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      placeholder="Tuliskan evaluasi teknis, kesan interview, atau pertimbangan gaji..."
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNoteText.trim() || isAddingNote}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 text-white text-xs font-semibold"
                      >
                        {isAddingNote ? 'Menyimpan...' : 'Simpan Catatan'}
                      </button>
                    </div>
                  </div>

                  {detailData.candidate.notes && (
                    <div className="pt-4 border-t border-zinc-100">
                      <h5 className="text-xs font-bold text-zinc-700 mb-1">Catatan Awal:</h5>
                      <div className="p-3 bg-zinc-50 rounded-xl text-zinc-700 text-xs whitespace-pre-wrap border border-zinc-200/70">
                        {detailData.candidate.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      

      {/* Email Visual Preview Modal Overlay */}
      {isPreviewModalOpen && (() => {
        const sampleCandidate = candidates.find(c => selectedIds.includes(c.id)) || candidates[0];
        const samplePos = sampleCandidate ? (sampleCandidate.position_title || sampleCandidate.position_name || 'Posisi Terkait') : 'Digital Marketing Specialist';
        const sampleSubject = substitutePlaceholders(emailSubject || 'Undangan Seleksi Rekrutmen 1sLabs - {{position_name}}', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs'
        });
        const sampleBody = substitutePlaceholders(emailBody || 'Halo **{{candidate_name}}**,\n\nTerima kasih atas lamaran Anda untuk posisi **{{position_name}}** di **{{company_name}}**.', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs',
          scheduling_link: 'https://1slabs.my.id/interview/schedule/sample-token',
          meeting_link: 'https://meet.google.com/oneslabs-interview',
          interview_date: 'Senin, 10 November 2026',
          interview_time: '10:00 - 10:45 WIB'
        });
        const renderedHtml = formatTextToEmailHtml(sampleBody);

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Window Titlebar */}
              <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/90 select-none">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 font-mono">
                    Pratinjau Tampilan Email Resmi Rekrutmen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simulated Client Header */}
              <div className="px-6 py-3.5 bg-white border-b border-zinc-100 space-y-2 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      1s
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900">1sLabs Recruitment</span>
                        <span className="text-[10px] font-mono text-zinc-500">&lt;hr@1slabs.my.id&gt;</span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> DKIM & SPF Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Kepada: <strong className="text-zinc-800 font-medium">{sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi'}</strong> &bull; <span className="font-mono text-zinc-600">{sampleCandidate?.email || 'ahmad.fauzi@example.com'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400 shrink-0 font-mono mt-1 hidden sm:block">
                    Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold shrink-0">
                    Subjek:
                  </span>
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {sampleSubject}
                  </span>
                </div>
              </div>

              {/* Paper Canvas */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-zinc-100/80 flex justify-center items-start">
                <div className="w-full max-w-[620px]">
                  <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl overflow-hidden">
                    {/* Brand Header */}
                    <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                      <img
                        src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                        alt="1sLabs Logo"
                        className="h-8 sm:h-9 w-auto object-contain"
                        onError={(e: any) => {
                          e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                        }}
                      />
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-700 border border-zinc-200 font-bold uppercase tracking-wider shadow-2xs">
                        Recruitment & HR
                      </span>
                    </div>

                    {/* Email Content Body */}
                    <div className="p-6 sm:p-8">
                      <div
                        className="email-rendered-body"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    </div>

                    {/* Minimalist Footer */}
                    <div className="px-6 py-5 bg-zinc-50/70 border-t border-zinc-100 text-center text-[11px] text-zinc-400 space-y-1">
                      <p className="font-medium text-zinc-600">
                        1sLabs Technology Studio &bull; Bandung, Indonesia
                      </p>
                      <p>
                        Email ini dikirimkan secara resmi melalui sistem rekrutmen 1sLabs (<span className="font-mono text-zinc-500">hr@1slabs.my.id</span>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
                <span className="text-[11px] text-zinc-500">
                  Pratinjau akurat 100% sesuai email HTML yang akan diterima kandidat.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Kembali ke Editor
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Email Modal */}
      {isBulkEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Kirim Email Rekrutmen Resmi (hr@1slabs.my.id)
                </h3>
                <p className="text-xs text-zinc-500">
                  Mengirimkan email individual kepada <strong>{selectedIds.length}</strong> kandidat terpilih (Privasi aman, tanpa CC/BCC).
                </p>
              </div>
              <button onClick={() => setIsBulkEmailModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none p-1">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Pilih Template Rekrutmen (Opsional)
                </label>
                <select
                  value={selectedTemplateKey}
                  onChange={e => handleTemplateChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                >
                  <option value="">-- Tulis Email Bebas / Kustom --</option>
                  {templates.map(t => (
                    <option key={t.template_key} value={t.template_key}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Subjek Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Contoh: Undangan Diskusi Seleksi 1sLabs - {{position_name}}"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Isi Pesan Email <span className="text-zinc-400 font-normal">(Mendukung Enter untuk paragraf, **tebal**, dan - poin)</span> <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Pratinjau Desain Email
                  </button>
                </div>
                <textarea
                  rows={9}
                  required
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Halo **{{candidate_name}}**,&#10;&#10;Terima kasih atas minat Anda bergabung dengan 1sLabs sebagai **{{position_name}}**...&#10;&#10;Berikut tahapan selanjutnya:&#10;- Portofolio & rekam jejak teknis&#10;- Wawancara tim HR&#10;&#10;Salam hangat,&#10;**Tim Rekrutmen 1sLabs**"
                  className="w-full text-xs p-3.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-sans leading-relaxed"
                />
              </div>

              {/* Placeholder Helper Pill */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[11px] text-zinc-600 space-y-2">
                <div>
                  <span className="font-bold text-zinc-900 block mb-1">Variabel Dinamis Tersedia:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{candidate_name}}'}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{position_name}}'}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{company_name}}'}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{scheduling_link}}'}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{interview_date}}'}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{meeting_link}}'}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">Tombol Aksi (CTA Button):</span> Tulis tautan di baris tersendiri seperti <code className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[10px] text-zinc-800">[Pilih Jadwal Interview -&gt;](link_atau_variabel)</code> untuk otomatis menghasilkan tombol aksi hitam resmi 1sLabs.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Sender: <strong className="text-zinc-700">hr@1slabs.my.id</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkEmailModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendBulkEmail}
                  disabled={isSendingBulk}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-semibold tracking-wide"
                >
                  {isSendingBulk ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Mengirimkan...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Kirim Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Visual Preview Modal Overlay */}
      {isPreviewModalOpen && (() => {
        const sampleCandidate = candidates.find(c => selectedIds.includes(c.id)) || candidates[0];
        const samplePos = sampleCandidate ? (sampleCandidate.position_title || sampleCandidate.position_name || 'Posisi Terkait') : 'Digital Marketing Specialist';
        const sampleSubject = substitutePlaceholders(emailSubject || 'Undangan Seleksi Rekrutmen 1sLabs - {{position_name}}', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs'
        });
        const sampleBody = substitutePlaceholders(emailBody || 'Halo **{{candidate_name}}**,\n\nTerima kasih atas lamaran Anda untuk posisi **{{position_name}}** di **{{company_name}}**.', {
          candidate_name: sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi',
          candidate_email: sampleCandidate?.email || 'ahmad.fauzi@example.com',
          position_name: samplePos,
          company_name: '1sLabs',
          scheduling_link: 'https://1slabs.my.id/interview/schedule/sample-token',
          meeting_link: 'https://meet.google.com/oneslabs-interview',
          interview_date: 'Senin, 10 November 2026',
          interview_time: '10:00 - 10:45 WIB'
        });
        const renderedHtml = formatTextToEmailHtml(sampleBody);

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Window Titlebar */}
              <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/90 select-none">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30 inline-block" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 font-mono">
                    Pratinjau Tampilan Email Resmi Rekrutmen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simulated Client Header */}
              <div className="px-6 py-3.5 bg-white border-b border-zinc-100 space-y-2 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      1s
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900">1sLabs Recruitment</span>
                        <span className="text-[10px] font-mono text-zinc-500">&lt;hr@1slabs.my.id&gt;</span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> DKIM & SPF Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Kepada: <strong className="text-zinc-800 font-medium">{sampleCandidate?.full_name || 'Bpk. Ahmad Fauzi'}</strong> &bull; <span className="font-mono text-zinc-600">{sampleCandidate?.email || 'ahmad.fauzi@example.com'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400 shrink-0 font-mono mt-1 hidden sm:block">
                    Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold shrink-0">
                    Subjek:
                  </span>
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {sampleSubject}
                  </span>
                </div>
              </div>

              {/* Paper Canvas */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-zinc-100/80 flex justify-center items-start">
                <div className="w-full max-w-[620px]">
                  <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl overflow-hidden">
                    {/* Brand Header */}
                    <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                      <img
                        src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                        alt="1sLabs Logo"
                        className="h-8 sm:h-9 w-auto object-contain"
                        onError={(e: any) => {
                          e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                        }}
                      />
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-700 border border-zinc-200 font-bold uppercase tracking-wider shadow-2xs">
                        Recruitment & HR
                      </span>
                    </div>

                    {/* Email Content Body */}
                    <div className="p-6 sm:p-8">
                      <div
                        className="email-rendered-body"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    </div>

                    {/* Minimalist Footer */}
                    <div className="px-6 py-5 bg-zinc-50/70 border-t border-zinc-100 text-center text-[11px] text-zinc-400 space-y-1">
                      <p className="font-medium text-zinc-600">
                        1sLabs Technology Studio &bull; Bandung, Indonesia
                      </p>
                      <p>
                        Email ini dikirimkan secara resmi melalui sistem rekrutmen 1sLabs (<span className="font-mono text-zinc-500">hr@1slabs.my.id</span>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
                <span className="text-[11px] text-zinc-500">
                  Pratinjau akurat 100% sesuai email HTML yang akan diterima kandidat.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Kembali ke Editor
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

