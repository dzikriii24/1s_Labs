import React, { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Layers,
  Monitor,
  Smartphone,
  X,
  Copy,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api, HREmailTemplate, HREmailLog, HRPosition, HRCandidate } from '../../../../services/api';
import notify from '../../../../lib/notify';
import {
  formatTextToEmailHtml,
  htmlToFormattedText,
  cleanMojibake
} from '../../../../utils/emailFormatter';

interface PreviewModalData {
  title?: string;
  subject: string;
  body: string;
  recipientName?: string;
  recipientEmail?: string;
  positionName?: string;
  templateKey?: string;
}


export const HREmailCampaignsTab: React.FC = () => {
  const [activeSubSection, setActiveSubSection] = useState<'compose' | 'templates' | 'logs'>('compose');

  // Templates State
  const [templates, setTemplates] = useState<HREmailTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<HREmailTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    template_key: '',
    name: '',
    subject: '',
    body_html: ''
  });

  // Compose State
  const [positions, setPositions] = useState<HRPosition[]>([]);
  const [candidates, setCandidates] = useState<HRCandidate[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [composePositionFilter, setComposePositionFilter] = useState<string>('all');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [campaignTitle, setCampaignTitle] = useState<string>('Email Outreach Rekrutmen 1sLabs');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Logs State
  const [logs, setLogs] = useState<HREmailLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState('all');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  // Rich Visual Preview Modal State
  const [previewData, setPreviewData] = useState<PreviewModalData | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchTemplates();
    api.hr.getPositions({ status: 'active' }).then(res => {
      if (res.success) setPositions(res.positions);
    });
  }, []);

  // Fetch candidates for compose
  useEffect(() => {
    api.hr.getCandidates({
      position_id: composePositionFilter === 'all' ? undefined : composePositionFilter,
      limit: 100
    }).then(res => {
      if (res.success) {
        setCandidates(res.candidates);
        setSelectedCandidateIds(res.candidates.map(c => c.id));
      }
    });
  }, [composePositionFilter]);

  // Fetch Logs
  const fetchLogs = async () => {
    setIsLogsLoading(true);
    try {
      const res = await api.hr.getEmailLogs({
        search: logsSearch.trim() || undefined,
        status: logsStatusFilter === 'all' ? undefined : logsStatusFilter,
        page: logsPage,
        limit: 20
      });
      if (res.success) {
        setLogs(res.logs);
        setLogsTotal(res.pagination.total);
        setLogsTotalPages(res.pagination.total_pages);
      }
    } catch (err: any) {
      console.warn('Failed to load email logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubSection === 'logs') {
      fetchLogs();
    }
  }, [activeSubSection, logsSearch, logsStatusFilter, logsPage]);

  const fetchTemplates = async () => {
    setIsTemplatesLoading(true);
    try {
      const res = await api.hr.getEmailTemplates();
      if (res.success && res.templates && res.templates.length > 0) {
        const cleaned = (res.templates || []).map(t => ({ ...t, name: cleanMojibake(t.name), subject: cleanMojibake(t.subject), body_html: cleanMojibake(t.body_html), body_text: cleanMojibake(t.body_text || "") }));
        setTemplates(cleaned);
        // Pre-populate compose with first template if currently empty
        setComposeBody(prev => {
          if (!prev) {
            const first = res.templates[0];
            setSelectedTemplateKey(first.template_key);
            setComposeSubject(first.subject);
            return htmlToFormattedText(first.body_html);
          }
          return prev;
        });
      }
    } catch (err: any) {
      console.warn('Failed to load templates:', err);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  const applyTemplate = (t: HREmailTemplate) => {
    setSelectedTemplateKey(t.template_key);
    setComposeSubject(cleanMojibake(t.subject));
    setComposeBody(htmlToFormattedText(t.body_html));
    notify.success(`Template "${t.name}" diterapkan ke composer.`);
  };

  const handleTemplateSelectChange = (key: string) => {
    setSelectedTemplateKey(key);
    const tmpl = templates.find(t => t.template_key === key);
    if (tmpl) {
      setComposeSubject(cleanMojibake(tmpl.subject));
      setComposeBody(htmlToFormattedText(tmpl.body_html));
    }
  };

  // Toggle candidate selection
  const handleToggleCandidate = (id: number) => {
    if (selectedCandidateIds.includes(id)) {
      setSelectedCandidateIds(selectedCandidateIds.filter(i => i !== id));
    } else {
      setSelectedCandidateIds([...selectedCandidateIds, id]);
    }
  };

  const handleSelectAllCandidates = () => {
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map(c => c.id));
    }
  };

  // Dispatch Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidateIds.length === 0) {
      notify.error('Pilih minimal satu kandidat penerima.');
      return;
    }
    if (!composeSubject.trim() || !composeBody.trim()) {
      notify.error('Subjek dan isi pesan email wajib diisi.');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Kirim Email Rekrutmen?',
      text: `Sistem akan mengirimkan email secara individual kepada ${selectedCandidateIds.length} kandidat terpilih dari akun hr@1slabs.my.id.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kirim Sekarang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#18181b'
    });

    if (!confirm.isConfirmed) return;

    setIsSending(true);
    try {
      const sendFn = api.hr.sendEmail || api.hr.sendEmails;
      const res = await sendFn({
        candidate_ids: selectedCandidateIds,
        template_key: selectedTemplateKey || undefined,
        custom_subject: composeSubject,
        custom_body: composeBody,
        campaign_title: campaignTitle
      });

      if (res.success) {
        Swal.fire({
          title: 'Pengiriman Berhasil!',
          text: `Berhasil mengirim ${res.result?.sent_count || selectedCandidateIds.length} email rekrutmen.`,
          icon: 'success',
          confirmButtonColor: '#18181b'
        });
        setActiveSubSection('logs');
      } else {
        notify.error(res.message || 'Gagal mengirim email.');
      }
    } catch (err: any) {
      notify.error(err.message || 'Terjadi kesalahan saat pengiriman email.');
    } finally {
      setIsSending(false);
    }
  };

  // Retry failed email
  const handleRetryLog = async (logId: number) => {
    try {
      const retryFn = api.hr.retryEmailLog || api.hr.retryEmail;
      const res = await retryFn(logId);
      if (res.success) {
        notify.success('Email berhasil dikirim ulang!');
        fetchLogs();
      } else {
        notify.error(res.message || 'Gagal mengirim ulang email.');
      }
    } catch (err: any) {
      notify.error(err.message || 'Terjadi kesalahan koneksi.');
    }
  };

  // Template Modal Handlers
  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      template_key: '',
      name: '',
      subject: '',
      body_html: ''
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tmpl: HREmailTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateForm({
      template_key: tmpl.template_key,
      name: tmpl.name,
      subject: tmpl.subject,
      body_html: htmlToFormattedText(tmpl.body_html)
    });
    setIsTemplateModalOpen(true);
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.hr.updateEmailTemplate(editingTemplate.id, {
          name: templateForm.name,
          subject: templateForm.subject,
          body_html: templateForm.body_html
        });
        notify.success('Template berhasil diperbarui!');
      } else {
        await api.hr.createEmailTemplate(templateForm);
        notify.success('Template rekrutmen baru berhasil dibuat!');
      }
      setIsTemplateModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      notify.error(err.message || 'Gagal menyimpan template.');
    }
  };

  // Preview Open Handlers
  const handleOpenComposePreview = () => {
    let bodyToPreview = composeBody;
    let subjectToPreview = composeSubject;

    if (!bodyToPreview.trim()) {
      const tmpl = templates.find(t => t.template_key === selectedTemplateKey) || templates[0];
      if (tmpl) {
        bodyToPreview = tmpl.body_html;
        subjectToPreview = subjectToPreview || tmpl.subject;
      }
    }

    const firstSelected = candidates.find(c => selectedCandidateIds.includes(c.id));
    const samplePos = composePositionFilter !== 'all'
      ? (positions.find(p => String(p.id) === composePositionFilter)?.name || 'Digital Marketing Specialist')
      : (positions[0]?.name || 'Digital Marketing Specialist');

    setPreviewData({
      title: 'Draf Email Rekrutmen (Kandidat Terpilih)',
      subject: subjectToPreview || 'Undangan Seleksi Rekrutmen 1sLabs - {{position_name}}',
      body: bodyToPreview,
      recipientName: firstSelected?.full_name || 'Bpk. Ahmad Fauzi (Contoh Kandidat)',
      recipientEmail: firstSelected?.email || 'ahmad.fauzi@example.com',
      positionName: samplePos
    });
  };

  const replacePreviewText = (text: string, recipientName?: string, positionName?: string) => {
    if (!text) return '';
    text = cleanMojibake(text);
    const sampleName = recipientName || (selectedCandidateIds.length > 0 ? (candidates.find(c => selectedCandidateIds.includes(c.id))?.full_name || 'Bpk. Ahmad Fauzi') : 'Bpk. Ahmad Fauzi');
    const samplePos = positionName || (positions.length > 0 ? positions[0].name : 'Digital Marketing Specialist');

    return text
      .replace(/\{\{candidate_name\}\}/gi, sampleName)
      .replace(/\{\{candidate_email\}\}/gi, 'ahmad.fauzi@example.com')
      .replace(/\{\{position_name\}\}/gi, samplePos)
      .replace(/\{\{company_name\}\}/gi, '1sLabs')
      .replace(/\{\{interview_date\}\}/gi, 'Senin, 10 November 2026')
      .replace(/\{\{interview_time\}\}/gi, '10:00 - 10:45 WIB')
      .replace(/\{\{meeting_link\}\}/gi, 'https://meet.google.com/oneslabs-interview')
      .replace(/\{\{scheduling_link\}\}/gi, 'https://1slabs.my.id/interview/schedule/sample-token');
  };

  const renderPreviewContent = (content: string, recipientName?: string, positionName?: string) => {
    if (!content || !content.trim()) {
      return (
        <div className="py-12 text-center text-zinc-400 italic text-xs">
          Belum ada draf pesan email. Silakan pilih salah satu template rekrutmen siap pakai dari menu dropdown di atas atau ketik pesan Anda.
        </div>
      );
    }

    const processed = replacePreviewText(content, recipientName, positionName);
    const html = formatTextToEmailHtml(processed);

    return (
      <div
        className="email-rendered-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const handleCopyPreviewText = () => {
    if (!previewData?.body) return;
    const stripped = previewData.body.replace(/<[^>]+>/g, ' ');
    navigator.clipboard.writeText(stripped);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-zinc-700" />
            Email Campaigns & Outreach Rekrutmen
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kirim email undangan, screening, dan pengumuman seleksi dari akun resmi <span className="font-mono text-zinc-700 font-bold">hr@1slabs.my.id</span>
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 shrink-0">
          <button
            onClick={() => setActiveSubSection('compose')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubSection === 'compose'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Compose Email
          </button>
          <button
            onClick={() => setActiveSubSection('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubSection === 'templates'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Template Rekrutmen ({templates.length})
          </button>
          <button
            onClick={() => setActiveSubSection('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubSection === 'logs'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Riwayat Log Pengiriman
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-SECTION 1: COMPOSE EMAIL
         ======================================================== */}
      {activeSubSection === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Candidate Target Selector */}
          <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col h-[750px]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-zinc-700" />
                  Target Kandidat ({selectedCandidateIds.length}/{candidates.length})
                </h3>
                <span className="text-[11px] text-zinc-400">Pilih kandidat penerima email outreach</span>
              </div>
              <button
                type="button"
                onClick={handleSelectAllCandidates}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {selectedCandidateIds.length === candidates.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>

            {/* Position filter */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                Filter Berdasarkan Posisi
              </label>
              <select
                value={composePositionFilter}
                onChange={e => setComposePositionFilter(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              >
                <option value="all">Semua Posisi Dilamar ({candidates.length} Kandidat)</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Candidates list with checkboxes */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {candidates.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-xs">
                  Tidak ada kandidat untuk posisi ini.
                </div>
              ) : (
                candidates.map(cand => {
                  const isSelected = selectedCandidateIds.includes(cand.id);
                  return (
                    <div
                      key={cand.id}
                      onClick={() => handleToggleCandidate(cand.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-zinc-900/5 border-zinc-900/30'
                          : 'bg-white border-zinc-100 hover:border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-zinc-900 accent-zinc-900 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate">{cand.full_name}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{cand.email}</p>
                          <span className="text-[10px] text-zinc-500 font-medium">{cand.position_name}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                          cand.email_status === 'replied'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : cand.email_status === 'delivered'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : cand.email_status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {cand.email_status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Compose Message */}
          <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-zinc-700" />
                  Penyusunan Pesan Email Rekrutmen
                </h3>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Privasi Terjaga (Kirim Individual)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Pilih Template Siap Pakai
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenComposePreview}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      Pratinjau Desain
                    </button>
                  </div>
                  <select
                    value={selectedTemplateKey}
                    onChange={e => handleTemplateSelectChange(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  >
                    <option value="">-- Buat Subjek & Isi Kustom --</option>
                    {templates.map(t => (
                      <option key={t.template_key} value={t.template_key}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Judul Batch / Kampanye
                  </label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={e => setCampaignTitle(e.target.value)}
                    placeholder="Contoh: Undangan Interview Batch 1"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Subjek Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Contoh: Undangan Interview Kerja di 1sLabs - {{position_name}}"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Isi Pesan Email (Format HTML & Teks didukung) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenComposePreview}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Pratinjau Desain Email
                  </button>
                </div>
                <textarea
                  rows={11}
                  required
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Tulis pesan email disini (gunakan Enter untuk paragraf, **teks tebal**, dan - untuk poin bullet)..."
                  className="w-full text-xs p-3.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-sans leading-relaxed"
                />
              </div>

              {/* Variable tags helper */}
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-[11px] text-zinc-600 space-y-2">
                <div>
                  <span className="font-bold text-zinc-900 block mb-1">Variabel Template Otomatis:</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                    <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{candidate_name}}'}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{position_name}}'}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{company_name}}'}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{scheduling_link}}'}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{interview_date}}'}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{'{{meeting_link}}'}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">Tombol Aksi (CTA Button):</span> Tulis tautan di baris tersendiri seperti <code className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[10px] text-zinc-800">[Pilih Jadwal Interview -&gt;](link_atau_variabel)</code> untuk otomatis menghasilkan tombol aksi hitam resmi 1sLabs.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
                <span className="text-xs text-zinc-400">
                  Sender: <strong className="text-zinc-800">hr@1slabs.my.id</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenComposePreview}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    Pratinjau Desain
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || selectedCandidateIds.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-semibold tracking-wide shadow-xs cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengirim ({selectedCandidateIds.length})...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim ke {selectedCandidateIds.length} Kandidat
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-SECTION 2: TEMPLATES MANAGEMENT
         ======================================================== */}
      {activeSubSection === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Daftar Template Email Rekrutmen Standar
              </h3>
              <p className="text-xs text-zinc-500">
                Template siap pakai dengan dynamic placeholder seperti nama kandidat dan jadwal interview
              </p>
            </div>

            <button
              onClick={handleOpenAddTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Template Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-zinc-900">{tmpl.name}</span>
                    {tmpl.is_default ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium line-clamp-1 mb-2">
                    Subjek: <span className="text-zinc-800">{tmpl.subject}</span>
                  </p>
                  <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-[11px] text-zinc-600 line-clamp-4 font-mono">
                    {tmpl.body_text || tmpl.body_html.replace(/<[^>]+>/g, ' ')}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewData({
                        title: `Template: ${tmpl.name}`,
                        subject: tmpl.subject,
                        body: tmpl.body_html,
                        templateKey: tmpl.template_key,
                        recipientName: 'Bpk. Ahmad Fauzi (Kandidat)',
                        recipientEmail: 'ahmad.fauzi@example.com',
                        positionName: 'Digital Marketing Specialist'
                      });
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTemplate(tmpl)}
                      className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                      title="Edit Template"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyTemplate(tmpl);
                        setActiveSubSection('compose');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                    >
                      Gunakan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-SECTION 3: EMAIL LOGS
         ======================================================== */}
      {activeSubSection === 'logs' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Log Riwayat Pengiriman Email Rekrutmen
              </h3>
              <p className="text-xs text-zinc-500">
                Total {logsTotal} email tercatat di database dengan status delivery aktual
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari penerima / subjek..."
                  value={logsSearch}
                  onChange={e => {
                    setLogsSearch(e.target.value);
                    setLogsPage(1);
                  }}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              {/* Status filter */}
              <select
                value={logsStatusFilter}
                onChange={e => {
                  setLogsStatusFilter(e.target.value);
                  setLogsPage(1);
                }}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
              </select>

              <button
                type="button"
                onClick={fetchLogs}
                className="p-1.5 border border-zinc-200 rounded-xl hover:bg-zinc-50 text-zinc-600 cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLogsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Kandidat / Penerima</th>
                  <th className="py-2.5 px-3">Subjek Email</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Detail / Error</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      Belum ada riwayat email rekrutmen.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-zinc-900">{log.recipient_name || '-'}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{log.recipient_email}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[240px] truncate text-zinc-800">
                        {log.subject}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            log.status === 'delivered'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : log.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.status === 'failed' || log.status === 'bounced'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-400 max-w-[200px] truncate">
                        {log.error_message || (log.message_id ? `ID: ${log.message_id.slice(0, 18)}...` : '-')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {log.body_html && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewData({
                                  title: `Log Email #${log.id}`,
                                  subject: log.subject,
                                  body: log.body_html || '',
                                  recipientName: log.recipient_name,
                                  recipientEmail: log.recipient_email
                                });
                              }}
                              className="text-zinc-600 hover:text-zinc-900 text-xs font-semibold p-1 hover:bg-zinc-100 rounded cursor-pointer"
                              title="Lihat Tampilan Email"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {log.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryLog(log.id)}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-zinc-900 text-white font-semibold hover:bg-zinc-800 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-400">
                Halaman {logsPage} dari {logsTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={logsPage <= 1}
                  onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={logsPage >= logsTotalPages}
                  onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          RICH VISUAL EMAIL PREVIEW MODAL
         ======================================================== */}
      {previewData !== null && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Top Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    Pratinjau Tampilan Email
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Live Sandbox
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {previewData.title || 'Simulasi Tampilan Email Rekrutmen Resmi 1sLabs'}
                  </p>
                </div>
              </div>

              {/* Center/Right Toolbar */}
              <div className="flex items-center gap-2">
                {/* Desktop / Mobile Switcher */}
                <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-xl border border-zinc-300/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPreviewText}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                  title="Salin isi pesan"
                >
                  {copiedPreview ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-200 transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Simulated Email Client Top Banner (Apple Mail / Gmail style) */}
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
                      Kepada: <strong className="text-zinc-800 font-medium">{previewData.recipientName || 'Bpk. Ahmad Fauzi (Kandidat)'}</strong> &bull; <span className="font-mono text-zinc-600">{previewData.recipientEmail || 'ahmad.fauzi@example.com'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 shrink-0 font-mono mt-1 hidden sm:block">
                  Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>

              {/* Subject banner */}
              <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold shrink-0">
                  Subjek:
                </span>
                <span className="text-xs font-bold text-zinc-900 truncate">
                  {replacePreviewText(previewData.subject, previewData.recipientName, previewData.positionName) || '(Subjek belum diisi)'}
                </span>
              </div>
            </div>

            {/* Email Canvas (Scrollable area) */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-zinc-100/80 flex justify-center items-start">
              <div
                className={`w-full transition-all duration-300 ease-in-out ${
                  previewDevice === 'mobile' ? 'max-w-[360px]' : 'max-w-[620px]'
                }`}
              >
                {/* The Official Email Paper (matches wrapHtmlEmail in email.service.js) */}
                <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl overflow-hidden">
                  
                  {/* Clean Minimalist Brand Header with Official Logo Image */}
                  <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                        alt="1sLabs Official Logo"
                        className="h-8 sm:h-9 w-auto object-contain"
                        onError={(e: any) => {
                          e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-700 border border-zinc-200 font-bold uppercase tracking-wider shadow-2xs">
                      Recruitment & HR
                    </span>
                  </div>

                  {/* Body Content Area */}
                  <div className="p-6 sm:p-8">
                    {renderPreviewContent(previewData.body, previewData.recipientName, previewData.positionName)}
                  </div>

                  {/* Official Email Footer */}
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

            {/* Modal Bottom Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <span className="text-[11px] text-zinc-500">
                Pratinjau akurat 100% sesuai email yang akan diterima kandidat.
              </span>
              <div className="flex items-center gap-2">
                {previewData.templateKey && activeSubSection === 'templates' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tmpl = templates.find(t => t.template_key === previewData.templateKey);
                      if (tmpl) {
                        applyTemplate(tmpl);
                        setPreviewData(null);
                        setActiveSubSection('compose');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Gunakan Template Ini
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD / EDIT TEMPLATE MODAL
         ======================================================== */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                {editingTemplate ? 'Edit Template Email' : 'Tambah Template Email Rekrutmen'}
              </h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kunci Unik Template (Key) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingTemplate)}
                  value={templateForm.template_key}
                  onChange={e => setTemplateForm({ ...templateForm, template_key: e.target.value })}
                  placeholder="Contoh: interview_invitation_v2"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Template <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Contoh: Undangan Interview Tahap 2"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Subjek Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.subject}
                  onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="Subjek email..."
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Isi Pesan Template <span className="text-zinc-400 font-normal">(Teks biasa, mendukung Enter untuk paragraf, **teks tebal**, dan - untuk poin)</span> <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewData({
                        title: templateForm.name || 'Pratinjau Template Baru',
                        subject: templateForm.subject || 'Subjek Template Rekrutmen',
                        body: templateForm.body_html,
                        recipientName: 'Bpk. Ahmad Fauzi (Kandidat)',
                        recipientEmail: 'ahmad.fauzi@example.com'
                      });
                    }}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    Pratinjau
                  </button>
                </div>
                <textarea
                  rows={7}
                  required
                  value={templateForm.body_html}
                  onChange={e => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                  placeholder="Halo **{{candidate_name}}**,&#10;&#10;Terima kasih atas minat Anda bergabung dengan tim 1sLabs sebagai **{{position_name}}**...&#10;&#10;Salam hangat,&#10;**Tim Rekrutmen 1sLabs**"
                  className="w-full text-xs p-3.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-sans leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
