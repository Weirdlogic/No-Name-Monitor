import React, { useMemo, useState } from 'react';
import { useStatistics } from '../../hooks/useStatistics';
import { Card } from '../ui/Card';
import { 
  AlertCircle, 
  Globe2, 
  Network, 
  Shield, 
  Target,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { AlertPanel } from './AlertPanel';
import { TLDDistributionChart } from './charts/TLDDistributionChart';
import { Skeleton } from '../ui/Skeleton';
import { TLDStats, MethodStats, TrendData } from '../../types/statistics';

// Types
interface StatCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: number | null;
  loading?: boolean;
}

interface TimeRangeProps {
  timeRange: '24h' | '7d' | '30d';
}

// Loading skeleton for stat card
const StatCardSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-center space-x-4">
      <div className="p-3 rounded-lg">
        <Skeleton className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  </Card>
);

const ChartSkeleton = () => (
  <div className="h-64 w-full">
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
);

// Enhanced StatCard with loading state and trends
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  previousValue,
  icon: Icon, 
  trend = null,
  loading = false 
}) => {
  if (loading) return <StatCardSkeleton />;

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return ArrowUpRight;
    if (trend < 0) return ArrowDownRight;
    return null;
  };

  const TrendIcon = trend ? getTrendIcon(trend) : null;

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
            {trend !== null && TrendIcon && (
              <div className={`ml-2 flex items-center text-sm ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="h-4 w-4" />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {previousValue !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Previous: {previousValue}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Error Display Component
const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center p-6 bg-red-50 rounded-lg">
    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
    <p className="text-red-700">{message}</p>
  </div>
);

// Main Dashboard Component
const MainDashboard: React.FC = () => {
  const { 
    totalTargets, 
    activeHosts, 
    tldDistribution, 
    methodDistribution,
    loading,
    error,
    getTrend 
  } = useStatistics();

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Calculate statistics
  const stats = useMemo(() => {
    if (!tldDistribution) {
      return {
        totalTLDs: 0,
        mostActiveTLD: 'N/A',
        tldStats: [] as TLDStats[]
      };
    }

    const entries = Array.from(tldDistribution.entries());
    const totalTLDs = entries.length;
    const mostActiveTLD = entries.sort((a, b) => b[1] - a[1])[0];
    const total = entries.reduce((sum, [_, count]) => sum + count, 0);

    const tldStats: TLDStats[] = entries.map(([tld, count]) => ({
      tld,
      count,
      percentage: (count / total) * 100,
      hosts: new Set([tld]), // This should be populated with actual host data
      uniqueIPs: 0, // This should be populated with actual IP count
      attackMethods: new Set() // This should be populated with actual methods
    }));

    return {
      totalTLDs,
      mostActiveTLD: mostActiveTLD ? `${mostActiveTLD[0]} (${mostActiveTLD[1]})` : 'N/A',
      tldStats
    };
  }, [tldDistribution]);

  if (error) {
    return <ErrorDisplay message={error.message} />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
          className="border rounded-md px-3 py-1 text-sm"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Targets" 
          value={totalTargets}
          previousValue={getTrend('totalTargets')?.previousValue}
          trend={getTrend('totalTargets')?.percentage}
          icon={Target}
          loading={loading}
        />
        <StatCard 
          title="Unique Hosts" 
          value={activeHosts}
          previousValue={getTrend('activeHosts')?.previousValue}
          trend={getTrend('activeHosts')?.percentage}
          icon={Globe2}
          loading={loading}
        />
        <StatCard 
          title="TLDs Targeted" 
          value={stats.totalTLDs}
          previousValue={getTrend('totalTLDs')?.previousValue}
          trend={getTrend('totalTLDs')?.percentage}
          icon={Network}
          loading={loading}
        />
        <StatCard
          title="Most Active TLD"
          value={stats.mostActiveTLD}
          icon={Shield}
          loading={loading}
        />
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* TLD Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">TLD Distribution</h3>
            {loading && <div className="animate-pulse bg-gray-100 h-4 w-24 rounded" />}
          </div>
          <div className="h-64">
            {loading ? (
              <div className="h-full bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <TLDDistributionChart data={stats.tldStats} />
            )}
          </div>
        </Card>

        {/* Alert Panel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <AlertPanel timeRange={timeRange as TimeRangeProps['timeRange']} />
        </Card>
      </div>

      {/* Additional Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attack Methods</h3>
        <div className="h-64">
          {loading ? (
            <div className="h-full bg-gray-50 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MainDashboard;