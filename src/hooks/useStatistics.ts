import { useState, useEffect } from 'react';
import StatisticsService from '../services/StatisticsService';
import { MethodStats, ProtocolStats, TLDStats } from '../types/statistics';

interface Statistics {
  totalTargets: number;
  activeHosts: number;
  tldDistribution: Map<string, number>;
  methodDistribution: MethodStats[];
  protocolDistribution: ProtocolStats[];
  tldStats: TLDStats[];
  lastUpdate: Date | null;
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const snapshot = await StatisticsService.getStatistics();
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

  // Get trend for a specific metric
  const getTrend = (metric: keyof Statistics): number | null => {
    // Implementation for trend calculation
    // Will be added in next iteration
    return null;
  };

  return {
    ...stats,
    loading,
    error,
    getTrend
  };
};