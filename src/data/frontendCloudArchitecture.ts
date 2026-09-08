export const VUE_STRUCTURE = `
frontend-vue/
├── src/
│   ├── assets/
│   │   └── main.css                 # Tailwind CSS v4 / estilos base
│   ├── components/
│   │   ├── common/
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseModal.vue
│   │   │   └── StatusBadge.vue      # Badge 'Solvente', 'Vencido', 'Por Vencer'
│   │   └── cashier/
│   │       ├── PaymentMethodTabs.vue # Selector dinámico de métodos (Efectivo, POS, Zelle, etc.)
│   │       └── UserQuickSearch.vue  # Búsqueda instantánea por DNI / Rostro / Teléfono
│   ├── layouts/
│   │   ├── AdminLayout.vue          # Sidebar con métricas, gestión de planes y hardware
│   │   ├── CashierLayout.vue        # Layout enfocado en velocidad de cobro y arqueo
│   │   └── ClientLayout.vue         # Portal limpio 'Mobile-First' para el socio
│   ├── router/
│   │   └── index.ts                 # Vue Router 4 con Navigation Guards de RBAC
│   ├── services/
│   │   └── api.ts                   # Instancia Axios con interceptores JWT Bearer
│   ├── stores/
│   │   ├── auth.ts                  # Pinia Store: usuario, roles y permisos
│   │   ├── cashier.ts               # Pinia Store: carrito de cobro, tasas de cambio y recibos
│   │   └── clientPortal.ts          # Pinia Store: saldo pendiente, días restantes, QR de acceso
│   └── views/
│       ├── auth/
│       │   └── LoginView.vue
│       ├── admin/
│       │   ├── DashboardView.vue    # KPIs: ingresos, aforo actual del gimnasio, morosidad
│       │   ├── PlansView.vue        # ABM de planes y restricciones horarias
│       │   └── HardwareView.vue     # Telemetría de torniquetes Hikvision y logs en vivo
│       ├── cashier/
│       │   ├── PosTerminalView.vue  # Registro manual de pagos y emisión de comprobantes
│       │   └── DailyCloseView.vue   # Cuadre de caja por método de pago
│       └── client/
│           ├── MyMembershipView.vue # Estado del plan, fecha de corte y saldo
│           └── AccessPassView.vue   # Credencial digital y código QR de respaldo
`;

export const VUE_CODE_SAMPLES = {
  router: `// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/auth/LoginView.vue'), meta: { public: true } },
    
    // Portal de Administrador (RBAC: 'admin')
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, roles: ['admin'] },
      children: [
        { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'plans', component: () => import('@/views/admin/PlansView.vue') },
        { path: 'hardware', component: () => import('@/views/admin/HardwareView.vue') },
      ]
    },

    // Módulo de Caja (RBAC: 'cashier', 'admin')
    {
      path: '/cashier',
      component: () => import('@/layouts/CashierLayout.vue'),
      meta: { requiresAuth: true, roles: ['cashier', 'admin'] },
      children: [
        { path: 'pos', component: () => import('@/views/cashier/PosTerminalView.vue') },
        { path: 'close', component: () => import('@/views/cashier/DailyCloseView.vue') },
      ]
    },

    // Portal de Clientes / Socios (RBAC: 'client')
    {
      path: '/portal',
      component: () => import('@/layouts/ClientLayout.vue'),
      meta: { requiresAuth: true, roles: ['client'] },
      children: [
        { path: 'status', component: () => import('@/views/client/MyMembershipView.vue') },
        { path: 'card', component: () => import('@/views/client/AccessPassView.vue') },
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ]
});

// Navigation Guard estricto para control de accesos
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.public) return next();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  const allowedRoles = to.meta.roles as string[] | undefined;
  if (allowedRoles && !allowedRoles.some(r => auth.hasRole(r))) {
    return next(auth.defaultRedirectPath);
  }

  next();
});

export default router;`,

  piniaAuth: `// src/stores/auth.ts
import { defineStore } from 'pinia';
import api from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('gym_token') || '',
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    hasRole: (state) => (role: string) => state.user?.roles.includes(role) ?? false,
    defaultRedirectPath: (state) => {
      if (state.user?.roles.includes('admin')) return '/admin/dashboard';
      if (state.user?.roles.includes('cashier')) return '/cashier/pos';
      return '/portal/status';
    }
  },
  actions: {
    async login(credentials: { email: string; password: string }) {
      const response = await api.post('/auth/login', credentials);
      this.token = response.data.access_token;
      this.user = response.data.user;
      localStorage.setItem('gym_token', this.token);
    },
    logout() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('gym_token');
    }
  }
});`,

  cashierView: `<!-- src/views/cashier/PosTerminalView.vue -->
<template>
  <div class="pos-container p-6 bg-slate-900 text-white min-h-screen">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Terminal de Caja - Cobro de Membresías</h1>
      <div class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm">
        Cajero: {{ auth.user?.name }}
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna 1: Búsqueda de Cliente -->
      <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
        <label class="block text-sm text-slate-400 mb-2">Buscar Cliente (Cédula / DNI)</label>
        <div class="flex gap-2 mb-4">
          <input 
            v-model="dniQuery" 
            placeholder="Ej: 24890123" 
            class="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg"
            @keyup.enter="searchClient"
          />
          <button @click="searchClient" class="bg-blue-600 px-4 py-2 rounded-lg font-medium">Buscar</button>
        </div>

        <div v-if="client" class="client-card bg-slate-900/80 p-4 rounded-lg border border-slate-700">
          <div class="font-bold text-lg">{{ client.name }} {{ client.last_name }}</div>
          <p class="text-sm text-slate-400">Tel: {{ client.phone }}</p>
          <div class="mt-3 flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded" :class="client.is_overdue ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'">
              {{ client.is_overdue ? 'VENCIDO (Torniquete Bloqueado)' : 'ACTIVO' }}
            </span>
            <span class="text-xs text-slate-400">Corte: {{ client.current_end_date }}</span>
          </div>
        </div>
      </div>

      <!-- Columna 2: Selección de Plan y Método -->
      <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 lg:col-span-2">
        <h2 class="font-bold text-lg mb-4">Procesar Renovación / Cobro</h2>
        
        <!-- Planes disponibles -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div 
            v-for="plan in plans" 
            :key="plan.id"
            @click="selectedPlan = plan"
            class="cursor-pointer p-4 rounded-xl border transition-all"
            :class="selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900'"
          >
            <div class="font-bold">{{ plan.name }}</div>
            <div class="text-2xl font-black text-blue-400 mt-1">\${{ plan.price }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ plan.duration_days }} días de acceso</div>
          </div>
        </div>

        <!-- Métodos de Pago Extensibles -->
        <div class="mb-6">
          <label class="block text-sm text-slate-400 mb-2">Método de Pago</label>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="method in paymentMethods" 
              :key="method.id"
              @click="selectedMethod = method"
              class="px-4 py-2 rounded-lg border text-sm"
              :class="selectedMethod?.id === method.id ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-700'"
            >
              {{ method.name }}
            </button>
          </div>
        </div>

        <!-- Campos condicionales del método (JSONB) -->
        <div v-if="selectedMethod?.requires_reference" class="mb-6">
          <label class="block text-sm text-slate-400 mb-2">Número de Referencia / Lote POS</label>
          <input 
            v-model="referenceNumber" 
            placeholder="Ej: REF-984321" 
            class="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg"
          />
        </div>

        <button 
          @click="processPayment" 
          :disabled="!canPay || processing"
          class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span v-if="processing">Enviando orden a Hikvision...</span>
          <span v-else>Confirmar Cobro e Habilitar Torniquete</span>
        </button>
      </div>
    </div>
  </div>
</template>`
};

