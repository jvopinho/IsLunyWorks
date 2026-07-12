'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

interface HoursData {
  date: string;
  hours: number;
}

interface HoursChartProps {
  data?: HoursData[];
  isLoading: boolean;
}

export const HoursChart: React.FC<HoursChartProps> = ({ data, isLoading }) => {
  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>📈 Horas Trabalhadas</WidgetTitle>
        <WidgetSubtitle>Total acumulado de horas trabalhadas por dia (últimos 30 dias)</WidgetSubtitle>
      </div>

      {isLoading || !data ? (
        <LoadingPlaceholder>Carregando dados de horas...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
                labelStyle={{ fontWeight: 600, color: '#0f172a' }}
              />
              <Area
                type="monotone"
                dataKey="hours"
                name="Horas"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#hoursGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </WidgetContainer>
  );
};
