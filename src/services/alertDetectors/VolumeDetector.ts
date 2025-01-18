// src/services/alertDetectors/VolumeDetector.ts

import { ConfigurationFile } from '../../types';
import {
  Alert,
  AlertType,
  AlertCategory,
  AlertSeverity,
  AlertContext
} from '../../types/alerts';
import { generateId } from '../../utils/idGenerator';

interface VolumeMetrics {
  totalTargets: number;
  uniqueHosts: Set<string>;
  uniqueIPs: Set<string>;
}

export class VolumeDetector {
  // Thresholds for volume changes
  private readonly SIGNIFICANT_INCREASE_THRESHOLD = 50; // 50% increase
  private readonly LARGE_INCREASE_THRESHOLD = 100;      // 100% increase
  private readonly MIN_TARGETS_FOR_ALERT = 5;          // Minimum targets to consider

  async detect(
    newConfig: ConfigurationFile,
    previousConfig?: ConfigurationFile
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    if (!newConfig.targets) {
      return alerts;
    }

    const currentMetrics = this.calculateMetrics(newConfig);
    
    if (!previousConfig?.targets) {
      // First configuration, check only absolute numbers
      alerts.push(...this.checkAbsoluteVolumes(currentMetrics));
      return alerts;
    }

    const previousMetrics = this.calculateMetrics(previousConfig);
    
    // Check for significant changes
    alerts.push(...this.detectVolumeChanges(previousMetrics, currentMetrics));

    return alerts;
  }

  private calculateMetrics(config: ConfigurationFile): VolumeMetrics {
    const metrics: VolumeMetrics = {
      totalTargets: 0,
      uniqueHosts: new Set<string>(),
      uniqueIPs: new Set<string>()
    };

    if (!config.targets) {
      return metrics;
    }

    metrics.totalTargets = config.targets.length;

    config.targets.forEach(target => {
      metrics.uniqueHosts.add(target.host);
      metrics.uniqueIPs.add(target.ip);
    });

    return metrics;
  }

  private detectVolumeChanges(
    previous: VolumeMetrics,
    current: VolumeMetrics
  ): Alert[] {
    const alerts: Alert[] = [];

    // Check total targets change
    if (previous.totalTargets >= this.MIN_TARGETS_FOR_ALERT) {
      const targetIncrease = this.calculatePercentageIncrease(
        previous.totalTargets,
        current.totalTargets
      );

      if (targetIncrease >= this.LARGE_INCREASE_THRESHOLD) {
        alerts.push(this.createVolumeAlert(
          AlertType.TARGET_VOLUME_INCREASE,
          'Large increase in total targets',
          `Total targets increased by ${targetIncrease.toFixed(1)}%`,
          AlertSeverity.HIGH,
          {
            oldValue: previous.totalTargets,
            newValue: current.totalTargets,
            threshold: this.LARGE_INCREASE_THRESHOLD
          }
        ));
      } else if (targetIncrease >= this.SIGNIFICANT_INCREASE_THRESHOLD) {
        alerts.push(this.createVolumeAlert(
          AlertType.TARGET_VOLUME_INCREASE,
          'Significant increase in total targets',
          `Total targets increased by ${targetIncrease.toFixed(1)}%`,
          AlertSeverity.MEDIUM,
          {
            oldValue: previous.totalTargets,
            newValue: current.totalTargets,
            threshold: this.SIGNIFICANT_INCREASE_THRESHOLD
          }
        ));
      }
    }

    // Check unique hosts change
    const previousHosts = previous.uniqueHosts.size;
    const currentHosts = current.uniqueHosts.size;
    if (previousHosts >= this.MIN_TARGETS_FOR_ALERT) {
      const hostIncrease = this.calculatePercentageIncrease(
        previousHosts,
        currentHosts
      );

      if (hostIncrease >= this.SIGNIFICANT_INCREASE_THRESHOLD) {
        alerts.push(this.createVolumeAlert(
          AlertType.UNIQUE_HOSTS_INCREASE,
          'Significant increase in unique hosts',
          `Unique hosts increased by ${hostIncrease.toFixed(1)}%`,
          AlertSeverity.HIGH,
          {
            oldValue: previousHosts,
            newValue: currentHosts,
            threshold: this.SIGNIFICANT_INCREASE_THRESHOLD
          }
        ));
      }
    }

    // Check unique IPs change
    const previousIPs = previous.uniqueIPs.size;
    const currentIPs = current.uniqueIPs.size;
    if (previousIPs >= this.MIN_TARGETS_FOR_ALERT) {
      const ipIncrease = this.calculatePercentageIncrease(
        previousIPs,
        currentIPs
      );

      if (ipIncrease >= this.SIGNIFICANT_INCREASE_THRESHOLD) {
        alerts.push(this.createVolumeAlert(
          AlertType.UNIQUE_IPS_INCREASE,
          'Significant increase in unique IPs',
          `Unique IPs increased by ${ipIncrease.toFixed(1)}%`,
          AlertSeverity.HIGH,
          {
            oldValue: previousIPs,
            newValue: currentIPs,
            threshold: this.SIGNIFICANT_INCREASE_THRESHOLD
          }
        ));
      }
    }

    return alerts;
  }

  private checkAbsoluteVolumes(metrics: VolumeMetrics): Alert[] {
    const alerts: Alert[] = [];
    const ABSOLUTE_HIGH_THRESHOLD = 100; // Example threshold

    if (metrics.totalTargets > ABSOLUTE_HIGH_THRESHOLD) {
      alerts.push(this.createVolumeAlert(
        AlertType.TARGET_VOLUME_INCREASE,
        'High absolute number of targets',
        `Current configuration contains ${metrics.totalTargets} targets`,
        AlertSeverity.MEDIUM,
        {
          currentValue: metrics.totalTargets,
          threshold: ABSOLUTE_HIGH_THRESHOLD
        }
      ));
    }

    return alerts;
  }

  private calculatePercentageIncrease(
    previous: number,
    current: number
  ): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private createVolumeAlert(
    type: AlertType,
    title: string,
    description: string,
    severity: AlertSeverity,
    context: AlertContext
  ): Alert {
    return {
      id: generateId(),
      type,
      category: AlertCategory.VOLUME,
      severity,
      timestamp: new Date(),
      title,
      description,
      context,
      metadata: {}
    };
  }
}