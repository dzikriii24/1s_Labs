import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  Mail,
  Sparkles,
  CheckCircle2,
  Send,
  CalendarCheck,
  ShieldAlert,
  RefreshCw,
  MessageSquare,
  Building2,
  Calendar,
  Phone,
  Search,
  ExternalLink,
  ChevronDown,
  User,
  Clock,
  ArrowUpRight,
  Filter,
  Check,
  FileText
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api, MarketingConversationThread, MarketingChatMessage } from '../../../../services/api';

/**
 * Clean and convert raw HTML or messy strings into beautiful chat prose
 */
function cleanMessageText(text: string): string {
  if (!text) return '';
  if (!text.includes('<') && !text.includes('<!DOCTYPE') && !text.includes('&')) {
    return text.trim();
  }
  return text
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|h[1-6])>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&bull;/gi, '•')
    .replace(/&rarr;/gi, '→')
    .replace(/&copy;/gi, '©')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

export const EmailInboxTab: React.FC = () => {
  const [threads, setThreads] = useState<MarketingConversationThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedThreadEmail, setSelectedThreadEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'interested' | 'unread'>('all');

  // Reply Composer State
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [expandedHtmlMap, setExpandedHtmlMap] = useState<Record<string, boolean>>({});

  // Chat stream scroll anchor
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async (selectLatest = false) => {
    setIsLoading(true);
    try {
      const res = await api.marketing.getThreads(searchQuery);
      if (res.success) {
        setThreads(res.threads);
        if (res.threads.length > 0) {
          if (selectLatest || !selectedThreadEmail) {
            setSelectedThreadEmail(res.threads[0].customer_email);
            setupComposerDefault(res.threads[0]);
          } else {
            // Keep selected thread if still exists
            const stillExists = res.threads.find(t => t.customer_email === selectedThreadEmail);
            if (!stillExists) {
              setSelectedThreadEmail(res.threads[0].customer_email);
              setupComposerDefault(res.threads[0]);
            }
          }
        } else {
          setSelectedThreadEmail(null);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load conversation threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [searchQuery]);

  const activeThread = threads.find(t => t.customer_email === selectedThreadEmail) || null;

  useEffect(() => {
    if (activeThread) {
      setupComposerDefault(activeThread);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedThreadEmail]);

  const setupComposerDefault = (thread: MarketingConversationThread) => {
    const lastMsg = thread.messages[thread.messages.length - 1];
    let subj = lastMsg?.subject || 'Tanggapan Penawaran 1sLabs';
    if (!subj.toLowerCase().startsWith('re:')) {
      subj = `Re: ${subj}`;
    }
    setReplySubject(subj);
  };

  // Sync Maildir Inbox directly from server
  const handleSyncInbox = async () => {
    setIsSyncing(true);
    try {
      const res = await api.marketing.syncInbox();
      if (res.success) {
        if (res.imported > 0) {
          await Swal.fire({
            icon: 'success',
            title: 'Sinkronisasi Berhasil!',
            text: `Ditemukan ${res.imported} balasan email baru dari prospek.`,
            confirmButtonColor: '#18181b',
            timer: 3000
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Kotak Masuk Terkini',
            text: 'Semua balasan email sudah tersinkronisasi. Tidak ada pesan baru.',
            confirmButtonColor: '#18181b',
            timer: 2000
          });
        }
        await fetchThreads(true);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Sinkronisasi',
        text: err.message || 'Terjadi kesalahan saat memeriksa email masuk.',
        confirmButtonColor: '#18181b'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Send Direct Reply to Customer
  const handleSendReply = async () => {
    if (!activeThread) return;
    if (!replyMessage.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Pesan Kosong',
        text: 'Silakan ketik isi pesan balasan terlebih dahulu.',
        confirmButtonColor: '#18181b'
      });
      return;
    }

    setIsSendingReply(true);
    try {
      const lastIncoming = [...activeThread.messages].reverse().find(m => m.direction === 'incoming');

      await api.marketing.sendInboxReply({
        recipient_email: activeThread.customer_email,
        recipient_name: activeThread.customer_name,
        company_id: activeThread.company_id,
        subject: replySubject,
        message_text: replyMessage,
        in_reply_to: lastIncoming?.id?.replace('reply-', '')
      });

      setReplyMessage('');

      Swal.fire({
        icon: 'success',
        title: 'Email Terkirim!',
        text: `Balasan berhasil dikirim ke ${activeThread.customer_email}`,
        confirmButtonColor: '#18181b',
        timer: 2500
      });

      // Refresh threads to show new outgoing message in stream
      await fetchThreads(false);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: err.message || 'Tidak dapat mengirim email balasan.',
        confirmButtonColor: '#18181b'
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Quick Action Handler for CRM Status
  const handleQuickAction = async (classification: string, message: string) => {
    if (!activeThread) return;
    const lastIncoming = [...activeThread.messages].reverse().find(m => m.direction === 'incoming');
    if (!lastIncoming || !lastIncoming.db_id) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Balasan',
        text: 'Prospek ini belum memiliki pesan balasan masuk.',
        confirmButtonColor: '#18181b'
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Konfirmasi Tindakan',
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#18181b'
    });

    if (confirm.isConfirmed) {
      try {
        await api.marketing.updateInboxStatus(lastIncoming.db_id, {
          classification,
          status: 'read'
        });
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          text: `Status telah diubah menjadi ${classification}.`,
          confirmButtonColor: '#18181b',
          timer: 2000
        });
        fetchThreads(false);
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.message,
          confirmButtonColor: '#18181b'
        });
      }
    }
  };

  // Quick Reply Template Insertion
  const applyQuickTemplate = (text: string) => {
    setReplyMessage(text);
  };

  const toggleHtmlView = (msgId: string) => {
    setExpandedHtmlMap(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Filtered threads list
  const filteredThreads = threads.filter(t => {
    if (filterType === 'interested') {
      return t.classification === 'Interested' || t.classification === 'Consultation Requested';
    }
    if (filterType === 'unread') {
      return t.unread_count > 0;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900">
                Email Conversations & Inbox
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Maildir Sync
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Komunikasi interaktif per customer seperti obrolan messenger. Pantau balasan, sentimen Gemini AI, dan balas langsung dari sistem.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncInbox}
            disabled={isSyncing}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Tarik email balasan terbaru dari server info@1slabs.my.id"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Email Masuk'}
          </button>
        </div>
      </div>

      {isLoading && threads.length === 0 ? (
        <div className="py-24 text-center text-zinc-500 text-xs font-mono bg-white border border-zinc-200 rounded-2xl shadow-xs">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-zinc-900 mb-3" />
          Memuat percakapan dan kotak masuk...
        </div>
      ) : threads.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-xs bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="font-semibold text-zinc-800 text-sm">Belum ada percakapan email yang terdaftar.</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Klik tombol <strong>Sinkronkan Email Masuk</strong> di atas untuk memindai email yang baru masuk ke server <code className="text-zinc-800 font-mono">info@1slabs.my.id</code>.
          </p>
          <button
            onClick={handleSyncInbox}
            disabled={isSyncing}
            className="mt-2 px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-xl hover:bg-zinc-800 inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            Sinkronkan Sekarang
          </button>
        </div>
      ) : (
        /* Split Chat Window */
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
          {/* LEFT COLUMN: Customer Threads List (4 of 12) */}
          <div className="lg:col-span-4 border-r border-zinc-200 flex flex-col h-[750px] bg-zinc-50/50">
            {/* Search & Filter Header */}
            <div className="p-3.5 border-b border-zinc-200 bg-white space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari prospek atau kata kunci..."
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Semua ({threads.length})
                </button>
                <button
                  onClick={() => setFilterType('interested')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                    filterType === 'interested'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Tertarik ({threads.filter(t => t.classification === 'Interested' || t.classification === 'Consultation Requested').length})
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                    filterType === 'unread'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Unread ({threads.filter(t => t.unread_count > 0).length})
                </button>
              </div>
            </div>

            {/* Conversation Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {filteredThreads.map(t => {
                const isSelected = t.customer_email === selectedThreadEmail;
                const isInterested = t.classification === 'Interested' || t.classification === 'Consultation Requested';
                const isPositive = t.sentiment === 'positive';
                const initials = (t.customer_name || t.customer_email)
                  .split(' ')
                  .map(s => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={t.customer_email}
                    onClick={() => setSelectedThreadEmail(t.customer_email)}
                    className={`p-3.5 transition-colors cursor-pointer relative ${
                      isSelected
                        ? 'bg-white border-l-4 border-l-zinc-900 shadow-xs'
                        : 'hover:bg-zinc-100/70 bg-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isInterested
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSelected
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">
                            {t.customer_name || t.company_name || t.customer_email}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                            {new Date(t.last_message_at).toLocaleDateString('id-ID', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {t.company_name && (
                          <div className="text-[11px] text-zinc-500 truncate mb-1">
                            {t.company_name}
                          </div>
                        )}

                        <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                          {t.last_direction === 'outgoing' ? (
                            <span className="font-semibold text-zinc-400">Anda: </span>
                          ) : null}
                          {cleanMessageText(t.last_message_text)}
                        </p>

                        <div className="flex items-center justify-between gap-1 mt-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {t.classification !== 'No Reply' && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  isInterested
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : t.classification === 'Unsubscribe' || t.classification === 'Not Interested'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                                }`}
                              >
                                {t.classification}
                              </span>
                            )}
                            {isPositive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Positif
                              </span>
                            )}
                          </div>

                          {t.unread_count > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Ada balasan baru" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Conversation (8 of 12) */}
          <div className="lg:col-span-8 flex flex-col h-[750px] bg-white">
            {activeThread ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {(activeThread.customer_name || activeThread.customer_email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-zinc-900 truncate">
                          {activeThread.customer_name || activeThread.company_name || activeThread.customer_email}
                        </h3>
                        {activeThread.company_status && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200">
                            {activeThread.company_status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mt-0.5 truncate">
                        <span>{activeThread.customer_email}</span>
                        {activeThread.company_phone && (
                          <>
                            <span>&bull;</span>
                            <a
                              href={`https://wa.me/${activeThread.company_phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium font-sans"
                            >
                              <Phone className="w-3 h-3" /> WhatsApp
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Header Quick Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      onClick={() => handleQuickAction('Consultation Requested', 'Tandai prospek meminta jadwal diskusi meeting?')}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" /> VMeet
                    </button>
                    <button
                      onClick={() => handleQuickAction('Interested', 'Tandai prospek tertarik dengan penawaran?')}
                      className="px-2.5 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tertarik
                    </button>
                    <button
                      onClick={() => handleQuickAction('Unsubscribe', 'Hentikan pengiriman email dan masukkan ke daftar unsubscribe?')}
                      className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Stop Contact
                    </button>
                  </div>
                </div>

                {/* Gemini AI Intelligence Banner (if summary exists) */}
                {activeThread.ai_summary && (
                  <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex items-start gap-2.5 text-xs text-zinc-700 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">
                      <span className="font-bold text-zinc-900 mr-1.5">Analisis Gemini AI:</span>
                      {activeThread.ai_summary}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        activeThread.sentiment === 'positive'
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeThread.sentiment === 'negative'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      Sentimen: {activeThread.sentiment}
                    </span>
                  </div>
                )}

                {/* Chat Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/40">
                  <div className="text-center my-2">
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-200/60 px-2.5 py-1 rounded-full">
                      Awal Percakapan dengan {activeThread.customer_name || activeThread.customer_email}
                    </span>
                  </div>

                  {activeThread.messages.map(msg => {
                    const isOutgoing = msg.direction === 'outgoing';
                    const hasHtml = !!msg.body_html;
                    const isExpandedHtml = expandedHtmlMap[msg.id];

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        {/* Sender Label & Timestamp */}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 px-1">
                          <span className="font-semibold text-zinc-700">
                            {isOutgoing ? '1sLabs (Anda)' : (msg.sender_name || activeThread.customer_name || 'Customer')}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {msg.sentiment && (
                            <span
                              className={`px-1.5 py-0.2 rounded font-sans text-[9px] font-semibold ${
                                msg.sentiment === 'positive'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : msg.sentiment === 'negative'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-zinc-200 text-zinc-700'
                              }`}
                            >
                              {msg.classification || msg.sentiment}
                            </span>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-xs text-xs leading-relaxed ${
                            isOutgoing
                              ? 'bg-zinc-900 text-zinc-100 rounded-br-xs'
                              : 'bg-white border border-zinc-200 text-zinc-900 rounded-bl-xs'
                          }`}
                        >
                          {/* Subject Tag if present */}
                          {msg.subject && (
                            <div
                              className={`text-[11px] font-semibold pb-1.5 mb-1.5 border-b truncate ${
                                isOutgoing ? 'text-zinc-300 border-zinc-800' : 'text-zinc-600 border-zinc-100'
                              }`}
                            >
                              Subjek: {msg.subject}
                            </div>
                          )}

                          {/* Body Content */}
                          <div className="whitespace-pre-wrap font-sans">
                            {cleanMessageText(msg.body) || '(Tidak ada isi pesan teks)'}
                          </div>

                          {/* Toggle Rich HTML preview if available */}
                          {hasHtml && (
                            <div className="mt-2.5 pt-2 border-t border-zinc-200/20">
                              <button
                                onClick={() => toggleHtmlView(msg.id)}
                                className={`text-[10px] font-medium flex items-center gap-1 underline cursor-pointer ${
                                  isOutgoing ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                                {isExpandedHtml ? 'Sembunyikan Desain Email Asli' : 'Lihat Desain Email Asli (Visual HTML)'}
                              </button>

                              {isExpandedHtml && (
                                <div className="mt-2.5 bg-white text-zinc-900 rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
                                  <iframe
                                    srcDoc={msg.body_html}
                                    title={`Email Preview ${msg.id}`}
                                    className="w-full h-80 border-0 bg-white"
                                    sandbox="allow-same-origin allow-popups"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Composer */}
                <div className="p-3.5 border-t border-zinc-200 bg-white space-y-2.5 shrink-0">
                  {/* Quick Reply Template Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 shrink-0 uppercase tracking-wider">
                      Template Cepat:
                    </span>
                    <button
                      onClick={() =>
                        applyQuickTemplate(
                          `Halo ${activeThread.customer_name || 'Bapak/Ibu'},\n\nTerima kasih atas respons baiknya! Kapan ada waktu luang untuk online meeting singkat 15-20 menit via Google Meet? Kami ingin menunjukkan preview konsep website yang cocok untuk usaha Anda.\n\nAtau Anda bisa langsung memilih jadwal di: https://1slabs.my.id/schedule\n\nSalam hangat,\nTim 1sLabs`
                        )
                      }
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                    >
                      📅 Jadwalkan Online Meet
                    </button>
                    <button
                      onClick={() =>
                        applyQuickTemplate(
                          `Halo ${activeThread.customer_name || 'Bapak/Ibu'},\n\nBerikut kami lampirkan informasi paket Website Siap Pakai untuk UMKM & Bisnis Lokal dari 1sLabs dengan garansi 1 tahun penuh dan gratis cloud hosting.\n\nApakah ada fitur atau referensi desain website tertentu yang sedang Anda butuhkan saat ini?\n\nSalam hangat,\nTim 1sLabs`
                        )
                      }
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                    >
                      💼 Kirim Portofolio & Paket
                    </button>
                    <button
                      onClick={() =>
                        applyQuickTemplate(
                          `Halo ${activeThread.customer_name || 'Bapak/Ibu'},\n\nTerima kasih atas ketertarikannya. Agar lebih nyaman dan cepat berdiskusi, kami juga dapat melanjutkan obrolan melalui WhatsApp resmi kami di +62 851-5629-6580.\n\nSalam hangat,\nTim 1sLabs`
                        )
                      }
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                    >
                      💬 Lanjut ke WhatsApp
                    </button>
                  </div>

                  {/* Subject Line Toggle */}
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <button
                      onClick={() => setShowSubjectInput(!showSubjectInput)}
                      className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${showSubjectInput ? 'rotate-180' : ''}`} />
                      Subjek: <span className="font-bold text-zinc-800">{replySubject}</span>
                    </button>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Dari: <strong className="text-zinc-700">info@1slabs.my.id</strong>
                    </span>
                  </div>

                  {showSubjectInput && (
                    <input
                      type="text"
                      value={replySubject}
                      onChange={e => setReplySubject(e.target.value)}
                      placeholder="Ubah subjek email..."
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                    />
                  )}

                  {/* Textarea & Send Button */}
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder={`Ketik pesan balasan email untuk ${activeThread.customer_name || activeThread.customer_email}...`}
                      className="w-full px-3.5 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-all resize-none"
                    />

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-zinc-400">
                        Email akan dikirim langsung ke <strong className="text-zinc-700">{activeThread.customer_email}</strong>
                      </span>

                      <button
                        onClick={handleSendReply}
                        disabled={isSendingReply || !replyMessage.trim()}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Send className={`w-3.5 h-3.5 ${isSendingReply ? 'animate-pulse text-emerald-400' : ''}`} />
                        {isSendingReply ? 'Mengirim...' : 'Kirim Balasan Email'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 space-y-2">
                <MessageSquare className="w-10 h-10 text-zinc-300" />
                <p className="text-xs font-medium text-zinc-600">Pilih salah satu percakapan di sebelah kiri untuk melihat pesan.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
