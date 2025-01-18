// src/components/dashboard/AlertPanel.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { AlertTriangle, ArrowUp, Shield, Target } from 'lucide-react';
import { Alert, AlertCategory, AlertSeverity } from '../../types/alerts';
import AlertService from '../../services/AlertService';

const severityIcons = {
  [AlertSeverity.CRITICAL]: AlertTriangle,
  [AlertSeverity.HIGH]: ArrowUp,
  [AlertSeverity.MEDIUM]: Target,
  [AlertSeverity.LOW]: Shield
};

const severityColors = {
  [AlertSeverity.CRITICAL]: 'text-red-500',
  [AlertSeverity.HIGH]: 'text-orange-500',
  [AlertSeverity.MEDIUM]: 'text-yellow-500',
  [AlertSeverity.LOW]: 'text-blue-500'
};

interface AlertCardProps {
  alert: Alert;
}

const AlertCard = ({ alert }: AlertCardProps) => {
  const Icon = severityIcons[alert.severity] || AlertTriangle;
  const colorClass = severityColors[alert.severity];

  return (
    <div className="border-l-4 border-l-blue-500 bg-white p-4 rounded shadow-sm">
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 ${colorClass} mt-1`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
            <span className="text-xs text-gray-500">
              {alert.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
          {alert.context.host && (
            <p className="mt-1 text-xs text-gray-500">
              Host: {alert.context.host}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const AlertPanel = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'ALL'>('ALL');

  useEffect(() => {
    // Get initial alerts
    const fetchAlerts = () => {
      const latestAlerts = AlertService.getAlerts(
        new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );
      setAlerts(latestAlerts);
    };

    fetchAlerts();
    
    // Poll for new alerts every minute
    const intervalId = setInterval(fetchAlerts, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredAlerts = selectedCategory === 'ALL' 
    ? alerts 
    : alerts.filter(alert => alert.category === selectedCategory);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as AlertCategory | 'ALL')}
          className="text-sm border border-gray-300 rounded-md p-1"
        >
          <option value="ALL">All Categories</option>
          {Object.values(AlertCategory).map(category => (
            <option key={category} value={category}>
              {category.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent alerts</p>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </Card>
  );
};