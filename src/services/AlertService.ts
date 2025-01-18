// src/services/AlertService.ts

import { Alert, AlertRule, AlertType } from '../types/alerts';
import { TargetChangeDetector } from './alertDetectors/TargetChangeDetector';
import { HostPatternDetector } from './alertDetectors/HostPatternDetector';
import { VolumeDetector } from './alertDetectors/VolumeDetector';
import { TLDDetector } from './alertDetectors/TLDDetector';
import { ConfigurationFile } from '../types';

class AlertService {
  private static instance: AlertService;
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  
  // Alert detectors
  private targetChangeDetector: TargetChangeDetector;
  private hostPatternDetector: HostPatternDetector;
  private volumeDetector: VolumeDetector;
  private tldDetector: TLDDetector;

  private constructor() {
    this.targetChangeDetector = new TargetChangeDetector();
    this.hostPatternDetector = new HostPatternDetector();
    this.volumeDetector = new VolumeDetector();
    this.tldDetector = new TLDDetector();
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  public async processConfiguration(
    newConfig: ConfigurationFile,
    previousConfig?: ConfigurationFile
  ): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    // Process each detector
    newAlerts.push(
      ...(await this.targetChangeDetector.detect(newConfig, previousConfig)),
      ...(await this.hostPatternDetector.detect(newConfig)),
      ...(await this.volumeDetector.detect(newConfig, previousConfig)),
      ...(await this.tldDetector.detect(newConfig, previousConfig))
    );

    // Store alerts
    this.alerts.push(...newAlerts);

    return newAlerts;
  }

  public addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  public getAlerts(
    startTime?: Date,
    endTime?: Date,
    types?: AlertType[]
  ): Alert[] {
    let filtered = this.alerts;

    if (startTime) {
      filtered = filtered.filter(alert => alert.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(alert => alert.timestamp <= endTime);
    }

    if (types) {
      filtered = filtered.filter(alert => types.includes(alert.type));
    }

    return filtered;
  }

  public clearAlerts(before?: Date): void {
    if (before) {
      this.alerts = this.alerts.filter(alert => alert.timestamp > before);
    } else {
      this.alerts = [];
    }
  }
}

export default AlertService.getInstance();