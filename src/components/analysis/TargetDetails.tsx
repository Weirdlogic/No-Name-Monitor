import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Shield, Clock, Server, AlertTriangle, ArrowRight, Globe } from 'lucide-react';
import { TargetConfig } from '../../types';
import { Alert } from '../../types/alerts';
import TimelineService from '../../services/TimelineService';
import AlertService from '../../services/AlertService';

interface TargetDetailsProps {
  target: TargetConfig;
}

interface TargetHistoryEntry {
  timestamp: Date;
  config: TargetConfig;
}

interface ConfigChange {
  type: string;
  timestamp: Date;
  old: string | number | boolean;
  new: string | number | boolean;
}

export const TargetDetails = ({ target }: TargetDetailsProps) => {
  const [history, setHistory] = useState<TargetHistoryEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [changes, setChanges] = useState<ConfigChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTargetData = async () => {
      try {
        // Get target history
        const targetHistory = await TimelineService.getTargetHistory(target.target_id);
        if (targetHistory) {
        setHistory(targetHistory.appearances.map(entry => ({
            timestamp: entry.start,
            config: entry.config
        })));
        // Process configuration changes with the mapped history
        const configChanges = processConfigChanges(targetHistory.appearances.map(entry => ({
            timestamp: entry.start,
            config: entry.config
        })));
        setChanges(configChanges);
        }

        // Get related alerts
        const targetAlerts = AlertService.getAlerts(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          undefined,
          undefined
        ).filter(alert => alert.context.targetId === target.target_id);
        setAlerts(targetAlerts);

      } catch (error) {
        console.error('Error loading target data:', error);
        setError(error instanceof Error ? error.message : 'Error loading target data');
      } finally {
        setLoading(false);
      }
    };

    loadTargetData();
  }, [target]);

  const processConfigChanges = (history: TargetHistoryEntry[]) => {
    const changes: ConfigChange[] = [];
    
    for (let i = 1; i < history.length; i++) {
      const current = history[i].config;
      const previous = history[i-1].config;
      const timestamp = history[i].timestamp;

      if (current.method !== previous.method) {
        changes.push({
          type: 'Method',
          timestamp,
          old: previous.method,
          new: current.method
        });
      }

      if (current.type !== previous.type) {
        changes.push({
          type: 'Protocol',
          timestamp,
          old: previous.type,
          new: current.type
        });
      }

      if (current.port !== previous.port) {
        changes.push({
          type: 'Port',
          timestamp,
          old: previous.port,
          new: current.port
        });
      }

      if (current.use_ssl !== previous.use_ssl) {
        changes.push({
          type: 'SSL',
          timestamp,
          old: previous.use_ssl,
          new: current.use_ssl
        });
      }
    }

    return changes;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">Loading target details...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-40 text-red-500">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Target Overview */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              {target.host}
              {target.use_ssl && <Shield className="h-5 w-5 text-green-500" />}
            </h2>
            <p className="text-gray-500 mt-1">{target.ip}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">First seen</p>
            <p className="font-medium">
              {history[0]?.timestamp.toLocaleDateString() || 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Method</p>
            <p className="font-medium">{target.method}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Protocol</p>
            <p className="font-medium">{target.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Port</p>
            <p className="font-medium">{target.port}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">SSL</p>
            <p className="font-medium">{target.use_ssl ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </Card>

      {/* Timeline of Changes */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Configuration Changes</h3>
        <div className="space-y-4">
          {changes.length === 0 ? (
            <p className="text-gray-500">No configuration changes detected</p>
          ) : (
            changes.map((change, index) => (
              <div key={`${change.type}-${index}`} className="flex items-center gap-4 text-sm">
                <div className="w-32 text-gray-500">
                  {change.timestamp.toLocaleDateString()}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-medium">{change.type}:</span>
                  <span className="text-gray-500">{String(change.old)}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span>{String(change.new)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Recent Alerts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Recent Alerts</h3>
          <span className="text-sm text-gray-500">Last 30 days</span>
        </div>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-gray-500">No recent alerts</p>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className={`h-5 w-5 ${
                  alert.severity === 'HIGH' ? 'text-red-500' : 
                  alert.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};