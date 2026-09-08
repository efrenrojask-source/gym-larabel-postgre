import React, { useState } from 'react';
import { BACKEND_STRUCTURE, CODE_SNIPPETS } from '../data/backendArchitecture';
import { Server, FolderTree, Code, Copy, Check, CheckCircle2, ShieldAlert } from 'lucide-react';

export const BackendArchitectureView: React.FC = () => {
  const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const selectedSnippet = CODE_SNIPPETS[selectedSnippetIndex];

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
          <Server className="w-3.5 h-3.5" />
          Backend Laravel 11 • Service Pattern & Event-Driven Architecture
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Estructura Modular, Controladores, Servicios y CRON</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Arquitectura desacoplada basada en principios <span className="text-amber-400 font-semibold">SOLID</span>:
          la lógica de hardware (Hikvision ISAPI) y notificaciones (Twilio y Google SMTP) no ensucian los controladores,
          sino que se aíslan en <span className="text-amber-400 font-mono">Services</span> e interactúan de forma reactiva mediante{' '}
          <span className="text-amber-400 font-mono">Domain Events</span> y colas asíncronas (<span className="text-amber-400 font-mono">Jobs</span>).
        </p>
      </div>

      {/* SOLID Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          {
            letter: 'S',
            title: 'Single Responsibility',
            desc: 'TwilioWhatsAppService solo envía mensajes; HikvisionService solo habla ISAPI.',
          },
          {
            letter: 'O',
            title: 'Open / Closed',
            desc: 'Nuevos métodos de pago o terminales se agregan mediante schemas JSONB e interfaces sin modificar clases núcleo.',
          },
          {
            letter: 'L',
            title: 'Liskov Substitution',
            desc: 'Cualquier hardware que implemente AccessControlServiceInterface puede sustituir a Hikvision.',
          },
          {
            letter: 'I',
            title: 'Interface Segregation',
            desc: 'Interfaces pequeñas y específicas en lugar de interfaces monolíticas gigantes.',
          },
          {
            letter: 'D',
            title: 'Dependency Inversion',
            desc: 'Controllers y Jobs dependen de interfaces (AccessControlServiceInterface), resueltas por el Service Container de Laravel.',
          },
        ].map((item) => (
          <div key={item.letter} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                {item.letter}
              </span>
              <span className="font-bold text-xs text-slate-200">{item.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Snippets & Directory Tree */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-400" />
              Archivos del Backend (Paso 2)
            </h3>
            <div className="space-y-1">
              {CODE_SNIPPETS.map((snippet, idx) => {
                const isSelected = selectedSnippetIndex === idx;
                return (
                  <button
                    key={snippet.filePath}
                    onClick={() => setSelectedSnippetIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-amber-400 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold truncate">{snippet.title}</div>
                    <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{snippet.filePath}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Tree Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
              <FolderTree className="w-4 h-4 text-blue-400" />
              Árbol de Directorios Laravel
            </div>
            <pre className="text-[11px] font-mono text-slate-400 p-2 overflow-x-auto max-h-[260px] scrollbar-none leading-relaxed">
              {BACKEND_STRUCTURE}
            </pre>
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-slate-800 gap-2">
            <div>
              <div className="text-sm font-bold text-slate-200">{selectedSnippet.title}</div>
              <div className="text-xs font-mono text-amber-400/90">{selectedSnippet.filePath}</div>
            </div>

            <button
              onClick={() => copyCode(selectedSnippet.code, selectedSnippet.filePath)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 self-start sm:self-auto transition-all"
            >
              {copied === selectedSnippet.filePath ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied === selectedSnippet.filePath ? 'Copiado' : 'Copiar Código'}</span>
            </button>
          </div>

          {/* Explanation bar */}
          <div className="bg-slate-900/40 px-6 py-3 border-b border-slate-800/80 text-xs text-slate-300">
            <p>{selectedSnippet.explanation}</p>
            {selectedSnippet.solidPrinciples && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedSnippet.solidPrinciples.map((sp, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {sp}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Code body */}
          <div className="p-6 overflow-x-auto flex-1 max-h-[600px]">
            <pre className="text-xs font-mono text-slate-300 leading-relaxed">
              <code>{selectedSnippet.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* CRON Timing Diagram */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          Cronograma Diario de Automatización (Orquestado por Cloud Scheduler)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="font-mono text-rose-400 font-bold text-sm mb-1">00:01 AM (Corte Físico)</div>
            <div className="font-semibold text-slate-300 mb-1">gym:deactivate-expired</div>
            <p className="text-slate-400 text-[11px]">
              Evalúa suscripciones con end_date &lt; hoy. Cambia estatus a expired y despacha HTTP PUT con userType: blackList
              hacia las terminales Hikvision para cerrar torniquetes inmediatamente.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="font-mono text-amber-400 font-bold text-sm mb-1">08:00 AM (Recordatorio Twilio)</div>
            <div className="font-semibold text-slate-300 mb-1">gym:check-expiring --days=3</div>
            <p className="text-slate-400 text-[11px]">
              Envía mensaje preventivo al cliente vía Twilio WhatsApp y correo vía Google SMTP advirtiendo que su plan vence
              en 3 días para evitar bloqueos en torniquetes.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="font-mono text-purple-400 font-bold text-sm mb-1">09:00 AM (Marketing & Fidelización)</div>
            <div className="font-semibold text-slate-300 mb-1">gym:send-birthday-greetings</div>
            <p className="text-slate-400 text-[11px]">
              Filtra clientes cuyo cumpleaños coincida con la fecha actual y envía mensaje personalizado de felicitaciones con cupón
              de 20% de descuento para su próxima renovación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
