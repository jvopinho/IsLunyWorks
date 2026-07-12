'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

interface ClockData {
  date: string;
  count: number;
}

interface ClockChartProps {
  data?: ClockData[];
  isLoading: boolean;
}

export const ClockChart: React.FC<ClockChartProps> = ({ data, isLoading }) => {
  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>📊 Volume de Registros</WidgetTitle>
        <WidgetSubtitle>Quantidade total de batidas de ponto por dia (últimos 30 dias)</WidgetSubtitle>
      </div>

      {isLoading || !data ? (
        <LoadingPlaceholder>Carregando dados de registros...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Bar dataKey="count" name="Registros" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </WidgetContainer>
  );
};
