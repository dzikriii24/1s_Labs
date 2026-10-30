import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Phone, ArrowRight, AlertCircle, Loader2, ShieldPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState<{ email: string; name: string } | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || !phone.trim()) {
      setError('Nomor WhatsApp wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, password, confirmPassword, phone });
      setRegisteredSuccess({ email: email.trim().toLowerCase(), name: name.trim() });
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 transition-colors duration-300 py-4 px-4 sm:px-8 flex flex-col justify-between">
      <Header />

      <main className="max-w-[1400px] w-full mx-auto my-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xl"
        >
          {registeredSuccess ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-6">
                <Mail className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Verifikasi Email Dikirim!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                Halo <strong>{registeredSuccess.name}</strong>, kami telah mengirimkan email verifikasi resmi ke:
              </p>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 mb-6 break-all">
                {registeredSuccess.email}
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-left text-xs text-amber-800 dark:text-amber-300 mb-8 space-y-1">
                <p className="font-semibold">Langkah Selanjutnya:</p>
                <p>1. Buka aplikasi email atau webmail Anda.</p>
                <p>2. Periksa kotak masuk (Inbox) atau folder Spam/Promosi.</p>
                <p>3. Klik tombol <strong>"Verifikasi Email Sekarang"</strong> untuk mengaktifkan akun Anda.</p>
              </div>
              <div className="space-y-3">
                <Link
                  to="/verify-email"
                  className="w-full py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Sudah Punya Token? Masukkan di Sini</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/portal"
                  className="block text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline pt-2"
                >
                  Ke Portal Pelanggan Terlebih Dahulu
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black mb-4">
                  <ShieldPlus className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Daftar Akun 1sLabs
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Buat akun pelanggan untuk memesan dan mengelola layanan hosting Anda.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Anda atau Nama Bisnis"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Alamat Email (Wajib)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@perusahaan.com"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Nomor WhatsApp (Wajib)
                    </label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Contoh: 081234567890</span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081234567890 atau +628123456789"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Digunakan untuk konfirmasi aktivasi hosting, verifikasi manual, dan invoice resmi.
                  </p>
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Ulangi Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi sandi"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 px-4 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Pendaftaran...</span>
                </>
              ) : (
                <>
                  <span>Buat Akun Pelanggan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sudah memiliki akun?{' '}
              <Link
                to={redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'}
                className="font-semibold text-black dark:text-white hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
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
