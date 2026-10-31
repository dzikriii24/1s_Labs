import React from 'react';
import {
  Server,
  Cpu,
  Layers,
  Terminal,
  Database,
  ShieldCheck,
  HardDrive,
  Globe,
  Clock
} from 'lucide-react';

export const ServerConfigView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Server className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Arsitektur Server & Diagnostik Lingkungan Cloud
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Spesifikasi teknis cluster server produksi 1sLabs, runtime engine Node.js, Phusion Passenger, dan daemon cPanel.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Host & OS */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" /> Host & Hypervisor
          </h2>
          <div className="space-y-2 text-xs font-mono text-zinc-700">
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Hostname:</span>
              <span className="text-zinc-900 font-bold">1slabs.my.id</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Public IP Produksi:</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">103.119.237.132</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Operating System:</span>
              <span className="text-zinc-900 font-semibold">CloudLinux x86_64 (LVE Containerized)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Control Panel:</span>
              <span className="text-zinc-900 font-semibold">cPanel & WHM v124 (REST UAPI)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Linux Kernel:</span>
              <span className="text-zinc-600">4.18.0-553.58.1.lve.el8.x86_64</span>
            </div>
          </div>
        </div>

        {/* Node & Passenger */}
        <div className="p-6 bg-white border border-zinc-200 rounded-3xl space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" /> Runtime Aplikasi & Web Server
          </h2>
          <div className="space-y-2 text-xs font-mono text-zinc-700">
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Application Server:</span>
              <span className="text-zinc-900 font-bold">Phusion Passenger (Apache mod_passenger)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Node.js Engine:</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Node.js v22.18.0 (Active LTS)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Database Engine:</span>
              <span className="text-zinc-900 font-bold">MySQL 8.0.36 / MariaDB 10.11</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">Database Name:</span>
              <span className="text-zinc-900 font-bold">u1zh8984_oneslabs</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">Document Root:</span>
              <span className="text-zinc-600">/home/u1zh8984/public_html/1slabs.my.id</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
