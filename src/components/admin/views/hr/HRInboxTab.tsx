import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  Mail,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  UserPlus,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  Check
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api, HRConversationThread, HRPosition } from '../../../../services/api';
import notify from '../../../../lib/notify';

/**
 * Strip raw HTML tags for clean text preview
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
    .replace(/\s+/g, ' ')
    .trim();
}

export const HRInboxTab: React.FC = () => {
  const [threads, setThreads] = useState<HRConversationThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedThreadEmail, setSelectedThreadEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'candidates_only'>('all');

  // Active thread details & messages
  const [activeCandidate, setActiveCandidate] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  // Reply Composer State
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Connect to Candidate Modal
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [positions, setPositions] = useState<HRPosition[]>([]);
  const [connectPositionId, setConnectPositionId] = useState<string>('');
  const [connectFullName, setConnectFullName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Chat scroll anchor
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load positions
  useEffect(() => {
    api.hr.getPositions({ status: 'active' }).then(res => {
      if (res.success) {
        setPositions(res.positions);
        if (res.positions.length > 0) setConnectPositionId(String(res.positions[0].id));
      }
    });
  }, []);

  const fetchThreads = async (selectLatest = false) => {
    setIsLoading(true);
    try {
      const res = await api.hr.getInboxThreads({
        search: searchQuery.trim() || undefined,
        filter: filterType === 'all' ? undefined : filterType
      });

      if (res.success) {
        setThreads(res.threads);
        if (res.threads.length > 0) {
          if (selectLatest || !selectedThreadEmail) {
            setSelectedThreadEmail(res.threads[0].from_email);
          } else {
            const exists = res.threads.find(t => t.from_email === selectedThreadEmail);
            if (!exists) setSelectedThreadEmail(res.threads[0].from_email);
          }
        } else {
          setSelectedThreadEmail(null);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load HR inbox threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads(true);
    const interval = setInterval(() => {
      fetchThreads(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [searchQuery, filterType]);

  // Load messages for selected thread
  useEffect(() => {
    if (!selectedThreadEmail) {
      setMessages([]);
      setActiveCandidate(null);
      return;
    }

    const loadMessages = async () => {
      setIsMessagesLoading(true);
      try {
        const res = await api.hr.getThreadMessages(selectedThreadEmail);
        if (res.success) {
          setMessages(res.messages);
          setActiveCandidate(res.candidate);

          // Setup default reply subject
          const lastMsg = res.messages[res.messages.length - 1];
          let subj = lastMsg?.subject || 'Tanggapan Rekrutmen 1sLabs';
          if (!subj.toLowerCase().startsWith('re:')) {
            subj = `Re: ${subj}`;
          }
          setReplySubject(subj);

          setTimeout(() => {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } catch (err: any) {
        notify.error('Gagal memuat pesan email.');
      } finally {
        setIsMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedThreadEmail]);

  // Sync Maildir from server
  const handleSyncInbox = async () => {
    setIsSyncing(true);
    try {
      const res = await api.hr.syncInbox();
      if (res.success) {
        if (res.result.imported > 0) {
          await Swal.fire({
            icon: 'success',
            title: 'Sinkronisasi Berhasil!',
            text: `Ditemukan ${res.result.imported} balasan email rekrutmen baru.`,
            confirmButtonColor: '#18181b',
            timer: 3000
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Kotak Masuk Terkini',
            text: 'Semua email rekrutmen sudah sinkron. Belum ada balasan baru.',
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

  // Send Direct Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadEmail || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await api.hr.sendInboxReply({
        recipient_email: selectedThreadEmail,
        subject: replySubject.trim() || 'Balasan dari 1sLabs Recruitment',
        message_text: replyMessage.trim(),
        candidate_id: activeCandidate?.id || null
      });

      if (res.success) {
        setReplyMessage('');
        notify.success('Balasan email berhasil dikirim dari hr@1slabs.my.id!');
        // Refresh messages in thread
        const updated = await api.hr.getThreadMessages(selectedThreadEmail);
        if (updated.success) {
          setMessages(updated.messages);
        }
        fetchThreads();
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal mengirim balasan.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Connect Unknown Email to Candidate
  const handleConnectCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadEmail || !connectPositionId) return;

    setIsConnecting(true);
    try {
      const res = await api.hr.connectCandidate({
        reply_id: 0,
        position_id: parseInt(connectPositionId, 10),
        full_name: connectFullName.trim() || undefined
      });

      if (res.success) {
        notify.success('Pengirim berhasil didaftarkan sebagai kandidat!');
        setIsConnectModalOpen(false);
        fetchThreads();
        const updated = await api.hr.getThreadMessages(selectedThreadEmail);
        if (updated.success) {
          setActiveCandidate(updated.candidate);
          setMessages(updated.messages);
        }
      }
    } catch (err: any) {
      notify.error(err.message || 'Gagal menghubungkan kandidat.');
    } finally {
      setIsConnecting(false);
    }
  };

  const activeThread = threads.find(t => t.from_email === selectedThreadEmail);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Recruitment Inbox (hr@1slabs.my.id)
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Kotak Masuk & Balasan Kandidat
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Komunikasi dua arah dengan seluruh pelamar. Balasan kandidat otomatis terdeteksi dan memperbarui status rekrutmen.
          </p>
        </div>

        <button
          onClick={handleSyncInbox}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Memeriksa Email Masuk...' : 'Sinkronkan Inbox (hr@)'}
        </button>
      </div>

      {/* Split Layout: Left Threads List, Right Chat Conversation */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* LEFT PANE: THREADS (4 cols) */}
        <div className="lg:col-span-4 border-r border-zinc-200/80 flex flex-col bg-zinc-50/40">
          {/* Search & Filter */}
          <div className="p-3.5 border-b border-zinc-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari email atau pengirim..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterType === 'all' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100 text-zinc-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterType === 'unread' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100 text-zinc-600'
                }`}
              >
                Belum Dibaca
              </button>
              <button
                onClick={() => setFilterType('candidates_only')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterType === 'candidates_only' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100 text-zinc-600'
                }`}
              >
                Kandidat
              </button>
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-zinc-400" />
                Memuat percakapan...
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                <Inbox className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                Tidak ada pesan email masuk.
              </div>
            ) : (
              threads.map(thread => {
                const isSelected = selectedThreadEmail === thread.from_email;
                return (
                  <div
                    key={thread.from_email}
                    onClick={() => setSelectedThreadEmail(thread.from_email)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-2xs'
                        : 'hover:bg-zinc-100/70 text-zinc-800 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="font-bold text-xs truncate">
                        {thread.candidate_name || thread.from_name || thread.from_email}
                      </p>
                      <span className={`text-[10px] shrink-0 ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        {new Date(thread.last_message_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    <p className={`text-[11px] font-semibold truncate mb-1 ${isSelected ? 'text-zinc-200' : 'text-zinc-700'}`}>
                      {thread.last_subject || '(Tanpa Subjek)'}
                    </p>

                    <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {cleanMessageText(thread.last_preview)}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-200/20 text-[10px]">
                      <span className={`truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {thread.position_name || (thread.candidate_id ? 'Kandidat' : 'Pengirim Baru')}
                      </span>

                      {thread.unread_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold text-[9px]">
                          {thread.unread_count} baru
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: THREAD MESSAGES & CHAT COMPOSER (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {selectedThreadEmail && activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50 shrink-0">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-900 truncate">
                      {activeCandidate?.full_name || activeThread.from_name || activeThread.from_email}
                    </h3>
                    {activeCandidate ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                        Terdaftar: {activeCandidate.position_name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                        Belum Terdaftar sebagai Kandidat
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{selectedThreadEmail}</p>
                </div>

                {!activeCandidate && (
                  <button
                    onClick={() => {
                      setConnectFullName(activeThread.from_name || activeThread.from_email.split('@')[0]);
                      setIsConnectModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 shrink-0"
                  >
                    <UserPlus className="w-3 h-3" />
                    Buat Kandidat
                  </button>
                )}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
                {isMessagesLoading ? (
                  <div className="py-16 text-center text-xs text-zinc-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat riwayat pesan...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-12">Belum ada riwayat pesan.</p>
                ) : (
                  messages.map((msg, i) => {
                    const isOutgoing = msg.direction === 'outgoing';
                    const timeStr = new Date(msg.message_date).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={msg.id || i}
                        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1 px-1">
                          <span className="font-semibold text-zinc-600">{msg.from_name || msg.from_email}</span>
                          <span>&bull;</span>
                          <span>{timeStr}</span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-2xs space-y-1 ${
                            isOutgoing
                              ? 'bg-zinc-900 text-white'
                              : 'bg-white border border-zinc-200 text-zinc-800'
                          }`}
                        >
                          {msg.subject && (
                            <p className={`font-bold text-xs pb-1 mb-1 border-b ${
                              isOutgoing ? 'border-zinc-700 text-zinc-200' : 'border-zinc-100 text-zinc-900'
                            }`}>
                              {msg.subject}
                            </p>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed font-sans">
                            {cleanMessageText(msg.body_text)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Reply Composer */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-zinc-200 bg-white space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-800">
                    Balas sebagai: <span className="font-mono text-zinc-900">hr@1slabs.my.id</span>
                  </span>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={e => setReplySubject(e.target.value)}
                    placeholder="Subjek balasan..."
                    className="w-1/2 p-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                  />
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Ketik pesan balasan resmi untuk kandidat..."
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white pr-24"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyMessage.trim()}
                    className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-xs font-semibold shadow-xs transition-all"
                  >
                    {isSendingReply ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Kirim
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <Inbox className="w-10 h-10 text-zinc-300 mb-3" />
              <p className="text-sm font-semibold text-zinc-700">Pilih Percakapan</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Pilih salah satu thread email kandidat di sebelah kiri untuk melihat percakapan lengkap dan membalas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Connect Unknown Email to Candidate Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">
                Daftarkan Pengirim sebagai Kandidat
              </h3>
              <button onClick={() => setIsConnectModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleConnectCandidate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alamat Email Pengirim
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedThreadEmail || ''}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap Kandidat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={connectFullName}
                  onChange={e => setConnectFullName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Pilih Posisi Dilamar <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={connectPositionId}
                  onChange={e => setConnectPositionId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                >
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
                >
                  {isConnecting ? 'Menyimpan...' : 'Hubungkan & Daftarkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

