'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

interface GrowthData {
  date: string;
  count: number;
}

interface UsersGrowthChartProps {
  data?: GrowthData[];
  isLoading: boolean;
}

export const UsersGrowthChart: React.FC<UsersGrowthChartProps> = ({ data, isLoading }) => {
  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>📈 Crescimento de Usuários</WidgetTitle>
        <WidgetSubtitle>Evolução acumulada da base de colaboradores cadastrados</WidgetSubtitle>
      </div>

      {isLoading || !data ? (
        <LoadingPlaceholder>Carregando dados de crescimento...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
                labelStyle={{ fontWeight: 600, color: '#0f172a' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Usuários"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ stroke: '#6366f1', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </WidgetContainer>
  );
};
