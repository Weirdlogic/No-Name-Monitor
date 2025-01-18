// src/services/StatisticsService.ts

import { TargetConfig } from '../types';
import DataService from './DataService';
import {
  StatisticsSnapshot,
  MethodStats,
  ProtocolStats,
  PortStats,
  TLDStats,
  SSLStats,
  HostStats,
  IPStats,
  StatisticsQuery,
  TimeWindow,
  StatisticsComparison,
  AggregationOptions,
  TrendAnalysis
} from '../types/statistics';

class StatisticsService {
  private static instance: StatisticsService;
  private lastSnapshot: StatisticsSnapshot | null = null;
  private snapshotTimestamp: Date | null = null;
  private readonly SNAPSHOT_VALIDITY = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  public async getStatistics(): Promise<StatisticsSnapshot> {
    if (this.isSnapshotValid()) {
      return this.lastSnapshot!;
    }
    return await this.generateNewSnapshot();
  }

  private isSnapshotValid(): boolean {
    if (!this.lastSnapshot || !this.snapshotTimestamp) {
      return false;
    }
    return (new Date().getTime() - this.snapshotTimestamp.getTime()) < this.SNAPSHOT_VALIDITY;
  }

  private async generateNewSnapshot(): Promise<StatisticsSnapshot> {
    const targets = await this.getAllTargets();
    const totalTargets = targets.length;

    const snapshot: StatisticsSnapshot = {
      timestamp: new Date(),
      totalTargets,
      uniqueHosts: this.countUniqueHosts(targets),
      uniqueIPs: this.countUniqueIPs(targets),
      methodDistribution: this.calculateMethodDistribution(targets),
      protocolDistribution: this.calculateProtocolDistribution(targets),
      portDistribution: this.calculatePortDistribution(targets),
      tldDistribution: this.calculateTLDDistribution(targets),
      sslStats: this.calculateSSLStats(targets),
      topHosts: this.calculateTopHosts(targets),
      topIPs: this.calculateTopIPs(targets)
    };

    this.lastSnapshot = snapshot;
    this.snapshotTimestamp = new Date();

    return snapshot;
  }

  private async getAllTargets(): Promise<TargetConfig[]> {
    return DataService.getActiveHosts().flatMap(host => 
      DataService.getTargetsForHost(host)
    );
  }

  private countUniqueHosts(targets: TargetConfig[]): number {
    return new Set(targets.map(t => t.host)).size;
  }

  private countUniqueIPs(targets: TargetConfig[]): number {
    return new Set(targets.map(t => t.ip)).size;
  }

