// src/services/alertDetectors/TLDDetector.ts

import { ConfigurationFile } from '../../types';
import {
  Alert,
  AlertType,
  AlertCategory,
  AlertSeverity,
  AlertContext
} from '../../types/alerts';
import { generateId } from '../../utils/idGenerator';

interface TLDMetrics {
  tldCounts: Map<string, number>;
  tldHosts: Map<string, Set<string>>;
}

export class TLDDetector {
    // Thresholds for TLD-based alerts
    private readonly SIGNIFICANT_TLD_INCREASE = 50; // 50% increase in TLD targets
    private readonly HIGH_RISK_TLDS = new Set([
      '.gov', '.mil', '.edu', '.bank', '.fin', '.emergency'
    ]);
  
    async detect(
      newConfig: ConfigurationFile,
      previousConfig?: ConfigurationFile
    ): Promise<Alert[]> {
      const alerts: Alert[] = [];
  
      if (!newConfig.targets) {
        return alerts;
      }
  
      const currentMetrics = this.calculateTLDMetrics(newConfig);
  
      // Check for new TLDs
      if (previousConfig?.targets) {
        const previousMetrics = this.calculateTLDMetrics(previousConfig);
        alerts.push(...this.detectTLDChanges(previousMetrics, currentMetrics));
      }
  
      // Check for high-risk TLD targeting
      alerts.push(...this.detectHighRiskTLDs(currentMetrics));
  
      return alerts;
    }
  
    private calculateTLDMetrics(config: ConfigurationFile): TLDMetrics {
      const metrics: TLDMetrics = {
        tldCounts: new Map<string, number>(),
        tldHosts: new Map<string, Set<string>>()
      };
  
      if (!config.targets) {
        return metrics;
      }
  
      config.targets.forEach(target => {
        const tld = this.extractTLD(target.host);
  
        // Update counts
        const currentCount = metrics.tldCounts.get(tld) || 0;
        metrics.tldCounts.set(tld, currentCount + 1);
  
        // Update hosts
        if (!metrics.tldHosts.has(tld)) {
          metrics.tldHosts.set(tld, new Set());
        }
        metrics.tldHosts.get(tld)!.add(target.host);
      });
  
      return metrics;
    }
  
    private detectTLDChanges(
      previous: TLDMetrics,
      current: TLDMetrics
    ): Alert[] {
      const alerts: Alert[] = [];
  
      Array.from(current.tldCounts.entries()).forEach(([tld, count]) => {
        if (!previous.tldCounts.has(tld)) {
          alerts.push(this.createTLDAlert(
            AlertType.NEW_TLD,
            `New TLD detected: ${tld}`,
            `New TLD ${tld} appeared with ${count} targets`,
            this.HIGH_RISK_TLDS.has(tld) ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
            {
              tld,
              currentValue: count,
              metadata: {
                hosts: Array.from(current.tldHosts.get(tld) || [])
              }
            }
          ));
        } else {
          const previousCount = previous.tldCounts.get(tld) || 0;
          const increase = this.calculatePercentageIncrease(previousCount, count);
  
          if (increase >= this.SIGNIFICANT_TLD_INCREASE) {
            alerts.push(this.createTLDAlert(
              AlertType.TLD_VOLUME_INCREASE,
              `Significant increase in ${tld} targets`,
              `Targets for ${tld} increased by ${increase.toFixed(1)}%`,
              this.HIGH_RISK_TLDS.has(tld) ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
              {
                tld,
                oldValue: previousCount,
                newValue: count,
                threshold: this.SIGNIFICANT_TLD_INCREASE,
                metadata: {
                  hosts: Array.from(current.tldHosts.get(tld) || [])
                }
              }
            ));
          }
        }
      });
  
      return alerts;
    }
  
    private detectHighRiskTLDs(metrics: TLDMetrics): Alert[] {
      const alerts: Alert[] = [];
  
      Array.from(metrics.tldCounts.entries()).forEach(([tld, count]) => {
        if (this.HIGH_RISK_TLDS.has(tld)) {
          alerts.push(this.createTLDAlert(
            AlertType.TLD_VOLUME_INCREASE,
            `High-risk TLD targeting: ${tld}`,
            `Detected ${count} targets for high-risk TLD ${tld}`,
            AlertSeverity.HIGH,
            {
              tld,
              currentValue: count,
              metadata: {
                hosts: Array.from(metrics.tldHosts.get(tld) || [])
              }
            }
          ));
        }
      });
  
      return alerts;
    }
  
    private calculatePercentageIncrease(
      previous: number,
      current: number
    ): number {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    }
  
    private extractTLD(host: string): string {
      const parts = host.split('.');
      if (parts.length < 2) return host;
      return `.${parts.slice(-2).join('.')}`;
    }
  
    private createTLDAlert(
      type: AlertType,
      title: string,
      description: string,
      severity: AlertSeverity,
      context: AlertContext
    ): Alert {
      return {
        id: generateId(),
        type,
        category: AlertCategory.TLD,
        severity,
        timestamp: new Date(),
        title,
        description,
        context,
        metadata: {}
      };
    }
  }
  
  