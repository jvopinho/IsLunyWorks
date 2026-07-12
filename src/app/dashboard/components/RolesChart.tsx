'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

interface RoleData {
  name: string;
  value: number;
}

interface RolesChartProps {
  data?: RoleData[];
  isLoading: boolean;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

export const RolesChart: React.FC<RolesChartProps> = ({ data, isLoading }) => {
  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>🍕 Distribuição por Cargo</WidgetTitle>
        <WidgetSubtitle>Proporção de colaboradores alocados em cada perfil de acesso</WidgetSubtitle>
      </div>

      {isLoading || !data ? (
        <LoadingPlaceholder>Carregando dados de cargos...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </WidgetContainer>
  );
};
