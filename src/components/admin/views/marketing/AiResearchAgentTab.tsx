import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Clock,
  Layers,
  Send,
  ShieldCheck
} from 'lucide-react';
import { api, MarketingAiLog } from '../../../../services/api';

export const AiResearchAgentTab: React.FC = () => {
  const [logs, setLogs] = useState<MarketingAiLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Tester state
  const [testPrompt, setTestPrompt] = useState(
    'PT Samudra Kencana Logistik, bergerak di bidang pengiriman kargo dan pergudangan di Tanjung Priok Jakarta Utara. Memiliki 45 armada truk tapi belum memiliki sistem tracking online untuk pelanggan. Kontak: info@samudrakencana.co.id, telp 021-4392817.'
  );
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.marketing.getAiLogs();
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err: any) {
      console.warn('Failed to load AI logs', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResponse(null);
    setTestError(null);

    try {
      const res = await api.marketing.testAiPrompt(testPrompt, selectedModel);
      if (res.success) {
        setTestResponse(res.result);
        fetchLogs();
      }
    } catch (err: any) {
      setTestError(err.message || 'Eksekusi model Gemini gagal.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <Bot className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              Gemini AI Research Agent Console
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Asisten AI cerdas untuk ekstraksi data terstruktur, klasifikasi kategori usaha, dan pendeteksi peluang kebutuhan teknologi 1sLabs.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Primary Model</div>
            <div className="text-sm font-bold text-zinc-900 font-mono">gemini-3.8-flash</div>
            <div className="text-[10px] text-emerald-600 font-medium">Low-latency REST v1beta</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Fallback Hierarchy</div>
            <div className="text-xs font-bold text-zinc-900 font-mono">flash-latest → 3.1-lite</div>
            <div className="text-[10px] text-zinc-500">Auto-recovery on 503 / 429</div>
          </div>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Policy Guardrail</div>
            <div className="text-xs font-bold text-zinc-900">Zero Hallucination</div>
            <div className="text-[10px] text-zinc-500">Strict JSON & Source Provenance</div>
          </div>
        </div>
      </div>

      {/* Interactive Extraction Tester */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" /> Interactive Extraction & Classifier Tester
          </h4>
          <span className="text-[11px] text-zinc-500">Uji coba parsing teks mentah secara live</span>
        </div>

        <form onSubmit={handleTestSubmit} className="space-y-3">
          <textarea
            rows={4}
            value={testPrompt}
            onChange={e => setTestPrompt(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 leading-relaxed"
            placeholder="Ketik teks profil usaha mentah di sini..."
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 font-medium">Model:</span>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                <option value="gemini-flash-latest">gemini-flash-latest</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isTesting ? 'Sedang Memproses...' : 'Uji Prompt'}</span>
            </button>
          </div>
        </form>

        {testError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {testError}
          </div>
        )}

        {testResponse && (
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2">
            <div className="flex justify-between items-center text-[11px] font-mono text-zinc-600">
              <span className="font-semibold text-zinc-900">Model Output (JSON Result)</span>
              <span className="text-emerald-700 font-medium">Latency: {testResponse.usage?.latency_ms || 'OK'}ms</span>
            </div>
            <pre className="text-xs text-zinc-800 overflow-x-auto p-3 bg-white rounded-lg border border-zinc-200 font-mono leading-relaxed">
              {JSON.stringify(testResponse.data || testResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* AI Execution History Log */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/75 flex justify-between items-center">
          <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> Riwayat Eksekusi AI (Tokens & Latency)
          </h4>
          <button
            onClick={fetchLogs}
            className="p-1.5 border border-zinc-200 hover:bg-zinc-100 rounded-lg text-zinc-600 text-xs transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoadingLogs ? (
          <p className="text-xs text-zinc-500 py-10 text-center font-mono">Memuat riwayat log AI...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-10 text-center">Belum ada riwayat penggunaan AI.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Tujuan</th>
                  <th className="py-2.5 px-4">Model</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Latency</th>
                  <th className="py-2.5 px-4 text-right">Tokens / Characters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-zinc-500 text-[11px]">
                      {new Date(l.created_at).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-900 font-semibold capitalize">
                      {l.purpose.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-zinc-600 text-[11px]">{l.model}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-zinc-800">{l.latency_ms}ms</td>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-500">
                      {l.input_snapshot ? l.input_snapshot.length : 0} chars
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
