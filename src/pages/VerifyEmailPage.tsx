import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const { refreshUser, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tok: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.auth.verifyEmail(tok);
      if (res.success) {
        setSuccess(res.message);
        // Refresh authenticated user state in context
        await refreshUser();
      } else {
        setError(res.message || 'Verifikasi gagal. Tautan tidak valid.');
      }
    } catch (err: any) {
      setError(err.message || 'Tautan verifikasi tidak valid atau telah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    const emailToSend = resendEmail.trim() || user?.email;
    if (!emailToSend) {
      setResendError('Silakan masukkan alamat email Anda.');
      setIsResending(false);
      return;
    }

    try {
      const res = await api.auth.resendVerification(emailToSend);
      if (res.success) {
        setResendMessage(res.message || 'Tautan verifikasi baru telah dikirim ke email Anda.');
      } else {
        setResendError(res.message);
      }
    } catch (err: any) {
      setResendError(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 transition-colors duration-300 py-4 px-4 sm:px-8 flex flex-col justify-between font-sans">
      <Header />

      <main className="max-w-[700px] w-full mx-auto my-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xl text-center"
        >
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-black dark:text-white mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Memverifikasi Alamat Email...
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mohon tunggu sejenak sementara kami memvalidasi token keamanan Anda.
              </p>
            </div>
          ) : success ? (
            <div className="py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
                Email Berhasil Diverifikasi!
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-8">
                {success} Akun Anda kini berstatus aktif penuh dan Anda dapat memesan paket hosting, menghubungkan domain, serta mengelola infrastruktur server.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/portal"
                  className="w-full sm:w-auto px-6 py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Buka Portal Pelanggan</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/#hosting"
                  className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Lihat Katalog Hosting
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 text-left">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-4">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Verifikasi Email Gagal
                </h1>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                  {error || 'Tautan verifikasi tidak sah atau telah kedaluwarsa (masa berlaku 24 jam).'}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mt-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span>Kirim Ulang Tautan Verifikasi Baru</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Masukkan email Anda di bawah untuk menerima tautan verifikasi baru dari <strong>info@1slabs.my.id</strong>.
                </p>

                {resendMessage && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-xs">
                    {resendMessage}
                  </div>
                )}

                {resendError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
                    {resendError}
                  </div>
                )}

                <form onSubmit={handleResend} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={resendEmail || user?.email || ''}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="nama@perusahaan.com"
                      required
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirimkan Tautan...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Kirim Ulang Email Verifikasi</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium underline"
                >
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};
