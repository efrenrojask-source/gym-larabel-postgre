import React, { useState } from 'react';
import { DATABASE_TABLES } from '../data/databaseSchema';
import { SchemaTable } from '../types/architecture';
import { Database, Key, Table as TableIcon, Copy, Check, Info, Layers, Code, ArrowRight } from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<SchemaTable>(DATABASE_TABLES[0]);
  const [copied, setCopied] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'erd' | 'table' | 'migration'>('erd');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              Arquitectura de Base de Datos PostgreSQL 16
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Esquema Relacional y Migraciones Laravel</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Diseñado con normalización 3FN, soporte de metadatos dinámicos mediante tipos nativos{' '}
              <span className="text-amber-400 font-mono">JSONB</span> (para soportar N métodos de pago sin alterar el esquema central) e índices{' '}
              <span className="text-amber-400 font-mono">GIN</span> y B-Tree optimizados para consultas del CRON y torniquetes.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setViewMode('erd')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'erd' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagrama ERD
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estructura de Columnas
            </button>
            <button
              onClick={() => setViewMode('migration')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'migration' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Código Migración PHP
            </button>
          </div>
        </div>
      </div>

      {/* ERD Interactive Visual Diagram */}
      {viewMode === 'erd' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Diagrama Relacional de Entidades (Click en una tabla para ver su detalle)
            </h3>
            <span className="text-xs text-slate-500">Relaciones 1:N y M:N validadas en PostgreSQL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DATABASE_TABLES.map((table) => {
              const isSelected = selectedTable.id === table.id;
              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                    <span className="font-mono font-bold text-sm text-slate-200">{table.name}</span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                        table.category === 'auth'
                          ? 'bg-purple-500/10 text-purple-400'
                          : table.category === 'billing'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : table.category === 'hardware'
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {table.category}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {table.columns.slice(0, 5).map((col) => (
                      <div key={col.name} className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1">
                          {col.isPrimary && <Key className="w-3 h-3 text-amber-400" />}
                          {col.isForeign && <span className="text-[10px] text-blue-400 font-bold">FK</span>}
                          <span className={col.isPrimary ? 'text-amber-200 font-medium' : ''}>{col.name}</span>
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">{col.type}</span>
                      </div>
                    ))}
                    {table.columns.length > 5 && (
                      <div className="text-[11px] text-slate-600 italic pt-1">
                        + {table.columns.length - 5} columnas más...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Relational Flow Map */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-300">Flujo Relacional Clave:</span>
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-amber-400">users</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-blue-400">subscriptions</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-emerald-400">payments</span>
              <span className="text-slate-500">(1:N)</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-emerald-400">payment_methods (JSONB)</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-emerald-400">payments.metadata</span>
              <span className="text-slate-500">(Extensible)</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-amber-400">users.hikvision_employee_no</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-orange-400">access_logs & ISAPI Hardware</span>
            </div>
          </div>
        </div>
      )}

      {/* Table Columns Detailed View */}
      {viewMode === 'table' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table List selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Tablas del Sistema</label>
            {DATABASE_TABLES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTable(t)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
                  selectedTable.id === t.id
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  <span>{t.name}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{t.columns.length} cols</span>
              </button>
            ))}
          </div>

          {/* Columns Table */}
          <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="font-mono text-amber-400">{selectedTable.name}</span>
                  <span className="text-xs text-slate-500 font-normal">({selectedTable.description})</span>
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(selectedTable.migrationCode, selectedTable.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-all"
              >
                {copied === selectedTable.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === selectedTable.id ? 'Copiado' : 'Copiar Migración'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Columna</th>
                    <th className="py-2.5 px-3 font-semibold">Tipo PostgreSQL</th>
                    <th className="py-2.5 px-3 font-semibold">Restricciones</th>
                    <th className="py-2.5 px-3 font-semibold">Default</th>
                    <th className="py-2.5 px-3 font-semibold">Propósito de Negocio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {selectedTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-mono font-medium flex items-center gap-1.5">
                        {col.isPrimary && <Key className="w-3 h-3 text-amber-400" title="Primary Key" />}
                        {col.isForeign && <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1 rounded">FK</span>}
                        <span className={col.isPrimary ? 'text-amber-300 font-bold' : ''}>{col.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{col.type}</td>
                      <td className="py-2.5 px-3">
                        {col.nullable ? (
                          <span className="text-slate-500">NULL</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">NOT NULL</span>
                        )}
                        {col.references && (
                          <span className="ml-1 text-[11px] text-blue-400">→ {col.references}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{col.defaultValue || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Indexes Info */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Índices de Rendimiento (PostgreSQL)
              </h4>
              <div className="space-y-1">
                {selectedTable.indexes.map((idx, i) => (
                  <div key={i} className="text-xs font-mono bg-slate-900 p-2 rounded-lg text-amber-300/90 border border-slate-800/80">
                    {idx}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Migration Code View */}
      {viewMode === 'migration' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-slate-300">
                database/migrations/2026_01_01_000000_create_{selectedTable.name}_table.php
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(selectedTable.migrationCode, `mig-${selectedTable.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-all"
            >
              {copied === `mig-${selectedTable.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === `mig-${selectedTable.id}` ? 'Copiado al portapapeles' : 'Copiar Archivo PHP'}</span>
            </button>
          </div>

          <div className="p-6 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-slate-300 leading-relaxed">
              <code>{selectedTable.migrationCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Scalable Architecture Callout for Multi-Payment Methods */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-1">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Arquitectura Escalable de Métodos de Pago (Efectivo, POS, Zelle, Pago Móvil, Stripe)
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              En lugar de crear columnas rígidas como <code className="text-emerald-300">bank_name</code> o{' '}
              <code className="text-emerald-300">zelle_email</code> en la tabla <code className="text-amber-300">payments</code>,
              se desacopla el comportamiento usando <span className="font-semibold text-white">JSONB</span> en{' '}
              <code className="text-emerald-300">payment_methods.config_schema</code> y{' '}
              <code className="text-emerald-300">payments.metadata</code>, acelerado con un índice{' '}
              <span className="font-semibold text-white">GIN</span>. Esto permite incorporar cualquier pasarela o método local sin alterar tablas ni generar bloqueos de esquema (zero-downtime DDL).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
