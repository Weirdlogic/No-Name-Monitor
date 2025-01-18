// src/components/monitoring/FileMonitor.tsx
import React, { useEffect, useState } from 'react';
import FileMonitorService from '../../services/FileMonitorService';

export const FileMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      try {
        await FileMonitorService.loadHistoricalFile(files[i]);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error loading file:', error);
      }
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      FileMonitorService.stopMonitoring();
    } else {
      FileMonitorService.startMonitoring();
    }
    setIsMonitoring(!isMonitoring);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Configuration Monitor</h2>
        <button
          onClick={toggleMonitoring}
          className={`px-4 py-2 rounded ${
            isMonitoring ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="file"
          multiple
          accept=".json"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {lastUpdate && (
        <div className="text-sm text-gray-500">
          Last update: {lastUpdate.toLocaleString()}
        </div>
      )}
    </div>
  );
};