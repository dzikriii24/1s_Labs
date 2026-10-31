import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Send,
  Printer,
  Download,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  DollarSign,
  User,
  Calendar,
  Eye,
  Check,
  ExternalLink,
  Edit,
  ShieldCheck,
  Layers,
  ArrowRight,
  FolderArchive,
  Upload
} from 'lucide-react';
import { api, InvoiceLineItem } from '../../../services/api';
import { PaymentProofsVaultView } from './PaymentProofsVaultView';

interface InvoiceManagementViewProps {
  onNavigate?: (tab: any) => void;
}

export const InvoiceManagementView: React.FC<InvoiceManagementViewProps> = ({ onNavigate }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Vault Picker & Inline Upload State
  const [pickerTarget, setPickerTarget] = useState<'global' | number | null>(null);
  const [uploadingInline, setUploadingInline] = useState(false);

  // Form Fields
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [domainName, setDomainName] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('1 Tahun');
  const [invoiceStatus, setInvoiceStatus] = useState('paid');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('Pembayaran resmi via QRIS / Transfer Bank 1sLabs. Harap simpan bukti pembayaran ini.');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');

  // Line Items with Sections
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      section: 'Layanan Infrastruktur & Cloud Hosting',
      name: 'Starter Cloud Hosting 1sLabs',
      description: "Penyimpanan NVMe SSD, Unlimited Bandwidth, AutoSSL Let's Encrypt & Web Server LiteSpeed",
      qty: 1,
      unit_price: 832500,
      total_price: 832500,
      proof_url: ''
    }
  ]);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [dpAmount, setDpAmount] = useState<number>(0);

  // Preview / Inspector Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getInvoices(statusFilter !== 'all' ? { status: statusFilter } : undefined);
      if (res.success && res.invoices) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.admin.getCustomers();
      if (res.success && res.customers) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.warn('Could not fetch customers list', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [statusFilter]);

  // Quick fill customer from dropdown
  const handleSelectCustomer = (idStr: string) => {
    if (!idStr) {
      setSelectedCustomerId('');
      return;
    }
    const id = parseInt(idStr, 10);
    setSelectedCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setCustomerName(c.name || '');
      setCustomerEmail(c.email || '');
      setCustomerPhone(c.phone || '');
      setCustomerAddress(c.address || 'Bandung / Jawa Barat, Indonesia');
    }
  };

  const handleAddItem = (presetSection?: string) => {
    setItems((prev) => [
      ...prev,
      {
        section: presetSection || (prev.length > 0 ? prev[prev.length - 1].section : 'Layanan & Jasa'),
        name: '',
        description: '',
        qty: 1,
        unit_price: 0,
        total_price: 0,
        proof_url: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'qty' || field === 'quantity' || field === 'unit_price') {
        const qty = field === 'qty' || field === 'quantity' ? Number(value) : (item.qty || item.quantity || 1);
        const price = field === 'unit_price' ? Number(value) : item.unit_price;
        item.total_price = Math.max(0, qty * price);
      }
      updated[index] = item;
      return updated;
    });
  };

  // Inline upload handler to upload proof and auto-fill URL
  const handleInlineUpload = async (files: FileList | null, target: 'global' | number) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingInline(true);
    try {
      const res = await api.admin.uploadProofs([file]);
      if (res.success && res.uploaded && res.uploaded.length > 0) {
        const uploadedUrl = res.uploaded[0].url;
        if (target === 'global') {
          setPaymentProofUrl(uploadedUrl);
        } else if (typeof target === 'number') {
          handleItemChange(target, 'proof_url', uploadedUrl);
        }
        alert(`Berkas "${file.name}" berhasil diunggah ke brankas dan tautan langsung terpasang!`);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah berkas bukti.');
    } finally {
      setUploadingInline(false);
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const grandTotal = Math.max(0, subtotal - Number(discountAmount) + Number(taxAmount));
  const balanceDue = dpAmount > 0 ? Math.max(0, grandTotal - Number(dpAmount)) : 0;

  // Open Create Modal
  const openCreateModal = () => {
    setSelectedInvoice(null);
    const yr = new Date().getFullYear();
    const mo = String(new Date().getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setCustomInvoiceNumber(`INV-${yr}${mo}-${rand}`);
    setEditingInvoiceId(null);
    setSelectedCustomerId('');
    setCustomerEmail('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDomainName('');
    setBillingPeriod('1 Tahun');
    setInvoiceStatus('paid');
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setNotes('Pembayaran resmi via QRIS / Transfer Bank 1sLabs. Harap simpan bukti transfer ini.');
    setPaymentProofUrl('');
    setDiscountAmount(0);
    setTaxAmount(0);
    setDpAmount(0);
    setItems([
      {
        section: 'Layanan Infrastruktur & Cloud Hosting',
        name: 'Starter Cloud Hosting 1sLabs',
        description: "Penyimpanan NVMe SSD, Unlimited Bandwidth, AutoSSL Let's Encrypt & Web Server LiteSpeed",
        qty: 1,
        unit_price: 832500,
        total_price: 832500,
        proof_url: ''
      }
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (inv: any) => {
    setSelectedInvoice(null); // Tutup modal preview agar tidak menimpa modal edit
    setEditingInvoiceId(inv.id);
    setCustomInvoiceNumber(inv.invoice_number || `INV-${inv.id}`);
    setSelectedCustomerId(inv.user_id || '');
    setCustomerEmail(inv.customer_email || inv.user_email || '');
    setCustomerName(inv.customer_name || inv.user_name || '');
    setCustomerPhone(inv.customer_phone || inv.phone || '');
    setCustomerAddress(inv.customer_address || '');
    setDomainName(inv.domain || '');
    setBillingPeriod(inv.period || '1 Tahun');
    setInvoiceStatus(inv.status || 'paid');
    setDueDate(inv.due_date ? inv.due_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setNotes(inv.notes || '');
    setDiscountAmount(parseFloat(inv.discount_amount || '0') || 0);
    setTaxAmount(parseFloat(inv.tax_amount || '0') || 0);

    // Parse items_json
    let parsedItems: any[] = [];
    let parsedProof = '';
    let parsedDp = 0;
    if (inv.items_json) {
      try {
        const raw = typeof inv.items_json === 'string' ? JSON.parse(inv.items_json) : inv.items_json;
        if (Array.isArray(raw)) {
          parsedItems = raw;
        } else if (raw && typeof raw === 'object') {
          parsedItems = raw.items || [];
          parsedProof = raw.payment_proof_url || '';
          parsedDp = raw.dp_amount || 0;
        }
      } catch (e) {
        console.warn('Could not parse items_json', e);
      }
    }

    if (parsedItems.length > 0) {
      setItems(
        parsedItems.map((it) => ({
          section: it.section || it.category || 'Rincian Layanan',
          name: it.name || it.item_name || 'Layanan 1sLabs',
          description: it.description || '',
          qty: it.qty || it.quantity || 1,
          unit_price: it.unit_price || it.unitPrice || 0,
          total_price: it.total_price || it.totalPrice || 0,
          proof_url: it.proof_url || it.payment_proof_url || it.proofUrl || ''
        }))
      );
    } else {
      setItems([
        {
          section: 'Layanan Infrastruktur & Cloud Hosting',
          name: inv.plan_name || 'Layanan Cloud Hosting',
          description: 'Paket langganan hosting resmi 1sLabs',
          qty: 1,
          unit_price: parseFloat(inv.total_amount || inv.amount || 0),
          total_price: parseFloat(inv.total_amount || inv.amount || 0),
          proof_url: ''
        }
      ]);
    }

    setDpAmount(parsedDp);
    setPaymentProofUrl(parsedProof || inv.payment_proof_image || '');
    setIsModalOpen(true);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim()) {
      alert('Email pelanggan wajib diisi.');
      return;
    }
    if (items.length === 0 || items.some((i) => !i.name.trim())) {
      alert('Harap lengkapi nama setiap item tagihan.');
      return;
    }

    setSubmitting(true);
    const targetInvoiceNo = customInvoiceNumber.trim().toUpperCase();
    const payload = {
      invoiceNumber: targetInvoiceNo,
      invoice_number: targetInvoiceNo,
      customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : undefined,
      customerName: customerName.trim() || 'Pelanggan 1sLabs',
      customer_name: customerName.trim() || 'Pelanggan 1sLabs',
      customerEmail: customerEmail.trim(),
      customer_email: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customer_phone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customer_address: customerAddress.trim(),
      dueDate,
      due_date: dueDate,
      domain: domainName.trim() || undefined,
      period: billingPeriod.trim() || '1 Tahun',
      status: invoiceStatus,
      items: items.map((i) => ({
        section: i.section || 'Layanan & Jasa',
        category: i.category || i.section || 'other',
        name: i.name.trim(),
        item_name: i.name.trim(),
        description: (i.description || '').trim(),
        qty: i.qty || 1,
        quantity: i.qty || 1,
        unit_price: Number(i.unit_price),
        total_price: Number(i.total_price),
        proof_url: (i.proof_url || i.payment_proof_url || '').trim() || undefined
      })),
      discount: Number(discountAmount),
      discount_amount: Number(discountAmount),
      tax: Number(taxAmount),
      tax_amount: Number(taxAmount),
      dpAmount: Number(dpAmount),
      dp_amount: Number(dpAmount),
      balanceDue: Number(balanceDue),
      balance_due: Number(balanceDue),
      paymentProofUrl: paymentProofUrl.trim() || undefined,
      payment_proof_url: paymentProofUrl.trim() || undefined,
      notes: notes.trim()
    };

    try {
      if (editingInvoiceId) {
        const res = await api.admin.updateInvoice(editingInvoiceId, payload);
        alert(res.message || 'Invoice berhasil diperbarui.');
      } else {
        const res = await api.admin.createInvoice(payload);
        alert(res.message || 'Invoice baru berhasil diterbitkan.');
      }

      setIsModalOpen(false);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm('Tandai invoice ini sebagai Lunas (Paid)? Status layanan terkait akan disinkronkan.')) {
      return;
    }
    try {
      const res = await api.admin.updateInvoiceStatus(id, 'paid');
      alert(res.message || 'Status invoice diperbarui menjadi Paid.');
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
      }
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status invoice.');
    }
  };

  const handleSendEmail = async (id: number) => {
    setSendingEmail(true);
    try {
      const res = await api.admin.sendInvoiceEmail(id);
      alert(res.message || 'Invoice resmi berhasil dikirimkan via email!');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim email invoice.');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatRupiah = (val?: any) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (!num && num !== 0) return 'Rp0';
    return `Rp${Math.round(num).toLocaleString('id-ID')}`;
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
      (inv.customer_email && inv.customer_email.toLowerCase().includes(q)) ||
      (inv.user_name && inv.user_name.toLowerCase().includes(q)) ||
      (inv.user_email && inv.user_email.toLowerCase().includes(q)) ||
      (inv.domain && inv.domain.toLowerCase().includes(q))
    );
  });

  // Extract sections for modal preview
  const parseInvoiceItems = (inv: any) => {
    if (!inv.items_json) return null;
    try {
      const raw = typeof inv.items_json === 'string' ? JSON.parse(inv.items_json) : inv.items_json;
      if (Array.isArray(raw)) return { items: raw };
      return raw;
    } catch (e) {
      return null;
    }
  };

  // Print Isolation & Handlers
  const handlePrintInvoice = () => {
    document.body.classList.add('printing-invoice-modal');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-invoice-modal');
      }, 1000);
    }, 50);
  };

  useEffect(() => {
    const onBefore = () => {
      if (selectedInvoice) {
        document.body.classList.add('printing-invoice-modal');
      }
    };
    const onAfter = () => {
      document.body.classList.remove('printing-invoice-modal');
    };
    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint', onAfter);
    return () => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint', onAfter);
      document.body.classList.remove('printing-invoice-modal');
    };
  }, [selectedInvoice]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="invoice-management-bg print:hidden bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Manajemen Faktur & Tagihan (Invoice Management)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Penerbitan tagihan multi-layanan, kalkulasi DP/Pelunasan, manajemen link bukti transfer, dan cetak faktur A4 resmi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('proof-vault')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Buka Brankas Berkas Bukti Pembayaran"
            >
              <FolderArchive className="w-3.5 h-3.5 text-purple-600" />
              Brankas Bukti
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Invoice Baru
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Refresh invoice"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="invoice-management-bg print:hidden bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor invoice (INV-...), nama pelanggan, email, domain..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'paid', 'unpaid', 'pending', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {st === 'all' ? 'Semua Status' : st === 'paid' ? 'Lunas (Paid)' : st === 'unpaid' ? 'Belum Lunas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="invoice-management-bg print:hidden bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Nomor Invoice</th>
                <th className="py-3.5 px-4 font-semibold">Penerima Tagihan</th>
                <th className="py-3.5 px-4 font-semibold">Total Tagihan</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Jatuh Tempo</th>
                <th className="py-3.5 px-4 font-semibold">Tanggal Terbit</th>
                <th className="py-3.5 px-5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                    Memuat daftar faktur invoice...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-sans">
                    Tidak ditemukan invoice yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invoiceTotal = inv.total_amount || inv.amount;
                  const parsed = parseInvoiceItems(inv);
                  const isKim = inv.invoice_number === 'INV-202610-KIMHOLIDAY';

                  return (
                    <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-mono text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                          {inv.invoice_number || `INV-${inv.id}`}
                          {isKim && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              Verified
                            </span>
                          )}
                        </div>
                        {inv.domain && (
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {inv.domain}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-900 font-bold">
                          {inv.user_name || inv.customer_name || 'Pelanggan 1sLabs'}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {inv.user_email || inv.customer_email}
                        </div>
                        {(inv.customer_phone || inv.phone) && (
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                            WA: {inv.customer_phone || inv.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-zinc-900">
                          {formatRupiah(invoiceTotal)}
                        </div>
                        {parsed?.dp_amount > 0 && (
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                            DP: {formatRupiah(parsed.dp_amount)} (Lunas)
                          </div>
                        )}
                        {parsed?.balance_due > 0 && (
                          <div className="text-[10px] text-amber-700 font-mono">
                            Sisa: {formatRupiah(parsed.balance_due)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lunas (Paid)
                          </span>
                        ) : inv.status === 'unpaid' || inv.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Belum Dibayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" /> Dibatalkan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-600">
                        {inv.due_date
                          ? new Date(inv.due_date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">
                        {inv.created_at
                          ? new Date(inv.created_at).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-colors text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                            title="Pratinjau Cetak / Faktur Resmi"
                          >
                            <Eye className="w-3 h-3" />
                            Lihat
                          </button>
                          <button
                            onClick={() => openEditModal(inv)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
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
      </div>

      {/* Create / Edit Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {editingInvoiceId ? 'Edit Faktur Tagihan (Invoice)' : 'Penerbitan Faktur Tagihan Baru'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Konfigurasi rincian layanan multi-section, kalkulasi DP/pelunasan, dan tautan bukti bayar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              {/* Editable Invoice Number Box */}
              <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-900">
                    Nomor Faktur / Invoice Number (Dapat Diedit Manual) *
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Format penomoran faktur resmi, contoh: <span className="font-mono font-semibold text-purple-700">INV-202610-KIMHOLIDAY</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customInvoiceNumber}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value.toUpperCase())}
                    placeholder="INV-..."
                    required
                    className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-zinc-900 font-mono font-bold text-xs uppercase focus:outline-none focus:ring-1 focus:ring-purple-500 w-56"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const yr = new Date().getFullYear();
                      const mo = String(new Date().getMonth() + 1).padStart(2, '0');
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setCustomInvoiceNumber(`INV-${yr}${mo}-${rand}`);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Auto Gen
                  </button>
                </div>
              </div>

              {/* Quick Customer Selection */}
              {customers.length > 0 && !editingInvoiceId && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Pilih Pelanggan Terdaftar (Quick Fill)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-xs font-medium"
                  >
                    <option value="">-- Pilih dari akun pelanggan yang ada --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) {c.phone ? `— WA: ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Pelanggan / Perusahaan *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Kim Holiday Travel"
                    required
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Pelanggan *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="kimholidaytravel1@gmail.com"
                    required
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nomor WhatsApp / Kontak</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="6285222393611"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Domain Terkait</label>
                  <input
                    type="text"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    placeholder="kimholidaytravel.id"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Status Faktur</label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold"
                  >
                    <option value="paid">Lunas (Paid)</option>
                    <option value="unpaid">Belum Lunas (Unpaid)</option>
                    <option value="cancelled">Dibatalkan (Cancelled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Alamat Pelanggan</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Bandung / Jawa Barat, Indonesia"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>

              {/* Items Management with Section Header */}
              <div className="space-y-3 pt-3 border-t border-zinc-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-mono">
                      Rincian Layanan & Jasa (Itemized Sections)
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Kelompokkan item ke dalam section seperti "Layanan Infrastruktur", "Jasa Pengembangan Web", dll.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem('Layanan Infrastruktur & Cloud Hosting')}
                      className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg font-bold border border-purple-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Section Hosting
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('Jasa Pengembangan & Penyesuaian Website')}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg font-bold border border-zinc-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> + Section Jasa
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-12 sm:col-span-5">
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-0.5">Section / Kategori</label>
                          <input
                            type="text"
                            value={item.section || ''}
                            onChange={(e) => handleItemChange(idx, 'section', e.target.value)}
                            placeholder="Contoh: Jasa Pengembangan Website"
                            className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 font-semibold text-xs"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-7">
                          <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-0.5">Nama Layanan / Pekerjaan *</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            placeholder="Contoh: Pengoptimalan Landing Page"
                            required
                            className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-6">
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            placeholder="Spesifikasi / deskripsi rincian pekerjaan"
                            className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-600 text-xs"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={item.qty || 1}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            placeholder="Qty"
                            className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 font-mono text-center text-xs"
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            placeholder="Harga (Rp)"
                            className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 font-mono text-right text-xs"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Per-Item Payment Proof Link with Vault Picker & Upload */}
                      <div className="pt-2 border-t border-zinc-200/60 flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold whitespace-nowrap">
                          Link Bukti:
                        </span>
                        <input
                          type="text"
                          value={item.proof_url || ''}
                          onChange={(e) => handleItemChange(idx, 'proof_url', e.target.value)}
                          placeholder="https://1slabs.my.id/uploads/proofs/... (Tautan / Link bukti transfer untuk item ini)"
                          className="flex-1 px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-zinc-700 font-mono text-xs placeholder:text-zinc-400"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPickerTarget(idx)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold text-[10px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1"
                            title="Pilih dari Brankas Bukti Pembayaran"
                          >
                            <FolderArchive className="w-3 h-3" />
                            Pilih Vault
                          </button>
                          <label className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-lg font-semibold text-[10px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1">
                            <Upload className={`w-3 h-3 ${uploadingInline ? 'animate-spin' : ''}`} />
                            Upload
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleInlineUpload(e.target.files, idx)}
                            />
                          </label>
                          {item.proof_url && (
                            <a
                              href={`/proof-viewer?url=${encodeURIComponent(item.proof_url)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] whitespace-nowrap hover:bg-emerald-100"
                            >
                              Buka Viewer ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown (DP, Diskon, Bukti Bayar) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Diskon / Potongan (Rp)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Pajak / PPN (Rp)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Uang Muka / DP Dibayar (Rp)
                  </label>
                  <input
                    type="number"
                    value={dpAmount}
                    onChange={(e) => setDpAmount(Number(e.target.value))}
                    placeholder="Contoh: 1600000"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-emerald-700 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Payment Proof Link Input */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">
                  Tautan / Link Bukti Pembayaran Global (Bukti Transfer / QRIS)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={paymentProofUrl}
                    onChange={(e) => setPaymentProofUrl(e.target.value)}
                    placeholder="https://1slabs.my.id/uploads/proofs/proof_...jpg atau URL gambar bukti"
                    className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 text-xs font-mono"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPickerTarget('global')}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Pilih dari Brankas Bukti Pembayaran"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      Pilih Vault
                    </button>
                    <label className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5">
                      <Upload className={`w-3.5 h-3.5 ${uploadingInline ? 'animate-spin' : ''}`} />
                      Upload Bukti
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleInlineUpload(e.target.files, 'global')}
                      />
                    </label>
                    {paymentProofUrl && (
                      <a
                        href={`/proof-viewer?url=${encodeURIComponent(paymentProofUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-zinc-900 text-white font-semibold text-xs inline-flex items-center gap-1 hover:bg-zinc-800 whitespace-nowrap"
                      >
                        Buka Viewer ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Catatan Tambahan Faktur</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruksi pembayaran, rincian termin, dll."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs"
                />
              </div>

              {/* Total Calculation Display Card with Section Breakdown */}
              {(() => {
                const secSums: { [s: string]: number } = {};
                items.forEach((it) => {
                  const sName = it.section || 'Layanan & Jasa';
                  secSums[sName] = (secSums[sName] || 0) + (it.total_price || 0);
                });
                const secEntries = Object.entries(secSums);

                return (
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                    {secEntries.length > 1 && (
                      <div className="space-y-1 pb-2 border-b border-zinc-200">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                          Rincian Subtotal per Section / Kategori:
                        </span>
                        {secEntries.map(([sName, sumVal], idx) => (
                          <div key={idx} className="flex justify-between items-center text-zinc-600">
                            <span>Subtotal {sName}:</span>
                            <span className="font-mono font-semibold text-zinc-800">{formatRupiah(sumVal)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-zinc-600">
                      <span>Total Subtotal Rincian:</span>
                      <span className="font-mono font-semibold">{formatRupiah(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>Diskon / Potongan:</span>
                        <span className="font-mono font-semibold">- {formatRupiah(discountAmount)}</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between items-center text-zinc-600">
                        <span>Pajak (PPN):</span>
                        <span className="font-mono font-semibold">+ {formatRupiah(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-sm font-bold text-zinc-900">
                      <span>Total Tagihan (Grand Total):</span>
                      <span className="font-mono text-base">{formatRupiah(grandTotal)}</span>
                    </div>
                    {dpAmount > 0 && (
                      <>
                        <div className="flex justify-between items-center text-emerald-700 font-semibold">
                          <span>Uang Muka / DP Lunas:</span>
                          <span className="font-mono">{formatRupiah(dpAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-zinc-200 text-base font-extrabold text-zinc-900">
                          <span>Sisa Tagihan (Pelunasan Akhir):</span>
                          <span className="font-mono text-purple-700">{formatRupiah(balanceDue)}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {editingInvoiceId ? 'Simpan Perubahan Invoice' : 'Terbitkan Invoice Resmi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Document / Official Printable Modal (Matching InvoicePage.tsx) */}
      {selectedInvoice && (
        <div className="invoice-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs print:static print:p-0 print:bg-white print:backdrop-none print:z-auto print:block print:inset-auto">
          <div className="invoice-modal-card bg-white border border-zinc-200 rounded-3xl w-full max-w-3xl max-h-[94vh] overflow-y-auto shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 print:animate-none print:max-h-none print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Faktur Resmi 1sLabs: {selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}
                  </h3>
                  <span className="text-[11px] text-zinc-500">Pratinjau cetak resmi dokumen komersial</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Cetak Faktur A4 / Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / Simpan PDF
                </button>
                <a
                  href={`/invoice/${selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  title="Buka Halaman Faktur Resmi di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Halaman Publik ↗
                </a>
                <button
                  onClick={() => openEditModal(selectedInvoice)}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  title="Edit Rincian Faktur"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Printable Surface */}
            <div
              id="invoice-official-sheet"
              className="invoice-sheet-surface p-5 sm:p-7 bg-white border border-zinc-200 rounded-2xl space-y-3.5 text-xs text-zinc-800 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:space-y-3"
            >
              {/* Header: Logo & Company vs Invoice ID */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-3.5 print:pb-2.5">
                <div>
                  <div className="mb-1.5">
                    <img
                      src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                      alt="1sLabs Official Logo"
                      className="h-8 sm:h-9 w-auto object-contain"
                    />
                  </div>
                  <div className="text-[11px] font-medium text-zinc-600">High-Performance Cloud & Software Engineering</div>
                  <div className="text-[11px] text-zinc-500">info@1slabs.my.id &bull; https://1slabs.my.id</div>
                  <div className="text-[11px] text-zinc-500">Bandung, Jawa Barat, Indonesia</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-zinc-900 text-sm sm:text-base">
                    {selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}
                  </div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">
                    Tanggal Terbit:{' '}
                    <span className="font-semibold text-zinc-800">
                      {selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div className="text-zinc-500 text-[11px]">
                    Jatuh Tempo:{' '}
                    <span className="font-semibold text-zinc-800">
                      {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div className="text-zinc-500 text-[11px]">
                    Status Pembayaran:{' '}
                    <span className={`font-bold uppercase ${selectedInvoice.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedInvoice.status === 'paid' ? 'Lunas (Paid)' : 'Belum Lunas'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipient Details & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50/70 p-3 sm:p-3.5 rounded-xl border border-zinc-200 print:bg-white print:border-zinc-300 print:rounded-lg print:p-2.5 print-avoid-break">
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold mb-0.5">
                    Ditagihkan Kepada (Customer):
                  </div>
                  <div className="text-zinc-900 font-bold text-xs sm:text-sm">
                    {selectedInvoice.user_name || selectedInvoice.customer_name || 'Kim Holiday Travel'}
                  </div>
                  <div className="text-zinc-600 font-mono text-[11px]">
                    {selectedInvoice.user_email || selectedInvoice.customer_email}
                  </div>
                  {(selectedInvoice.customer_phone || selectedInvoice.phone) && (
                    <div className="text-zinc-600 text-[11px] mt-0.5 flex items-center space-x-1.5">
                      <span className="font-medium text-emerald-700">WhatsApp:</span>
                      <span className="font-mono">{selectedInvoice.customer_phone || selectedInvoice.phone}</span>
                    </div>
                  )}
                  <div className="text-zinc-500 text-[10px] mt-0.5 font-mono">
                    Status Akun: Terverifikasi Email & WhatsApp
                  </div>
                </div>

                <div className="sm:text-right space-y-0.5 text-xs">
                  <div>
                    <span className="text-zinc-500">Domain Layanan: </span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {selectedInvoice.domain || 'kimholidaytravel.id'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Metode Verifikasi: </span>
                    <span className="font-semibold text-zinc-900">TRANSFER / QRIS</span>
                  </div>
                  {selectedInvoice.period && (
                    <div>
                      <span className="text-zinc-500">Periode Layanan: </span>
                      <span className="font-semibold text-zinc-900">{selectedInvoice.period}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Section Items Table */}
              {(() => {
                const parsed = parseInvoiceItems(selectedInvoice);
                const hasItems = parsed?.items && parsed.items.length > 0;

                // Group by section
                const sectionsMap: { [sec: string]: any[] } = {};
                if (hasItems) {
                  parsed.items.forEach((it: any) => {
                    const sec = it.section || it.category || 'Rincian Layanan & Jasa';
                    if (!sectionsMap[sec]) sectionsMap[sec] = [];
                    sectionsMap[sec].push(it);
                  });
                }

                return hasItems ? (
                  <div className="space-y-3 print:space-y-2">
                    {Object.entries(sectionsMap).map(([sectionTitle, secItems], sIdx) => (
                      <div key={sIdx} className="border border-zinc-200 rounded-xl overflow-hidden print:border-zinc-300 print:rounded-lg">
                        <div className="bg-zinc-50/90 px-3.5 py-1.5 border-b border-zinc-200 flex items-center justify-between">
                          <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 font-mono">
                            {sectionTitle}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {secItems.length} item
                          </span>
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-zinc-200 text-zinc-500 text-[10.5px] bg-white">
                              <th className="py-1.5 px-3.5 font-semibold">Layanan & Spesifikasi</th>
                              <th className="py-1.5 px-2 font-semibold text-center w-12">Qty</th>
                              <th className="py-1.5 px-3 font-semibold text-right w-28">Harga Satuan</th>
                              <th className="py-1.5 px-3.5 font-semibold text-right w-32">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {secItems.map((it: any, iIdx: number) => (
                              <tr key={iIdx} className="hover:bg-zinc-50/50">
                                <td className="py-1.5 px-3.5">
                                  <div className="font-bold text-zinc-900 text-[11.5px] leading-tight">
                                    {it.name || it.item_name}
                                  </div>
                                  {it.description && (
                                    <div className="text-zinc-500 text-[10.5px] mt-0.5 leading-snug">
                                      {it.description}
                                    </div>
                                  )}
                                  {(it.proof_url || it.payment_proof_url || it.proofUrl) && (
                                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-semibold">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                        Bukti Pembayaran
                                      </span>
                                      <a
                                        href={`/proof-viewer?url=${encodeURIComponent(it.proof_url || it.payment_proof_url || it.proofUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                                      >
                                        Lihat Bukti ↗
                                      </a>
                                    </div>
                                  )}
                                </td>
                                <td className="py-1.5 px-2 text-center text-zinc-700 font-mono text-[11px] align-top pt-2">
                                  {it.qty || it.quantity || 1}
                                </td>
                                <td className="py-1.5 px-3 text-right text-zinc-700 font-mono text-[11px] align-top pt-2">
                                  {formatRupiah(it.unit_price || it.unitPrice || 0)}
                                </td>
                                <td className="py-1.5 px-3.5 text-right font-bold text-zinc-900 font-mono text-[11px] align-top pt-2">
                                  {formatRupiah(it.total_price || it.totalPrice || (it.qty || 1) * (it.unit_price || 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-zinc-50 border-t border-zinc-200 font-medium">
                            <tr>
                              <td colSpan={3} className="py-1.5 px-3.5 text-right text-zinc-600 font-semibold text-[11px]">
                                Subtotal {sectionTitle}:
                              </td>
                              <td className="py-1.5 px-3.5 text-right font-bold text-zinc-900 font-mono text-xs">
                                {formatRupiah(
                                  secItems.reduce(
                                    (sum: number, it: any) =>
                                      sum + parseFloat((it.total_price || it.totalPrice || (it.qty || 1) * (it.unit_price || it.unitPrice || 0)).toString()),
                                    0
                                  )
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden print:border-zinc-300 print:rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500 text-[10.5px] bg-zinc-50 print:bg-zinc-100">
                          <th className="py-1.5 px-3.5 font-semibold">Deskripsi Layanan</th>
                          <th className="py-1.5 px-3.5 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-3.5">
                            <div className="font-bold text-zinc-900 text-xs">
                              {selectedInvoice.plan_name || 'Layanan 1sLabs Technology'}
                            </div>
                            <div className="text-zinc-500 text-[10.5px]">
                              Infrastruktur cloud hosting & penyesuaian layanan digital resmi
                            </div>
                          </td>
                          <td className="py-2 px-3.5 text-right font-bold text-zinc-900 font-mono">
                            {formatRupiah(selectedInvoice.total_amount || selectedInvoice.amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Summary & Signatory Section */}
              {(() => {
                const parsed = parseInvoiceItems(selectedInvoice);
                const hasItems = Boolean(parsed?.items && parsed.items.length > 0);
                const sectionsMap: { [sec: string]: any[] } = {};
                if (hasItems && parsed?.items) {
                  parsed.items.forEach((it: any) => {
                    const sec = it.section || it.category || 'Rincian Layanan & Jasa';
                    if (!sectionsMap[sec]) sectionsMap[sec] = [];
                    sectionsMap[sec].push(it);
                  });
                }
                const grand = parseFloat(selectedInvoice.total_amount || selectedInvoice.amount || 0);
                const sub = parseFloat(selectedInvoice.subtotal || grand.toString()) || grand;
                const disc = parseFloat(selectedInvoice.discount_amount || '0') || 0;
                const tax = parseFloat(selectedInvoice.tax_amount || '0') || 0;
                const dp = parsed?.dp_amount || 0;
                const bal = parsed?.balance_due || (dp > 0 ? Math.max(0, grand - dp) : 0);
                const proofUrl = parsed?.payment_proof_url || selectedInvoice.payment_proof_image;

                return (
                  <div className="pt-3 pb-1 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-start gap-4 print:flex-row print:pt-2.5 print-avoid-break">
                    {/* Official Stamp & Proof Link */}
                    <div className="space-y-2 max-w-sm">
                      <div className="flex items-center space-x-2.5 border border-emerald-200 bg-emerald-50/60 p-2.5 rounded-xl print:bg-white print:border-emerald-500 print:rounded-lg">
                        <img
                          src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                          alt="Official Seal 1sLabs"
                          className="w-11 h-11 object-contain rounded-lg flex-shrink-0"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-emerald-900 block text-[11px]">
                            Disahkan Resmi oleh 1sLabs
                          </span>
                          <span className="text-[10px] text-zinc-600 mt-0.5 block leading-snug">
                            Faktur ini sah dan diterbitkan secara digital dengan tanda tangan elektronik terverifikasi.
                          </span>
                        </div>
                      </div>

                      {/* Payment Proof Display */}
                      {proofUrl && (
                        <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-semibold text-zinc-800">Bukti Transfer Terlampir</span>
                          </div>
                          <a
                            href={`/proof-viewer?url=${encodeURIComponent(proofUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                          >
                            Lihat Bukti ↗
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Financial Calculations with Detailed Section Breakdown */}
                    <div className="w-full sm:w-80 space-y-1 text-xs self-end">
                      {hasItems && Object.keys(sectionsMap).length > 1 ? (
                        <div className="space-y-1 pb-1.5 border-b border-zinc-200">
                          <span className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-0.5">
                            Rincian Subtotal per Kategori:
                          </span>
                          {Object.entries(sectionsMap).map(([sName, sItems], idx) => {
                            const sSum = sItems.reduce(
                              (acc: number, it: any) =>
                                acc + parseFloat((it.total_price || it.totalPrice || (it.qty || 1) * (it.unit_price || it.unitPrice || 0)).toString()),
                              0
                            );
                            return (
                              <div key={idx} className="flex justify-between text-zinc-600 text-[11px]">
                                <span>Subtotal {sName}:</span>
                                <span className="font-semibold text-zinc-900 font-mono">{formatRupiah(sSum)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Subtotal Layanan:</span>
                          <span className="font-semibold text-zinc-900 font-mono">{formatRupiah(sub)}</span>
                        </div>
                      )}

                      {disc > 0 && (
                        <div className="flex justify-between text-emerald-700 text-[11px]">
                          <span>Diskon / Potongan:</span>
                          <span className="font-semibold font-mono">- {formatRupiah(disc)}</span>
                        </div>
                      )}
                      {tax > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">PPN (11%):</span>
                          <span className="font-semibold text-zinc-900 font-mono">{formatRupiah(tax)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1.5 border-t border-zinc-200 text-xs font-bold text-zinc-900">
                        <span>Total Nilai Project:</span>
                        <span className="font-mono text-sm">{formatRupiah(grand)}</span>
                      </div>
                      {dp > 0 && (
                        <>
                          <div className="flex justify-between text-emerald-700 font-semibold text-xs">
                            <span>Uang Muka / DP (Lunas):</span>
                            <span className="font-mono">{formatRupiah(dp)}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-zinc-200 text-sm font-extrabold text-zinc-900">
                            <span>Sisa Pelunasan:</span>
                            <span className="text-purple-700 font-mono">{formatRupiah(bal)}</span>
                          </div>
                        </>
                      )}
                      {dp === 0 && (
                        <div className="flex justify-between pt-1.5 border-t border-zinc-200 text-sm font-extrabold text-zinc-900">
                          <span>Total Lunas:</span>
                          <span className="text-emerald-700 font-mono">{formatRupiah(grand)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 text-[11px] print:p-2">
                  <span className="font-bold text-zinc-900 block mb-0.5">Catatan Faktur:</span>
                  {selectedInvoice.notes}
                </div>
              )}

              {/* Legal Verification Footer */}
              <div className="pt-2.5 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 gap-1 font-mono print:flex-row print:pt-2 print-avoid-break">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dokumen elektronik resmi 1sLabs Technology &bull; Verifikasi Sah</span>
                </div>
                <div>
                  ID: {selectedInvoice.invoice_number}-OFFICIAL-1SLABS
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-5 border-t border-zinc-200 mt-6 print:hidden">
              <div className="flex items-center gap-2">
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => handleMarkPaid(selectedInvoice.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tandai Lunas
                  </button>
                )}
                <button
                  onClick={() => handleSendEmail(selectedInvoice.id)}
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingEmail ? 'animate-spin' : ''}`} />
                  Kirim Email Invoice
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/invoice/${selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Halaman Publik &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Vault Picker Modal */}
      {pickerTarget !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Pilih Berkas Bukti Pembayaran dari Brankas
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Klik "Gunakan pada Faktur Ini" atau "Pilih" pada berkas yang diinginkan untuk menyematkan tautannya secara otomatis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                className="text-zinc-400 hover:text-zinc-900 p-2 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <PaymentProofsVaultView
              isPickerMode
              onSelectProof={(selectedUrl) => {
                if (pickerTarget === 'global') {
                  setPaymentProofUrl(selectedUrl);
                } else if (typeof pickerTarget === 'number') {
                  handleItemChange(pickerTarget, 'proof_url', selectedUrl);
                }
                setPickerTarget(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
