import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe,
  Server,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { api, HostingService } from '../services/api';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const SetupDomainPage: React.FC = () => {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const [service, setService] = useState<HostingService | null>(null);
  const [domain, setDomain] = useState('');
  const [domainType, setDomainType] = useState<'existing' | 'new'>('existing');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceCode) return;
      try {
        setLoading(true);
        const res = await api.services.getByCode(serviceCode);
        if (res.success && res.service) {
          setService(res.service);
          if (res.service.domain) {
            setDomain(res.service.domain);
          }
        } else {
          setError('Data layanan tidak ditemukan.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat rincian layanan hosting.');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceCode) return;

    if (!domain.trim()) {
      setError('Harap masukkan nama domain utama website Anda.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.services.setupDomain(serviceCode, {
        domain: domain.trim(),
        domain_type: domainType
      });

      if (res.success) {
        // Navigate to Customer Portal to view the service control panel
        navigate(`/portal?service=${serviceCode}`);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan domain layanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col justify-between py-4 px-4 sm:px-8">
        <Header />
        <div className="flex flex-col items-center justify-center my-32">
          <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white mb-3" />
          <p className="text-sm text-gray-500">Memuat konfigurasi layanan...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 py-4 px-4 sm:px-8 flex flex-col justify-between font-sans">
      <Header />

      <main className="max-w-[800px] w-full mx-auto my-8">
        <div className="mb-6 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Link to="/portal" className="hover:underline">Portal Pelanggan</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Aktivasi Domain ({serviceCode})</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-lg"
        >
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-100 dark:border-gray-800 mb-6">
            <div className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pembayaran Terverifikasi
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Konfigurasi Domain Utama Hosting
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Paket: {service?.plan_name} • Kode Layanan: {service?.service_code}
              </p>
            </div>
          </div>

          {/* Check if service is already configured */}
          {service && (service.status === 'active' || (service.domain && service.status !== 'awaiting_domain')) ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Konfigurasi Awal Telah Selesai
              </h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Domain utama untuk layanan ini sudah berhasil dikonfigurasi sebagai{' '}
                <strong className="text-gray-900 dark:text-white font-mono">{service.domain}</strong>.
                Konfigurasi awal server hanya dilakukan sekali. Jika Anda ingin mengganti domain, silakan gunakan tombol <strong>Ganti / Edit Domain</strong> di halaman Portal Hosting.
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <Link
                  to={`/portal?service=${service.service_code}`}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <span>Buka Portal Hosting</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Transparent Domain Registrar Notice per Master Prompt */}
              <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start space-x-3 text-blue-900 dark:text-blue-300 text-xs leading-relaxed">
                <Info className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Pemberitahuan Konfigurasi Server:</span>
                  Input domain ini berfungsi untuk mengalokasikan virtual host, folder direktori web, dan database pada server 1sLabs. Jika Anda menggunakan domain yang dibeli di registrar lain, arahkan Nameserver ke <strong>{service?.nameservers || 'ns1.domainmurah.net, ns2.domainmurah.net'}</strong> atau A Record ke IP <strong>{service?.server_ip || '103.119.237.132'}</strong>.
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
            {/* Domain Type Options */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Opsi Domain
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDomainType('existing')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    domainType === 'existing'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Domain Milik Sendiri</span>
                    <input
                      type="radio"
                      name="domainType"
                      checked={domainType === 'existing'}
                      onChange={() => setDomainType('existing')}
                      className="accent-black dark:accent-white"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Saya sudah memiliki domain di registrar lain dan akan mengarahkan DNS ke server 1sLabs.
                  </span>
                </label>

                <label
                  onClick={() => setDomainType('new')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    domainType === 'new'
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Pendaftaran Domain Baru</span>
                    <input
                      type="radio"
                      name="domainType"
                      checked={domainType === 'new'}
                      onChange={() => setDomainType('new')}
                      className="accent-black dark:accent-white"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Bantuan pendaftaran nama domain baru didampingi oleh tim teknis 1sLabs.
                  </span>
                </label>
              </div>
            </div>

            {/* Domain Name Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Nama Domain Lengkap
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase())}
                  placeholder="contoh: tokobisnis.com atau brandanda.my.id"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Jangan sertakan `http://` atau `https://`. Cukup masukkan nama domain dan ekstensinya (contoh: <code>perusahaan.co.id</code>).
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !domain.trim()}
              className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Konfigurasi...</span>
                </>
              ) : (
                <>
                  <span>Simpan & Masuk ke Dashboard Hosting</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </motion.div>
      </main>

      <div className="max-w-[1400px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
};
