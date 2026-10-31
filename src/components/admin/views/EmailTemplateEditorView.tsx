import React, { useEffect, useState } from 'react';
import {
  Mail,
  Send,
  Eye,
  Check,
  RefreshCw,
  Smartphone,
  Monitor,
  Code,
  Sparkles,
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api, EmailTemplateItem } from '../../../services/api';

export const EmailTemplateEditorView: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('customer_verify_email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Test email state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('dzikri@1slabs.my.id');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getEmailTemplates();
      if (res.success && res.templates) {
        setTemplates(res.templates);
        const current = res.templates.find((t: any) => t.template_key === selectedKey) || res.templates[0];
        if (current) {
          loadTemplateIntoForm(current);
        }
      }
    } catch (err) {
      console.error('Failed to load email templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const loadTemplateIntoForm = (tmpl: EmailTemplateItem) => {
    setSelectedKey(tmpl.template_key);
    setSubject(tmpl.subject || '');
    setHeading(tmpl.heading || '');
    setBodyText((tmpl as any).body_html || tmpl.body_text || '');
    setButtonText(tmpl.button_text || '');
    setButtonUrl(tmpl.button_url || '');
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedKey(key);
    const tmpl = templates.find((t) => t.template_key === key);
    if (tmpl) {
      loadTemplateIntoForm(tmpl);
    }
  };

  const insertVariable = (varName: string) => {
    setBodyText((prev) => `${prev} {{${varName}}}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.admin.updateEmailTemplate(selectedKey, {
        subject: subject.trim(),
        heading: heading.trim(),
        body_html: bodyText.trim(),
        body_text: bodyText.trim(),
        button_text: buttonText.trim(),
        button_url: buttonUrl.trim()
      } as any);

      if (res.success) {
        alert(res.message || 'Template email berhasil disimpan.');
        await fetchTemplates();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan template email.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Kembalikan template ini ke pengaturan bawaan awal? Perubahan kustom akan dihapus.')) {
      return;
    }
    try {
      const res = await api.admin.resetEmailTemplate(selectedKey);
      alert(res.message || 'Template berhasil direset ke default.');
      await fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Gagal mereset template.');
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) {
      alert('Alamat email tujuan pengujian wajib diisi.');
      return;
    }

    setSendingTest(true);
    try {
      const res = await api.admin.sendTestEmail(testEmailAddress.trim(), selectedKey);
      alert(res.message || 'Email uji coba berhasil dikirim!');
      setShowTestModal(false);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim email uji coba.');
    } finally {
      setSendingTest(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.template_key === selectedKey);

  // Render dummy live preview
  const previewHtmlBody = bodyText
    .replace(/\{\{customer_name\}\}/g, 'Kim Holiday Travel')
    .replace(/\{\{customer_email\}\}/g, 'kimholidaytravel1@gmail.com')
    .replace(/\{\{order_number\}\}/g, 'ORD-202610-8B9A1')
    .replace(/\{\{invoice_number\}\}/g, 'INV-202610-B7ED33')
    .replace(/\{\{invoice_total\}\}/g, 'Rp832.500')
    .replace(/\{\{payment_url\}\}/g, 'https://1slabs.my.id/portal')
    .replace(/\{\{portal_url\}\}/g, 'https://1slabs.my.id/portal')
    .replace(/\{\{service_name\}\}/g, 'Business Cloud Hosting (Annual)')
    .replace(/\{\{domain_name\}\}/g, 'kimholidaytravel.id')
    .replace(/\{\{service_code\}\}/g, 'SRV-202610-KH01')
    .replace(/\{\{server_ip\}\}/g, '103.119.237.132')
    .replace(/\{\{nameservers\}\}/g, 'ns1.1slabs.my.id, ns2.1slabs.my.id')
    .replace(/\{\{hosting_expiration\}\}/g, '30 Oktober 2027')
    .replace(/\{\{days_remaining\}\}/g, '365')
    .replace(/\{\{admin_url\}\}/g, 'https://1slabs.my.id/admin')
    .replace(/\{\{error_message\}\}/g, 'None (Provisioning Success)')
    .replace(/\{\{verification_url\}\}/g, 'https://1slabs.my.id/verify-email?token=verified');

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
                Editor Template Email & Pratinjau Visual (Brevo SMTP)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Kustomisasi teks, subjek, tombol CTA, dan variabel dinamis seluruh 12 notifikasi sistem 1sLabs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Email Tes</span>
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
            title="Kembalikan ke template awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>
        </div>
      </div>

      {/* Template Selector Grid */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
        <label className="block text-xs font-bold text-zinc-700 mb-2">Pilih Template Email ({templates.length} Template Tersedia):</label>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {templates.map((tmpl) => (
            <button
              key={tmpl.template_key}
              onClick={() => handleSelectTemplate(tmpl.template_key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                selectedKey === tmpl.template_key
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}
            >
              <span>{tmpl.name}</span>
              {(tmpl as any).is_customized && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Live Visual Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Editor Form */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">
              Konfigurasi Konten & Variabel
            </h3>
            <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
              {selectedKey}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Subjek Email (Subject Line) *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Judul Heading Email</label>
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700">Isi Pesan (Body HTML / Teks) *</label>
                <span className="text-[10px] text-zinc-400">Gunakan tag &lt;p&gt;, &lt;strong&gt;, dsb.</span>
              </div>
              <textarea
                rows={6}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 leading-relaxed"
              />
            </div>

            {/* Variable Insertion Pills */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Variabel Dinamis Tersedia (Klik untuk Menyisipkan):</label>
              <div className="flex flex-wrap gap-1.5">
                {(selectedTemplate?.variables || ['customer_name', 'customer_email', 'invoice_number', 'order_number', 'portal_url']).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono cursor-pointer border border-zinc-200 transition-colors"
                  >
                    + &#123;&#123;{v}&#125;&#125;
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Teks Tombol Aksi (CTA)</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Buka Portal"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Tautan Tombol (URL)</label>
                <input
                  type="text"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="{{portal_url}}"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Simpan Perubahan Template</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Email Simulation Preview */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              Pratinjau Visual Email (Live Sandbox)
            </h3>

            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-medium ${
                  previewDevice === 'desktop' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                }`}
                title="Desktop view"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-medium ${
                  previewDevice === 'mobile' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                }`}
                title="Mobile view"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Email Preview Frame */}
          <div className={`mx-auto bg-zinc-100 p-4 sm:p-6 rounded-2xl transition-all ${
            previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'
          }`}>
            <div className="bg-white rounded-2xl shadow-md border border-zinc-200/80 p-6 space-y-5">
              {/* Header inside email */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <img
                  src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                  alt="1sLabs"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase bg-zinc-100 px-2 py-0.5 rounded">
                  Pemberitahuan Sah
                </span>
              </div>

              {/* Subject preview */}
              <div className="text-xs font-bold text-zinc-900">
                {subject || 'Subjek email...'}
              </div>

              {/* Heading */}
              {heading && (
                <h4 className="text-base font-black text-zinc-900 tracking-tight">
                  {heading}
                </h4>
              )}

              {/* Rendered HTML body */}
              <div
                className="text-xs text-zinc-700 space-y-2 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: previewHtmlBody }}
              />

              {/* CTA Button */}
              {buttonText && (
                <div className="pt-2">
                  <span className="inline-block px-5 py-2.5 bg-zinc-900 text-white font-semibold text-xs rounded-xl shadow-xs text-center cursor-default">
                    {buttonText}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 space-y-1">
                <p>Email ini dikirimkan otomatis dari platform resmi 1sLabs Hosting.</p>
                <p>&copy; 2026 1sLabs Technology &bull; info@1slabs.my.id &bull; Bandung, Indonesia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-zinc-900">Kirim Email Uji Coba</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kirim ke Alamat Email:
                </label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="dzikri@1slabs.my.id"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Email uji coba akan dikirim melalui SMTP Relay Brevo (info@1slabs.my.id).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl cursor-pointer"
                >
                  {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Kirim Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
