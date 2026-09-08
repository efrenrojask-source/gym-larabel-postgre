import React from 'react';
import { Database, Server, Cpu, Cloud, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'database', label: '1. Base de Datos (PostgreSQL)', icon: Database, badge: '7 Tablas + Migraciones' },
    { id: 'backend', label: '2. Backend (Laravel SOLID)', icon: Server, badge: 'Service Pattern & CRON' },
    { id: 'hikvision', label: '3. Hikvision ISAPI (IoT)', icon: Cpu, badge: 'Simulador & Guzzle' },
    { id: 'frontend', label: '4. Frontend (Vue.js 3)', icon: ShieldCheck, badge: 'Pinia & 3 Portales' },
    { id: 'cloud', label: '5. Despliegue en GCP', icon: Cloud, badge: 'Cloud Run & Cloud SQL' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black text-xl">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">Gym ERP & Cloud Architecture Hub</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Laravel 11 + Vue 3 + Hikvision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Arquitectura de Software Senior • PostgreSQL 16 • Twilio WhatsApp • Google SMTP • Google Cloud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>GCP Cloud Run Ready</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>ISAPI Protocol v2.0</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
