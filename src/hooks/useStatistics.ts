// src/hooks/useStatistics.ts
import { useState, useEffect } from 'react';
import DataService from '../services/DataService';

interface Statistics {
  totalTargets: number;
  activeHosts: number;
  tldDistribution: Map<string, number>;
}

export const useStatistics = () => {
  const [stats, setStats] = useState<Statistics>({
    totalTargets: 0,
    activeHosts: 0,
    tldDistribution: new Map()
  });

  useEffect(() => {
    const updateStats = () => {
      setStats({
        totalTargets: DataService.getTotalTargets(),
        activeHosts: DataService.getActiveHostsCount(),
        tldDistribution: DataService.getTLDStatistics()
      });
    };

    updateStats();
    // You might want to add a subscription to DataService updates here
  }, []);

  return stats;
};