// src/services/TimelineService.ts

import { TargetConfig } from '../types';
import { TimeWindow, TrendAnalysis } from '../types/statistics';
import DataService from './DataService';
import { TimelineServiceMath } from './TimelineServiceMath';

interface TimelineEntry {
  timestamp: Date;
  targetCount: number;
  uniqueHosts: number;
  newTargets: TargetConfig[];
  removedTargets: TargetConfig[];
  configChanges: ConfigChange[];
}

interface ConfigChange {
  targetId: string;
  host: string;
  changeType: 'method' | 'protocol' | 'port' | 'path' | 'ssl';
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
}

interface TargetHistory {
  targetId: string;
  host: string;
  firstSeen: Date;
  lastSeen: Date;
  appearances: {
    start: Date;
    end: Date;
    config: TargetConfig;
  }[];
  configChanges: ConfigChange[];
}

interface TargetWithTimestamp {
  target: TargetConfig;
  timestamp: Date;
}

class TimelineService {
  private static instance: TimelineService;
  private timelineCache: Map<string, TimelineEntry[]> = new Map();
  private targetHistoryCache: Map<string, TargetHistory> = new Map();
  private readonly MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes
  private readonly TIME_WINDOW_THRESHOLD = 15 * 60 * 1000; // 15 minutes for grouping events

  private constructor() {}

  public static getInstance(): TimelineService {
    if (!TimelineService.instance) {
      TimelineService.instance = new TimelineService();
    }
    return TimelineService.instance;
  }

  public async getTimeline(window: TimeWindow): Promise<TimelineEntry[]> {
    const cacheKey = `${window.start.toISOString()}-${window.end.toISOString()}`;
    
    if (this.timelineCache.has(cacheKey)) {
      const cached = this.timelineCache.get(cacheKey)!;
      if (this.isCacheValid(cached[0].timestamp)) {
        return cached;
      }
    }

    const allTargets = await this.getAllTargetsInWindow(window);
    const targetsByTimestamp = this.groupTargetsByTimestamp(allTargets);
    const timeline = await this.createTimelineEntries(targetsByTimestamp);
    
    this.timelineCache.set(cacheKey, timeline);
    return timeline;
  }

  public async getTargetHistory(targetId: string): Promise<TargetHistory | null> {
    if (this.targetHistoryCache.has(targetId)) {
      const cached = this.targetHistoryCache.get(targetId)!;
      if (this.isCacheValid(cached.lastSeen)) {
        return cached;
      }
    }

    const history = await this.fetchTargetHistory(targetId);
    if (history && history.length > 0) {
      const processedHistory = this.processTargetHistory(history);
      this.targetHistoryCache.set(targetId, processedHistory);
      return processedHistory;
    }
    return null;
  }

  public async analyzeTargetTrends(window: TimeWindow): Promise<TrendAnalysis> {
    const timeline = await this.getTimeline(window);
    const dataPoints = timeline.map(entry => ({
      timestamp: entry.timestamp,
      value: entry.targetCount
    }));

    // Clean data
    const cleanedData = TimelineServiceMath.interpolateGaps(
      dataPoints.filter(point => 
        !TimelineServiceMath.detectOutliers(dataPoints).includes(point)
      ),
      1 // 1 hour max gap
    );

    // Smooth data for analysis
    const smoothedData = TimelineServiceMath.calculateMovingAverage(cleanedData, 3);

    return {
      timeWindow: window,
      trend: TimelineServiceMath.calculateTrend(smoothedData),
      changeRate: TimelineServiceMath.calculateChangeRate(smoothedData),
      confidence: TimelineServiceMath.calculateConfidence(smoothedData),
      dataPoints: cleanedData
    };
  }

  private async getAllTargetsInWindow(window: TimeWindow): Promise<TargetWithTimestamp[]> {
    const configs = await Promise.all(
      DataService.getActiveHosts().map(async host => {
        const targets = await DataService.getTargetsForHost(host);
        return targets.map(target => ({
          target,
          timestamp: new Date() // You'll need to get actual timestamps from your data
        }));
      })
    );

    return configs.flat().filter(item => 
      item.timestamp >= window.start && item.timestamp <= window.end
    );
  }

  private groupTargetsByTimestamp(
    targets: TargetWithTimestamp[]
  ): Map<string, TargetConfig[]> {
    const grouped = new Map<string, TargetConfig[]>();
    
    const sortedTargets = targets.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (sortedTargets.length === 0) return grouped;

    let currentWindow = new Date(sortedTargets[0].timestamp);
    let currentTargets: TargetConfig[] = [];

    sortedTargets.forEach(({ target, timestamp }) => {
      if (timestamp.getTime() - currentWindow.getTime() > this.TIME_WINDOW_THRESHOLD) {
        if (currentTargets.length > 0) {
          grouped.set(currentWindow.toISOString(), currentTargets);
        }
        currentWindow = new Date(timestamp);
        currentTargets = [target];
      } else {
        currentTargets.push(target);
      }
    });

    if (currentTargets.length > 0) {
      grouped.set(currentWindow.toISOString(), currentTargets);
    }

    return grouped;
  }

  private async fetchTargetHistory(targetId: string): Promise<{ timestamp: Date; config: TargetConfig }[]> {
    return await DataService.getTargetHistory(targetId);
  }

  private processTargetHistory(
    history: { timestamp: Date; config: TargetConfig }[]
  ): TargetHistory {
    const appearances = this.processAppearances(history);
    const configChanges = this.processConfigChanges(history);

    return {
      targetId: history[0].config.target_id,
      host: history[0].config.host,
      firstSeen: history[0].timestamp,
      lastSeen: history[history.length - 1].timestamp,
      appearances,
      configChanges
    };
  }

