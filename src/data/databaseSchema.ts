import { SchemaTable } from '../types/architecture';

export const DATABASE_TABLES: SchemaTable[] = [
  {
    id: 'roles',
    name: 'roles',
    category: 'auth',
    description: 'Catálogo de roles del sistema bajo RBAC (Administrador, Cajero, Cliente, Entrenador).',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'Identificador único autoincremental' },
      { name: 'name', type: 'VARCHAR(50)', nullable: false, description: 'Slug único del rol (admin, cashier, client)' },
      { name: 'display_name', type: 'VARCHAR(100)', nullable: false, description: 'Nombre legible (Administrador General)' },
      { name: 'description', type: 'TEXT', nullable: true, description: 'Descripción de alcances y privilegios' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Auditoría de creación' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Auditoría de actualización' },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_roles_name ON roles(name);'],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: roles (RBAC)
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique()->comment('Slug del rol: admin, cashier, client');
            $table->string('display_name', 100);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Tabla pivote para asignación N:M de roles a usuarios
        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->primary(['user_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('roles');
    }
};`,
  },
  {
    id: 'users',
    name: 'users',
    category: 'auth',
    description: 'Almacena credenciales, datos personales, fecha de cumpleaños (para promociones) y código de enrolamiento biométrico Hikvision.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'ID primario' },
      { name: 'dni_number', type: 'VARCHAR(30)', nullable: false, description: 'Cédula / DNI / Pasaporte' },
      { name: 'name', type: 'VARCHAR(100)', nullable: false, description: 'Nombres del usuario' },
      { name: 'last_name', type: 'VARCHAR(100)', nullable: false, description: 'Apellidos del usuario' },
      { name: 'email', type: 'VARCHAR(150)', nullable: false, description: 'Correo electrónico para Google SMTP' },
      { name: 'phone', type: 'VARCHAR(30)', nullable: false, description: 'Teléfono E.164 para Twilio WhatsApp (+58412..., +52...)' },
      { name: 'birth_date', type: 'DATE', nullable: false, description: 'Fecha de nacimiento (filtro para CRON de cumpleaños)' },
      { name: 'hikvision_employee_no', type: 'VARCHAR(32)', nullable: true, description: 'ID de usuario mapeado en el lector facial ISAPI' },
      { name: 'facial_registered', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Indica si tiene rostro enrolado en terminal' },
      { name: 'status', type: 'VARCHAR(20)', nullable: false, defaultValue: "'active'", description: 'active, inactive, blacklisted' },
      { name: 'password', type: 'VARCHAR(255)', nullable: false, description: 'Hash Bcrypt/Argon2' },
      { name: 'remember_token', type: 'VARCHAR(100)', nullable: true, description: 'Token de sesión' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Fecha creación' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Fecha actualización' },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_users_email ON users(email);',
      'CREATE UNIQUE INDEX idx_users_dni ON users(dni_number);',
      'CREATE UNIQUE INDEX idx_users_hikvision_emp ON users(hikvision_employee_no);',
      'CREATE INDEX idx_users_birth_date ON users(birth_date);',
    ],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: users
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('dni_number', 30)->unique()->comment('Documento de Identidad');
            $table->string('name', 100);
            $table->string('last_name', 100);
            $table->string('email', 150)->unique();
            $table->string('phone', 30)->comment('Formato internacional E.164 para WhatsApp Twilio');
            $table->date('birth_date')->comment('Crucial para CRON de felicitaciones y cupones');
            $table->string('hikvision_employee_no', 32)->nullable()->unique()
                  ->comment('EmployeeNo sincronizado con hardware Hikvision ISAPI');
            $table->boolean('facial_registered')->default(false)
                  ->comment('Flag que valida si el lector tiene foto biométrica cargada');
            $table->enum('status', ['active', 'inactive', 'blacklisted'])->default('active');
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();

            // Índices optimizados para PostgreSQL
            $table->index(['birth_date'], 'idx_users_birth_date');
            $table->index(['status'], 'idx_users_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};`,
  },
  {
    id: 'plans',
    name: 'plans',
    category: 'subscriptions',
    description: 'Catálogo de planes de gimnasio (Básico, VIP, Estudiante, Parejas, Pases Libres).',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'ID primario' },
      { name: 'code', type: 'VARCHAR(50)', nullable: false, description: 'Código único de plan (PLAN_VIP_ANUAL)' },
      { name: 'name', type: 'VARCHAR(120)', nullable: false, description: 'Nombre descriptivo (Plan VIP Total)' },
      { name: 'price', type: 'NUMERIC(10,2)', nullable: false, description: 'Precio base en USD o divisa base' },
      { name: 'duration_days', type: 'INTEGER', nullable: false, description: 'Duración en días (30 para mensual, 365 anual)' },
      { name: 'access_start_time', type: 'TIME', nullable: true, description: 'Hora inicio permitida (ej. 06:00:00 para horario restringido)' },
      { name: 'access_end_time', type: 'TIME', nullable: true, description: 'Hora fin permitida (ej. 23:00:00)' },
      { name: 'allow_all_zones', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Acceso a área de pesas, cardio, sauna, etc.' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Si está disponible para venta' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Creación' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Actualización' },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_plans_code ON plans(code);'],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: plans
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Identificador de negocio ej: PLAN-VIP-01');
            $table->string('name', 120);
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('duration_days')->default(30)->comment('30, 90, 180, 365');
            $table->time('access_start_time')->nullable()->comment('Restricción horaria para torniquetes');
            $table->time('access_end_time')->nullable();
            $table->boolean('allow_all_zones')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};`,
  },
  {
    id: 'subscriptions',
    name: 'subscriptions',
    category: 'subscriptions',
    description: 'Membresías activas o históricas del cliente con fechas de corte y control de sincronización de acceso.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'ID de la suscripción' },
      { name: 'user_id', type: 'BIGINT', nullable: false, isForeign: true, references: 'users.id', description: 'Cliente asociado' },
      { name: 'plan_id', type: 'BIGINT', nullable: false, isForeign: true, references: 'plans.id', description: 'Plan contratado' },
      { name: 'start_date', type: 'DATE', nullable: false, description: 'Fecha de inicio del ciclo' },
      { name: 'end_date', type: 'DATE', nullable: false, description: 'Fecha límite de vencimiento (Corte)' },
      { name: 'status', type: 'VARCHAR(20)', nullable: false, defaultValue: "'active'", description: 'active, expired, pending_payment, cancelled' },
      { name: 'hardware_synced', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Garantiza si Hikvision ya recibió el estatus' },
      { name: 'expiration_warned_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Timestamp de alerta preventiva WhatsApp enviada' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Creación' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Actualización' },
    ],
    indexes: [
      'CREATE INDEX idx_subs_user ON subscriptions(user_id);',
      'CREATE INDEX idx_subs_status_end ON subscriptions(status, end_date);',
    ],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: subscriptions
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('plan_id')->constrained('plans')->onDelete('restrict');
            $table->date('start_date');
            $table->date('end_date')->comment('Fecha de corte: base de evaluación para Hikvision y Twilio');
            $table->enum('status', ['active', 'expired', 'pending_payment', 'cancelled'])->default('active');
            $table->boolean('hardware_synced')->default(false)
                  ->comment('true si el terminal Hikvision ISAPI ya tiene el privilegio activo');
            $table->timestamp('expiration_warned_at')->nullable()
                  ->comment('Evita duplicar envíos de WhatsApp de advertencia preventiva');
            $table->timestamps();

            // Índices de alto rendimiento para el CRON diario
            $table->index(['status', 'end_date'], 'idx_subscriptions_status_end_date');
            $table->index(['user_id', 'status'], 'idx_subscriptions_user_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};`,
  },
  {
    id: 'payment_methods',
    name: 'payment_methods',
    category: 'billing',
    description: 'Arquitectura escalable basada en JSONB para agregar cualquier método de pago sin alterar el esquema.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'ID primario' },
      { name: 'code', type: 'VARCHAR(40)', nullable: false, description: 'cash, pos_card, bank_transfer, zelle, pagomovil, stripe' },
      { name: 'name', type: 'VARCHAR(80)', nullable: false, description: 'Efectivo USD, Punto de Venta, Zelle, Pago Móvil' },
      { name: 'currency', type: 'VARCHAR(10)', nullable: false, defaultValue: "'USD'", description: 'USD, VES, EUR, MXN' },
      { name: 'requires_reference', type: 'BOOLEAN', nullable: false, defaultValue: 'false', description: 'Si exige número de comprobante/lote' },
      { name: 'config_schema', type: 'JSONB', nullable: true, description: 'Definición de campos requeridos (banco, cédula, tel, etc.)' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Habilitado en caja' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Creación' },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_payment_methods_code ON payment_methods(code);'],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: payment_methods (Arquitectura extensible mediante JSONB)
     */
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique()->comment('cash, pos_card, bank_transfer, zelle, pagomovil');
            $table->string('name', 80);
            $table->string('currency', 10)->default('USD');
            $table->boolean('requires_reference')->default(false);
            $table->jsonb('config_schema')->nullable()
                  ->comment('Metadatos de validación: campos requeridos en frontend dinámico');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};`,
  },
  {
    id: 'payments',
    name: 'payments',
    category: 'billing',
    description: 'Transacciones de pago en caja física o pasarela, con trazabilidad al cajero, metadata en JSONB y disparo de desbloqueo.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'ID de recibo de pago' },
      { name: 'receipt_number', type: 'VARCHAR(40)', nullable: false, description: 'Número de factura/recibo único (REC-2026-0001)' },
      { name: 'subscription_id', type: 'BIGINT', nullable: false, isForeign: true, references: 'subscriptions.id', description: 'Suscripción pagada' },
      { name: 'user_id', type: 'BIGINT', nullable: false, isForeign: true, references: 'users.id', description: 'Cliente que paga' },
      { name: 'payment_method_id', type: 'BIGINT', nullable: false, isForeign: true, references: 'payment_methods.id', description: 'Método usado' },
      { name: 'cashier_id', type: 'BIGINT', nullable: false, isForeign: true, references: 'users.id', description: 'Cajero que registró la transacción' },
      { name: 'amount', type: 'NUMERIC(12,2)', nullable: false, description: 'Monto cobrado en divisa del método' },
      { name: 'exchange_rate', type: 'NUMERIC(12,4)', nullable: false, defaultValue: '1.0000', description: 'Tasa de cambio aplicada al momento' },
      { name: 'amount_usd', type: 'NUMERIC(12,2)', nullable: false, description: 'Equivalente normalizado en USD' },
      { name: 'reference_number', type: 'VARCHAR(100)', nullable: true, description: 'N° de comprobante bancario / autorización POS' },
      { name: 'metadata', type: 'JSONB', nullable: true, description: 'Detalles del método (Banco emisor, últimos 4 dígitos, etc.)' },
      { name: 'status', type: 'VARCHAR(20)', nullable: false, defaultValue: "'completed'", description: 'completed, refunded, voided' },
      { name: 'paid_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'CURRENT_TIMESTAMP', description: 'Fecha y hora exacta del cobro' },
    ],
    indexes: [
      'CREATE UNIQUE INDEX idx_payments_receipt ON payments(receipt_number);',
      'CREATE INDEX idx_payments_user ON payments(user_id);',
      'CREATE INDEX idx_payments_paid_at ON payments(paid_at);',
      'CREATE INDEX idx_payments_metadata_gin ON payments USING GIN(metadata);',
    ],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: payments (Módulo de Caja y Facturación)
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number', 40)->unique()->comment('Folio consecutivo');
            $table->foreignId('subscription_id')->constrained('subscriptions')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('users')->comment('Cliente pagador');
            $table->foreignId('payment_method_id')->constrained('payment_methods');
            $table->foreignId('cashier_id')->constrained('users')->comment('Cajero responsable');
            $table->decimal('amount', 12, 2)->comment('Monto en moneda original');
            $table->decimal('exchange_rate', 12, 4)->default(1.0000);
            $table->decimal('amount_usd', 12, 2)->comment('Monto normalizado para estadísticas');
            $table->string('reference_number', 100)->nullable();
            $table->jsonb('metadata')->nullable()->comment('Almacena atributos específicos (banco, id tx, etc.)');
            $table->enum('status', ['completed', 'refunded', 'voided'])->default('completed');
            $table->timestamp('paid_at')->useCurrent();
            $table->timestamps();

            // Índices optimizados para reportes de cierre de caja
            $table->index(['paid_at', 'cashier_id'], 'idx_payments_caja_diaria');
            // Índice GIN para búsquedas rápidas dentro del JSONB
            $table->rawIndex('CREATE INDEX idx_payments_metadata_gin ON payments USING GIN (metadata);');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};`,
  },
  {
    id: 'access_logs',
    name: 'access_logs',
    category: 'hardware',
    description: 'Historial inmutable de aperturas de torniquete, denegaciones por morosidad y eventos biométricos.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'ID de log' },
      { name: 'user_id', type: 'BIGINT', nullable: true, isForeign: true, references: 'users.id', description: 'Cliente reconocido (null si no está registrado)' },
      { name: 'terminal_id', type: 'VARCHAR(50)', nullable: false, description: 'Identificador del terminal Hikvision' },
      { name: 'event_time', type: 'TIMESTAMPTZ', nullable: false, description: 'Hora reportada por el dispositivo' },
      { name: 'access_type', type: 'VARCHAR(20)', nullable: false, description: 'entry (entrada), exit (salida)' },
      { name: 'is_granted', type: 'BOOLEAN', nullable: false, description: 'true: torniquete abrió / false: denegado' },
      { name: 'rejection_reason', type: 'VARCHAR(100)', nullable: true, description: 'SUBSCRIPTION_EXPIRED, SCHEDULE_OUT_OF_BOUNDS, UNKNOWN_FACE' },
      { name: 'raw_payload', type: 'JSONB', nullable: true, description: 'Evento JSON/XML original recibido por Webhook ISAPI' },
    ],
    indexes: [
      'CREATE INDEX idx_access_logs_user_time ON access_logs(user_id, event_time DESC);',
      'CREATE INDEX idx_access_logs_granted ON access_logs(is_granted);',
    ],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: access_logs (Auditoría física y telemetría)
     */
    public function up(): void
    {
        Schema::create('access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('terminal_id', 50)->comment('IP o serial del terminal Hikvision');
            $table->timestamp('event_time')->useCurrent();
            $table->enum('access_type', ['entry', 'exit'])->default('entry');
            $table->boolean('is_granted')->comment('true = Apertura exitosa, false = Denegado');
            $table->string('rejection_reason', 100)->nullable();
            $table->jsonb('raw_payload')->nullable()->comment('Evento ISAPI original para auditoría forense');
            $table->timestamps();

            // Índices para monitoreo en vivo en pantalla de recepción
            $table->index(['event_time', 'is_granted'], 'idx_access_logs_recent');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_logs');
    }
};`,
  },
  {
    id: 'hikvision_terminals',
    name: 'hikvision_terminals',
    category: 'hardware',
    description: 'Registro de hardware físico (relojes biométricos, torniquetes, lectores faciales) y credenciales ISAPI.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', nullable: false, isPrimary: true, description: 'ID primario' },
      { name: 'device_name', type: 'VARCHAR(80)', nullable: false, description: 'Torniquete Entrada Principal' },
      { name: 'ip_address', type: 'VARCHAR(45)', nullable: false, description: 'IP local o VPN (ej. 192.168.10.50 o 10.8.0.2)' },
      { name: 'port', type: 'INTEGER', nullable: false, defaultValue: '80', description: 'Puerto HTTP ISAPI (usualmente 80 o 443)' },
      { name: 'username', type: 'VARCHAR(50)', nullable: false, defaultValue: "'admin'", description: 'Usuario administrador del equipo' },
      { name: 'password_encrypted', type: 'TEXT', nullable: false, description: 'Clave cifrada con Hash::make / Crypt de Laravel' },
      { name: 'is_online', type: 'BOOLEAN', nullable: false, defaultValue: 'true', description: 'Estado según Heartbeat' },
      { name: 'last_sync_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Última sincronización masiva completada' },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_terminals_ip ON hikvision_terminals(ip_address);'],
    migrationCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla: hikvision_terminals
     */
    public function up(): void
    {
        Schema::create('hikvision_terminals', function (Blueprint $table) {
            $table->id();
            $table->string('device_name', 80);
            $table->string('ip_address', 45)->unique();
            $table->unsignedInteger('port')->default(80);
            $table->string('username', 50)->default('admin');
            $table->text('password_encrypted')->comment('Cifrado con Crypt::encryptString');
            $table->boolean('is_online')->default(true);
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hikvision_terminals');
    }
};`,
  },
];
