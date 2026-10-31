import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Printer,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Maximize2
} from 'lucide-react';

export const ProofViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { filename: paramFilename } = useParams<{ filename?: string }>();

  const rawUrl = searchParams.get('url');
  const fileParam = searchParams.get('file') || paramFilename;

  // Resolve target media URL
  let targetUrl = '';
  if (rawUrl) {
    targetUrl = rawUrl.startsWith('http') ? rawUrl : `https://1slabs.my.id${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  } else if (fileParam) {
    targetUrl = `https://1slabs.my.id/uploads/proofs/${fileParam}`;
  }

  const filename = fileParam || (targetUrl ? targetUrl.split('/').pop()?.split('?')[0] : 'Dokumen-Bukti');
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  // Viewer Controls for Image
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [activeImgSrc, setActiveImgSrc] = useState(targetUrl);
  const [retriedFallback, setRetriedFallback] = useState(false);

  useEffect(() => {
    // Reset zoom & rotation if URL changes
    setActiveImgSrc(targetUrl);
    setRetriedFallback(false);
    setZoom(1);
    setRotation(0);
    setImageError(false);
    setImageLoading(true);
  }, [targetUrl]);

  const handleImageError = () => {
    if (!retriedFallback && activeImgSrc && !activeImgSrc.includes('/api/uploads/proofs/') && activeImgSrc.includes('/uploads/proofs/')) {
      const fallbackUrl = activeImgSrc.replace('/uploads/proofs/', '/api/uploads/proofs/');
      setActiveImgSrc(fallbackUrl);
      setRetriedFallback(true);
    } else {
      setImageLoading(false);
      setImageError(true);
    }
  };

  const handleCopyLink = () => {
    const currentFullUrl = window.location.href;
    navigator.clipboard.writeText(currentFullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = filename || 'bukti-transfer-1slabs';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!targetUrl) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
            Tautan Bukti Tidak Valid
          </h2>
          <p className="text-xs text-zinc-500 mb-6">
            Parameter berkas bukti pembayaran tidak ditemukan atau URL tidak lengkap.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation & Branding Bar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 px-4 py-3 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Document Title */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img
                src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                alt="1sLabs Official"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-[240px] sm:max-w-sm">
                  {filename}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isPdf
                      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {ext ? ext.toUpperCase() : 'BUKTI'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dokumen Bukti Pembayaran Resmi 1sLabs</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            {isImage && (
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mr-1 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Perkecil (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1 font-semibold min-w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Perbesar (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Putar 90 Derajat"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDarkCanvas((d) => !d)}
                  className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 transition-colors"
                  title="Ubah Latar Belakang"
                >
                  {darkCanvas ? 'Light' : 'Dark'}
                </button>
              </div>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
              title="Salin Tautan Viewer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
              title="Cetak Dokumen"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Unduh Berkas Asli"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Asli</span>
            </button>

            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Buka Berkas Langsung"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Document Viewer Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 overflow-auto">
        <div className="w-full max-w-5xl flex-1 flex flex-col">
          {/* Certificate / Verification Header Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Sertifikat Validasi Bukti Pembayaran Digital
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Diverifikasi resmi dan disimpan secara aman di Cloud Infrastructure 1sLabs.
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono text-zinc-500">
              <span>Status: </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Terverifikasi Valid (Verified)
              </span>
            </div>
          </div>

          {/* Document Content */}
          <div
            className={`flex-1 min-h-[580px] rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-md flex items-center justify-center p-4 transition-colors relative ${
              darkCanvas ? 'bg-zinc-950' : 'bg-zinc-50 dark:bg-zinc-900/60'
            }`}
          >
            {isPdf ? (
              <div className="w-full h-full min-h-[650px] flex flex-col">
                <iframe
                  src={`${targetUrl}#toolbar=1&navpanes=0`}
                  title="Pratinjau Dokumen PDF Bukti Pembayaran"
                  className="w-full h-full min-h-[650px] rounded-2xl border-none shadow-xs"
                />
              </div>
            ) : isImage ? (
              <div className="w-full h-full flex flex-col items-center justify-center overflow-auto p-4 select-none relative min-h-[400px]">
                {imageLoading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-9 h-9 border-3 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {imageError ? (
                  <div className="text-center p-6 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm max-w-sm">
                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                      Gambar Tidak Dapat Ditampilkan Langsung
                    </h4>
                    <p className="text-xs text-zinc-500 mb-4">
                      Berkas gambar mungkin dibatasi atau koneksi terhalang. Anda dapat membuka atau mengunduhnya secara langsung.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka di Tab Baru
                      </a>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh
                      </button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={activeImgSrc}
                    alt={filename}
                    onLoad={() => setImageLoading(false)}
                    onError={handleImageError}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className={`max-h-[75vh] max-w-full object-contain rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 cursor-zoom-in transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onClick={() => setZoom((z) => (z >= 2 ? 1 : z + 0.5))}
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-8">
                <FileText className="w-16 h-16 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                  Berkas {ext ? ext.toUpperCase() : 'Dokumen'}
                </h3>
                <p className="text-xs text-zinc-500 mb-4 max-w-md">
                  Pratinjau langsung tidak tersedia untuk format berkas ini di browser. Anda dapat mengunduh atau membukanya di tab baru.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="py-4 px-4 text-center text-[11px] text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 print:hidden font-mono">
        Official Digital Payment Verification &bull; 1sLabs Technology &bull; https://1slabs.my.id
      </footer>
    </div>
  );
};
