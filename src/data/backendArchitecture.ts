import { CodeSnippet } from '../types/architecture';

export const BACKEND_STRUCTURE = `
backend-laravel/
├── app/
│   ├── Console/
│   │   ├── Commands/
│   │   │   ├── CheckExpiringSubscriptions.php  # CRON: Alertas X días antes por Twilio/SMTP
│   │   │   ├── DeactivateExpiredSubscriptions.php # CRON: Bloquea morosos en Hikvision
│   │   │   └── SendBirthdayGreetings.php       # CRON: Felicitaciones y promos
│   │   └── Kernel.php (o routes/console.php)   # Programación horaria de tareas
│   ├── Enums/
│   │   ├── SubscriptionStatus.php              # ACTIVE, EXPIRED, PENDING, CANCELLED
│   │   ├── PaymentStatus.php                   # COMPLETED, REFUNDED, VOIDED
│   │   └── UserRole.php                        # ADMIN, CASHIER, CLIENT
│   ├── Events/
│   │   ├── PaymentCompletedEvent.php           # Evento al registrar cobro en caja
│   │   └── SubscriptionExpiredEvent.php        # Evento al vencer membresía
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AuthController.php          # Login JWT / Sanctum con RBAC
│   │   │       ├── Cashier/
│   │   │       │   └── PaymentController.php   # Cobros manuales, arqueo de caja
│   │   │       ├── Admin/
│   │   │       │   ├── PlanController.php      # CRUD de planes y restricciones
│   │   │       │   └── TerminalController.php  # Sincronización forzada ISAPI
│   │   │       └── Client/
│   │   │           └── PortalController.php    # Consulta de saldo, fechas de corte
│   │   ├── Middleware/
│   │   │   └── CheckRole.php                   # Validación de roles Spatie o nativo
│   │   └── Requests/
│   │       └── StorePaymentRequest.php         # Validación de esquemas dinámicos JSON
│   ├── Jobs/
│   │   ├── SyncHikvisionUserJob.php            # Cola asíncrona para no trabar el HTTP request
│   │   ├── SendTwilioWhatsAppJob.php           # Encolamiento con reintentos para Twilio
│   │   └── SendEmailMailableJob.php            # Encolamiento para Google SMTP
│   ├── Listeners/
│   │   ├── UnlockTurnstileOnPayment.php        # Escucha PaymentCompleted -> desbloquea
│   │   └── LockTurnstileOnExpiration.php       # Escucha SubscriptionExpired -> bloquea
│   ├── Models/
│   │   ├── User.php
│   │   ├── Role.php
│   │   ├── Plan.php
│   │   ├── Subscription.php
│   │   ├── PaymentMethod.php
│   │   ├── Payment.php
│   │   ├── AccessLog.php
│   │   └── HikvisionTerminal.php
│   └── Services/
│       ├── Contracts/
│       │   ├── AccessControlServiceInterface.php # ISP & DIP (SOLID)
│       │   ├── NotificationServiceInterface.php
│       │   └── PaymentGatewayInterface.php
│       ├── AccessControl/
│       │   └── HikvisionService.php            # Comunicación ISAPI vía Guzzle Digest Auth
│       ├── Notifications/
│       │   ├── TwilioWhatsAppService.php       # Integración con API Twilio WhatsApp
│       │   └── GoogleSmtpMailService.php       # Envíos autenticados vía Gmail SMTP
│       └── Billing/
│           └── SubscriptionService.php         # Cálculo de fechas, renovación y corte
`;

