import React, { useState, useMemo } from 'react';
import { Card } from '../../ui/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend
} from 'recharts';
import { TimeWindow } from '../../../types/statistics';
import { Calendar, Filter, ZoomIn } from 'lucide-react';

interface TimelineData {
  timestamp: Date;
  targets: number;
  uniqueHosts: number;
  uniqueIPs: number;
}

interface TimelineChartProps {
  data: TimelineData[];
  onTimeWindowChange?: (window: TimeWindow) => void;
  onPointSelect?: (point: TimelineData) => void;
}

const timeRanges = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'all': Infinity
};

export const TimelineChart = ({ data, onTimeWindowChange, onPointSelect }: TimelineChartProps) => {
  const [timeRange, setTimeRange] = useState<keyof typeof timeRanges>('7d');
  const [metrics, setMetrics] = useState({
    targets: true,
    hosts: true,
    ips: false
  });

  const filteredData = useMemo(() => {
    const cutoff = new Date(Date.now() - timeRanges[timeRange]);
    return timeRange === 'all' ? data : data.filter(d => d.timestamp >= cutoff);
  }, [data, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-white p-3 shadow-lg rounded border">
        <p className="font-medium">
          {new Date(label).toLocaleDateString()} {new Date(label).toLocaleTimeString()}
        </p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  const handleBrushChange = (brushRange: any) => {
    if (brushRange && onTimeWindowChange) {
      onTimeWindowChange({
        start: new Date(brushRange.startIndex),
        end: new Date(brushRange.endIndex)
      });
    }
  };

  const handlePointClick = (point: any) => {
    if (point && point.activePayload && onPointSelect) {
      onPointSelect(point.activePayload[0].payload);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Attack Timeline</h3>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as keyof typeof timeRanges)}
            className="text-sm border border-gray-300 rounded-md p-1"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={metrics.targets}
                onChange={(e) => setMetrics({ ...metrics, targets: e.target.checked })}
                className="form-checkbox h-4 w-4 text-blue-500"
              />
              <span className="text-sm">Targets</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={metrics.hosts}
                onChange={(e) => setMetrics({ ...metrics, hosts: e.target.checked })}
                className="form-checkbox h-4 w-4 text-green-500"
              />
              <span className="text-sm">Hosts</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={metrics.ips}
                onChange={(e) => setMetrics({ ...metrics, ips: e.target.checked })}
                className="form-checkbox h-4 w-4 text-red-500"
              />
              <span className="text-sm">IPs</span>
            </label>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={filteredData}
            onClick={handlePointClick}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              scale="time" 
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {metrics.targets && (
              <Line 
                type="monotone" 
                dataKey="targets" 
                stroke="#3B82F6" 
                dot={false}
                name="Targets"
              />
            )}
            {metrics.hosts && (
              <Line 
                type="monotone" 
                dataKey="uniqueHosts" 
                stroke="#10B981" 
                dot={false}
                name="Hosts"
              />
            )}
            {metrics.ips && (
              <Line 
                type="monotone" 
                dataKey="uniqueIPs" 
                stroke="#EF4444" 
                dot={false}
                name="IPs"
              />
            )}
            <Brush 
              dataKey="timestamp"
              height={30}
              stroke="#8884d8"
              onChange={handleBrushChange}
              tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Average Targets</p>
          <p className="text-lg font-medium">
            {Math.round(filteredData.reduce((acc, d) => acc + d.targets, 0) / filteredData.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Peak Targets</p>
          <p className="text-lg font-medium">
            {Math.max(...filteredData.map(d => d.targets))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Current Targets</p>
          <p className="text-lg font-medium">
            {filteredData[filteredData.length - 1]?.targets || 0}
          </p>
        </div>
      </div>
    </Card>
  );
};