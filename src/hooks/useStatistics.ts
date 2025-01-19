import { useState, useEffect } from 'react';
import StatisticsService from '../services/StatisticsService';
import { MethodStats, ProtocolStats, TLDStats } from '../types/statistics';

// Types
export interface TrendData {
  previousValue: number;
  percentage: number;
}

interface Statistics {
  totalTargets: number;
  activeHosts: number;
  tldDistribution: Map<string, number>;
  methodDistribution: MethodStats[];
  protocolDistribution: ProtocolStats[];
  tldStats: TLDStats[];
  lastUpdate: Date | null;
}

export interface StatisticsData extends Statistics {
  loading: boolean;
  error: Error | null;
  getTrend: (metric: keyof Pick<Statistics, 'totalTargets' | 'activeHosts'>) => TrendData | null;
}

export const useStatistics = () => {
  const [stats, setStats] = useState<Statistics>({
    totalTargets: 0,
    activeHosts: 0,
    tldDistribution: new Map(),
    methodDistribution: [],
    protocolDistribution: [],
    tldStats: [],
    lastUpdate: null
  });

  const [previousStats, setPreviousStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const snapshot = await StatisticsService.getStatistics();
        setPreviousStats(stats);
        setStats({
          totalTargets: snapshot.totalTargets,
          activeHosts: snapshot.uniqueHosts,
          tldDistribution: new Map(
            snapshot.tldDistribution.map(tld => [tld.tld, tld.count])
          ),
          methodDistribution: snapshot.methodDistribution,
          protocolDistribution: snapshot.protocolDistribution,
          tldStats: snapshot.tldDistribution,
          lastUpdate: snapshot.timestamp
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch statistics'));
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
    // Poll for updates every 5 minutes
    const intervalId = setInterval(fetchStatistics, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const getTrend = (metric: keyof Pick<Statistics, 'totalTargets' | 'activeHosts'>): TrendData | null => {
    if (!previousStats) return null;

    const currentValue = stats[metric];
    const previousValue = previousStats[metric];

    if (typeof currentValue !== 'number' || typeof previousValue !== 'number') {
      return null;
    }

    const percentage = previousValue !== 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

    return {
      previousValue,
      percentage: Number(percentage.toFixed(1))
    };
  };

  return {
    ...stats,
    loading,
    error,
    getTrend
  };
};