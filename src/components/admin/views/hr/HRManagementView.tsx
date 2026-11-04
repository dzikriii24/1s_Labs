import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Send,
  Inbox,
  CalendarCheck,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  Bell
} from 'lucide-react';
import { HRDashboardTab } from './HRDashboardTab';
import { HRCandidatesTab } from './HRCandidatesTab';
import { HRPipelineTab } from './HRPipelineTab';
import { HREmailCampaignsTab } from './HREmailCampaignsTab';
import { HRInboxTab } from './HRInboxTab';
import { HRInterviewsTab } from './HRInterviewsTab';
import { HRPositionsTab } from './HRPositionsTab';
import { api, HRNotification } from '../../../../services/api';

export type HRSubtab =
  | 'dashboard'
  | 'candidates'
  | 'pipeline'
  | 'campaigns'
  | 'inbox'
  | 'interviews'
  | 'positions';

interface HRManagementViewProps {
  initialSubtab?: HRSubtab;
  onNavigateSubtab?: (subtab: HRSubtab) => void;
  onNavigate?: (tab: string) => void;
}

export const HRManagementView: React.FC<HRManagementViewProps> = ({
  initialSubtab = 'dashboard',
  onNavigateSubtab,
  onNavigate
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = (searchParams.get('sub') as HRSubtab) || initialSubtab || 'dashboard';

  const [activeSubtab, setActiveSubtab] = useState<HRSubtab>(initialSubtab || subParam);
  const [notifications, setNotifications] = useState<HRNotification[]>([]);
  const [selectedCandidateDetailId, setSelectedCandidateDetailId] = useState<number | null>(null);

  // Sync when initialSubtab changes from AdminLayout
  useEffect(() => {
    if (initialSubtab && initialSubtab !== activeSubtab) {
      setActiveSubtab(initialSubtab);
    }
  }, [initialSubtab]);

  // Sync with searchParams
  useEffect(() => {
    const urlSub = searchParams.get('sub') as HRSubtab;
    if (urlSub && urlSub !== activeSubtab) {
      setActiveSubtab(urlSub);
    }
  }, [searchParams]);

  // Fetch unread notifications
  useEffect(() => {
    api.hr.getNotifications().then(res => {
      if (res.success) {
        setNotifications(res.notifications);
      }
    });
  }, [activeSubtab]);

  const handleTabChange = (tab: HRSubtab) => {
    setActiveSubtab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('sub', tab);
      return next;
    });
    if (onNavigateSubtab) {
      onNavigateSubtab(tab);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  const tabs: Array<{
    id: HRSubtab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }> = [
    { id: 'dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: Layers },
    { id: 'campaigns', label: 'Email Campaigns', icon: Send },
    {
      id: 'inbox',
      label: 'HR Inbox',
      icon: Inbox,
      badge: unreadNotifCount > 0 ? String(unreadNotifCount) : undefined
    },
    { id: 'interviews', label: 'Interview Schedule', icon: CalendarCheck },
    { id: 'positions', label: 'Positions Master', icon: Briefcase }
  ];

  return (
    <div className="space-y-6">
      {/* Top HR Sub-Navigation Header */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Branding Strip */}
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
              HR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-900">
                  Human Resources & Recruitment Management
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-white">
                  1sLabs
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Pusat pengelolaan kandidat, komunikasi email rekrutmen (<span className="font-semibold text-zinc-700">hr@1slabs.my.id</span>), proses seleksi, dan penjadwalan interview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-zinc-600 font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 bg-white shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sistem Terintegrasi
            </div>
          </div>
        </div>

        {/* Tab Buttons (Horizontal Scrolling) */}
        <div className="overflow-x-auto">
          <div className="flex px-4 sm:px-6 min-w-max border-b border-zinc-100">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubtab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 py-3.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-zinc-900 text-zinc-900'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Render Active Subtab View */}
      {activeSubtab === 'dashboard' && (
        <HRDashboardTab
          onNavigateTab={tabKey => handleTabChange(tabKey as HRSubtab)}
          onSelectCandidate={id => {
            setSelectedCandidateDetailId(id);
            handleTabChange('candidates');
          }}
        />
      )}

      {activeSubtab === 'candidates' && (
        <HRCandidatesTab
          preselectedCandidateId={selectedCandidateDetailId}
          onOpenComposeModal={() => handleTabChange('campaigns')}
        />
      )}

      {activeSubtab === 'pipeline' && (
        <HRPipelineTab />
      )}

      {activeSubtab === 'campaigns' && (
        <HREmailCampaignsTab />
      )}

      {activeSubtab === 'inbox' && (
        <HRInboxTab />
      )}

      {activeSubtab === 'interviews' && (
        <HRInterviewsTab />
      )}

      {activeSubtab === 'positions' && (
        <HRPositionsTab />
      )}
    </div>
  );
};