  private calculateMethodDistribution(targets: TargetConfig[]): MethodStats[] {
    const methodMap = new Map<string, {
      count: number,
      paths: Set<string>,
      targets: Set<string>
    }>();

    targets.forEach(target => {
      if (!methodMap.has(target.method)) {
        methodMap.set(target.method, {
          count: 0,
          paths: new Set(),
          targets: new Set()
        });
      }
      const data = methodMap.get(target.method)!;
      data.count++;
      data.paths.add(target.path);
      data.targets.add(target.host);
    });

    return Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      percentage: (data.count / targets.length) * 100,
      commonPaths: Array.from(data.paths).slice(0, 10),
      commonTargets: Array.from(data.targets).slice(0, 10)
    })).sort((a, b) => b.count - a.count);
  }

  private calculateProtocolDistribution(targets: TargetConfig[]): ProtocolStats[] {
    const protocolMap = new Map<string, {
      count: number,
      ports: number[]
    }>();

    targets.forEach(target => {
      if (!protocolMap.has(target.type)) {
        protocolMap.set(target.type, {
          count: 0,
          ports: []
        });
      }
      const data = protocolMap.get(target.type)!;
      data.count++;
      data.ports.push(target.port);
    });

    return Array.from(protocolMap.entries()).map(([protocol, data]) => ({
      protocol,
      count: data.count,
      percentage: (data.count / targets.length) * 100,
      averagePort: data.ports.reduce((a, b) => a + b, 0) / data.ports.length,
      commonPorts: Array.from(new Set(data.ports)).slice(0, 5)
    })).sort((a, b) => b.count - a.count);
  }

  private calculatePortDistribution(targets: TargetConfig[]): PortStats[] {
    const portMap = new Map<number, {
      count: number,
      protocols: Set<string>
    }>();

    targets.forEach(target => {
      if (!portMap.has(target.port)) {
        portMap.set(target.port, {
          count: 0,
          protocols: new Set()
        });
      }
      const data = portMap.get(target.port)!;
      data.count++;
      data.protocols.add(target.type);
    });

    const commonPorts = new Set([80, 443, 8080, 8443]); // Common web ports

    return Array.from(portMap.entries()).map(([port, data]) => ({
      port,
      count: data.count,
      percentage: (data.count / targets.length) * 100,
      protocols: Array.from(data.protocols),
      isCommonPort: commonPorts.has(port)
    })).sort((a, b) => b.count - a.count);
  }

  private calculateTLDDistribution(targets: TargetConfig[]): TLDStats[] {
    const tldMap = new Map<string, {
      count: number,
      hosts: Set<string>,
      ips: Set<string>,
      methods: Set<string>
    }>();
    
    targets.forEach(target => {
      const tld = this.extractTLD(target.host);
      if (!tldMap.has(tld)) {
        tldMap.set(tld, {
          count: 0,
          hosts: new Set(),
          ips: new Set(),
          methods: new Set()
        });
      }
      const data = tldMap.get(tld)!;
      data.count++;
      data.hosts.add(target.host);
      data.ips.add(target.ip);
      data.methods.add(target.method);
    });

    return Array.from(tldMap.entries()).map(([tld, data]) => ({
      tld,
      count: data.count,
      percentage: (data.count / targets.length) * 100,
      hosts: data.hosts,
      uniqueIPs: data.ips.size,
      attackMethods: data.methods
    })).sort((a, b) => b.count - a.count);
  }

  private calculateSSLStats(targets: TargetConfig[]): SSLStats {
    const sslEnabled = targets.filter(t => t.use_ssl);
    const sslDisabled = targets.filter(t => !t.use_ssl);
    
    const byProtocol: Record<string, number> = {};
    sslEnabled.forEach(target => {
      byProtocol[target.type] = (byProtocol[target.type] || 0) + 1;
    });

    return {
      enabled: sslEnabled.length,
      disabled: sslDisabled.length,
      percentage: (sslEnabled.length / targets.length) * 100,
      byProtocol
    };
  }

  private calculateTopHosts(targets: TargetConfig[]): HostStats[] {
    const hostMap = new Map<string, {
      count: number,
      ips: Set<string>,
      methods: Set<string>,
      protocols: Set<string>,
      firstSeen: Date,
      lastSeen: Date
    }>();

    targets.forEach(target => {
      if (!hostMap.has(target.host)) {
        hostMap.set(target.host, {
          count: 0,
          ips: new Set(),
          methods: new Set(),
          protocols: new Set(),
          firstSeen: new Date(),
          lastSeen: new Date()
        });
      }
      const data = hostMap.get(target.host)!;
      data.count++;
      data.ips.add(target.ip);
      data.methods.add(target.method);
      data.protocols.add(target.type);
    });

    return Array.from(hostMap.entries())
      .map(([host, data]) => ({
        host,
        targetCount: data.count,
        uniqueIPs: data.ips,
        methods: data.methods,
        protocols: data.protocols,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen
      }))
      .sort((a, b) => b.targetCount - a.targetCount)
      .slice(0, 10);
  }

  private calculateTopIPs(targets: TargetConfig[]): IPStats[] {
    const ipMap = new Map<string, {
      count: number,
      hosts: Set<string>,
      methods: Set<string>,
      firstSeen: Date,
      lastSeen: Date
    }>();

    targets.forEach(target => {
      if (!ipMap.has(target.ip)) {
        ipMap.set(target.ip, {
          count: 0,
          hosts: new Set(),
          methods: new Set(),
          firstSeen: new Date(),
          lastSeen: new Date()
        });
      }
      const data = ipMap.get(target.ip)!;
      data.count++;
      data.hosts.add(target.host);
      data.methods.add(target.method);
    });

    return Array.from(ipMap.entries())
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        hosts: data.hosts,
        methods: data.methods,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private extractTLD(host: string): string {
    const parts = host.split('.');
    return parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : host;
  }

  // Analysis helper methods
  public getTargetsForTLD(tld: string): TargetConfig[] {
    const tldData = this.lastSnapshot?.tldDistribution.find(t => t.tld === tld);
    return tldData ? Array.from(tldData.hosts).flatMap(host => 
      DataService.getTargetsForHost(host)
    ) : [];
  }

  public getTargetsByMethod(method: string): TargetConfig[] {
    return DataService.getActiveHosts()
      .flatMap(host => DataService.getTargetsForHost(host))
      .filter(target => target.method === method);
  }

  public getTargetsByProtocol(protocol: string): TargetConfig[] {
    return DataService.getActiveHosts()
      .flatMap(host => DataService.getTargetsForHost(host))
      .filter(target => target.type === protocol);
  }
}

export default StatisticsService.getInstance();