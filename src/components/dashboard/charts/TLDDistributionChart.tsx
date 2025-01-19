import React, { useMemo, useState } from 'react';
import { Card } from '../../ui/Card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { TLDStats } from '../../../types/statistics';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { CategoricalChartState } from 'recharts/types/chart/types';

interface TLDDistributionChartProps {
  data: TLDStats[];
  onTLDSelect?: (tld: string) => void;
}

export const TLDDistributionChart = ({ data, onTLDSelect }: TLDDistributionChartProps) => {
  const [sortBy, setSortBy] = useState<'count' | 'uniqueIPs'>('count');
  const [showTop, setShowTop] = useState(10);
  const [showDetails, setShowDetails] = useState(false);

  const processedData = useMemo(() => {
    return data
      .map(item => ({
        tld: item.tld,
        targets: item.count, // we keep this as targets in the object
        uniqueIPs: item.uniqueIPs,
        percentage: item.percentage,
        methodCount: item.attackMethods.size,
        hostCount: item.hosts.size
      }))
      .sort((a, b) => {
        const key = sortBy === 'count' ? 'targets' : sortBy;
        return b[key] - a[key];
      })
      .slice(0, showTop);
  }, [data, sortBy, showTop]);

  // Define handleBarClick here
  const handleBarClick = (data: CategoricalChartState) => {
    if (data.activePayload?.[0]?.payload?.tld && onTLDSelect) {
      onTLDSelect(data.activePayload[0].payload.tld);
    }
  };

  const handleItemClick = (tld: { tld: string }) => {
    if (onTLDSelect) {
      onTLDSelect(tld.tld);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 shadow-lg rounded border">
        <p className="font-medium">{data.tld}</p>
        <p className="text-sm">Targets: {data.targets}</p>
        <p className="text-sm">Unique IPs: {data.uniqueIPs}</p>
        <p className="text-sm">Unique Hosts: {data.hostCount}</p>
        <p className="text-sm">Attack Methods: {data.methodCount}</p>
        <p className="text-sm text-gray-500">{data.percentage.toFixed(1)}% of total</p>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">TLD Distribution</h3>
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'count' | 'uniqueIPs')}
            className="text-sm border border-gray-300 rounded-md p-1"
          >
            <option value="count">Sort by Targets</option>
            <option value="uniqueIPs">Sort by Unique IPs</option>
          </select>
          <select
            value={showTop}
            onChange={(e) => setShowTop(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md p-1"
          >
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
            <option value="50">Top 50</option>
          </select>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="ml-1">Details</span>
          </button>
        </div>
      </div>

      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tld" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="targets" 
              fill="#3B82F6" 
              name="Targets"
              radius={[4, 4, 0, 0]}
            />
            {sortBy === 'uniqueIPs' && (
              <Bar 
                dataKey="uniqueIPs" 
                fill="#10B981" 
                name="Unique IPs"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showDetails && (
        <div className="mt-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedData.map((tld) => (
              <div 
                key={tld.tld}
                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => handleItemClick(tld)}
              >
                <h4 className="font-medium">{tld.tld}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Targets: {tld.targets}</p>
                  <p>Unique IPs: {tld.uniqueIPs}</p>
                  <p>Hosts: {tld.hostCount}</p>
                  <p>Methods: {tld.methodCount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
