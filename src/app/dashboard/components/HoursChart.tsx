'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetHeader, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

export const HoursChart: React.FC = () => {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['hoursChart', days],
    queryFn: async () => {
      const res = await axios.get(`/api/dashboard/charts?days=${days}`);
      return res.data;
    },
  });

  const chartData = data?.hoursAndRecords || [];

  return (
    <WidgetContainer>
      <WidgetHeader>
        <div>
          <WidgetTitle>📈 Horas Trabalhadas</WidgetTitle>
          <WidgetSubtitle>Total acumulado de horas trabalhadas por dia (IsLuny Org)</WidgetSubtitle>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          style={{
            padding: '0.375rem 0.5rem',
            fontSize: '0.75rem',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            backgroundColor: 'white',
            outline: 'none',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
          <option value={365}>Último ano</option>
        </select>
      </WidgetHeader>

      {isLoading ? (
        <LoadingPlaceholder>Carregando dados de horas...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
