import React from 'react';
import { Card } from '../../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MethodStats } from '../../../types/statistics';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface MethodDistributionChartProps {
  data: MethodStats[];
}

export const MethodDistributionChart = ({ data }: MethodDistributionChartProps) => {
  const chartData = data.map(item => ({
    name: item.method,
    value: item.count,
    percentage: item.percentage
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Attack Methods</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} targets (${chartData.find(d => d.name === name)?.percentage.toFixed(1)}%)`,
                name
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        {chartData.map((method, index) => (
          <div key={method.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{method.name}</span>
            </div>
            <span className="font-medium">{method.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};