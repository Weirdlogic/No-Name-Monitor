// src/components/dashboard/StatisticsPanel.tsx
import React from 'react';
import { Card } from '../ui/Card';
import { useStatistics } from '../../hooks/useStatistics';
import { AlertCircle, Globe, Target } from 'lucide-react';

export const StatisticsPanel: React.FC = () => {
  const { totalTargets, activeHosts, tldDistribution } = useStatistics();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <div className="flex items-center">
          <Target className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Targets</h3>
            <p className="text-2xl font-semibold">{totalTargets}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <Globe className="h-8 w-8 text-green-500 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Active Hosts</h3>
            <p className="text-2xl font-semibold">{activeHosts}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-gray-500">TLD Distribution</h3>
            <div className="text-sm">
              {Array.from(tldDistribution.entries()).map(([tld, count]) => (
                <div key={tld} className="flex justify-between">
                  <span>{tld}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};