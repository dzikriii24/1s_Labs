import React from 'react';
import {
  Users,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Key,
  ShieldAlert
} from 'lucide-react';

export const AdminManagementView: React.FC = () => {
  const adminUsers = [
    {
      id: 1,
      email: 'dzikri@1slabs.my.id',
      name: 'Dzikri Fauzi',
      role: 'Super Administrator',
      status: 'active',
      lastLogin: '2026-10-30 16:45 WIB'
    },
    {
      id: 2,
      email: 'admin@1slabs.my.id',
      name: '1sLabs Operations Admin',
      role: 'Super Administrator',
      status: 'active',
      lastLogin: '2026-10-30 15:30 WIB'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-zinc-700" />
          Admin Team & Access Governance (RBAC)
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Authorized platform administrators, privilege tiers, and security enforcement policies.
        </p>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm font-semibold text-zinc-900 font-mono uppercase tracking-wider">
            Active Administrative Accounts
          </h3>
          <span className="text-xs text-zinc-500 font-medium">2 Accounts Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Admin Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Role Tier</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {adminUsers.map((adm) => (
                <tr key={adm.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900">{adm.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-zinc-600">{adm.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {adm.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-zinc-500">{adm.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-700" />
          Role-Based Access Control (RBAC) Specification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-bold text-zinc-900 text-sm">Super Admin</div>
            <p className="text-zinc-600 leading-relaxed">
              Full unconstrained access to server commands, AutoSSL execution, financial records, email configuration, and user permissions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-bold text-zinc-900 text-sm">Finance Admin</div>
            <p className="text-zinc-600 leading-relaxed">
              Payment verification approvals, commercial invoice generation, revenue analytics, and transaction CSV exports.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-bold text-zinc-900 text-sm">Hosting & Infra Admin</div>
            <p className="text-zinc-600 leading-relaxed">
              cPanel account provisioning, quota adjustments, DNS verification, AutoSSL monitoring, and safe process termination.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="font-bold text-zinc-900 text-sm">Support Specialist</div>
            <p className="text-zinc-600 leading-relaxed">
              Customer profile lookup, service overview, email dispatch inspection, and documentation report generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
