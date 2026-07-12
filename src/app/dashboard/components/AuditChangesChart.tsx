'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, ChartWrapper, LoadingPlaceholder } from './styles';

const COLORS = ['#ef4444', '#6366f1', '#f59e0b', '#10b981'];

export const AuditChangesChart: React.FC = () => {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['auditChangesStats'],
    queryFn: async () => {
      const res = await axios.get('/api/audit/statistics');
      return res.data;
    },
  });

  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>🛠️ Alterações e Ações do Sistema</WidgetTitle>
        <WidgetSubtitle>Contagem consolidada de modificações e acessos na plataforma</WidgetSubtitle>
      </div>

      {isLoading ? (
        <LoadingPlaceholder>Carregando dados de auditoria...</LoadingPlaceholder>
      ) : (
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: '0.675rem' }} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
              />
              <Bar dataKey="count" name="Operações" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </WidgetContainer>
  );
};
