// src/hooks/useConfigurationData.ts
import { useState, useEffect } from 'react';
import { TargetConfig } from '../types';
import DataService from '../services/DataService';

export const useConfigurationData = (host?: string) => {
  const [targets, setTargets] = useState<TargetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (host) {
      try {
        const data = DataService.getTargetsForHost(host);
        setTargets(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
  }, [host]);

  return { targets, loading, error };
};