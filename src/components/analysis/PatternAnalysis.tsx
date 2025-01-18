import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { 
  Sankey, 
  Tooltip, 
  ResponsiveContainer,
  Rectangle,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Shield, Network } from 'lucide-react';
import DataService from '../../services/DataService';
import { TargetConfig } from '../../types';

interface PatternNode {
  name: string;
  value: number;
  category: 'tld' | 'method' | 'protocol' | 'port';
}

interface PatternLink {
  source: number;
  target: number;
  value: number;
}

interface PatternDetail {
  pattern: string;
  count: number;
  details: {
    method: string;
    protocol: string;
    port: string;
    ssl: boolean;
  };
}

interface MethodData {
  name: string;
  value: number;
}

interface ProtocolData {
  name: string;
  value: number;
}

export const PatternAnalysis = () => {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  
  const targets = useMemo(() => {
    const hosts = DataService.getActiveHosts();
    return hosts.flatMap(host => DataService.getTargetsForHost(host));
  }, []);

  // Process data for pattern analysis
  const { nodes, links, patterns, methods, protocols } = useMemo(() => {
    const nodeMap = new Map<string, number>();
    const nodes: PatternNode[] = [];
    const links: PatternLink[] = [];
    const patterns = new Map<string, number>();
    const methods = new Map<string, number>();
    const protocols = new Map<string, number>();

    // Helper to get or create node index
    const getNodeIndex = (name: string, category: PatternNode['category']) => {
      const key = `${category}:${name}`;
      if (!nodeMap.has(key)) {
        nodeMap.set(key, nodes.length);
        nodes.push({ name, value: 1, category });
      }
      return nodeMap.get(key)!;
    };

    // Process each target
    targets.forEach(target => {
      // Extract TLD
      const tld = target.host.split('.').slice(-1)[0];
      const tldIndex = getNodeIndex(tld, 'tld');

      // Method node
      const methodIndex = getNodeIndex(target.method, 'method');
      links.push({ source: tldIndex, target: methodIndex, value: 1 });
      methods.set(target.method, (methods.get(target.method) || 0) + 1);

      // Protocol node
      const protocolIndex = getNodeIndex(target.type, 'protocol');
      links.push({ source: methodIndex, target: protocolIndex, value: 1 });
      protocols.set(target.type, (protocols.get(target.type) || 0) + 1);

      // Create pattern signature
      const pattern = `${target.method}-${target.type}-${target.port}-${target.use_ssl}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });

    // Aggregate link values
    const linkMap = new Map<string, number>();
    links.forEach(link => {
      const key = `${link.source}-${link.target}`;
      linkMap.set(key, (linkMap.get(key) || 0) + link.value);
    });

    const aggregatedLinks = Array.from(linkMap.entries()).map(([key, value]) => {
      const [source, target] = key.split('-').map(Number);
      return { source, target, value };
    });

    return { 
      nodes, 
      links: aggregatedLinks,
      patterns,
      methods,
      protocols
    };
  }, [targets]);

  // Color scheme
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const categoryColors: Record<PatternNode['category'], string> = {
    tld: '#3B82F6',
    method: '#10B981',
    protocol: '#F59E0B',
    port: '#EF4444'
  };

  const commonPatterns: PatternDetail[] = Array.from(patterns.entries())
    .slice(0, 5)
    .map(([pattern, count]) => {
      const [method, protocol, port, ssl] = pattern.split('-');
      return {
        pattern,
        count,
        details: {
          method,
          protocol,
          port,
          ssl: ssl === 'true'
        }
      };
    });

  const methodData: MethodData[] = Array.from(methods.entries()).map(([name, value]) => ({
    name,
    value
  }));

  const protocolData: ProtocolData[] = Array.from(protocols.entries()).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Common Patterns */}
        <Card className="p-6 md:col-span-2">
          <h3 className="text-lg font-medium mb-4">Common Attack Patterns</h3>
          <div className="space-y-4">
            {commonPatterns.map((item) => (
              <div 
                key={item.pattern}
                onClick={() => setSelectedPattern(item.pattern)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedPattern === item.pattern ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Network className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{item.count} targets</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {((item.count / targets.length) * 100).toFixed(1)}% of total
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Method:</span>
                    <span className="ml-2 font-medium">{item.details.method}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Protocol:</span>
                    <span className="ml-2 font-medium">{item.details.protocol}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Port:</span>
                    <span className="ml-2 font-medium">{item.details.port}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">SSL:</span>
                    <span className="ml-2 font-medium">
                      {item.details.ssl ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Pattern Statistics</h3>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500">Unique Patterns</p>
              <p className="text-2xl font-semibold">{patterns.size}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Most Common Pattern</p>
              <p className="text-lg font-medium">
                {commonPatterns[0]?.count} targets
                <span className="text-sm text-gray-500 ml-2">
                  ({((commonPatterns[0]?.count / targets.length) * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">SSL Usage</p>
              <p className="text-lg font-medium">
                {targets.filter(t => t.use_ssl).length} targets
                <span className="text-sm text-gray-500 ml-2">
                  ({((targets.filter(t => t.use_ssl).length / targets.length) * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pattern Flow */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Attack Pattern Flow</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={{ nodes, links }}
              node={({ payload, x0, x1, y0, y1 }: any) => (
                <Rectangle
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={y1 - y0}
                  fill={categoryColors[payload.category as PatternNode['category']]}
                  fillOpacity={0.9}
                />
              )}
              link={{
                stroke: '#ddd',
              }}
              nodePadding={50}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <Tooltip />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pattern Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Method Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {methodData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Protocol Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {protocolData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};