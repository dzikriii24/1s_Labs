import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../../../services/api';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  defaultScope?: 'indonesia' | 'international';
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  defaultScope = 'indonesia'
}) => {
  const isIntl = defaultScope === 'international';

  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const [defaultCategory, setDefaultCategory] = useState(isIntl ? 'Coffee Shop' : 'Coffee Shop');
  const [defaultScale, setDefaultScale] = useState('Small Business');
  const [defaultCountry, setDefaultCountry] = useState(isIntl ? 'Malaysia' : 'Indonesia');

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number; errors: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseCsvContent = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        setError('File CSV minimal harus memiliki 1 baris header dan 1 baris data.');
        return;
      }

      // Detect separator (comma, semicolon, tab)
      const firstLine = lines[0];
      let sep = ',';
      if (firstLine.includes(';') && !firstLine.includes(',')) sep = ';';
      else if (firstLine.includes('\t') && !firstLine.includes(',')) sep = '\t';

      const splitCsvLine = (line: string) => {
        const regex = new RegExp(`(?:^|${sep})(?:"([^"]*)"|([^"${sep}]*))`, 'g');
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          matches.push(match[1] !== undefined ? match[1] : match[2] || '');
        }
        return matches;
      };

      const hdrs = splitCsvLine(firstLine).map(h => h.trim().replace(/^["']|["']$/g, ''));
      setHeaders(hdrs);

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i]);
        const rowObj: any = {};
        hdrs.forEach((h, idx) => {
          rowObj[h] = values[idx] ? values[idx].trim().replace(/^["']|["']$/g, '') : '';
        });
        rows.push(rowObj);
      }

      setParsedRows(rows);
      setError(null);
    } catch (err: any) {
      setError(`Gagal mem-parse file CSV: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      setError('Belum ada data baris yang berhasil diuraikan.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const res = await api.marketing.importCompanies(parsedRows, {
        defaultCategory,
        defaultScale,
        defaultCountry
      });

      if (res.success) {
        setImportResult({
          imported: res.imported,
          duplicates: res.duplicates,
          errors: res.errors || []
        });
        onImportComplete();
      } else {
        setError(res.message || 'Gagal memproses import data.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-start border-b border-zinc-100 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-zinc-900">
                Bulk Import Bisnis (CSV / XLSX)
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload daftar bisnis secara massal dengan pencegahan duplikasi otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl p-6 text-center transition-colors bg-zinc-50/50">
            <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-800">
              {fileName ? fileName : 'Pilih file CSV / TSV dari komputer Anda'}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Kolom yang didukung: Name/Nama, Phone/Telepon, Email, City/Kota, Category/Kategori, Website
            </p>
            <label className="mt-3 inline-block px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors">
              Pilih File
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Fallback Defaults */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs">
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 block mb-1">Kategori Default</label>
              <input
                type="text"
                value={defaultCategory}
                onChange={e => setDefaultCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 block mb-1">Skala Default</label>
              <input
                type="text"
                value={defaultScale}
                onChange={e => setDefaultScale(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-600 block mb-1">Negara Default</label>
              <input
                type="text"
                value={defaultCountry}
                onChange={e => setDefaultCountry(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-900">
                  Preview Data ({parsedRows.length} entitas terdeteksi)
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Menampilkan 5 baris pertama
                </span>
              </div>

              <div className="overflow-x-auto border border-zinc-200 rounded-xl max-h-48 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-[11px] font-mono text-zinc-600 uppercase border-b border-zinc-200">
                      {headers.slice(0, 5).map(h => (
                        <th key={h} className="py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-700">
                    {parsedRows.slice(0, 5).map((r, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        {headers.slice(0, 5).map(h => (
                          <td key={h} className="py-1.5 px-3 truncate max-w-xs">{r[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result Alert */}
          {importResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Import Selesai Berhasil!
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center">
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200/60">
                  <span className="text-[10px] text-emerald-600 block uppercase">Disimpan Baru</span>
                  <span className="text-base font-bold text-emerald-900">{importResult.imported}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-200/60">
                  <span className="text-[10px] text-amber-600 block uppercase">Duplikat Dilewati</span>
                  <span className="text-base font-bold text-amber-800">{importResult.duplicates}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || parsedRows.length === 0}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{isImporting ? 'Mengimport Data...' : `Mulai Import (${parsedRows.length} Data)`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

