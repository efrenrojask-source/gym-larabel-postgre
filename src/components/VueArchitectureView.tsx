import React, { useState } from 'react';
import { VUE_STRUCTURE, VUE_CODE_SAMPLES } from '../data/frontendCloudArchitecture';
import { ShieldCheck, User, CreditCard, LayoutDashboard, Copy, Check, QrCode, Search, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const VueArchitectureView: React.FC = () => {
  const [activeRoleView, setActiveRoleView] = useState<'admin' | 'cashier' | 'client'>('cashier');
  const [activeCodeTab, setActiveCodeTab] = useState<'router' | 'pinia' | 'component'>('component');
  const [copied, setCopied] = useState<string | null>(null);

  // Cashier interactive demo state
  const [searchDni, setSearchDni] = useState('V-24.890.123');
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(35);
  const [selectedMethod, setSelectedMethod] = useState('zelle');
  const [paidSuccess, setPaidSuccess] = useState(false);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Frontend Vue.js 3 • Pinia State & Vue Router RBAC
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Arquitectura del Frontend y Portales de Usuario</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Estructura modular con <span className="text-amber-400 font-semibold">Composition API (&lt;script setup&gt;)</span>,
          almacenamiento de estado centralizado con <span className="text-amber-400 font-mono">Pinia</span>, y control estricto de roles
          (<span className="text-amber-400 font-mono">admin</span>, <span className="text-amber-400 font-mono">cashier</span>, <span className="text-amber-400 font-mono">client</span>) mediante Navigation Guards de Vue Router.
        </p>
      </div>

      {/* Role Selector Tabs for Live UI Previews */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveRoleView('cashier')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeRoleView === 'cashier'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Vista Cajero (POS Cobros)</span>
          </button>
          <button
            onClick={() => setActiveRoleView('admin')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeRoleView === 'admin'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Vista Administrador (Control Total)</span>
          </button>
          <button
            onClick={() => setActiveRoleView('client')}
            className={`flex-1 sm:flex-initial flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeRoleView === 'client'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Vista Portal Cliente (Mobile First)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono px-3">Simulación Interactiva del Frontend Vue 3</span>
      </div>

      {/* INTERACTIVE VIEW 1: CASHIER POS */}
      {activeRoleView === 'cashier' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Terminal de Punto de Venta (POS) - Caja 01
              </h3>
              <p className="text-xs text-slate-400">Cobro en ventanilla y reactivación instantánea de torniquete</p>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
              Operador: <span className="text-amber-400 font-semibold">Cajero Manuel Silva</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Col 1: Búsqueda de cliente */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Búsqueda Rápida de Socio</label>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchDni}
                  onChange={(e) => setSearchDni(e.target.value)}
                  placeholder="DNI / Cédula / Teléfono"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 pl-8 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              {/* Client Status Card */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Carlos Mendoza</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    VENCIDO (Corte: 07/Sep)
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">DNI: {searchDni} • Tel: +584121234567</div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Torniquete Hikvision:</span>
                  <span className="text-rose-400 font-bold">BLOQUEADO</span>
                </div>
              </div>
            </div>

            {/* Col 2 & 3: Planes y Pago */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Seleccionar Plan a Renovar</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Plan Básico 30d', price: 25, days: 30 },
                    { name: 'Plan VIP Completo', price: 35, days: 30 },
                    { name: 'Plan Anual Gold', price: 300, days: 365 },
                  ].map((p) => (
                    <div
                      key={p.name}
                      onClick={() => setSelectedPlanPrice(p.price)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all text-left ${
                        selectedPlanPrice === p.price
                          ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/40 text-slate-100'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold text-xs">{p.name}</div>
                      <div className="text-lg font-black text-amber-400 mt-1">${p.price} USD</div>
                      <div className="text-[10px] text-slate-500">{p.days} días de acceso</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods (JSONB dynamic selector) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Método de Pago (Arquitectura Dinámica)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'cash', label: 'Efectivo USD / VES' },
                    { id: 'pos', label: 'Punto de Venta (Tarjeta)' },
                    { id: 'zelle', label: 'Zelle' },
                    { id: 'pagomovil', label: 'Pago Móvil' },
                    { id: 'transfer', label: 'Transferencia Bancaria' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedMethod === m.id
                          ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm payment CTA */}
              <button
                onClick={() => {
                  setPaidSuccess(true);
                  setTimeout(() => setPaidSuccess(false), 3500);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Pago de ${selectedPlanPrice} USD y Desbloquear Acceso en Hikvision</span>
              </button>

              {paidSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>¡Transacción Exitosa!</strong> Recibo REC-2026-0908 emitido. El torniquete ha sido desbloqueado
                    automáticamente vía ISAPI para Carlos Mendoza.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE VIEW 2: ADMIN DASHBOARD */}
      {activeRoleView === 'admin' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-purple-400" />
                Panel de Administración General (RBAC: Admin)
              </h3>
              <p className="text-xs text-slate-400">Control de membresías, ingresos, aforo y estado de hardware</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                Exportar Reporte Contable
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white">
                + Crear Nuevo Plan
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Socios Activos Hoy</div>
              <div className="text-2xl font-black text-slate-100 mt-1">428</div>
              <div className="text-[10px] text-emerald-400 mt-1">▲ +12% este mes</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Aforo Actual en Sala</div>
              <div className="text-2xl font-black text-amber-400 mt-1">54 personas</div>
              <div className="text-[10px] text-slate-500 mt-1">Capacidad máx: 120</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Morosidad / Vencidos</div>
              <div className="text-2xl font-black text-rose-400 mt-1">31</div>
              <div className="text-[10px] text-slate-500 mt-1">Bloqueados en torniquete</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Terminales Hikvision</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">2 / 2 Online</div>
              <div className="text-[10px] text-slate-500 mt-1">Latencia VPN: 14ms</div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE VIEW 3: CLIENT PORTAL */}
      {activeRoleView === 'client' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md mx-auto">
          <div className="text-center pb-4 border-b border-slate-800 mb-6">
            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-500 mx-auto mb-2 flex items-center justify-center text-amber-400 font-bold text-xl">
              CM
            </div>
            <h3 className="text-base font-bold text-slate-100">Carlos Mendoza</h3>
            <p className="text-xs text-slate-400">Socio #101 • Plan VIP Todo Incluido</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Membership status card */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-rose-500/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Estado de Membresía</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">VENCIDO</span>
              </div>
              <div className="text-sm font-semibold text-slate-200">Fecha Límite: 07/Sep/2026</div>
              <div className="text-[11px] text-rose-400/90 mt-1">
                ⚠️ Tu acceso por reconocimiento facial se encuentra pausado temporalmente.
              </div>
            </div>

            {/* QR Code Pass */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center">
              <QrCode className="w-24 h-24 text-slate-300 mb-2" />
              <div className="text-[11px] text-slate-400 font-mono">ID BIOMÉTRICO: HIK-EMP-0101</div>
              <p className="text-[10px] text-slate-500 mt-1">Presenta este pase en caja para renovar rápidamente</p>
            </div>
          </div>
        </div>
      )}

      {/* Vue Code Architecture Tab Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('component')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                activeCodeTab === 'component' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PosTerminalView.vue
            </button>
            <button
              onClick={() => setActiveCodeTab('router')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                activeCodeTab === 'router' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              router/index.ts (RBAC)
            </button>
            <button
              onClick={() => setActiveCodeTab('pinia')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                activeCodeTab === 'pinia' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              stores/auth.ts (Pinia)
            </button>
          </div>

          <button
            onClick={() => {
              const code =
                activeCodeTab === 'component'
                  ? VUE_CODE_SAMPLES.cashierView
                  : activeCodeTab === 'router'
                  ? VUE_CODE_SAMPLES.router
                  : VUE_CODE_SAMPLES.piniaAuth;
              copyCode(code, activeCodeTab);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all"
          >
            {copied === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === activeCodeTab ? 'Copiado' : 'Copiar Código'}</span>
          </button>
        </div>

        <div className="p-6 overflow-x-auto max-h-[480px]">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed">
            <code>
              {activeCodeTab === 'component' && VUE_CODE_SAMPLES.cashierView}
              {activeCodeTab === 'router' && VUE_CODE_SAMPLES.router}
              {activeCodeTab === 'pinia' && VUE_CODE_SAMPLES.piniaAuth}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
