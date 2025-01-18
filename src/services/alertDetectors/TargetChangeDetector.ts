// src/services/alertDetectors/TargetChangeDetector.ts

import { ConfigurationFile, TargetConfig } from '../../types';
import {
  Alert,
  AlertType,
  AlertCategory,
  AlertSeverity,
  AlertContext
} from '../../types/alerts';
import { generateId } from '../../utils/idGenerator';

export class TargetChangeDetector {
    async detect(
      newConfig: ConfigurationFile,
      previousConfig?: ConfigurationFile
    ): Promise<Alert[]> {
      const alerts: Alert[] = [];
  
      // Can't detect changes without previous config
      if (!previousConfig || !previousConfig.targets || !newConfig.targets) {
        return alerts;
      }
  
      // Create maps for easier lookup
      const prevTargetsMap = new Map(
        previousConfig.targets.map(t => [t.target_id, t])
      );
      const newTargetsMap = new Map(
        newConfig.targets.map(t => [t.target_id, t])
      );
  
      // Check for new and modified targets
      Array.from(newTargetsMap.entries()).forEach(([targetId, newTarget]) => {
        const prevTarget = prevTargetsMap.get(targetId);
  
        if (!prevTarget) {
          // New target
          alerts.push(this.createNewTargetAlert(newTarget));
        } else {
          // Check for changes
          alerts.push(...this.detectChanges(prevTarget, newTarget));
        }
      });
  
      // Check for removed targets
      Array.from(prevTargetsMap.entries()).forEach(([targetId, prevTarget]) => {
        if (!newTargetsMap.has(targetId)) {
          alerts.push(this.createRemovedTargetAlert(prevTarget));
        }
      });
  
      return alerts;
    }
  
    private detectChanges(prevTarget: TargetConfig, newTarget: TargetConfig): Alert[] {
      const alerts: Alert[] = [];
  
      // Method changes
      if (prevTarget.method !== newTarget.method) {
        alerts.push(this.createAlert(
          AlertType.METHOD_CHANGE,
          `Method changed for target ${newTarget.host}`,
          `Target method changed from ${prevTarget.method} to ${newTarget.method}`,
          AlertSeverity.HIGH,
          {
            targetId: newTarget.target_id,
            host: newTarget.host,
            oldValue: prevTarget.method,
            newValue: newTarget.method
          }
        ));
      }
  
      // Protocol changes
      if (prevTarget.type !== newTarget.type) {
        alerts.push(this.createAlert(
          AlertType.PROTOCOL_CHANGE,
          `Protocol changed for target ${newTarget.host}`,
          `Target protocol changed from ${prevTarget.type} to ${newTarget.type}`,
          AlertSeverity.HIGH,
          {
            targetId: newTarget.target_id,
            host: newTarget.host,
            oldValue: prevTarget.type,
            newValue: newTarget.type
          }
        ));
      }
  
      // Port changes
      if (prevTarget.port !== newTarget.port) {
        alerts.push(this.createAlert(
          AlertType.PORT_CHANGE,
          `Port changed for target ${newTarget.host}`,
          `Target port changed from ${prevTarget.port} to ${newTarget.port}`,
          AlertSeverity.MEDIUM,
          {
            targetId: newTarget.target_id,
            host: newTarget.host,
            oldValue: prevTarget.port,
            newValue: newTarget.port
          }
        ));
      }
  
      // SSL changes
      if (prevTarget.use_ssl !== newTarget.use_ssl) {
        alerts.push(this.createAlert(
          AlertType.SSL_CHANGE,
          `SSL configuration changed for target ${newTarget.host}`,
          `Target SSL configuration changed from ${prevTarget.use_ssl} to ${newTarget.use_ssl}`,
          AlertSeverity.HIGH,
          {
            targetId: newTarget.target_id,
            host: newTarget.host,
            oldValue: prevTarget.use_ssl,
            newValue: newTarget.use_ssl
          }
        ));
      }
  
      // Path changes
      if (prevTarget.path !== newTarget.path) {
        alerts.push(this.createAlert(
          AlertType.PATH_CHANGE,
          `Path changed for target ${newTarget.host}`,
          `Target path changed from ${prevTarget.path} to ${newTarget.path}`,
          AlertSeverity.MEDIUM,
          {
            targetId: newTarget.target_id,
            host: newTarget.host,
            oldValue: prevTarget.path,
            newValue: newTarget.path
          }
        ));
      }
  
      return alerts;
    }
  
    private createNewTargetAlert(target: TargetConfig): Alert {
      return this.createAlert(
        AlertType.TARGET_APPEARED,
        `New target detected: ${target.host}`,
        `New target detected with ID ${target.target_id} targeting ${target.host}`,
        AlertSeverity.HIGH,
        {
          targetId: target.target_id,
          host: target.host,
          ip: target.ip
        }
      );
    }
  
    private createRemovedTargetAlert(target: TargetConfig): Alert {
      return this.createAlert(
        AlertType.TARGET_DISAPPEARED,
        `Target removed: ${target.host}`,
        `Target ${target.target_id} targeting ${target.host} has been removed`,
        AlertSeverity.MEDIUM,
        {
          targetId: target.target_id,
          host: target.host,
          ip: target.ip
        }
      );
    }
  
    private createAlert(
      type: AlertType,
      title: string,
      description: string,
      severity: AlertSeverity,
      context: AlertContext
    ): Alert {
      return {
        id: generateId(),
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
  