export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    title: 'Interface Segregation: Contrato de Control de Acceso',
    filePath: 'app/Services/Contracts/AccessControlServiceInterface.php',
    language: 'php',
    solidPrinciples: ['S: Single Responsibility', 'I: Interface Segregation', 'D: Dependency Inversion'],
    explanation: 'Define el contrato agnóstico para cualquier hardware de control de acceso. Si mañana el gimnasio cambia de Hikvision a ZKTeco o Dahua, los Controllers y Jobs no se tocan; solo se inyecta una nueva implementación.',
    code: `<?php

namespace App\\Services\\Contracts;

use App\\Models\\User;
use App\\Models\\Subscription;

interface AccessControlServiceInterface
{
    /**
     * Sincroniza la información del usuario en la terminal biométrica.
     */
    public function syncUser(User $user): bool;

    /**
     * Concede o reactiva el acceso físico (desbloquea torniquete/lector facial).
     */
    public function grantAccess(User $user, Subscription $subscription): bool;

    /**
     * Revoca o bloquea el acceso físico debido a membresía vencida o morosidad.
     */
    public function revokeAccess(User $user, string $reason = 'SUBSCRIPTION_EXPIRED'): bool;

    /**
     * Obtiene el estado de conexión del dispositivo (Heartbeat).
     */
    public function getDeviceStatus(): array;

    /**
     * Descarga los registros de acceso (logs) recientes desde el buffer del hardware.
     */
    public function pullAccessLogs(): array;
}`,
  },
  {
    title: 'Hikvision ISAPI Service (Implementación con GuzzleHttp)',
    filePath: 'app/Services/AccessControl/HikvisionService.php',
    language: 'php',
    solidPrinciples: ['S: Single Responsibility (solo ISAPI)', 'O: Open/Closed (extensible)', 'D: Dependency Inversion'],
    explanation: 'Implementación completa del protocolo ISAPI de Hikvision. Emplea autenticación HTTP Digest requerida por los lectores faciales (DS-K1T341, DS-K1T671, etc.). Utiliza el endpoint JSON/XML de gestión de usuarios `/ISAPI/AccessControl/UserInfo/Record` para cambiar el estado entre "normal" y "blackList" o ajustar la ventana temporal `beginTime` y `endTime`.',
    code: `<?php

namespace App\\Services\\AccessControl;

use App\\Models\\User;
use App\\Models\\Subscription;
use App\\Models\\HikvisionTerminal;
use App\\Services\\Contracts\\AccessControlServiceInterface;
use GuzzleHttp\\Client;
use GuzzleHttp\\Exception\\GuzzleException;
use Illuminate\\Support\\Facades\\Log;
use Carbon\\Carbon;

class HikvisionService implements AccessControlServiceInterface
{
    protected Client $httpClient;
    protected HikvisionTerminal $terminal;

    public function __construct(HikvisionTerminal $terminal)
    {
        $this->terminal = $terminal;
        
        // El protocolo ISAPI de Hikvision exige Autenticación Digest (no Basic Auth)
        $this->httpClient = new Client([
            'base_uri' => sprintf('http://%s:%d', $this->terminal->ip_address, $this->terminal->port),
            'auth' => [
                $this->terminal->username,
                $this->terminal->decrypted_password, // Descifrado seguro
                'digest'
            ],
            'timeout' => 5.0, // Timeout estricto para no bloquear procesos
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ],
        ]);
    }

    /**
     * Desbloquea al cliente permitiendo el acceso en el rango de fechas de su suscripción.
     */
    public function grantAccess(User $user, Subscription $subscription): bool
    {
        try {
            $employeeNo = $user->hikvision_employee_no ?? (string)$user->id;

            // Formato ISO 8601 exigido por ISAPI de Hikvision: YYYY-MM-DDTHH:MM:SS
            $beginTime = Carbon::parse($subscription->start_date)->startOfDay()->format('Y-m-d\\TH:i:s');
            $endTime   = Carbon::parse($subscription->end_date)->endOfDay()->format('Y-m-d\\TH:i:s');

            $payload = [
                'UserInfo' => [
                    'employeeNo' => $employeeNo,
                    'name'       => mb_substr($user->name . ' ' . $user->last_name, 0, 32),
                    'userType'   => 'normal', // 'normal' permite paso si coincide con horario
                    'closeDelay' => 5,
                    'Valid'      => [
                        'enable'    => true,
                        'beginTime' => $beginTime,
                        'endTime'   => $endTime,
                        'timeType'  => 'local',
                    ],
                    'doorRight'  => '1', // Permiso sobre puerta / torniquete 1
                    'RightPlan'  => [
                        [
                            'doorNo'         => 1,
                            'planTemplateNo' => '1', // Template de horario normal en el reloj
                        ]
                    ],
                ]
            ];

            // Petición ISAPI PUT para actualizar registro de usuario
            $response = $this->httpClient->put('/ISAPI/AccessControl/UserInfo/Record?format=json', [
                'json' => $payload,
            ]);

            $statusCode = $response->getStatusCode();
            $body = json_decode($response->getBody()->getContents(), true);

            if ($statusCode === 200 && ($body['statusCode'] ?? 1) === 1) {
                Log::info("ISAPI [Hikvision] Acceso concedido a Usuario #{$user->id} hasta {$endTime}");
                $subscription->update(['hardware_synced' => true]);
                return true;
            }

            Log::warning("ISAPI [Hikvision] Respuesta no exitosa al conceder acceso:", $body ?? []);
            return false;

        } catch (GuzzleException $e) {
            Log::error("ISAPI [Hikvision] Error HTTP al conceder acceso: " . $e->getMessage(), [
                'user_id' => $user->id,
                'ip' => $this->terminal->ip_address,
            ]);
            return false;
        }
    }

    /**
     * Bloquea inmediatamente al cliente en el hardware (Lista Negra o fecha caduca).
     */
    public function revokeAccess(User $user, string $reason = 'SUBSCRIPTION_EXPIRED'): bool
    {
        try {
            $employeeNo = $user->hikvision_employee_no ?? (string)$user->id;

            // Para bloqueo forzado, Hikvision soporta userType='blackList' o expirar fechas
            $payload = [
                'UserInfo' => [
                    'employeeNo' => $employeeNo,
                    'name'       => mb_substr($user->name . ' ' . $user->last_name, 0, 32),
                    'userType'   => 'blackList', // Bloquea en reconocimiento facial inmediatamente
                    'Valid'      => [
                        'enable'    => false, // Invalida el acceso
                        'beginTime' => '2000-01-01T00:00:00',
                        'endTime'   => '2000-01-01T00:00:00',
                    ],
                ]
            ];

            $response = $this->httpClient->put('/ISAPI/AccessControl/UserInfo/Record?format=json', [
                'json' => $payload,
            ]);

            $statusCode = $response->getStatusCode();
            $body = json_decode($response->getBody()->getContents(), true);

            if ($statusCode === 200) {
                Log::info("ISAPI [Hikvision] Acceso revocado a Usuario #{$user->id}. Motivo: {$reason}");
                return true;
            }

            return false;

        } catch (GuzzleException $e) {
            Log::error("ISAPI [Hikvision] Error HTTP al revocar acceso: " . $e->getMessage());
            return false;
        }
    }

    public function syncUser(User $user): bool
    {
        // Registro inicial de usuario en la base de datos de rostros del terminal
        $employeeNo = $user->hikvision_employee_no ?? (string)$user->id;
        $payload = [
            'UserInfo' => [
                'employeeNo'   => $employeeNo,
                'name'         => mb_substr($user->name, 0, 32),
                'userType'     => 'normal',
                'userVerifyMode' => 'faceOrFpOrCardOrPw',
            ]
        ];

        try {
            $response = $this->httpClient->post('/ISAPI/AccessControl/UserInfo/Record?format=json', [
                'json' => $payload,
            ]);
            return $response->getStatusCode() === 200;
        } catch (GuzzleException $e) {
            Log::error("ISAPI [Hikvision] Error syncUser: " . $e->getMessage());
            return false;
        }
    }

    public function getDeviceStatus(): array
    {
        try {
            $response = $this->httpClient->get('/ISAPI/System/deviceInfo?format=json');
            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            return ['status' => 'offline', 'error' => $e->getMessage()];
        }
    }

    public function pullAccessLogs(): array
    {
        // Consulta eventos recientes en el buffer del terminal
        try {
            $response = $this->httpClient->post('/ISAPI/AccessControl/AcsEvent?format=json', [
                'json' => [
                    'AcsEventCond' => [
                        'searchID'          => '1',
                        'searchResultPosition' => 0,
                        'maxResults'        => 50,
                        'major'             => 5, // Eventos de control de acceso
                        'minor'             => 0,
                    ]
                ]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            return [];
        }
    }
}`,
  },
  {
    title: 'Twilio WhatsApp Service (Service Pattern)',
    filePath: 'app/Services/Notifications/TwilioWhatsAppService.php',
    language: 'php',
    solidPrinciples: ['S: Single Responsibility (mensajería WhatsApp)', 'D: Inyección de Configuración'],
    explanation: 'Servicio desacoplado que encapsula la API oficial de Twilio para WhatsApp. Maneja formato internacional de teléfonos, sanitización y logging de envíos de alertas y cumpleaños.',
    code: `<?php

namespace App\\Services\\Notifications;

use Twilio\\Rest\\Client as TwilioClient;
use Twilio\\Exceptions\\TwilioException;
use Illuminate\\Support\\Facades\\Log;

class TwilioWhatsAppService
{
    protected TwilioClient $client;
    protected string $fromNumber;

    public function __construct()
    {
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.auth_token');
        $this->fromNumber = config('services.twilio.whatsapp_from'); // ej: 'whatsapp:+14155238886'

        $this->client = new TwilioClient($sid, $token);
    }

    /**
     * Envía mensaje de WhatsApp mediante plantilla o texto directo.
     */
    public function sendMessage(string $toPhone, string $messageBody): bool
    {
        try {
            // Normalizar teléfono: Twilio requiere prefijo 'whatsapp:+'
            $formattedPhone = str_starts_with($toPhone, '+') ? $toPhone : '+' . $toPhone;
            if (!str_starts_with($formattedPhone, 'whatsapp:')) {
                $formattedPhone = 'whatsapp:' . $formattedPhone;
            }

            $message = $this->client->messages->create(
                $formattedPhone,
                [
                    'from' => $this->fromNumber,
                    'body' => $messageBody,
                ]
            );

            Log::info("Twilio WhatsApp enviado con éxito. SID: {$message->sid} Destino: {$formattedPhone}");
            return true;

        } catch (TwilioException $e) {
            Log::error("Fallo al enviar Twilio WhatsApp: " . $e->getMessage(), [
                'to' => $toPhone,
            ]);
            return false;
        }
    }

    /**
     * Plantilla: Alerta preventiva de vencimiento de plan.
     */
    public function sendExpirationWarning(string $phone, string $userName, string $planName, string $dueDate, int $daysLeft): bool
    {
        $body = "🏋️ *HOLA {$userName}*!\n\n"
              . "Te recordamos que tu suscripción *{$planName}* vence en *{$daysLeft} días* (Fecha de corte: *{$dueDate}*).\n\n"
              . "Para evitar interrupciones en tu acceso a los torniquetes biométricos, te invitamos a renovar tu mensualidad en caja o por transferencia.\n\n"
              . "¡Que tengas un excelente entrenamiento!";

        return $this->sendMessage($phone, $body);
    }

    /**
     * Plantilla: Felicitación de cumpleaños con descuento promocional.
     */
    public function sendBirthdayPromo(string $phone, string $userName, string $promoCode, int $discountPercent): bool
    {
        $body = "🎂🎉 *¡FELIZ CUMPLEAÑOS, {$userName}!* 🥳\n\n"
              . "En el equipo del Gimnasio celebramos tu día. Para premiar tu constancia, tienes un cupón exclusivo de *{$discountPercent}% de descuento* en tu próxima renovación.\n\n"
              . "Código: *{$promoCode}*\n"
              . "Válido durante este mes presentando tu DNI en recepción. ¡A romper récords hoy!";

        return $this->sendMessage($phone, $body);
    }
}`,
  },
  {
    title: 'CRON Command: Verificación de Suscripciones por Vencer (Twilio & SMTP)',
    filePath: 'app/Console/Commands/CheckExpiringSubscriptions.php',
    language: 'php',
    solidPrinciples: ['S: Responsable solo de la orquestación diaria de vencimientos'],
    explanation: 'Comando de consola ejecutado vía Scheduler cada mañana a las 08:00 AM. Detecta clientes a X días de su fecha de corte y despacha jobs en cola para enviar WhatsApp por Twilio y correo por Google SMTP.',
    code: `<?php

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use App\\Models\\Subscription;
use App\\Jobs\\SendTwilioWhatsAppJob;
use App\\Jobs\\SendEmailMailableJob;
use Carbon\\Carbon;

class CheckExpiringSubscriptions extends Command
{
    protected $signature = 'gym:check-expiring {--days=3 : Días de anticipación para avisar}';
    protected $description = 'Verifica planes a punto de vencer y envía recordatorios por WhatsApp y Email';

    public function handle(): int
    {
        $daysBefore = (int) $this->option('days');
        $targetDate = Carbon::today()->addDays($daysBefore)->toDateString();

        $this->info("Buscando suscripciones que vencen el {$targetDate} ({$daysBefore} días restantes)...");

        // Obtenemos solo suscripciones activas que vencen en la fecha target y no han sido alertadas
        $subscriptions = Subscription::with(['user', 'plan'])
            ->where('status', 'active')
            ->whereDate('end_date', $targetDate)
            ->whereNull('expiration_warned_at')
            ->cursor(); // Uso de cursor lazy para bajo consumo de RAM

        $count = 0;
        foreach ($subscriptions as $subscription) {
            $user = $subscription->user;
            $plan = $subscription->plan;

            // 1. Encolar alerta por Twilio WhatsApp (Background Queue)
            if (!empty($user->phone)) {
                SendTwilioWhatsAppJob::dispatch(
                    $user->phone,
                    $user->name,
                    $plan->name,
                    $subscription->end_date,
                    $daysBefore
                );
            }

            // 2. Encolar alerta por Google SMTP Email
            if (!empty($user->email)) {
                SendEmailMailableJob::dispatch(
                    $user->email,
                    $user->name,
                    $plan->name,
                    $subscription->end_date,
                    $daysBefore
                );
            }

            $subscription->update(['expiration_warned_at' => now()]);
            $count++;
        }

        $this->info("Se procesaron y encolaron {$count} recordatorios satisfactoriamente.");
        return Command::SUCCESS;
    }
}`,
  },
  {
    title: 'CRON Command: Bloqueo Automático de Morosos en Hardware Hikvision',
    filePath: 'app/Console/Commands/DeactivateExpiredSubscriptions.php',
    language: 'php',
    solidPrinciples: ['S: Automatización de corte de acceso físico'],
    explanation: 'Ejecutado diariamente a las 00:01 AM. Identifica suscripciones que vencieron ayer, actualiza su estatus a "expired" y despacha de inmediato la orden ISAPI a los terminales Hikvision para revocar el permiso de acceso.',
    code: `<?php

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use App\\Models\\Subscription;
use App\\Jobs\\SyncHikvisionUserJob;
use Carbon\\Carbon;

class DeactivateExpiredSubscriptions extends Command
{
    protected $signature = 'gym:deactivate-expired';
    protected $description = 'Bloquea el acceso físico en Hikvision para todas las suscripciones vencidas';

    public function handle(): int
    {
        $today = Carbon::today()->toDateString();
        $this->info("Evaluando membresías vencidas antes del {$today}...");

        $expiredSubscriptions = Subscription::with('user')
            ->where('status', 'active')
            ->where('end_date', '<', $today)
            ->get();

        foreach ($expiredSubscriptions as $sub) {
            $sub->update([
                'status' => 'expired',
                'hardware_synced' => false
            ]);

            // Despachar Job para enviar HTTP PUT a Hikvision ISAPI (userType='blackList')
            SyncHikvisionUserJob::dispatch($sub->user_id, 'revoke', 'SUBSCRIPTION_DUE');
        }

        $this->info("Se revocó el acceso a {$expiredSubscriptions->count()} usuarios vencidos.");
        return Command::SUCCESS;
    }
}`,
  },
  {
    title: 'CRON Command: Felicitaciones y Promociones de Cumpleaños',
    filePath: 'app/Console/Commands/SendBirthdayGreetings.php',
    language: 'php',
    solidPrinciples: ['S: Marketing automatizado por fecha de nacimiento'],
    explanation: 'Corre todas las mañanas a las 09:00 AM. Consulta clientes cuyo día y mes de cumpleaños coincidan con hoy y envía cupón vía Twilio WhatsApp y Google SMTP.',
    code: `<?php

namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use App\\Models\\User;
use App\\Services\\Notifications\\TwilioWhatsAppService;
use Illuminate\\Support\\Facades\\Mail;
use App\\Mail\\BirthdayPromoMail;
use Carbon\\Carbon;

class SendBirthdayGreetings extends Command
{
    protected $signature = 'gym:send-birthday-greetings';
    protected $description = 'Envía felicitaciones y cupones de cumpleaños por WhatsApp y Email';

    public function handle(TwilioWhatsAppService $twilio): int
    {
        $todayMonth = Carbon::today()->format('m');
        $todayDay   = Carbon::today()->format('d');

        // Búsqueda eficiente en PostgreSQL por mes y día
        $birthdayUsers = User::whereRaw('EXTRACT(MONTH FROM birth_date) = ?', [$todayMonth])
            ->whereRaw('EXTRACT(DAY FROM birth_date) = ?', [$todayDay])
            ->where('status', 'active')
            ->get();

        $this->info("Se encontraron {$birthdayUsers->count()} cumpleañeros hoy.");

        foreach ($birthdayUsers as $user) {
            $promoCode = 'BDAY-' . strtoupper(substr($user->name, 0, 3)) . '-' . date('Y');

            // Enviar por WhatsApp
            if (!empty($user->phone)) {
                $twilio->sendBirthdayPromo($user->phone, $user->name, $promoCode, 20);
            }

            // Enviar por Correo Google SMTP
            if (!empty($user->email)) {
                Mail::to($user->email)->queue(new BirthdayPromoMail($user, $promoCode));
            }
        }

        return Command::SUCCESS;
    }
}`,
  },
  {
    title: 'Programación de Tareas (Laravel Schedule)',
    filePath: 'routes/console.php',
    language: 'php',
    solidPrinciples: ['Declarativo y Centralizado'],
    explanation: 'Configuración en el Kernel/Console de Laravel para Cloud Scheduler en Google Cloud.',
    code: `<?php

use Illuminate\\Support\\Facades\\Schedule;

// 1. A las 00:01 AM de cada día: Desactivar membresías vencidas y bloquear en Hikvision
Schedule::command('gym:deactivate-expired')
    ->dailyAt('00:01')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/cron-hikvision-revoke.log'));

// 2. A las 08:00 AM: Avisar por WhatsApp y Correo 3 días antes de que venza
Schedule::command('gym:check-expiring --days=3')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/cron-expirations-warning.log'));

// 3. A las 09:00 AM: Felicitaciones y promos de cumpleaños
Schedule::command('gym:send-birthday-greetings')
    ->dailyAt('09:00')
    ->withoutOverlapping();

// 4. Cada 5 minutos: Monitorear Heartbeat y logs de acceso de terminales Hikvision
Schedule::command('gym:pull-hikvision-events')
    ->everyFiveMinutes();`,
  },
  {
    title: 'Controlador de Pagos en Caja (Cashier Controller)',
    filePath: 'app/Http/Controllers/Api/Cashier/PaymentController.php',
    language: 'php',
    solidPrinciples: ['S: Delegación a Services y Events'],
    explanation: 'Registra cobros manuales (efectivo, tarjeta, transferencia, Zelle, Pago Móvil), renueva la suscripción y dispara el evento que desbloquea automáticamente el torniquete en Hikvision sin congelar el request del cajero.',
    code: `<?php

namespace App\\Http\\Controllers\\Api\\Cashier;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Requests\\StorePaymentRequest;
use App\\Models\\Subscription;
use App\\Models\\Payment;
use App\\Events\\PaymentCompletedEvent;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Http\\JsonResponse;
use Carbon\\Carbon;

class PaymentController extends Controller
{
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $payment = DB::transaction(function () use ($validated, $request) {
            $subscription = Subscription::with('plan')->findOrFail($validated['subscription_id']);
            $user = $subscription->user;

            // 1. Calcular nueva fecha de corte
            $baseDate = Carbon::parse($subscription->end_date)->isPast()
                ? Carbon::today()
                : Carbon::parse($subscription->end_date);
            
            $newEndDate = $baseDate->copy()->addDays($subscription->plan->duration_days);

            // 2. Crear registro de pago
            $payment = Payment::create([
                'receipt_number'    => 'REC-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5)),
                'subscription_id'   => $subscription->id,
                'user_id'           => $subscription->user_id,
                'payment_method_id' => $validated['payment_method_id'],
                'cashier_id'        => $request->user()->id, // Usuario autenticado con rol cajero
                'amount'            => $validated['amount'],
                'exchange_rate'     => $validated['exchange_rate'] ?? 1.0,
                'amount_usd'        => $validated['amount_usd'] ?? $validated['amount'],
                'reference_number'  => $validated['reference_number'] ?? null,
                'metadata'          => $validated['metadata'] ?? [], // JSONB escalable
                'status'            => 'completed',
                'paid_at'           => now(),
            ]);

            // 3. Reactivar suscripción
            $subscription->update([
                'status'                => 'active',
                'end_date'              => $newEndDate,
                'expiration_warned_at'  => null,
                'hardware_synced'       => false, // Será puesto en true por el Listener
            ]);

            // 4. Disparar Evento de Dominio (Desacoplamiento SOLID)
            // El Listener se encargará de despachar la orden HTTP a Hikvision
            event(new PaymentCompletedEvent($payment, $subscription));

            return $payment;
        });

        return response()->json([
            'message'        => 'Pago registrado con éxito y torniquete habilitado.',
            'receipt_number' => $payment->receipt_number,
            'payment'        => $payment->load(['paymentMethod', 'subscription']),
        ], 201);
    }
}`,
  },
];
