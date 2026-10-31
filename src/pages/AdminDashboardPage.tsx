import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../components/admin/AdminLayout';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login?redirect=/admin');
      } else if (!isAdmin) {
        navigate('/portal');
      }
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-mono">Authenticating administrative session...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-white mb-1">Access Restricted</h1>
        <p className="text-xs text-zinc-400 max-w-sm mb-4">
          This portal requires verified administrative privileges. Your current credentials lack sufficient access rights.
        </p>
        <button
          onClick={() => navigate('/login?redirect=/admin')}
          className="px-4 py-2 text-xs font-semibold bg-white text-zinc-950 rounded-lg"
        >
          Authenticate as Administrator
        </button>
      </div>
    );
  }

  return <AdminLayout />;
};
