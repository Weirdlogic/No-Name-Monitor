import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Shield, Globe, Network, Server, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { TargetConfig } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SearchResultsProps {
  results: TargetConfig[];
  onTargetSelect: (target: TargetConfig) => void;
}

type GroupBy = 'tld' | 'method' | 'protocol' | 'port' | 'none';

interface ResultGroup {
  key: string;
  targets: TargetConfig[];
  description: string;
}

export const SearchResults = ({ results, onTargetSelect }: SearchResultsProps) => {
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Group results based on selected criterion
  const groupedResults = useMemo((): ResultGroup[] => {
    if (groupBy === 'none') {
      return [{
        key: 'all',
        targets: results,
        description: `${results.length} targets found`
      }];
    }

    const groups = new Map<string, TargetConfig[]>();

    results.forEach(target => {
      let key: string;
      let description: string;

      switch (groupBy) {
        case 'tld':
          key = target.host.split('.').slice(-1)[0];
          description = `.${key} domains`;
          break;
        case 'method':
          key = target.method;
          description = `${key} requests`;
          break;
        case 'protocol':
          key = target.type;
          description = `${key} protocol`;
          break;
        case 'port':
          key = target.port.toString();
          description = `Port ${key}`;
          break;
        default:
          key = 'default';
          description = 'All targets';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(target);
    });

    return Array.from(groups.entries())
      .map(([key, targets]) => ({
        key,
        targets,
        description: `${targets.length} targets using ${description}`
      }))
      .sort((a, b) => b.targets.length - a.targets.length);
  }, [results, groupBy]);

  // Calculate statistics for visualization
  const stats = useMemo(() => ({
    totalTargets: results.length,
    uniqueHosts: new Set(results.map(t => t.host)).size,
    uniqueIPs: new Set(results.map(t => t.ip)).size,
    methodDistribution: results.reduce((acc, target) => {
      acc[target.method] = (acc[target.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [results]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Search Results</h2>
          <div className="flex items-center space-x-4">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="border rounded-md p-2"
            >
              <option value="none">No Grouping</option>
              <option value="tld">Group by TLD</option>
              <option value="method">Group by Method</option>
              <option value="protocol">Group by Protocol</option>
              <option value="port">Group by Port</option>
            </select>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-1 text-gray-600"
            >
              {showDetails ? <ChevronUp /> : <ChevronDown />}
              <span>Details</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500">Total Targets</p>
            <p className="text-2xl font-semibold">{stats.totalTargets}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unique Hosts</p>
            <p className="text-2xl font-semibold">{stats.uniqueHosts}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unique IPs</p>
            <p className="text-2xl font-semibold">{stats.uniqueIPs}</p>
          </div>
        </div>

        {/* Method Distribution Chart */}
        {showDetails && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(stats.methodDistribution).map(([name, value]) => ({
                    name,
                    value
                  }))}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.keys(stats.methodDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Grouped Results */}
      <div className="space-y-4">
        {groupedResults.map(group => (
          <Card
            key={group.key}
            className={`p-4 cursor-pointer transition-colors ${
              selectedGroup === group.key ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedGroup(
              selectedGroup === group.key ? null : group.key
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {groupBy === 'tld' && <Globe className="h-5 w-5 text-blue-500" />}
                {groupBy === 'method' && <Server className="h-5 w-5 text-green-500" />}
                {groupBy === 'protocol' && <Network className="h-5 w-5 text-yellow-500" />}
                {groupBy === 'port' && <Shield className="h-5 w-5 text-red-500" />}
                <div>
                  <h3 className="font-medium">{group.description}</h3>
                  <p className="text-sm text-gray-500">
                    {((group.targets.length / results.length) * 100).toFixed(1)}% of results
                  </p>
                </div>
              </div>
              {selectedGroup === group.key ? <ChevronUp /> : <ChevronDown />}
            </div>

            {/* Expanded Group Details */}
            {selectedGroup === group.key && (
              <div className="mt-4 space-y-2">
                {group.targets.map(target => (
                  <div
                    key={target.target_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTargetSelect(target);
                    }}
                    className="p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{target.host}</span>
                      <span className="text-sm text-gray-500">{target.ip}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex items-center space-x-4">
                      <span>{target.method}</span>
                      <span>{target.type}</span>
                      <span>Port: {target.port}</span>
                      {target.use_ssl && <Shield className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Pattern Analysis */}
      {showDetails && results.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Pattern Analysis</h3>
          <div className="space-y-4">
            {/* Common Patterns */}
            <div>
              <h4 className="font-medium mb-2">Common Attack Patterns</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(
                  results.reduce((acc, target) => {
                    const pattern = `${target.method}-${target.type}-${target.port}`;
                    acc[pattern] = (acc[pattern] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([pattern, count]) => {
                    const [method, type, port] = pattern.split('-');
                    return (
                      <div key={pattern} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{count} targets</span>
                          <span className="text-sm text-gray-500">
                            {((count / results.length) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <div>{method}</div>
                          <div>{type}</div>
                          <div>Port: {port}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};