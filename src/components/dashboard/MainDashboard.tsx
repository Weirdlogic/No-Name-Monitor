import React from 'react';
import { useStatistics } from '../../hooks/useStatistics';
import { Card } from '../ui/Card';
import { AlertCircle, Globe2, Network, Shield, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define the types for StatCard props
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: number | null;
}

// StatCard Component
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend = null }) => (
  <Card className="p-6">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="h-6 w-6 text-blue-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-baseline">
          <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
          {trend !== null && (
            <span className={`ml-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  </Card>
);

// MainDashboard Component
const MainDashboard: React.FC = () => {
  const { totalTargets, activeHosts, tldDistribution, methodDistribution } = useStatistics();

  // Calculations for statistics
  const totalTLDs = Array.from(tldDistribution.keys()).length;
  const mostActiveTLD = Array.from(tldDistribution.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Prepare data for the chart
  const tldChartData = Array.from(tldDistribution.entries()).map(([tld, count]) => ({
    tld,
    count,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Targets" value={totalTargets} icon={Target} />
        <StatCard title="Unique Hosts" value={activeHosts} icon={Globe2} />
        <StatCard title="TLDs Targeted" value={totalTLDs} icon={Network} />
        <StatCard
          title="Most Active TLD"
          value={mostActiveTLD ? `${mostActiveTLD[0]} (${mostActiveTLD[1]})` : 'N/A'}
          icon={Shield}
        />
      </div>

      {/* Chart and Alerts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart Card */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">TLD Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={tldChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tld" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Alerts Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="space-y-4">
             {/* Alert list will go here - we'll add this in the next iteration */}
            <p className="text-gray-500 text-sm">No recent alerts</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MainDashboard;
