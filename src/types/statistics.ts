// src/types/statistics.ts

import { TargetConfig } from './index';

// Base statistics interface
export interface BaseStats {
  count: number;
  percentage: number;
}

// Method statistics
export interface MethodStats extends BaseStats {
  method: string;
  commonPaths?: string[];
  commonTargets?: string[];
}

// Protocol statistics
export interface ProtocolStats extends BaseStats {
  protocol: string;
  averagePort?: number;
  commonPorts?: number[];
}

// Port statistics
export interface PortStats extends BaseStats {
  port: number;
  protocols: string[];
  isCommonPort: boolean;
}

// TLD statistics
export interface TLDStats extends BaseStats {
  tld: string;
  hosts: Set<string>;
  uniqueIPs: number;
  attackMethods: Set<string>;
}

// SSL Usage statistics
export interface SSLStats {
  enabled: number;
  disabled: number;
  percentage: number;
  byProtocol: Record<string, number>;
}

// IP Address statistics
export interface IPStats {
  ip: string;
  count: number;
  hosts: Set<string>;
  methods: Set<string>;
  firstSeen: Date;
  lastSeen: Date;
}

// Host statistics
export interface HostStats {
  host: string;
  targetCount: number;
  uniqueIPs: Set<string>;
  methods: Set<string>;
  protocols: Set<string>;
  firstSeen: Date;
  lastSeen: Date;
}

// Time window for analysis
export interface TimeWindow {
  start: Date;
  end: Date;
}

// Complete statistics snapshot
export interface StatisticsSnapshot {
  timestamp: Date;
  window?: TimeWindow;
  totalTargets: number;
  uniqueHosts: number;
  uniqueIPs: number;
  methodDistribution: MethodStats[];
  protocolDistribution: ProtocolStats[];
  portDistribution: PortStats[];
  tldDistribution: TLDStats[];
  sslStats: SSLStats;
  topHosts: HostStats[];
  topIPs: IPStats[];
}

// Statistics query parameters
export interface StatisticsQuery {
  timeWindow?: TimeWindow;
  includeInactive?: boolean;
  filterTLD?: string[];
  filterMethods?: string[];
  filterProtocols?: string[];
}

// Statistics comparison result
export interface StatisticsComparison {
  window1: TimeWindow;
  window2: TimeWindow;
  targetsDelta: number;
  hostsDelta: number;
  newTargets: TargetConfig[];
  removedTargets: TargetConfig[];
  methodChanges: {
    method: string;
    percentageChange: number;
  }[];
  protocolChanges: {
    protocol: string;
    percentageChange: number;
  }[];
  tldChanges: {
    tld: string;
    percentageChange: number;
  }[];
}

// Statistics aggregation options
export interface AggregationOptions {
  groupBy: 'hour' | 'day' | 'week' | 'month';
  metrics: ('targets' | 'hosts' | 'ips' | 'methods' | 'protocols')[];
}

// Trend analysis result
export interface TrendAnalysis {
  timeWindow: TimeWindow;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  confidence: number;
  dataPoints: {
    timestamp: Date;
    value: number;
  }[];
}

export interface TLDStats {
  tld: string;
  count: number;
  percentage: number;
  hosts: Set<string>;
  uniqueIPs: number;
  attackMethods: Set<string>;
}

export interface MethodStats {
  method: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  previousValue: number;
  percentage: number;
}

export interface Statistics {
  totalTargets: number;
  activeHosts: number;
  totalTLDs: number;
  tldDistribution: Map<string, number>;
  methodDistribution: MethodStats[];
}

export interface StatisticsHookReturn {
  totalTargets: number;
  activeHosts: number;
  tldDistribution: Map<string, number>;
  methodDistribution: MethodStats[];
  loading: boolean;
  error: Error | null;
  getTrend: (metric: keyof Statistics) => TrendData | undefined;
}