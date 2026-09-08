export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
  defaultValue?: string;
  description: string;
}

export interface SchemaTable {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'billing' | 'subscriptions' | 'hardware';
  columns: SchemaColumn[];
  indexes: string[];
  migrationCode: string;
}

export interface CodeSnippet {
  title: string;
  filePath: string;
  language: 'php' | 'vue' | 'typescript' | 'bash' | 'yaml';
  code: string;
  explanation: string;
  solidPrinciples?: string[];
}

export interface HikvisionDeviceStatus {
  ip: string;
  port: number;
  model: string;
  firmware: string;
  status: 'online' | 'offline' | 'warning';
  lastHeartbeat: string;
}

export interface SimulationLog {
  id: string;
  timestamp: string;
  user: string;
  terminal: string;
  action: 'PERMITIDO' | 'DENEGADO' | 'SINCRONIZADO' | 'NOTIFICADO_WHATSAPP' | 'NOTIFICADO_EMAIL';
  reason: string;
  details?: string;
}
