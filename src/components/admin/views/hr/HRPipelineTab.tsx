import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Plus
} from 'lucide-react';
import { api, HRCandidate, HRPosition, HRPromotedStatus } from '../../../../services/api';
import notify from '../../../../lib/notify';

interface StageConfig {
  key: HRPromotedStatus;
  title: string;
  dotColor: string;
  badgeBg: string;
}

const PIPELINE_STAGES: StageConfig[] = [
  { key: 'new_candidate', title: 'New Candidate', dotColor: 'bg-blue-500', badgeBg: 'bg-blue-50 text-blue-700' },
  { key: 'contacted', title: 'Contacted', dotColor: 'bg-zinc-400', badgeBg: 'bg-zinc-100 text-zinc-700' },
  { key: 'responded', title: 'Responded', dotColor: 'bg-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-700' },
  { key: 'screening', title: 'Screening', dotColor: 'bg-amber-500', badgeBg: 'bg-amber-50 text-amber-700' },
  { key: 'interview_scheduled', title: 'Interview Scheduled', dotColor: 'bg-purple-500', badgeBg: 'bg-purple-50 text-purple-700' },
  { key: 'interview_completed', title: 'Interview Completed', dotColor: 'bg-cyan-500', badgeBg: 'bg-cyan-50 text-cyan-700' },
  { key: 'offered', title: 'Offered / Accepted', dotColor: 'bg-emerald-600', badgeBg: 'bg-emerald-100 text-emerald-800' },
  { key: 'on_hold', title: 'On Hold', dotColor: 'bg-orange-500', badgeBg: 'bg-orange-50 text-orange-700' },
  { key: 'rejected', title: 'Rejected', dotColor: 'bg-zinc-400', badgeBg: 'bg-zinc-100 text-zinc-500' }
];

export const HRPipelineTab: React.FC = () => {
  const [candidates, setCandidates] = useState<HRCandidate[]>([]);
  const [positions, setPositions] = useState<HRPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await api.hr.getCandidates({
        limit: 150,
        position_id: positionFilter === 'all' ? undefined : positionFilter
      });
      if (res.success) {
        setCandidates(res.candidates);
      }
    } catch (err: any) {
      console.warn('Failed to fetch pipeline candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.hr.getPositions({ status: 'active' }).then(res => {
      if (res.success) setPositions(res.positions);
    });
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [positionFilter]);

  const handleStageChange = async (candidateId: number, newStage: HRPromotedStatus) => {
    // Optimistic UI update
    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, recruitment_status: newStage } : c))
    );

    try {
      const res = await api.hr.updateCandidateStatus(candidateId, { recruitment_status: newStage });
      if (res.success) {
        notify.success(`Status kandidat dipindahkan ke ${newStage}.`);
      }
    } catch (err: any) {
      notify.error('Gagal memperbarui status pipeline.');
      fetchCandidates();
    }
  };

  const filteredCandidates = candidates.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.position_name && c.position_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Recruitment Pipeline (Kanban Board)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Visualisasikan dan perbarui tahapan seleksi kandidat di seluruh pipeline rekrutmen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kandidat..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
            />
          </div>

          <select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-zinc-200 bg-white font-medium text-zinc-700"
          >
            <option value="all">Semua Posisi</option>
            {positions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={fetchCandidates}
            className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 shadow-xs"
            title="Refresh Kanban"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scroll) */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1300px] items-start">
          {PIPELINE_STAGES.map(stage => {
            const stageCandidates = filteredCandidates.filter(
              c => c.recruitment_status === stage.key
            );

            return (
              <div
                key={stage.key}
                className="w-72 bg-zinc-100/70 border border-zinc-200/80 rounded-2xl flex flex-col max-h-[720px] shadow-2xs shrink-0"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-zinc-200 bg-white/70 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${stage.dotColor} shrink-0`} />
                    <span className="font-bold text-xs text-zinc-900 truncate">{stage.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/80 text-zinc-700">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Column Body (Cards List) */}
                <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                  {stageCandidates.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-zinc-400 border border-dashed border-zinc-200/70 rounded-xl">
                      Kosong
                    </div>
                  ) : (
                    stageCandidates.map(cand => (
                      <div
                        key={cand.id}
                        className="bg-white p-3.5 rounded-xl border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-zinc-900">{cand.full_name}</p>
                          <span className="text-[10px] text-zinc-400 shrink-0 font-medium capitalize">
                            {cand.source}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-600 font-medium line-clamp-1">
                          {cand.position_name || 'Posisi 1sLabs'}
                        </p>

                        <div className="space-y-0.5 text-[11px] text-zinc-500">
                          <p className="truncate flex items-center gap-1 text-[10px]">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            {cand.email}
                          </p>
                        </div>

                        {/* Move stage dropdown quick action */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-medium">Pindahkan:</span>
                          <select
                            value={cand.recruitment_status}
                            onChange={e => handleStageChange(cand.id, e.target.value as HRPromotedStatus)}
                            className="text-[10px] p-1 rounded-md border border-zinc-200 bg-white font-medium text-zinc-700"
                          >
                            {PIPELINE_STAGES.map(s => (
                              <option key={s.key} value={s.key}>{s.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

