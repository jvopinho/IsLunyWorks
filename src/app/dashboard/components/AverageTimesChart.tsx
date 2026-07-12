'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

interface AverageTimesChartProps {
  data?: { date: string; avgIn: number; avgOut: number }[];
  isLoading: boolean;
}

export const AverageTimesChart: React.FC<AverageTimesChartProps> = ({ data, isLoading }) => {
  const formatHour = (val: number) => {
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>⏱️ Horário Médio de Entrada e Saída</WidgetTitle>
        <WidgetSubtitle>Tendência diária da média dos horários de batida (últimos 30 dias)</WidgetSubtitle>
      </div>

      {isLoading || !data ? (
        <LoadingPlaceholder>Carregando horários médios...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                domain={[6, 22]}
                tickFormatter={formatHour}
              />
              <Tooltip
                formatter={(value: any) => [formatHour(Number(value)), 'Horário']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
                labelStyle={{ fontWeight: 600, color: '#0f172a' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line
                type="monotone"
                dataKey="avgIn"
                name="Entrada Média"
                stroke="#eab308"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="avgOut"
                name="Saída Média"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </WidgetContainer>
  );
};
