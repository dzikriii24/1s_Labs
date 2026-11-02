import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Plus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Eye,
  RefreshCw,
  Sparkles,
  Users,
  Target,
  ShieldCheck,
  ShieldAlert,
  X,
  Smartphone,
  Monitor,
  CheckSquare,
  Square,
  Search,
  Filter,
  ExternalLink,
  History,
  FileText,
  Building,
  MapPin,
  ChevronRight,
  Info,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  api,
  MarketingCampaign,
  MarketingEmailTemplate,
  MarketingEmailCandidate,
  MarketingEmailLogItem,
  MarketingCampaignRecipient
} from '../../../../services/api';

// Curated 1sLabs Official Templates with Branding & Logo
const OFFICIAL_1SLABS_TEMPLATES = [
  {
    id: 'tpl-umkm-website',
    name: 'Website UMKM & Bisnis Lokal (Profile, WhatsApp & Maps)',
    category: 'Indonesia - Small Business',
    language: 'id',
    subject: 'Peluang Pengembangan Website & Digital Presence untuk {{business_name}}',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
  <p>Halo Tim <strong>{{business_name}}</strong>,</p>

  <p>Salam hangat dari <strong>1sLabs</strong> — studio teknologi & digital partner yang berfokus membantu UMKM, cafe, dan bisnis lokal di Indonesia meningkatkan visibilitas dan penjualan melalui website profesional yang terjangkau.</p>

  <p>Berdasarkan pengamatan kami, <strong>{{business_name}}</strong> di {{city}} memiliki potensi besar untuk menjangkau lebih banyak pelanggan baru yang mencari produk atau layanan Anda secara online.</p>

  <p>Kami memiliki paket pengembangan <strong>Website Bisnis Lokal & UMKM</strong> siap pakai, meliputi:</p>

  <ul style="padding-left: 20px; margin: 16px 0;">
    <li style="margin-bottom: 8px;"><strong>Desain Modern & Mobile-Friendly:</strong> Tampil bersih, elegan, dan sangat cepat saat dibuka di smartphone calon pelanggan.</li>
    <li style="margin-bottom: 8px;"><strong>Integrasi Tombol WhatsApp Langsung:</strong> Pelanggan dapat langsung bertanya, reservasi, atau order hanya dengan 1 kali klik.</li>
    <li style="margin-bottom: 8px;"><strong>Lokasi Google Maps & Jam Operasional:</strong> Memudahkan pelanggan menemukan dan datang langsung ke lokasi usaha Anda.</li>
    <li style="margin-bottom: 8px;"><strong>Galeri Foto Produk / Layanan:</strong> Tampilkan menu, produk, atau portofolio terbaik usaha Anda dengan kualitas tajam.</li>
    <li style="margin-bottom: 8px;"><strong>Free High-Speed Cloud Hosting 1 Tahun:</strong> Server cepat dan andal, Anda tidak perlu memikirkan biaya server di awal.</li>
    <li style="margin-bottom: 8px;"><strong>Free Maintenance & Garansi 1 Tahun Penuh:</strong> Didampingi langsung oleh tim teknis 1sLabs jika ada pergantian foto, menu, atau info operasional.</li>
  </ul>

  <p>Waktu pengerjaan umumnya hanya 1–2 minggu. Kami sangat ingin berdiskusi santai terlebih dahulu untuk memahami kebutuhan spesifik {{business_name}} tanpa komitmen apapun.</p>

  <p>Apabila berkenan, apakah kami boleh mengirimkan preview konsep desain website atau mengobrol singkat melalui WhatsApp?</p>

  <p style="margin-top: 24px;">Terima kasih banyak atas waktu dan perhatiannya.<br><br>
  Salam hangat,<br>
  <strong>Tim Kemitraan Digital 1sLabs</strong><br>
  <a href="https://1slabs.my.id" style="color: #059669; text-decoration: none; font-weight: 600;">https://1slabs.my.id/</a> &bull; WhatsApp: +62 851-5629-6580
  </p>
</div>`
  },
  {
    id: 'tpl-fnb-menu',
    name: 'Menu Digital & QR Code Ordering (Cafe, Resto & Bakery)',
    category: 'Indonesia - F&B',
    language: 'id',
    subject: 'Solusi Menu Digital Interaktif & QR Code Meja untuk {{business_name}}',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
  <p>Halo Pengelola & Tim <strong>{{business_name}}</strong>,</p>

  <p>Perkenalkan, kami dari <strong>1sLabs</strong>. Kami memperhatikan perkembangan industri kuliner & cafe di {{city}}, termasuk <strong>{{business_name}}</strong> yang memiliki daya tarik dan pelanggan tersendiri.</p>

  <p>Untuk meningkatkan kenyamanan bersantap dan efisiensi pesanan di meja, kami ingin menawarkan solusi <strong>Digital Menu & QR Code Ordering</strong> khusus usaha kuliner:</p>

  <ul style="padding-left: 20px; margin: 16px 0;">
    <li style="margin-bottom: 8px;"><strong>Scan & Lihat dari Meja:</strong> Pengunjung cukup mengarahkan kamera smartphone ke QR code di meja tanpa perlu menunggu buku menu fisik.</li>
    <li style="margin-bottom: 8px;"><strong>Foto Makanan Menggugah Selera:</strong> Tampilkan foto hidangan dan minuman dengan visual menarik beserta deskripsi & label rekomendasi chef.</li>
    <li style="margin-bottom: 8px;"><strong>Update Menu & Harga Mandiri:</strong> Anda dapat mengubah status menu habis (sold out) atau memperbarui harga kapan saja secara instan tanpa perlu mencetak ulang buku menu.</li>
    <li style="margin-bottom: 8px;"><strong>Pesan Otomatis via WhatsApp:</strong> Pesanan yang dipilih pelanggan dapat langsung terkirim dengan format terstruktur ke WhatsApp kasir atau barista.</li>
    <li style="margin-bottom: 8px;"><strong>Termasuk Free Cloud Hosting & Garansi 1 Tahun.</strong></li>
  </ul>

  <p>Solusi ini sangat praktis, hemat biaya operasional kertas menu, dan dapat aktif dalam hitungan hari.</p>

  <p>Bolehkah kami mendemokan tampilan demo menu interaktif ini secara langsung kepada tim {{business_name}}?</p>

  <p style="margin-top: 24px;">Sukses selalu untuk usahanya.<br><br>
  Salam hormat,<br>
  <strong>Tim Solusi F&B 1sLabs</strong><br>
  <a href="https://1slabs.my.id" style="color: #059669; text-decoration: none; font-weight: 600;">1slabs.my.id</a>
  </p>
</div>`
  },
  {
    id: 'tpl-booking-system',
    name: 'Online Booking & Reservasi (Salon, Barbershop & Studio)',
    category: 'Indonesia - Booking',
    language: 'id',
    subject: 'Sistem Reservasi & Booking Online Praktis untuk {{business_name}}',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
  <p>Halo Tim <strong>{{business_name}}</strong>,</p>

  <p>Perkenalkan, kami dari <strong>1sLabs</strong>. Kami melihat layanan dan kualitas yang dihadirkan {{business_name}} di {{city}} sangat diminati oleh pelanggan setia.</p>

  <p>Seringkali pelanggan ingin memesan jadwal treatment, potong rambut, atau sesi foto di malam hari atau di luar jam operasional. Kami membantu menyediakan <strong>Website & Sistem Booking Online</strong> yang sangat sederhana dan ramah pengguna:</p>

  <ul style="padding-left: 20px; margin: 16px 0;">
    <li style="margin-bottom: 8px;"><strong>Pemilihan Layanan & Waktu Mandiri:</strong> Pelanggan memilih jenis treatment, tanggal, jam yang tersedia, dan stylist/kapster favorit.</li>
    <li style="margin-bottom: 8px;"><strong>Konfirmasi Otomatis ke WhatsApp:</strong> Bukti reservasi langsung terkirim otomatis ke WhatsApp pelanggan dan admin Anda.</li>
    <li style="margin-bottom: 8px;"><strong>Mengurangi Antrean & No-Show:</strong> Jadwal tertata rapi sehingga ruang tunggu tidak terlalu padat.</li>
    <li style="margin-bottom: 8px;"><strong>Sudah Termasuk Domain, Hosting Cloud 1 Tahun & Garansi Teknis.</strong></li>
  </ul>

  <p>Apakah kami dapat menjadwalkan obrolan singkat 5 menit untuk menunjukkan cara kerja sistem booking ini?</p>

  <p style="margin-top: 24px;">Salam hangat,<br>
  <strong>1sLabs Digital Team</strong><br>
  <a href="https://1slabs.my.id" style="color: #059669; text-decoration: none; font-weight: 600;">https://1slabs.my.id</a>
  </p>
</div>`
  },
  {
    id: 'tpl-intl-english',
    name: '[EN - Global] Digital Presence & Modern Web Engineering for {{business_name}}',
    category: 'International - Global (EN)',
    language: 'en',
    subject: 'Digital Presence & Web Development Support for {{business_name}}',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
  <p>Hi <strong>{{business_name}}</strong> Team,</p>

  <p>I hope this message finds you well.</p>

  <p>My name is Dzikri from <strong>1sLabs</strong>. We are a boutique digital technology and web engineering studio specializing in helping independent businesses, specialty cafes, boutique stores, and local service brands build fast, modern, and accessible websites.</p>

  <p>We recently came across <strong>{{business_name}}</strong> in {{city}} and were genuinely impressed by your offerings and brand presence.</p>

  <p>If your team has been considering refreshing your digital footprint, launching an interactive online catalog/booking platform, or improving mobile speed, we would love to collaborate. Our all-inclusive small business suite features:</p>

  <ul style="padding-left: 20px; margin: 16px 0;">
    <li style="margin-bottom: 8px;"><strong>Clean, High-Performance Responsive Architecture:</strong> Blazing-fast page loads and pixel-perfect rendering across all mobile and desktop devices.</li>
    <li style="margin-bottom: 8px;"><strong>Direct WhatsApp & Enquiry Integration:</strong> Instant customer capture and seamless ordering channels.</li>
    <li style="margin-bottom: 8px;"><strong>Interactive Location & Operating Hours:</strong> Google Maps integration and accurate opening schedules.</li>
    <li style="margin-bottom: 8px;"><strong>Complimentary 1-Year Fast Cloud Hosting & SSL Certificate:</strong> Zero initial server headaches or infrastructure overhead.</li>
    <li style="margin-bottom: 8px;"><strong>Complimentary 1-Year Support & Warranty:</strong> Direct technical assistance whenever you update photos, services, or menus.</li>
  </ul>

  <p>We believe in honest, consultative relationships without pushy sales. Would you be open to a brief 5-minute chat or seeing a tailored concept preview for {{business_name}}?</p>

  <p style="margin-top: 24px;">Warm regards,<br><br>
  <strong>1sLabs Engineering Team</strong><br>
  <a href="https://1slabs.my.id" style="color: #059669; text-decoration: none; font-weight: 600;">https://1slabs.my.id</a> &bull; Bandung, Indonesia
  </p>
</div>`
  },
  {
    id: 'tpl-intl-malay',
    name: '[MY - Melayu] Peluang Kerjasama Laman Web & Digitalisasi {{business_name}}',
    category: 'International - MY/SG',
    language: 'ms',
    subject: 'Peluang Kerjasama Pembangunan Laman Web & Digital {{business_name}}',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
  <p>Salam sejahtera kepada Pengurusan & Tim <strong>{{business_name}}</strong>,</p>

  <p>Saya Dzikri dari <strong>1sLabs</strong> — rakan kongsi pembangunan teknologi web & digital khusus untuk perniagaan kecil, kafe, butik, dan usahawan tempatan.</p>

  <p>Kami melihat potensi perniagaan <strong>{{business_name}}</strong> di {{city}} untuk meluaskan capaian pelanggan melalui laman web yang moden, pantas, dan mesra telefon pintar.</p>

  <p>Pakej penyelesaian laman web kami merangkumi:</p>

  <ul style="padding-left: 20px; margin: 16px 0;">
    <li style="margin-bottom: 8px;"><strong>Rekaan Moden & Responsif:</strong> Memaparkan profil, menu/katalog produk dengan kemas di semua peranti.</li>
    <li style="margin-bottom: 8px;"><strong>Integrasi Pertanyaan & Pesanan Terus ke WhatsApp:</strong> Pelanggan boleh terus berhubung dengan pihak tuan/puan dalam 1 klik.</li>
    <li style="margin-bottom: 8px;"><strong>Peta Lokasi Google Maps & Waktu Operasi Jelas:</strong> Memudahkan pelanggan berkunjung terus ke kedai anda.</li>
    <li style="margin-bottom: 8px;"><strong>Percuma Cloud Hosting & Sijil Keselamatan SSL selama 1 Tahun:</strong> Tiada caj pelayan tambahan pada peringkat awal.</li>
    <li style="margin-bottom: 8px;"><strong>Jaminan Penyelenggaraan & Sokongan Teknikal 1 Tahun Penuh.</strong></li>
  </ul>

  <p>Jika pihak tuan/puan berminat untuk melihat contoh rekaan atau berbincang santai secara dalam talian, kami berbesar hati untuk berhubung.</p>

  <p style="margin-top: 24px;">Sekian, terima kasih.<br><br>
  Yang benar,<br>
  <strong>1sLabs Digital Team</strong><br>
  <a href="https://1slabs.my.id" style="color: #059669; text-decoration: none; font-weight: 600;">1slabs.my.id</a>
  </p>
</div>`
  },
  {
    id: 'tpl-followup-local',
    name: '[Follow-up ID] Kemitraan Website & Digitalisasi Bisnis Lokal',
    category: 'Indonesia - Follow-up',
    language: 'id',
    subject: 'Follow-up: Peluang Kolaborasi Pengembangan Website untuk {{business_name}}',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
  <p>Halo Pengelola & Tim <strong>{{business_name}}</strong>,</p>

  <p>Semoga Anda dan seluruh tim senantiasa sehat dan lancar dalam menjalankan aktivitas usaha di {{city}}.</p>

  <p>Saya ingin menindaklanjuti (follow-up) email perkenalan singkat kami beberapa waktu lalu mengenai program <strong>Pengembangan Website & Digital Presence Profesional</strong> dari <strong>1sLabs</strong> khusus untuk <strong>{{business_name}}</strong>.</p>

  <p>Kami sangat memahami bahwa jadwal harian Anda padat mengelola operasional bisnis. Oleh karena itu, izinkan kami merangkum beberapa nilai tambah utama yang langsung didapatkan {{business_name}} bersama 1sLabs:</p>

  <ul style="padding-left: 20px; margin: 16px 0;">
    <li style="margin-bottom: 8px;"><strong>Desain Modern, Cepat & Mobile-Friendly:</strong> Tampil bersih, elegan, dan profesional saat dibuka di smartphone calon pelanggan.</li>
    <li style="margin-bottom: 8px;"><strong>Integrasi WhatsApp Langsung & Google Maps:</strong> Calon pelanggan dapat langsung bertanya, reservasi, atau order via WhatsApp hanya dengan 1 kali klik.</li>
    <li style="margin-bottom: 8px;"><strong>Free High-Speed Cloud Hosting 1 Tahun Penuh:</strong> Server NVMe berkecepatan tinggi tanpa beban biaya server terpisah di awal.</li>
    <li style="margin-bottom: 8px;"><strong>Pendampingan Teknis & Maintenance 1 Tahun:</strong> Tim 1sLabs siap mendampingi jika ada pembaruan menu, foto produk, jam buka, atau promo usaha.</li>
    <li style="margin-bottom: 8px;"><strong>Pengerjaan Singkat:</strong> Website siap online dalam waktu 1–2 minggu kerja.</li>
  </ul>

  <p>Kami sangat antusias membantu {{business_name}} tampil lebih kredibel dan menjangkau lebih banyak pelanggan baru. Kami juga siap membuatkan <strong>preview mock-up konsep desain website gratis</strong> secara khusus untuk bisnis Anda.</p>

  <p>Apabila Anda memiliki waktu luang 5–10 menit minggu ini, apakah kami boleh berdiskusi santai melalui WhatsApp atau Google Meet?</p>

  <p style="margin-top: 24px;">Terima kasih banyak atas perhatian dan waktu berharga yang Anda luangkan.<br><br>
  Salam hangat,<br>
  <strong>Tim Kemitraan Digital 1sLabs</strong><br>
  <a href="https://1slabs.my.id" style="color: #059669; text-decoration: none; font-weight: 600;">https://1slabs.my.id/</a> &bull; WhatsApp: +62 851-5629-6580
  </p>
</div>`
  },
  {
    id: 'tpl-followup-global',
    name: '[EN - Follow-up] Partnership & Modern Web Experience for {{business_name}}',
    category: 'International - Follow-up (EN)',
    language: 'en',
    subject: 'Follow-up: Elevating Web Experience & Digital Presence for {{business_name}}',
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #18181b; line-height: 1.6;">
  <p>Hi Team <strong>{{business_name}}</strong>,</p>

  <p>I hope you are having a productive week.</p>

  <p>I am briefly following up on our previous note regarding <strong>1sLabs</strong> and how we can support <strong>{{business_name}}</strong> in modernizing your digital presence and web engineering infrastructure.</p>

  <p>I know how full schedules can get, so I wanted to keep this brief and highlight the key advantages we bring to businesses like yours:</p>

  <ul style="padding-left: 20px; margin: 16px 0;">
    <li style="margin-bottom: 8px;"><strong>High-Performance Web Architecture:</strong> Sub-second load times, responsive mobile-first UI, and enterprise-grade SEO indexing.</li>
    <li style="margin-bottom: 8px;"><strong>Direct Customer Conversion:</strong> Seamless booking, inquiry, or ordering workflows tailored to your operational needs.</li>
    <li style="margin-bottom: 8px;"><strong>Full Technical Partnership:</strong> We handle cloud deployment, domain configuration, security, and continuous updates.</li>
    <li style="margin-bottom: 8px;"><strong>Turnkey Delivery & Guaranteed Support:</strong> 1 full year of managed cloud hosting and priority maintenance included.</li>
  </ul>

  <p>We would love to share a complimentary <strong>quick design audit & concept preview</strong> tailored specifically to {{business_name}} without any commitment.</p>

  <p>Would you be open to a brief 10-minute introductory conversation or quick exchange on WhatsApp / email later this week?</p>

  <p style="margin-top: 24px;">Thank you very much for your time and consideration.<br><br>
  Warm regards,<br>
  <strong>1sLabs Global Partnerships & Engineering Team</strong><br>
  <a href="https://1slabs.my.id" style="color: #2563eb; text-decoration: none; font-weight: 600;">https://1slabs.my.id/</a> &bull; Direct WhatsApp: +62 851-5629-6580
  </p>
</div>`
  }
];

export const EmailCampaignsTab: React.FC = () => {
  // Main view toggle: 'campaigns' | 'email-logs'
  const [activeView, setActiveView] = useState<'campaigns' | 'email-logs'>('campaigns');

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [templates, setTemplates] = useState<MarketingEmailTemplate[]>([]);
  const [quota, setQuota] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Campaign Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1); // Step 1: Content & Preview, Step 2: Target Selection
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Form inputs
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('tpl-umkm-website');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [avoidRecentContact, setAvoidRecentContact] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Candidate selection (Step 2)
  const [candidates, setCandidates] = useState<MarketingEmailCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<number>>(new Set());
  const [candidateFilterScope, setCandidateFilterScope] = useState<'all' | 'indonesia' | 'international'>('all');
  const [candidateFilterStatus, setCandidateFilterStatus] = useState<'all' | 'uncontacted' | 'contacted'>('uncontacted');
  const [candidateSearch, setCandidateSearch] = useState('');

  // Confirmation Modal before sending
  const [confirmSendCampaign, setConfirmSendCampaign] = useState<MarketingCampaign | null>(null);
  const [confirmSelectedRecipientIds, setConfirmSelectedRecipientIds] = useState<number[] | null>(null);
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);

  // Campaign Recipients View Modal
  const [viewingRecipientsCampaign, setViewingRecipientsCampaign] = useState<MarketingCampaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<MarketingCampaignRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Preview & Test Modal
  const [previewCampaign, setPreviewCampaign] = useState<MarketingCampaign | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('dzikrirabbani2401@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit & Resend / Follow-up state
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [isResendMode, setIsResendMode] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpeningEdit, setIsOpeningEdit] = useState(false);

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<MarketingEmailLogItem[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logLimit] = useState(25);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logStatus, setLogStatus] = useState('all');
  const [viewingLogBody, setViewingLogBody] = useState<MarketingEmailLogItem | null>(null);

  // Load initial data
  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.marketing.getCampaigns();
      if (res.success) {
        setCampaigns(res.campaigns);
        setTemplates(res.templates);
        setQuota(res.quota);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Fetch Candidates for Step 2
  const fetchCandidates = async () => {
    setIsLoadingCandidates(true);
    try {
      const res = await api.marketing.getEmailCandidates({
        scope: candidateFilterScope !== 'all' ? candidateFilterScope : undefined,
        status: candidateFilterStatus !== 'all' ? candidateFilterStatus : undefined,
        search: candidateSearch.trim() || undefined
      });
      if (res.success) {
        setCandidates(res.data);
      }
    } catch (err: any) {
      console.warn('Gagal memuat daftar target email:', err.message);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (isCreateOpen && createStep === 2) {
      fetchCandidates();
    }
  }, [isCreateOpen, createStep, candidateFilterScope, candidateFilterStatus, candidateSearch]);

  // Fetch Sent Email Logs
  const fetchEmailLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.marketing.getEmailLogs({
        page: logPage,
        limit: logLimit,
        search: logSearch.trim() || undefined,
        status: logStatus !== 'all' ? logStatus : undefined
      });
      if (res.success) {
        setEmailLogs(res.data);
        setLogTotal(res.pagination.total);
      }
    } catch (err: any) {
      console.warn('Gagal memuat riwayat email:', err.message);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeView === 'email-logs') {
      fetchEmailLogs();
    }
  }, [activeView, logPage, logStatus, logSearch]);

  // Handle template selection
  const handleTemplateSelect = (keyOrId: string) => {
    setSelectedTemplateKey(keyOrId);
    const official = OFFICIAL_1SLABS_TEMPLATES.find(t => t.id === keyOrId);
    if (official) {
      setCampaignSubject(official.subject);
      setCampaignBody(official.body_html);
      return;
    }
    const dbTpl = templates.find(t => String(t.id) === keyOrId);
    if (dbTpl) {
      setCampaignSubject(dbTpl.subject);
      setCampaignBody(dbTpl.body_html);
    }
  };

  // Open Create Campaign
  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setIsResendMode(false);
    setCreateStep(1);
    setCampaignName('');
    const firstTpl = OFFICIAL_1SLABS_TEMPLATES[0];
    setSelectedTemplateKey(firstTpl.id);
    setCampaignSubject(firstTpl.subject);
    setCampaignBody(firstTpl.body_html);
    setSelectedCompanyIds(new Set());
    setAvoidRecentContact(true);
    setIsCreateOpen(true);
  };

  // Open Edit Campaign for Draft
  const handleOpenEdit = async (camp: MarketingCampaign) => {
    setIsOpeningEdit(true);
    try {
      setEditingCampaign(camp);
      setIsResendMode(false);
      setCampaignName(camp.name);
      setCampaignSubject(camp.subject);
      setCampaignBody(camp.body_html);
      setAvoidRecentContact(false);
      setCandidateFilterStatus('all');
      setCreateStep(1);

      const matched = OFFICIAL_1SLABS_TEMPLATES.find(t => t.subject === camp.subject || t.body_html === camp.body_html);
      setSelectedTemplateKey(matched ? matched.id : 'tpl-umkm-website');

      const recRes = await api.marketing.getCampaignRecipients(camp.id);
      if (recRes.success && recRes.data) {
        const ids = recRes.data.map(r => r.company_id);
        setSelectedCompanyIds(new Set(ids));
      } else {
        setSelectedCompanyIds(new Set());
      }
      setIsCreateOpen(true);
    } catch (err: any) {
      alert(`Gagal memuat campaign: ${err.message}`);
    } finally {
      setIsOpeningEdit(false);
    }
  };

  // Open Edit & Kirim Ulang for Completed campaign
  const handleOpenEditAndResend = async (camp: MarketingCampaign) => {
    setIsOpeningEdit(true);
    try {
      setEditingCampaign(camp);
      setIsResendMode(true);
      setCampaignName(camp.name);
      setCampaignSubject(camp.subject);
      setCampaignBody(camp.body_html);
      setAvoidRecentContact(false);
      setCandidateFilterStatus('all');
      setCreateStep(1);

      const matched = OFFICIAL_1SLABS_TEMPLATES.find(t => t.subject === camp.subject || t.body_html === camp.body_html);
      setSelectedTemplateKey(matched ? matched.id : 'tpl-umkm-website');

      const recRes = await api.marketing.getCampaignRecipients(camp.id);
      if (recRes.success && recRes.data) {
        const ids = recRes.data.map(r => r.company_id);
        setSelectedCompanyIds(new Set(ids));
      } else {
        setSelectedCompanyIds(new Set());
      }
      setIsCreateOpen(true);
    } catch (err: any) {
      alert(`Gagal memuat campaign: ${err.message}`);
    } finally {
      setIsOpeningEdit(false);
    }
  };

  // Open Follow-up Campaign (Creates a new follow-up campaign with previous recipients preselected!)
  const handleOpenFollowUp = async (camp: MarketingCampaign) => {
    setIsOpeningEdit(true);
    try {
      setEditingCampaign(null); // Fresh campaign for follow-up
      setIsResendMode(false);
      setCampaignName(`[Follow-up] ${camp.name.replace(/^\[Follow-up\]\s*/i, '')}`);
      setAvoidRecentContact(false);
      setCandidateFilterStatus('all');
      setCreateStep(1);

      const isGlobal = (camp.name + ' ' + camp.subject + ' ' + (camp.target_industry || '')).toLowerCase().includes('en') ||
        (camp.name + ' ' + camp.subject).toLowerCase().includes('global') ||
        camp.subject.toLowerCase().includes('partner') ||
        camp.subject.toLowerCase().includes('digital presence');

      const followUpTpl = isGlobal
        ? OFFICIAL_1SLABS_TEMPLATES.find(t => t.id === 'tpl-followup-global')!
        : OFFICIAL_1SLABS_TEMPLATES.find(t => t.id === 'tpl-followup-local')!;

      setSelectedTemplateKey(followUpTpl.id);
      setCampaignSubject(followUpTpl.subject);
      setCampaignBody(followUpTpl.body_html);

      const recRes = await api.marketing.getCampaignRecipients(camp.id);
      if (recRes.success && recRes.data) {
        const ids = recRes.data.map(r => r.company_id);
        setSelectedCompanyIds(new Set(ids));
      } else {
        setSelectedCompanyIds(new Set());
      }
      setIsCreateOpen(true);
    } catch (err: any) {
      alert(`Gagal menyiapkan follow-up: ${err.message}`);
    } finally {
      setIsOpeningEdit(false);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (camp: MarketingCampaign) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus campaign "${camp.name}"? Semua data target penerima pada campaign ini akan dihapus.`)) {
      return;
    }
    setDeletingCampaignId(camp.id);
    setIsDeleting(true);
    try {
      const res = await api.marketing.deleteCampaign(camp.id);
      if (res.success) {
        setStatusFeedback({ text: res.message, type: 'success' });
        fetchCampaigns();
      }
    } catch (err: any) {
      alert(`Gagal menghapus campaign: ${err.message}`);
    } finally {
      setDeletingCampaignId(null);
      setIsDeleting(false);
    }
  };

  // Insert variable into editor
  const handleInsertVariable = (variableName: string) => {
    const tag = `{{${variableName}}}`;
    setCampaignBody(prev => prev + ' ' + tag);
  };

  // Toggle company checkbox in Step 2
  const toggleSelectCompany = (id: number) => {
    setSelectedCompanyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered candidates
  const handleSelectAllFiltered = () => {
    setSelectedCompanyIds(new Set(candidates.map(c => c.id)));
  };

  // Select only uncontacted
  const handleSelectOnlyUncontacted = () => {
    const uncontactedIds = candidates
      .filter(c => c.contacted_times === 0 && c.email_sent_count === 0)
      .map(c => c.id);
    setSelectedCompanyIds(new Set(uncontactedIds));
  };

  const handleClearSelection = () => {
    setSelectedCompanyIds(new Set());
  };

  // Submit and create or update Campaign
  const handleSaveCampaign = async (andStart = false) => {
    if (!campaignName.trim()) {
      alert('Mohon masukkan Nama Campaign.');
      return;
    }
    if (!campaignSubject.trim()) {
      alert('Mohon masukkan Subject Email.');
      return;
    }
    if (!campaignBody.trim()) {
      alert('Mohon masukkan Isi Pesan Email.');
      return;
    }
    if (selectedCompanyIds.size === 0) {
      alert('Pilih minimal 1 bisnis penerima pada Step 2 sebelum menyimpan.');
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback(null);
    try {
      let res: any;
      if (editingCampaign) {
        // UPDATE existing campaign (draft or completed with resend)
        res = await api.marketing.updateCampaign(editingCampaign.id, {
          name: campaignName,
          subject: campaignSubject,
          body_html: campaignBody,
          target_company_ids: Array.from(selectedCompanyIds),
          avoid_recently_contacted: avoidRecentContact,
          reset_to_draft: isResendMode || editingCampaign.status === 'completed'
        });
      } else {
        // CREATE new campaign
        res = await api.marketing.createCampaign({
          name: campaignName,
          subject: campaignSubject,
          body_html: campaignBody,
          target_company_ids: Array.from(selectedCompanyIds),
          avoid_recently_contacted: avoidRecentContact
        });
      }

      if (res.success) {
        setIsCreateOpen(false);
        const campId = editingCampaign ? editingCampaign.id : res.campaign_id;
        setEditingCampaign(null);
        setIsResendMode(false);
        fetchCampaigns();
        setStatusFeedback({ text: res.message, type: 'success' });

        if (andStart && campId) {
          // Open start confirmation immediately
          const targetCamp = {
            id: campId,
            name: campaignName,
            subject: campaignSubject,
            body_html: campaignBody,
            status: 'draft',
            total_recipients: res.total_recipients,
            sent_count: 0,
            delivered_count: 0,
            failed_count: 0,
            bounced_count: 0,
            responded_count: 0,
            interested_count: 0,
            unsubscribed_count: 0,
            target_lead_score_min: 0,
            created_at: new Date().toISOString()
          } as MarketingCampaign;
          setConfirmSendCampaign(targetCamp);
        }
      }
    } catch (err: any) {
      alert(`Gagal menyimpan campaign: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test email
  const handleSendTest = async (campaignId?: number) => {
    setIsSendingTest(true);
    try {
      if (campaignId) {
        const res = await api.marketing.sendTestEmail(campaignId, testEmailAddress);
        alert(res.message);
      } else {
        // Send preview using test address directly
        alert(`Test preview telah dikonfigurasi untuk dikirimkan ke: ${testEmailAddress}`);
      }
    } catch (err: any) {
      alert(`Gagal kirim test email: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Start campaign confirmation
  const handleConfirmStart = async () => {
    if (!confirmSendCampaign) return;
    setIsStartingCampaign(true);
    try {
      const res = await api.marketing.startCampaign(
        confirmSendCampaign.id,
        confirmSelectedRecipientIds || undefined
      );
      alert(res.message);
      setConfirmSendCampaign(null);
      setConfirmSelectedRecipientIds(null);
      fetchCampaigns();
      if (activeView === 'email-logs') {
        fetchEmailLogs();
      }
    } catch (err: any) {
      alert(`Pengiriman gagal: ${err.message}`);
    } finally {
      setIsStartingCampaign(false);
    }
  };

  // Open View Recipients
  const handleOpenRecipients = async (camp: MarketingCampaign) => {
    setViewingRecipientsCampaign(camp);
    setIsLoadingRecipients(true);
    try {
      const res = await api.marketing.getCampaignRecipients(camp.id);
      if (res.success) {
        setCampaignRecipients(res.data);
      }
    } catch (err: any) {
      console.warn('Gagal memuat data penerima campaign:', err.message);
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  // Render Live Preview HTML with 1sLabs Branded Wrapper
  const isEnglishTemplate = selectedTemplateKey.includes('intl') || selectedTemplateKey.includes('english') || selectedTemplateKey.includes('en');
  const isMalayTemplate = selectedTemplateKey.includes('malay') || selectedTemplateKey.includes('ms');

  const ctaButtonText = isEnglishTemplate
    ? 'Schedule a Discussion / Online Meeting \u2192'
    : (isMalayTemplate
      ? 'Jadualkan Perbincangan / Sesi Dalam Talian \u2192'
      : 'Jadwalkan Diskusi / Online Meeting \u2192');

  const ctaBadgeText = isEnglishTemplate
    ? 'Official Partnership'
    : (isMalayTemplate ? 'Rakan Rasmi' : 'Kemitraan Resmi');

  const renderedPreviewHtml = useMemo(() => {
    const isEnglish = isEnglishTemplate;
    const sampleCompName = isEnglish ? 'VCR Cafe Bangsar' : 'Armor Kopi Bandung';
    const sampleContact = isEnglish ? 'Kenneth Lee' : 'Bpk. Dzikri Rabbani';
    const sampleCity = isEnglish ? 'Kuala Lumpur' : 'Bandung';
    const sampleCountry = isEnglish ? 'Malaysia' : 'Indonesia';

    const substituted = campaignBody
      .replace(/{{business_name}}/gi, sampleCompName)
      .replace(/{{company_name}}/gi, sampleCompName)
      .replace(/{{contact_name}}/gi, sampleContact)
      .replace(/{{city}}/gi, sampleCity)
      .replace(/{{country}}/gi, sampleCountry)
      .replace(/{{province}}/gi, isEnglish ? 'Wilayah Persekutuan' : 'Jawa Barat')
      .replace(/{{unsubscribe_url}}/gi, '#unsubscribe');

    return substituted;
  }, [campaignBody, selectedTemplateKey]);

  return (
    <div className="space-y-6">
      {/* Top Header Card & View Switcher */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
              1sLabs Outreach Engine
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] font-mono font-semibold">
              Safe 100/day
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
            <span>Email Campaigns & Outreach</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">
            Kirimkan penawaran kemitraan digital 1sLabs berlogo resmi, pilih target bisnis secara transparan, cegah pesan ganda, dan pantau riwayat email lengkap.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {quota && (
            <div className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-700 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${quota.remaining_quota > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>Sisa Kuota Hari Ini: <strong className="text-zinc-900">{quota.remaining_quota}</strong> / {quota.max_limit}</span>
            </div>
          )}

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Campaign Baru</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center space-x-1 border-b border-zinc-200">
        <button
          onClick={() => setActiveView('campaigns')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
            activeView === 'campaigns'
              ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50 rounded-t-xl'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Daftar Campaign ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveView('email-logs')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
            activeView === 'email-logs'
              ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50 rounded-t-xl'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Email Terkirim</span>
          {logTotal > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-mono">
              {logTotal}
            </span>
          )}
        </button>
      </div>

      {statusFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium shadow-xs flex items-center justify-between gap-3 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusFeedback.text}</span>
          </div>
          <button onClick={() => setStatusFeedback(null)} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: CAMPAIGNS LIST */}
      {activeView === 'campaigns' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-700" /> Daftar Campaign Marketing
            </h4>
            <button
              onClick={fetchCampaigns}
              className="p-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer"
              title="Refresh campaigns"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-zinc-500 text-xs font-mono">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-900 mb-2" />
              Memuat data campaign...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <Send className="w-6 h-6" />
              </div>
              <p className="font-medium text-zinc-700">Belum ada campaign marketing yang dibuat.</p>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                Buat campaign penawaran pertama Anda, pilih template berlogo resmi 1sLabs, dan tentukan target bisnis yang diinginkan.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Campaign Pertama</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="p-5 bg-zinc-50/70 border border-zinc-200 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-zinc-900">{camp.name}</span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                          camp.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : camp.status === 'running'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {camp.status === 'completed' ? 'Selesai' : camp.status === 'running' ? 'Sedang Berjalan' : 'Draft'}
                      </span>
                      {camp.target_industry && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-zinc-700 border border-zinc-200 font-mono">
                          {camp.target_industry}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-600 truncate">
                      Subject: <strong className="text-zinc-800 font-mono font-medium">{camp.subject}</strong>
                    </div>

                    <div className="text-[11px] text-zinc-500 flex items-center gap-3 font-mono flex-wrap pt-1">
                      <span title="Total target bisnis yang dipilih untuk campaign ini">Target: <strong className="text-zinc-900">{camp.total_recipients} bisnis</strong></span>
                      <span title="Jumlah email yang sukses dikirimkan ke penerima">&bull; Terkirim: <strong className="text-emerald-700">{camp.sent_count}</strong></span>
                      <span title="Jumlah prospek yang membalas email ke inbox">&bull; Dibalas: <strong className="text-amber-700">{camp.responded_count}</strong></span>
                      <span title="Jumlah prospek yang mengklik CTA 'Jadwalkan Diskusi / Online Meeting' di email atau merespons tertarik" className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                        &bull; Tertarik: <strong className="text-emerald-800">{camp.interested_count}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0 flex-wrap">
                    {/* EDIT DRAFT BUTTON */}
                    {camp.status === 'draft' && (
                      <button
                        onClick={() => handleOpenEdit(camp)}
                        disabled={isOpeningEdit}
                        className="px-3 py-1.5 border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Edit pesan, template dan daftar penerima campaign draft ini"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit Pesan & Target</span>
                      </button>
                    )}

                    {/* EDIT & RESEND COMPLETED CAMPAIGN */}
                    {camp.status === 'completed' && (
                      <button
                        onClick={() => handleOpenEditAndResend(camp)}
                        disabled={isOpeningEdit}
                        className="px-3 py-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Edit pesan email atau target dan kirimkan ulang"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Edit & Kirim Ulang</span>
                      </button>
                    )}

                    {/* FOLLOW-UP CAMPAIGN BUTTON */}
                    {camp.status === 'completed' && (
                      <button
                        onClick={() => handleOpenFollowUp(camp)}
                        disabled={isOpeningEdit}
                        className="px-3 py-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Buat campaign email follow-up baru dengan penerima yang sama"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Kirim Follow-up</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRecipients(camp)}
                      className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Lihat daftar penerima bisnis"
                    >
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Penerima ({camp.total_recipients})</span>
                    </button>

                    <button
                      onClick={() => setPreviewCampaign(camp)}
                      className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Preview tampilan email"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => handleSendTest(camp.id)}
                      disabled={isSendingTest}
                      className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Kirim email percobaan ke alamat admin"
                    >
                      <Send className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Test Email</span>
                    </button>

                    {camp.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setConfirmSendCampaign(camp);
                          setConfirmSelectedRecipientIds(null);
                        }}
                        className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
                        <span>Kirim Campaign</span>
                      </button>
                    )}

                    {/* DELETE CAMPAIGN BUTTON */}
                    <button
                      onClick={() => handleDeleteCampaign(camp)}
                      disabled={isDeleting && deletingCampaignId === camp.id}
                      className="p-1.5 border border-zinc-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 rounded-xl transition-colors shadow-2xs cursor-pointer"
                      title="Hapus campaign ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SENT EMAIL LOGS (RIWAYAT EMAIL TERKIRIM) */}
      {activeView === 'email-logs' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-700" /> Riwayat Log Email Terkirim
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Daftar rekaman pengiriman email ke perusahaan dan kontak person, lengkap dengan status pengiriman dan pesan asli.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari perusahaan, email, subject..."
                  value={logSearch}
                  onChange={e => {
                    setLogSearch(e.target.value);
                    setLogPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-56 font-mono"
                />
              </div>

              <select
                value={logStatus}
                onChange={e => {
                  setLogStatus(e.target.value);
                  setLogPage(1);
                }}
                className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none font-mono"
              >
                <option value="all">Semua Status</option>
                <option value="sent">Terkirim (Sent)</option>
                <option value="failed">Gagal (Failed)</option>
              </select>

              <button
                onClick={fetchEmailLogs}
                className="p-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors cursor-pointer"
                title="Refresh log"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoadingLogs ? (
            <div className="py-16 text-center text-zinc-500 text-xs font-mono">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-900 mb-2" />
              Memuat log pengiriman email...
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs space-y-2">
              <p className="font-medium text-zinc-700">Belum ada rekaman riwayat email terkirim.</p>
              <p className="text-[11px] text-zinc-400">
                Setelah Anda menjalankan campaign atau mengirimkan email ke prospek, catatan log pengiriman akan tercatat di sini secara permanen.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4 font-semibold">Waktu Kirim</th>
                    <th className="py-3 px-4 font-semibold">Perusahaan / Bisnis</th>
                    <th className="py-3 px-4 font-semibold">Penerima & Kontak</th>
                    <th className="py-3 px-4 font-semibold">Subject & Campaign</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                        {new Date(log.sent_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">
                          {log.company_name || log.current_company_name || 'Bisnis Tanpa Nama'}
                        </div>
                        {log.country && log.country !== 'Indonesia' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono">
                            {log.country}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-zinc-900 font-medium">{log.recipient_email}</div>
                        {log.recipient_name && (
                          <div className="text-zinc-400 text-[10px]">
                            {log.recipient_name} {log.contact_position ? `(${log.contact_position})` : ''}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-zinc-800 truncate" title={log.subject}>
                          {log.subject}
                        </div>
                        {log.campaign_name && (
                          <div className="text-[10px] text-zinc-400 font-mono truncate">
                            Campaign: {log.campaign_name}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Terkirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium" title={log.error_details || ''}>
                            <AlertCircle className="w-3 h-3" /> Gagal
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingLogBody(log)}
                          className="px-2.5 py-1 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] rounded-lg font-medium transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lihat Pesan</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL (2-STEP SPLIT SCREEN WIZARD) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-zinc-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-zinc-50/50">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-xl bg-zinc-900 text-white">
                  <Mail className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-zinc-900">
                      {editingCampaign
                        ? (isResendMode ? 'Edit & Kirim Ulang Campaign' : 'Edit Email Campaign (Draft)')
                        : (campaignName.startsWith('[Follow-up]') ? 'Buat Email Follow-up Campaign' : 'Buat Email Campaign 1sLabs')}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold">
                      Step {createStep} dari 2
                    </span>
                    {editingCampaign && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-semibold">
                        Mode Edit
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {createStep === 1
                      ? 'Sesuaikan nama campaign, template resmi berlogo 1sLabs, subject & body email dengan live preview.'
                      : 'Pilih dan sesuaikan perusahaan / bisnis penerima (dapat menambah atau mengurangi target).'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: STEP 1 (SPLIT SCREEN CONTENT & LIVE PREVIEW) */}
            {createStep === 1 && (
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
                {/* Left Column: Form Editor (7 cols) */}
                <div className="lg:col-span-7 p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                  <div>
                    <label className="text-xs font-semibold text-zinc-800 block mb-1">
                      Nama Campaign <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Outreach Q4 - Small Business & UMKM Kuliner"
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                    />
                  </div>

                  {/* Template Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-800">
                        Template Penawaran Resmi 1sLabs
                      </label>
                      <span className="text-[10px] text-emerald-700 font-mono font-medium">
                        Berlogo & Format Resmi
                      </span>
                    </div>
                    <select
                      value={selectedTemplateKey}
                      onChange={e => handleTemplateSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                    >
                      <optgroup label="Template Resmi 1sLabs (Direkomendasikan)">
                        {OFFICIAL_1SLABS_TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </optgroup>
                      {templates.length > 0 && (
                        <optgroup label="Template dari Database">
                          {templates.map(t => (
                            <option key={String(t.id)} value={String(t.id)}>
                              {t.name} ({t.category})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-800 block mb-1">
                      Subject Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={campaignSubject}
                      onChange={e => setCampaignSubject(e.target.value)}
                      placeholder="Subject pesan email..."
                      className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  {/* Dynamic Variable Chips */}
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-700 block mb-1.5">
                      Sisipkan Variabel Otomatis:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: 'business_name', label: 'Nama Bisnis' },
                        { key: 'contact_name', label: 'Nama Kontak' },
                        { key: 'city', label: 'Kota Usaha' },
                        { key: 'country', label: 'Negara' },
                        { key: 'province', label: 'Provinsi' }
                      ].map(v => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => handleInsertVariable(v.key)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>{`{{${v.key}}}`}</span>
                          <span className="text-zinc-400 text-[10px]">({v.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body HTML Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-800">
                        Isi Pesan Email (HTML) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Perubahan langsung ter-render pada panel preview di sebelah kanan
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      value={campaignBody}
                      onChange={e => setCampaignBody(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      placeholder="Tuliskan kode HTML email..."
                    />
                  </div>

                  {/* Safe Guardrail Option */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <label className="font-semibold text-zinc-900 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avoidRecentContact}
                          onChange={e => setAvoidRecentContact(e.target.checked)}
                          className="rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                        />
                        <span>Aktifkan Validasi Anti-Double (Cegah Email Ganda)</span>
                      </label>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        Otomatis melewati bisnis atau email penerima yang sudah pernah dihubungi dalam 7 hari terakhir agar tidak dianggap spam.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Device Preview (5 cols) */}
                <div className="lg:col-span-5 p-6 bg-zinc-100/70 flex flex-col overflow-y-auto max-h-[75vh]">
                  {/* Preview Toolbar */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 shrink-0">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-zinc-800">Live Email Preview</span>
                    </div>

                    <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-zinc-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                        title="Desktop Preview"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                        title="Mobile Device Preview"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rendered Mockup Container */}
                  <div className={`mx-auto w-full transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-xs' : 'max-w-md'}`}>
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden text-xs">
                      {/* Email Client Simulated Header */}
                      <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-200 space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                          <span>DARI: <strong>1s Labs &lt;info@1slabs.my.id&gt;</strong></span>
                          <span>Baru saja</span>
                        </div>
                        <div className="text-zinc-700 truncate">
                          KEPADA: <span className="text-zinc-900 font-semibold">contact@bisnis-contoh.com</span>
                        </div>
                        <div className="text-zinc-900 font-bold truncate pt-0.5">
                          SUBJECT: {campaignSubject || '(Subject belum diisi)'}
                        </div>
                      </div>

                      {/* Official 1sLabs Branded Template Header */}
                      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
                        <img
                          src="https://1slabs.my.id/logo-1slabs.png"
                          alt="1sLabs Official"
                          className="h-7 w-auto object-contain"
                          onError={(e: any) => {
                            e.target.src = 'https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png';
                          }}
                        />
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-semibold uppercase">
                          {ctaBadgeText}
                        </span>
                      </div>

                      {/* Rendered Email Content */}
                      <div
                        className="p-5 text-zinc-900 prose prose-sm max-w-none text-xs leading-relaxed space-y-3"
                        dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                      />

                      {/* Official CTA Button Simulation */}
                      <div className="px-5 pb-5 pt-1">
                        <a
                          href="#cta-preview"
                          onClick={e => e.preventDefault()}
                          className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold text-xs shadow-xs text-center"
                        >
                          {ctaButtonText}
                        </a>
                      </div>

                      {/* Official 1sLabs Footer Simulation */}
                      <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-100 text-center text-zinc-500 text-[10px] space-y-1">
                        <p className="font-bold text-zinc-800">1sLabs &bull; Software Engineering & Cloud Solutions</p>
                        <p>Bandung, Jawa Barat, Indonesia &bull; WhatsApp: +62 851-5629-6580</p>
                        <p className="text-zinc-400 pt-1">
                          {isEnglishTemplate ? (
                            <>You received this email because your business contact is publicly listed. <a href="#unsub" className="underline text-zinc-500">Unsubscribe</a></>
                          ) : (
                            <>Anda menerima email ini karena kontak bisnis publik Anda terdaftar. <a href="#unsub" className="underline text-zinc-500">Berhenti Berlangganan</a></>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: STEP 2 (TARGET COMPANY SELECTION WITH ANTI-DOUBLE PROTECTION) */}
            {createStep === 2 && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[75vh]">
                {/* Information Card & Quota Indicator */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Pilih Bisnis Target Pengiriman ({selectedCompanyIds.size} dipilih)</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Hanya menampilkan bisnis yang memiliki kontak email valid. Terdapat penanda status bisnis yang sudah pernah dihubungi.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectOnlyUncontacted}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Pilih yang Belum Dihubungi
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Pilih Semua ({candidates.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-500 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Batalkan
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Scope Filter */}
                    <div className="flex rounded-xl bg-zinc-100 p-0.5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setCandidateFilterScope('all')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          candidateFilterScope === 'all' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-600'
                        }`}
                      >
                        Semua ({candidates.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCandidateFilterScope('indonesia')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          candidateFilterScope === 'indonesia' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-600'
                        }`}
                      >
                        Indonesia UMKM
                      </button>
                      <button
                        type="button"
                        onClick={() => setCandidateFilterScope('international')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          candidateFilterScope === 'international' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-600'
                        }`}
                      >
                        Internasional
                      </button>
                    </div>

                    {/* Status Filter */}
                    <select
                      value={candidateFilterStatus}
                      onChange={e => setCandidateFilterStatus(e.target.value as any)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none font-medium cursor-pointer"
                    >
                      <option value="uncontacted">🟢 Belum Pernah Dihubungi (Rekomendasi)</option>
                      <option value="all">Semua Status Kontak</option>
                      <option value="contacted">🟡 Sudah Pernah Dihubungi</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama bisnis atau kota..."
                      value={candidateSearch}
                      onChange={e => setCandidateSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-56 font-mono"
                    />
                  </div>
                </div>

                {/* Candidate Selection Table */}
                {isLoadingCandidates ? (
                  <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-900 mb-2" />
                    Memuat daftar bisnis yang siap dihubungi...
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    Tidak ada bisnis yang cocok dengan kriteria filter saat ini.
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
                          <th className="py-2.5 px-3 w-8">
                            <input
                              type="checkbox"
                              checked={candidates.length > 0 && candidates.every(c => selectedCompanyIds.has(c.id))}
                              onChange={e => {
                                if (e.target.checked) {
                                  handleSelectAllFiltered();
                                } else {
                                  handleClearSelection();
                                }
                              }}
                              className="rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-3 font-semibold">Status Hubungi</th>
                          <th className="py-2.5 px-3 font-semibold">Nama Bisnis & Skala</th>
                          <th className="py-2.5 px-3 font-semibold">Alamat Email Penerima</th>
                          <th className="py-2.5 px-3 font-semibold">Kontak Person</th>
                          <th className="py-2.5 px-3 font-semibold">Lokasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {candidates.map(comp => {
                          const isSelected = selectedCompanyIds.has(comp.id);
                          const isContacted = comp.contacted_times > 0 || comp.email_sent_count > 0;
                          const effectiveEmail = comp.email || comp.contact_person_email;

                          return (
                            <tr
                              key={comp.id}
                              onClick={() => toggleSelectCompany(comp.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-50/60' : 'hover:bg-zinc-50'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectCompany(comp.id)}
                                  className="rounded text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                                />
                              </td>

                              <td className="py-3 px-3 whitespace-nowrap">
                                {isContacted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Sudah Dihubungi ({comp.contacted_times || comp.email_sent_count}x)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Belum Dihubungi</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                                  <span>{comp.name}</span>
                                  {comp.is_international ? (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono">
                                      {comp.country}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  {comp.business_scale || 'Small Business'} &bull; {comp.category || 'Bisnis Lokal'}
                                </div>
                              </td>

                              <td className="py-3 px-3 font-mono text-[11px] text-zinc-900 font-medium">
                                {effectiveEmail}
                              </td>

                              <td className="py-3 px-3">
                                {comp.contact_person_name ? (
                                  <div>
                                    <span className="font-medium text-zinc-900">{comp.contact_person_name}</span>
                                    {comp.contact_person_position && (
                                      <span className="text-zinc-400 text-[10px] block font-mono">
                                        {comp.contact_person_position}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-zinc-400 italic text-[11px]">Tim Pengelola</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-zinc-500 whitespace-nowrap">
                                <span>{comp.city || '-'}</span>
                                {comp.country && comp.country !== 'Indonesia' ? `, ${comp.country}` : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
              {createStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingCampaign(null);
                      setIsResendMode(false);
                    }}
                    className="px-4 py-2 border border-zinc-200 text-xs font-semibold text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendTest()}
                      disabled={isSendingTest}
                      className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Email ke Saya</span>
                    </button>

                    {editingCampaign && (
                      <button
                        type="button"
                        disabled={isSubmitting || selectedCompanyIds.size === 0}
                        onClick={() => handleSaveCampaign(false)}
                        className="px-4 py-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        Simpan Perubahan Draft
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCreateStep(2)}
                      className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Lanjut: Pilih & Edit Penerima ({selectedCompanyIds.size})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCreateStep(1)}
                    className="px-4 py-2 border border-zinc-200 text-xs font-semibold text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>&larr; Kembali ke Desain Pesan</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting || selectedCompanyIds.size === 0}
                      onClick={() => handleSaveCampaign(false)}
                      className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      {editingCampaign ? 'Simpan Perubahan Draft' : 'Simpan sebagai Draft'}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting || selectedCompanyIds.size === 0}
                      onClick={() => handleSaveCampaign(true)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{editingCampaign ? (isResendMode ? 'Simpan & Kirim Ulang Sekarang' : 'Simpan & Mulai Kirim') : 'Siapkan & Mulai Kirim'} ({selectedCompanyIds.size} Bisnis)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION START MODAL (NO AMBIGUITY BEFORE SENDING) */}
      {confirmSendCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-zinc-900">Konfirmasi Pengiriman Campaign</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Harap tinjau target sebelum pesan email resmi dikirimkan.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setConfirmSendCampaign(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">Nama Campaign:</span>
                <span className="font-semibold text-zinc-900">{confirmSendCampaign.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">Subject Pesan:</span>
                <span className="font-mono text-zinc-900 truncate max-w-[240px]">{confirmSendCampaign.subject}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">Target Penerima:</span>
                <span className="font-bold text-emerald-700">
                  {confirmSelectedRecipientIds ? confirmSelectedRecipientIds.length : confirmSendCampaign.total_recipients} Bisnis
                </span>
              </div>
              {quota && (
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Sisa Kuota Aman Hari Ini:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {quota.remaining_quota} / {quota.max_limit} email
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Sistem secara otomatis memvalidasi duplikasi email dan memeriksa batas maksimal 100 email/hari untuk menjaga reputasi pengirim 1sLabs.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendCampaign(null)}
                className="px-4 py-2 border border-zinc-200 text-xs font-semibold text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isStartingCampaign}
                onClick={handleConfirmStart}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isStartingCampaign ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirimkan...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-emerald-400" />
                    <span>Konfirmasi & Kirim Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECIPIENTS VIEW MODAL */}
      {viewingRecipientsCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl p-6 shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex justify-between items-start pb-3 border-b border-zinc-200">
              <div>
                <h4 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-700" />
                  <span>Daftar Penerima: {viewingRecipientsCampaign.name}</span>
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Total {campaignRecipients.length} penerima terdaftar dalam campaign ini.
                </p>
              </div>
              <button
                onClick={() => setViewingRecipientsCampaign(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {isLoadingRecipients ? (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-900 mb-2" />
                  Memuat daftar penerima...
                </div>
              ) : campaignRecipients.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Belum ada penerima terdaftar.
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
                        <th className="py-2.5 px-3 font-semibold">Nama Bisnis</th>
                        <th className="py-2.5 px-3 font-semibold">Penerima & Email</th>
                        <th className="py-2.5 px-3 font-semibold">Lokasi</th>
                        <th className="py-2.5 px-3 font-semibold">Status Kirim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {campaignRecipients.map(r => (
                        <tr key={r.id} className="hover:bg-zinc-50">
                          <td className="py-2.5 px-3 font-semibold text-zinc-900">
                            {r.comp_name || r.company_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            <div className="text-zinc-900">{r.recipient_email}</div>
                            {r.recipient_name && <div className="text-zinc-400 text-[10px]">{r.recipient_name}</div>}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500">
                            {r.city || '-'}{r.country && r.country !== 'Indonesia' ? `, ${r.country}` : ''}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {r.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Terkirim
                              </span>
                            ) : r.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium">
                                <AlertCircle className="w-3 h-3" /> Gagal
                              </span>
                            ) : r.status === 'skipped' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium" title={r.error_message || 'Dilewati untuk mencegah pesan ganda'}>
                                Dilewati (Anti-Double)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-medium">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setViewingRecipientsCampaign(null)}
                className="px-4 py-2 border border-zinc-200 text-xs font-semibold text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SINGLE SENT EMAIL LOG BODY MODAL */}
      {viewingLogBody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex justify-between items-start pb-3 border-b border-zinc-200">
              <div>
                <h4 className="text-base font-bold text-zinc-900">Salinan Email Terkirim</h4>
                <div className="text-xs text-zinc-500 font-mono mt-1 space-y-0.5">
                  <div>Kepada: <strong className="text-zinc-900">{viewingLogBody.recipient_email}</strong> ({viewingLogBody.recipient_name || viewingLogBody.company_name})</div>
                  <div>Subject: <strong className="text-zinc-900">{viewingLogBody.subject}</strong></div>
                  <div>Dikirim pada: {new Date(viewingLogBody.sent_at).toLocaleString('id-ID')} WIB</div>
                </div>
              </div>
              <button
                onClick={() => setViewingLogBody(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {viewingLogBody.body_html ? (
                <div
                  className="p-6 bg-zinc-50/80 rounded-2xl border border-zinc-200 prose prose-sm max-w-none text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: viewingLogBody.body_html }}
                />
              ) : (
                <div className="p-6 bg-zinc-50 rounded-2xl text-xs text-zinc-500 font-mono">
                  Pratinjau HTML lengkap tidak tersimpan untuk email lama ini.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setViewingLogBody(null)}
                className="px-4 py-2 border border-zinc-200 text-xs font-semibold text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-start mb-3 pb-3 border-b border-zinc-200">
              <div>
                <h4 className="text-base font-bold text-zinc-900">Preview Pesan Email</h4>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                  Subject: <strong className="text-zinc-900">{previewCampaign.subject}</strong>
                </div>
              </div>
              <button
                onClick={() => setPreviewCampaign(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-xs prose prose-sm max-w-none text-xs leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: previewCampaign.body_html
                  .replace(/{{business_name}}/g, 'Armor Kopi Bandung')
                  .replace(/{{company_name}}/g, 'Armor Kopi Bandung')
                  .replace(/{{contact_name}}/g, 'Bpk. Dzikri Rabbani')
                  .replace(/{{city}}/g, 'Bandung')
                  .replace(/{{country}}/g, 'Indonesia')
                  .replace(/{{unsubscribe_url}}/g, '#')
              }}
            />

            <div className="flex justify-end pt-4 border-t border-zinc-200 mt-4">
              <button
                onClick={() => setPreviewCampaign(null)}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
