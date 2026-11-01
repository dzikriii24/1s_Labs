import React, { useState } from 'react';
import {
  Search,
  Globe,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  Award,
  Plus,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { api } from '../../../../services/api';

export const CompanyResearchTab: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl && !businessName) {
      alert('Masukkan nama bisnis atau website URL terlebih dahulu.');
      return;
    }

    setIsResearching(true);
    setError(null);
    setResearchResult(null);
    setSaveSuccess(false);

    try {
      const prompt = `Lakukan analisis profil bisnis dan kebutuhan teknologi untuk:
Nama Usaha: ${businessName || 'Dari URL website'}
Website: ${targetUrl || 'N/A'}

Identifikasi:
1. Sektor industri dan jenis usaha di Indonesia (UMKM / PT / CV / Retail / F&B).
2. Potensi kebutuhan sistem informasi, website, atau dashboard.
3. Rekomendasi solusi yang cocok dari 1sLabs (Website Development, Custom Web App, Business Management System, API Integration).
4. Estimasi lead score (0-100).`;

      const aiRes = await api.marketing.testAiPrompt(prompt, 'gemini-3.8-flash');
      if (aiRes.success) {
        setResearchResult({
          name: businessName || targetUrl.replace(/^https?:\/\//, '').split('/')[0],
          website: targetUrl,
          analysis: aiRes.result.data || aiRes.result
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan riset perusahaan.');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
            <Search className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              On-Demand Company Research
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Masukkan nama perusahaan atau alamat website resmi untuk menganalisis kondisi digital, mendeteksi kebutuhan teknologi, dan menghitung lead score.
            </p>
          </div>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleRunResearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Nama Perusahaan / Bisnis
              </label>
              <input
                type="text"
                placeholder="e.g. Kopi Kenangan / PT Logistik Nusantara"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Website URL Resmi (Opsional)
              </label>
              <input
                type="text"
                placeholder="https://example.com"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isResearching}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isResearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 text-emerald-400" />}
              <span>{isResearching ? 'Gemini AI Sedang Meneliti...' : 'Mulai Riset dengan AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Research Result */}
      {researchResult && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                  Gemini AI Intelligence
                </span>
                <span className="text-xs text-zinc-400 font-mono">Real-time Analysis</span>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 mt-1">{researchResult.name}</h4>
              {researchResult.website && (
                <a
                  href={researchResult.website.startsWith('http') ? researchResult.website : `https://${researchResult.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono mt-0.5"
                >
                  {researchResult.website} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold">
                Riset Selesai
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs text-zinc-800">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Hasil Analisis Gemini AI
              </div>
              <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans bg-white p-3.5 rounded-xl border border-zinc-200 leading-relaxed">
                {typeof researchResult.analysis === 'string'
                  ? researchResult.analysis
                  : JSON.stringify(researchResult.analysis, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