  private async createTimelineEntries(
    targetsByTimestamp: Map<string, TargetConfig[]>
  ): Promise<TimelineEntry[]> {
    const timeline: TimelineEntry[] = [];
    let previousTargets = new Set<string>();
    
    const timestamps = Array.from(targetsByTimestamp.keys()).sort();
    
    for (const timestamp of timestamps) {
      const currentTargets = targetsByTimestamp.get(timestamp)!;
      const currentTargetIds = new Set(currentTargets.map(t => t.target_id));
      
      const entry: TimelineEntry = {
        timestamp: new Date(timestamp),
        targetCount: currentTargets.length,
        uniqueHosts: new Set(currentTargets.map(t => t.host)).size,
        newTargets: currentTargets.filter(t => !previousTargets.has(t.target_id)),
        removedTargets: Array.from(previousTargets)
          .filter(id => !currentTargetIds.has(id))
          .map(id => this.findTarget(Array.from(targetsByTimestamp.values()).flat(), id))
          .filter((t): t is TargetConfig => t !== undefined),
        configChanges: this.detectConfigChanges(
          Array.from(previousTargets)
            .map(id => this.findTarget(Array.from(targetsByTimestamp.values()).flat(), id)),
          currentTargets
        )
      };

      timeline.push(entry);
      previousTargets = currentTargetIds;
    }

    return timeline;
  }

  private findTarget(targets: TargetConfig[], targetId: string): TargetConfig | undefined {
    return targets.find(t => t.target_id === targetId);
  }

  private detectConfigChanges(
    previousTargets: (TargetConfig | undefined)[],
    currentTargets: TargetConfig[]
  ): ConfigChange[] {
    const changes: ConfigChange[] = [];
    const currentTargetsMap = new Map(
      currentTargets.map(target => [target.target_id, target])
    );

    previousTargets.forEach(prevTarget => {
      if (!prevTarget) return;

      const currentTarget = currentTargetsMap.get(prevTarget.target_id);
      if (!currentTarget) return;

      // Check method changes
      if (prevTarget.method !== currentTarget.method) {
        changes.push({
          targetId: prevTarget.target_id,
          host: prevTarget.host,
          changeType: 'method',
          oldValue: prevTarget.method,
          newValue: currentTarget.method
        });
      }

      // Check protocol changes
      if (prevTarget.type !== currentTarget.type) {
        changes.push({
          targetId: prevTarget.target_id,
          host: prevTarget.host,
          changeType: 'protocol',
          oldValue: prevTarget.type,
          newValue: currentTarget.type
        });
      }

      // Check port changes
      if (prevTarget.port !== currentTarget.port) {
        changes.push({
          targetId: prevTarget.target_id,
          host: prevTarget.host,
          changeType: 'port',
          oldValue: prevTarget.port,
          newValue: currentTarget.port
        });
      }

      // Check path changes
      if (prevTarget.path !== currentTarget.path) {
        changes.push({
          targetId: prevTarget.target_id,
          host: prevTarget.host,
          changeType: 'path',
          oldValue: prevTarget.path,
          newValue: currentTarget.path
        });
      }

      // Check SSL changes
      if (prevTarget.use_ssl !== currentTarget.use_ssl) {
        changes.push({
          targetId: prevTarget.target_id,
          host: prevTarget.host,
          changeType: 'ssl',
          oldValue: prevTarget.use_ssl,
          newValue: currentTarget.use_ssl
        });
      }
    });

    return changes;
  }

  private processAppearances(
    history: { timestamp: Date; config: TargetConfig }[]
  ): { start: Date; end: Date; config: TargetConfig }[] {
    const appearances: { start: Date; end: Date; config: TargetConfig }[] = [];
    if (history.length === 0) return appearances;

    let currentAppearance = {
      start: history[0].timestamp,
      end: history[0].timestamp,
      config: history[0].config
    };

    for (let i = 1; i < history.length; i++) {
      const current = history[i];
      const timeDiff = current.timestamp.getTime() - currentAppearance.end.getTime();

      if (timeDiff <= this.TIME_WINDOW_THRESHOLD &&
          this.areConfigsEqual(currentAppearance.config, current.config)) {
        currentAppearance.end = current.timestamp;
      } else {
        appearances.push({ ...currentAppearance });
        currentAppearance = {
          start: current.timestamp,
          end: current.timestamp,
          config: current.config
        };
      }
    }

    appearances.push(currentAppearance);
    return appearances;
  }

  private processConfigChanges(
    history: { timestamp: Date; config: TargetConfig }[]
  ): ConfigChange[] {
    const changes: ConfigChange[] = [];
    for (let i = 1; i < history.length; i++) {
      const prevConfig = history[i - 1].config;
      const currentConfig = history[i].config;
      changes.push(...this.detectConfigChanges([prevConfig], [currentConfig]));
    }
    return changes;
  }

  private areConfigsEqual(config1: TargetConfig, config2: TargetConfig): boolean {
    return config1.method === config2.method &&
           config1.type === config2.type &&
           config1.port === config2.port &&
           config1.path === config2.path &&
           config1.use_ssl === config2.use_ssl;
  }

  private isCacheValid(timestamp: Date): boolean {
    return (new Date().getTime() - timestamp.getTime()) < this.MAX_CACHE_AGE;
  }
}

export default TimelineService.getInstance();