export const GCP_RECOMMENDATION = {
  overview: 'Arquitectura Cloud-Native en Google Cloud Platform (GCP) diseñada para alta disponibilidad, coste escalable a cero en horas valle y conectividad privada segura con el hardware local del gimnasio.',
  components: [
    {
      service: 'Google Cloud Run',
      role: 'Backend API Laravel (PHP 8.3 FPM + Nginx Container) & Frontend Vue.js SPA',
      why: 'Ejecución serverless basada en contenedores Docker. Escala a cero por la noche para ahorrar costes y escala horizontalmente de inmediato durante picos de entrada matutinos o vespertinos. Soporta 0 costos de mantenimiento de servidores Linux.',
      costModel: 'Pay-per-use (miligramos de CPU/segundo)'
    },
    {
      service: 'Google Cloud SQL (PostgreSQL 16)',
      role: 'Base de Datos Relacional Central',
      why: 'Soporte nativo para tipos JSONB e índices GIN (vitales para nuestra arquitectura extensible de métodos de pago y auditoría forense de ISAPI). Configuración con High Availability (Multi-AZ) y copias de seguridad automatizadas diarias con retención configurable.',
      costModel: 'Instancia db-f1-micro para dev o db-custom-2-7680 para producción con almacenamiento escalable SSD.'
    },
    {
      service: 'Serverless VPC Access + Cloud VPN / Cloud NAT',
      role: 'Conexión Segura con el Lector Facial Hikvision Local',
      why: 'CRÍTICO: El hardware Hikvision está en una red física LAN local (gimnasio). No debe exponerse a internet público con puertos abiertos. Mediante un Gateway VPN (o Cloud Router con IPSec / WireGuard), Cloud Run se comunica con la IP privada del terminal (ej. 192.168.1.50) a través del VPC Connector de forma 100% encriptada y privada.',
      costModel: 'Tarifa fija por conector VPC + tráfico'
    },
    {
      service: 'Google Cloud Scheduler + Cloud Tasks',
      role: 'Orquestación de CRONs y Colas Asíncronas',
      why: 'Cloud Scheduler hace peticiones HTTPS protegidas con IAM hacia los endpoints de Laravel (ej: /api/cron/check-expiring) a las horas programadas. Cloud Tasks encola los reintentos de Twilio y los envíos ISAPI a los torniquetes para no bloquear la respuesta HTTP al cajero.',
      costModel: 'Prácticamente gratuito para los primeros millones de llamadas'
    },
    {
      service: 'Secret Manager & Cloud Storage',
      role: 'Gestión de Credenciales & Backups Biométricos',
      why: 'Secret Manager custodia las credenciales de Twilio (SID/Token), credenciales de Google Workspace SMTP, claves privadas y contraseñas de terminales Hikvision. Cloud Storage aloja fotos de perfil de socios para enrolamiento biométrico facial.',
      costModel: 'Menos de $1 USD/mes'
    }
  ]
};
