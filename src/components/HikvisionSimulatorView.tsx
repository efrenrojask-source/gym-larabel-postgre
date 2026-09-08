import React, { useState } from 'react';
import { Cpu, ShieldCheck, ShieldAlert, Wifi, Play, RefreshCw, Terminal, CheckCircle, XCircle, ArrowRight, Lock, Unlock, DollarSign } from 'lucide-react';

interface MockMember {
  id: number;
  name: string;
  dni: string;
  plan: string;
  status: 'active' | 'expired';
  dueDate: string;
  faceRegistered: boolean;
  phone: string;
}

interface SimulatedEvent {
  id: string;
  timestamp: string;
  user: string;
  result: 'GRANTED' | 'DENIED' | 'SYNC_UNLOCK' | 'SYNC_LOCK';
  details: string;
  payload: any;
}

export const HikvisionSimulatorView: React.FC = () => {
  const [members, setMembers] = useState<MockMember[]>([
    {
      id: 101,
      name: 'Carlos Mendoza',
      dni: 'V-24.890.123',
      plan: 'Plan VIP Todo Incluido',
      status: 'expired',
      dueDate: '2026-09-07',
      faceRegistered: true,
      phone: '+584121234567',
    },
    {
      id: 102,
      name: 'Sofía Ramos',
      dni: 'V-28.456.789',
      plan: 'Plan Básico Mensual',
      status: 'active',
      dueDate: '2026-09-28',
      faceRegistered: true,
      phone: '+584149876543',
    },
    {
      id: 103,
      name: 'Diego Valera',
      dni: 'V-21.112.334',
      plan: 'Plan Estudiante Mañanas',
      status: 'expired',
      dueDate: '2026-09-05',
      faceRegistered: true,
      phone: '+584245558899',
    },
  ]);

  const [selectedMemberId, setSelectedMemberId] = useState<number>(101);
  const [terminalStatus, setTerminalStatus] = useState<'idle' | 'granted' | 'denied' | 'syncing'>('idle');
  const [logs, setLogs] = useState<SimulatedEvent[]>([
    {
      id: 'log-0',
      timestamp: '12:00:04',
      user: 'Sofía Ramos',
      result: 'GRANTED',
      details: 'Rostro verificado 98.4%. Torniquete 1 abierto durante 5 segundos.',
      payload: { employeeNo: '102', userType: 'normal', validEndTime: '2026-09-28T23:59:59' },
    },
  ]);
  const [lastRequestLog, setLastRequestLog] = useState<any>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId)!;

  // 1. Simular escaneo de rostro en torniquete
  const simulateFaceScan = () => {
    const isAllowed = selectedMember.status === 'active';
    setTerminalStatus(isAllowed ? 'granted' : 'denied');

    const newLog: SimulatedEvent = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      user: selectedMember.name,
      result: isAllowed ? 'GRANTED' : 'DENIED',
      details: isAllowed
        ? `Acceso PERMITIDO por torniquete. Suscripción vigente hasta ${selectedMember.dueDate}.`
        : `Acceso DENEGADO. Suscripción VENCIDA desde ${selectedMember.dueDate}. Torniquete bloqueado.`,
      payload: {
        method: 'POST /ISAPI/AccessControl/AcsEvent?format=json',
        event: {
          employeeNo: String(selectedMember.id),
          name: selectedMember.name,
          majorEventType: 5,
          minorEventType: isAllowed ? 75 : 76,
          description: isAllowed ? 'Access Granted (Face match)' : 'Access Denied (Card or user expired/blacklisted)',
        },
      },
    };

    setLogs((prev) => [newLog, ...prev]);
    setLastRequestLog(newLog.payload);

    setTimeout(() => {
      setTerminalStatus('idle');
    }, 4000);
  };

  // 2. Simular pago en caja -> Desbloqueo ISAPI
  const simulatePaymentAndUnlock = () => {
    setTerminalStatus('syncing');

    // Nueva fecha +30 días
    const newDueDate = '2026-10-08';
    setMembers((prev) =>
      prev.map((m) => (m.id === selectedMember.id ? { ...m, status: 'active', dueDate: newDueDate } : m))
    );

    const isapiPayload = {
      httpMethod: 'PUT',
      endpoint: 'http://192.168.10.50:80/ISAPI/AccessControl/UserInfo/Record?format=json',
      auth: 'Digest username="admin", realm="Hikvision", nonce="d3f78a...", response="987bca..."',
      body: {
        UserInfo: {
          employeeNo: String(selectedMember.id),
          name: selectedMember.name,
          userType: 'normal',
          closeDelay: 5,
          Valid: {
            enable: true,
            beginTime: '2026-09-08T00:00:00',
            endTime: `${newDueDate}T23:59:59`,
            timeType: 'local',
          },
          doorRight: '1',
        },
      },
      response: {
        statusCode: 1,
        statusString: 'OK',
        subStatusCode: 'ok',
        description: 'User permission updated successfully',
      },
    };

    const newLog: SimulatedEvent = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      user: selectedMember.name,
      result: 'SYNC_UNLOCK',
      details: `Pago registrado en caja. HikvisionService envió PUT ISAPI: acceso HABILITADO hasta ${newDueDate}.`,
      payload: isapiPayload,
    };

    setLogs((prev) => [newLog, ...prev]);
    setLastRequestLog(isapiPayload);

    setTimeout(() => {
      setTerminalStatus('idle');
    }, 2000);
  };

  // 3. Simular bloqueo manual o CRON de expiración
  const simulateRevoke = () => {
    setTerminalStatus('syncing');

    setMembers((prev) =>
      prev.map((m) => (m.id === selectedMember.id ? { ...m, status: 'expired' } : m))
    );

    const isapiPayload = {
      httpMethod: 'PUT',
      endpoint: 'http://192.168.10.50:80/ISAPI/AccessControl/UserInfo/Record?format=json',
      auth: 'Digest username="admin", response="auth_hash_hikvision"',
      body: {
        UserInfo: {
          employeeNo: String(selectedMember.id),
          name: selectedMember.name,
          userType: 'blackList', // Bloqueo en hardware
          Valid: {
            enable: false,
            beginTime: '2000-01-01T00:00:00',
            endTime: '2000-01-01T00:00:00',
          },
        },
      },
      response: {
        statusCode: 1,
        statusString: 'OK',
        description: 'User moved to blackList / access revoked',
      },
    };

    const newLog: SimulatedEvent = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      user: selectedMember.name,
      result: 'SYNC_LOCK',
      details: `Orden ISAPI ejecutada: Usuario puesto en 'blackList'. Reconocimiento facial BLOQUEADO en torniquete.`,
      payload: isapiPayload,
    };

    setLogs((prev) => [newLog, ...prev]);
    setLastRequestLog(isapiPayload);

    setTimeout(() => {
      setTerminalStatus('idle');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold mb-2">
          <Cpu className="w-3.5 h-3.5" />
          Integración IoT de Hardware (Hikvision ISAPI Protocol)
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Simulador de Control de Acceso y Sincronización</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Prueba en tiempo real cómo la clase <span className="text-amber-400 font-mono">HikvisionService</span> se comunica
          con la terminal de reconocimiento facial (ej. Serie DS-K1T341 / DS-K1T671) mediante{' '}
          <span className="text-amber-400 font-semibold">HTTP Digest Authentication</span>,
          bloqueando morosos con <code className="text-rose-400 font-mono">userType: 'blackList'</code> o concediendo paso con{' '}
          <code className="text-emerald-400 font-mono">userType: 'normal'</code> y vigencias de fecha.
        </p>
      </div>

      {/* Simulator Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Hardware Mock Display */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center">
            {/* Terminal Top Hardware Bezel */}
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono">192.168.10.50:80</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-900 font-mono text-[10px] text-slate-300">
                Hikvision DS-K1T341AM
              </span>
            </div>

            {/* Facial Recognition Screen Mockup */}
            <div
              className={`w-60 h-72 rounded-2xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-500 ${
                terminalStatus === 'granted'
                  ? 'border-emerald-500 bg-emerald-950/40 shadow-2xl shadow-emerald-500/20'
                  : terminalStatus === 'denied'
                  ? 'border-rose-500 bg-rose-950/40 shadow-2xl shadow-rose-500/20'
                  : terminalStatus === 'syncing'
                  ? 'border-blue-500 bg-blue-950/40'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {terminalStatus === 'idle' && (
                <>
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center mb-3 text-slate-500">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-slate-200">Terminal en Espera</div>
                  <div className="text-xs text-slate-500 mt-1">Acérquese para reconocimiento facial</div>
                </>
              )}

              {terminalStatus === 'granted' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-3 text-emerald-400 animate-pulse">
                    <Unlock className="w-10 h-10" />
                  </div>
                  <div className="text-sm font-black text-emerald-300">¡ACCESO PERMITIDO!</div>
                  <div className="text-xs text-slate-300 mt-1 font-semibold">{selectedMember.name}</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">Torniquete Habilitado (5s)</div>
                </>
              )}

              {terminalStatus === 'denied' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mb-3 text-rose-400 animate-bounce">
                    <Lock className="w-10 h-10" />
                  </div>
                  <div className="text-sm font-black text-rose-300">ACCESO DENEGADO</div>
                  <div className="text-xs text-slate-300 mt-1 font-semibold">{selectedMember.name}</div>
                  <div className="text-[11px] text-rose-400 mt-0.5">Suscripción Vencida ({selectedMember.dueDate})</div>
                </>
              )}

              {terminalStatus === 'syncing' && (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center mb-3 text-blue-400 animate-spin">
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-bold text-blue-300">Sincronizando ISAPI...</div>
                  <div className="text-[11px] text-slate-400 mt-1">Enviando HTTP Digest PUT</div>
                </>
              )}
            </div>

            {/* Hardware Status indicator */}
            <div className="mt-4 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Rele 1: Normal
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> Firmware: V3.2.30
              </span>
            </div>
          </div>

          {/* Member Selector Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Seleccionar Socio en Torniquete
            </h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                    selectedMemberId === m.id
                      ? 'bg-slate-900 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{m.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        m.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {m.status === 'active' ? 'SOLVENTE' : 'VENCIDO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{m.plan}</span>
                    <span className="font-mono">Corte: {m.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls and Real-time Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Trigger Buttons */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              Disparadores de Eventos del Sistema (Laravel &rarr; Hikvision)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={simulateFaceScan}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold gap-1.5 transition-all"
              >
                <Play className="w-4 h-4 text-blue-400" />
                <span>Simular Escaneo Facial</span>
                <span className="text-[10px] text-blue-400/80 font-normal">Torniquete evalúa ISAPI</span>
              </button>

              <button
                onClick={simulatePaymentAndUnlock}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold gap-1.5 transition-all"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Simular Cobro en Caja</span>
                <span className="text-[10px] text-emerald-400/80 font-normal">Renueva + Desbloquea ISAPI</span>
              </button>

              <button
                onClick={simulateRevoke}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold gap-1.5 transition-all"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Simular Bloqueo (CRON)</span>
                <span className="text-[10px] text-rose-400/80 font-normal">userType: 'blackList'</span>
              </button>
            </div>
          </div>

          {/* Live Inspection: Actual Guzzle/ISAPI Request & Payload */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-orange-400" />
                Inspección de Petición HTTP ISAPI (Guzzle Client)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">RFC 7616 Digest Auth</span>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[160px]">
              {lastRequestLog ? (
                <pre>{JSON.stringify(lastRequestLog, null, 2)}</pre>
              ) : (
                <div className="text-slate-500 italic">Presione una de las acciones arriba para capturar el payload ISAPI...</div>
              )}
            </div>
          </div>

          {/* Real-time Access Audit Log Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Logs Recientes de Acceso y Hardware (Tabla access_logs)
            </h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {logs.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {item.result === 'GRANTED' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {item.result === 'DENIED' && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                    {item.result === 'SYNC_UNLOCK' && <Unlock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {item.result === 'SYNC_LOCK' && <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                    <div>
                      <div className="font-semibold text-slate-200">
                        {item.user}{' '}
                        <span className="text-[10px] font-normal text-slate-500">({item.result})</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.details}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
