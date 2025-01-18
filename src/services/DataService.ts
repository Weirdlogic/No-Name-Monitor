// src/services/DataService.ts
import { ConfigurationFile, TargetConfig, RandomRule } from '../types';
import { extractTimestampFromFilename } from '../utils/fileProcessors';

class DataService {
  private static instance: DataService;
  private configurationStore: Map<string, ConfigurationFile>;
  private hostIndex: Map<string, Set<string>>;        // host -> target_ids
  private timelineIndex: Map<string, Date[]>;         // host -> timestamps
  private tldIndex: Map<string, Set<string>>;         // tld -> hosts
  private methodIndex: Map<string, Set<string>>;      // method -> target_ids
  private targetIndex: Map<string, TargetConfig>;     // target_id -> target

  private constructor() {
    this.configurationStore = new Map();
    this.hostIndex = new Map();
    this.timelineIndex = new Map();
    this.tldIndex = new Map();
    this.methodIndex = new Map();
    this.targetIndex = new Map();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public async processConfigurationFile(filename: string, data: ConfigurationFile) {
    const timestamp = extractTimestampFromFilename(filename);
    const fileId = timestamp.toISOString();

    // Store the full configuration
    this.configurationStore.set(fileId, data);

    // Process targets if they exist
    if (data.targets) {
      data.targets.forEach(target => {
        this.indexTarget(target, timestamp);
      });
    }

    // Process random rules
    data.randoms.forEach(rule => {
      // Additional processing for random rules if needed
    });
  }

  private indexTarget(target: TargetConfig, timestamp: Date) {
    // Index by target ID
    this.targetIndex.set(target.target_id, target);

    // Index by host
    if (!this.hostIndex.has(target.host)) {
      this.hostIndex.set(target.host, new Set());
    }
    this.hostIndex.get(target.host)?.add(target.target_id);

    // Index by TLD
    const tld = this.extractTLD(target.host);
    if (!this.tldIndex.has(tld)) {
      this.tldIndex.set(tld, new Set());
    }
    this.tldIndex.get(tld)?.add(target.host);

    // Index by method
    if (!this.methodIndex.has(target.method)) {
      this.methodIndex.set(target.method, new Set());
    }
    this.methodIndex.get(target.method)?.add(target.target_id);

    // Update timeline
    if (!this.timelineIndex.has(target.host)) {
      this.timelineIndex.set(target.host, []);
    }
    this.timelineIndex.get(target.host)?.push(timestamp);
  }

  private extractTLD(host: string): string {
    const parts = host.split('.');
    return parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : host;
  }

  // Statistics Methods
  public getTotalTargets(): number {
    return this.targetIndex.size;
  }

  public getActiveHostsCount(): number {
    return this.hostIndex.size;
  }

  public getConfigurationCount(): number {
    return this.configurationStore.size;
  }

  // Query Methods
  public getTargetsForHost(host: string): TargetConfig[] {
    const targetIds = this.hostIndex.get(host) || new Set();
    return Array.from(targetIds)
      .map(id => this.targetIndex.get(id))
      .filter((target): target is TargetConfig => target !== undefined);
  }

  public getHostTimeline(host: string): Date[] {
    return [...(this.timelineIndex.get(host) || [])].sort((a, b) => a.getTime() - b.getTime());
  }

  public getTLDStatistics(): Map<string, number> {
    const stats = new Map<string, number>();
    this.tldIndex.forEach((hosts, tld) => {
      stats.set(tld, hosts.size);
    });
    return stats;
  }

  public getActiveHosts(): string[] {
    return Array.from(this.hostIndex.keys());
  }

  public getMethodDistribution(): Map<string, number> {
    const stats = new Map<string, number>();
    this.methodIndex.forEach((targets, method) => {
      stats.set(method, targets.size);
    });
    return stats;
  }

  public searchTargets(query: string): TargetConfig[] {
    const results: TargetConfig[] = [];
    this.targetIndex.forEach(target => {
      if (
        target.host.toLowerCase().includes(query.toLowerCase()) ||
        target.ip.includes(query) ||
        target.target_id.includes(query)
      ) {
        results.push(target);
      }
    });
    return results;
  }

  // Timeline Methods
  public getLatestUpdate(): Date | null {
    const timestamps = Array.from(this.configurationStore.keys())
      .map(ts => new Date(ts));
    return timestamps.length > 0 
      ? new Date(Math.max(...timestamps.map(d => d.getTime())))
      : null;
  }

  public getTargetHistory(targetId: string): {timestamp: Date, config: TargetConfig}[] {
    const history: {timestamp: Date, config: TargetConfig}[] = [];
    this.configurationStore.forEach((config, timestamp) => {
      const target = config.targets?.find(t => t.target_id === targetId);
      if (target) {
        history.push({
          timestamp: new Date(timestamp),
          config: target
        });
      }
    });
    return history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Cleanup Methods
  public clearData(): void {
    this.configurationStore.clear();
    this.hostIndex.clear();
    this.timelineIndex.clear();
    this.tldIndex.clear();
    this.methodIndex.clear();
    this.targetIndex.clear();
  }
}

export default DataService.getInstance();