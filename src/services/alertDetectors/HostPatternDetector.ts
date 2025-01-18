// src/services/alertDetectors/HostPatternDetector.ts

import { ConfigurationFile, TargetConfig } from '../../types';
import {
  Alert,
  AlertType,
  AlertCategory,
  AlertSeverity,
  AlertContext
} from '../../types/alerts';
import { generateAlertId } from '../../utils/idGenerator';

interface HostData {
  targets: string[];
  ips: Set<string>;
}

interface IPData {
  hosts: Set<string>;
  targets: string[];
}

export class HostPatternDetector {
  async detect(config: ConfigurationFile): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    if (!config.targets) {
      return alerts;
    }

    const hostMap = new Map<string, HostData>();
    const ipMap = new Map<string, IPData>();

    // Build host and IP maps
    for (const target of config.targets) {
      this.updateHostMap(hostMap, target);
      this.updateIPMap(ipMap, target);
    }

    // Check for multiple targets per host
    alerts.push(...this.detectMultipleTargetsPerHost(hostMap));

    // Check for multiple hosts per IP
    alerts.push(...this.detectMultipleHostsPerIP(ipMap));

    return alerts;
  }

  private updateHostMap(
    hostMap: Map<string, HostData>,
    target: TargetConfig
  ): void {
    if (!hostMap.has(target.host)) {
      hostMap.set(target.host, {
        targets: [],
        ips: new Set()
      });
    }

    const hostData = hostMap.get(target.host)!;
    hostData.targets.push(target.target_id);
    hostData.ips.add(target.ip);
  }

  private updateIPMap(
    ipMap: Map<string, IPData>,
    target: TargetConfig
  ): void {
    if (!ipMap.has(target.ip)) {
      ipMap.set(target.ip, {
        hosts: new Set(),
        targets: []
      });
    }

    const ipData = ipMap.get(target.ip)!;
    ipData.hosts.add(target.host);
    ipData.targets.push(target.target_id);
  }

  private detectMultipleTargetsPerHost(
    hostMap: Map<string, HostData>
  ): Alert[] {
    const alerts: Alert[] = [];

    // Using Array.from to handle Map iteration
    Array.from(hostMap).forEach(([host, data]) => {
      if (data.targets.length > 1) {
        alerts.push(this.createAlert(
          AlertType.MULTIPLE_TARGETS_HOST,
          `Multiple targets for host ${host}`,
          `Host ${host} is targeted by ${data.targets.length} different configurations`,
          data.targets.length > 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          {
            host,
            currentValue: data.targets.length,
            metadata: {
              targetIds: data.targets,
              uniqueIPs: Array.from(data.ips)
            }
          }
        ));
      }

      // Check for host with multiple IPs
      if (data.ips.size > 1) {
        alerts.push(this.createAlert(
          AlertType.HOST_IP_CHANGE,
          `Multiple IPs for host ${host}`,
          `Host ${host} is associated with ${data.ips.size} different IPs`,
          AlertSeverity.HIGH,
          {
            host,
            currentValue: data.ips.size,
            metadata: {
              ips: Array.from(data.ips)
            }
          }
        ));
      }
    });

    return alerts;
  }

  private detectMultipleHostsPerIP(
    ipMap: Map<string, IPData>
  ): Alert[] {
    const alerts: Alert[] = [];

    // Using Array.from to handle Map iteration
    Array.from(ipMap).forEach(([ip, data]) => {
      if (data.hosts.size > 1) {
        alerts.push(this.createAlert(
          AlertType.MULTIPLE_HOSTS_IP,
          `Multiple hosts for IP ${ip}`,
          `IP ${ip} is associated with ${data.hosts.size} different hosts`,
          data.hosts.size > 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          {
            ip,
            currentValue: data.hosts.size,
            metadata: {
              hosts: Array.from(data.hosts),
              targetIds: data.targets
            }
          }
        ));
      }
    });

    return alerts;
  }

  private createAlert(
    type: AlertType,
    title: string,
    description: string,
    severity: AlertSeverity,
    context: AlertContext
  ): Alert {
    return {
      id: generateAlertId(),
      type,
      category: AlertCategory.HOST_PATTERN,
      severity,
      timestamp: new Date(),
      title,
      description,
      context,
      metadata: {}
    };
  }
}