// src/components/monitoring/TargetList.tsx
import React from 'react';
import { useConfigurationData } from '../../hooks/useConfigurationData';

export const TargetList: React.FC = () => {
  const { targets, loading } = useConfigurationData();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Target list content */}
    </div>
  );
};