import React from 'react';
import { GCP_RECOMMENDATION } from '../data/frontendCloudArchitecture';
import { Cloud, ShieldCheck, Network, Lock, Cpu, Server, Database, Clock, FileCheck, Layers, ArrowRight } from 'lucide-react';

export const CloudDeploymentView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
          <Cloud className="w-3.5 h-3.5" />
          Google Cloud Platform (GCP) • Arquitectura Cloud-Native
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Diseño de Infraestructura y Topología de Red</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Solución serverless basada en <span className="text-amber-400 font-semibold">Cloud Run</span> y{' '}
          <span className="text-amber-400 font-semibold">Cloud SQL PostgreSQL</span>, garantizando que los terminales Hikvision
          (ubicados en la red física del gimnasio) se comuniquen de forma segura sin exponer puertos a internet público a través de un túnel{' '}
          <span className="text-amber-400 font-mono">Cloud VPN / VPC Access</span>.
        </p>
      </div>

      {/* Visual Network & Topology Diagram */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-400" />
          Topología de Red: Nube GCP &harr; Red LAN del Gimnasio (Hardware IoT)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* Box 1: GCP Serverless Tier */}
          <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-5 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Google Cloud Run
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded">Serverless</span>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-slate-200">API Laravel 11 (PHP 8.3 FPM)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Escala de 0 a N instancias según demanda</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-slate-200">SPA Vue.js 3 + Pinia</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Distribución estática / CDN Cloud Storage</div>
              </div>
            </div>
          </div>

          {/* Box 2: Managed Database & VPC Bridge */}
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Cloud SQL & VPC
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded">Private IP</span>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-slate-200">PostgreSQL 16 (High Availability)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tipos nativos JSONB + Índices GIN</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Serverless VPC Access + Cloud VPN</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Túnel IPSec directo hacia el router del gimnasio</div>
              </div>
            </div>
          </div>

          {/* Box 3: On-Premises Gym Hardware */}
          <div className="bg-slate-900/80 border border-orange-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Hardware Local (Gimnasio)
              </span>
              <span className="text-[10px] bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded">LAN Segura</span>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Terminal Facial Hikvision (DS-K1T)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">IP LAN: 192.168.10.50 (Puerto 80 ISAPI)</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Torniquetes Físicos de Acceso</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Apertura por relé seco comandada por Hikvision</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Warning about Hardware on Internet */}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="font-bold">Regla de Oro de Seguridad de Red:</strong> Nunca abra puertos del router del gimnasio
            (Port Forwarding) hacia la IP pública para acceder al terminal Hikvision. Los dispositivos IoT son blanco constante de ataques
            de fuerza bruta. La conexión DEBE realizarse mediante <span className="underline">Cloud VPN / Cloud Router</span> o
            un agente ligero que haga túnel inverso seguro hacia Cloud Run.
          </div>
        </div>
      </div>

      {/* Detailed Services Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GCP_RECOMMENDATION.components.map((item) => (
          <div key={item.service} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200">{item.service}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                {item.costModel}
              </span>
            </div>
            <div className="text-xs font-semibold text-amber-400/90">{item.role}</div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.why}</p>
          </div>
        ))}
      </div>

      {/* Production Dockerfile & CI/CD snippet */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          Comandos de Despliegue en Google Cloud Run (CLI gcloud)
        </h4>
        <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
{`# 1. Compilar imagen de contenedor de Laravel en Google Artifact Registry
gcloud builds submit --tag us-central1-docker.pkg.dev/gym-crm-cloud/gym-repo/laravel-api:v1.0

# 2. Desplegar en Cloud Run conectado a la VPC privada y Secret Manager
gcloud run deploy gym-laravel-api \\
    --image us-central1-docker.pkg.dev/gym-crm-cloud/gym-repo/laravel-api:v1.0 \\
    --platform managed \\
    --region us-central1 \\
    --vpc-connector gym-serverless-vpc \\
    --set-secrets="TWILIO_AUTH_TOKEN=twilio-token:latest,DB_PASSWORD=pg-password:latest" \\
    --set-env-vars="DB_HOST=10.45.0.3,DB_PORT=5432,DB_DATABASE=gym_db,DB_USERNAME=gym_user" \\
    --min-instances=0 \\
    --max-instances=10 \\
    --allow-unauthenticated

# 3. Configurar Cloud Scheduler para invocar el Kernel CRON de Laravel diariamente
gcloud scheduler jobs create http gym-cron-deactivate-expired \\
    --schedule="1 0 * * *" \\
    --uri="https://gym-laravel-api-xyz-uc.a.run.app/api/cron/deactivate-expired" \\
    --http-method=POST \\
    --oidc-service-account-email=cloud-scheduler-sa@gym-crm-cloud.iam.gserviceaccount.com`}
        </pre>
      </div>
    </div>
  );
};
