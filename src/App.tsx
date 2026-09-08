import React, { useState } from 'react';
import { Header } from './components/Header';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { BackendArchitectureView } from './components/BackendArchitectureView';
import { HikvisionSimulatorView } from './components/HikvisionSimulatorView';
import { VueArchitectureView } from './components/VueArchitectureView';
import { CloudDeploymentView } from './components/CloudDeploymentView';
import { Database, Server, Cpu, ShieldCheck, Cloud } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('database');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header & Tab Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'database' && <DatabaseSchemaView />}
        {activeTab === 'backend' && <BackendArchitectureView />}
        {activeTab === 'hikvision' && <HikvisionSimulatorView />}
        {activeTab === 'frontend' && <VueArchitectureView />}
        {activeTab === 'cloud' && <CloudDeploymentView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Gym Cloud ERP Architecture • Senior Software Architecture & Full-Stack Blueprint</span>
          </div>
          <div className="flex items-center gap-4">
            <span>PHP 8.3 / Laravel 11</span>
            <span>Vue.js 3 / Pinia</span>
            <span>PostgreSQL 16</span>
            <span>Hikvision ISAPI</span>
            <span>Google Cloud</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
