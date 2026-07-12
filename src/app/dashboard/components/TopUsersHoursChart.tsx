'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetHeader, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

export const TopUsersHoursChart: React.FC = () => {
  const [days, setDays] = useState(30);

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['topUsers', days],
    queryFn: async () => {
      const res = await axios.get(`/api/dashboard/top-users?days=${days}`);
      return res.data;
    },
  });

  return (
    <WidgetContainer>
      <WidgetHeader>
        <div>
          <WidgetTitle>👥 Horas por Colaborador</WidgetTitle>
          <WidgetSubtitle>Colaboradores com mais horas trabalhadas acumuladas no período</WidgetSubtitle>
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
        </select>
      </WidgetHeader>

      {isLoading ? (
        <LoadingPlaceholder>Carregando ranking...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
              />
              <Bar dataKey="hours" name="Horas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </WidgetContainer>
  );
};
