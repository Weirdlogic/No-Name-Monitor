// src/types/alerts.ts

export enum AlertSeverity {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    INFO = 'INFO'
  }
  
  export enum AlertCategory {
    TARGET_CHANGE = 'TARGET_CHANGE',
    HOST_PATTERN = 'HOST_PATTERN',
    VOLUME = 'VOLUME',
    TLD = 'TLD'
  }
  
  export enum AlertType {
    // Target Changes
    METHOD_CHANGE = 'METHOD_CHANGE',
    PROTOCOL_CHANGE = 'PROTOCOL_CHANGE',
    PORT_CHANGE = 'PORT_CHANGE',
    SSL_CHANGE = 'SSL_CHANGE',
    PATH_CHANGE = 'PATH_CHANGE',
    TARGET_APPEARED = 'TARGET_APPEARED',
    TARGET_DISAPPEARED = 'TARGET_DISAPPEARED',
  
    // Host Patterns
    MULTIPLE_TARGETS_HOST = 'MULTIPLE_TARGETS_HOST',
    MULTIPLE_HOSTS_IP = 'MULTIPLE_HOSTS_IP',
    HOST_IP_CHANGE = 'HOST_IP_CHANGE',
  
    // Volume Changes
    TARGET_VOLUME_INCREASE = 'TARGET_VOLUME_INCREASE',
    UNIQUE_HOSTS_INCREASE = 'UNIQUE_HOSTS_INCREASE',
    UNIQUE_IPS_INCREASE = 'UNIQUE_IPS_INCREASE',
  
    // TLD Patterns
    NEW_TLD = 'NEW_TLD',
    TLD_VOLUME_INCREASE = 'TLD_VOLUME_INCREASE'
  }
  
  export interface Alert {
    id: string;
    type: AlertType;
    category: AlertCategory;
    severity: AlertSeverity;
    timestamp: Date;
    title: string;
    description: string;
    context: AlertContext;
    metadata: Record<string, unknown>;
  }
  
  export interface AlertContext {
    targetId?: string;
    host?: string;
    ip?: string;
    tld?: string;
    oldValue?: unknown;
    newValue?: unknown;
    threshold?: number;
    currentValue?: number;
    metadata?: Record<string, unknown>;
  }
  
  export interface AlertRule {
    id: string;
    type: AlertType;
    enabled: boolean;
    severity: AlertSeverity;
    conditions: AlertCondition[];
    metadata?: Record<string, unknown>;
  }
  
  export interface AlertCondition {
    type: string;
    params: Record<string, unknown>;
  }