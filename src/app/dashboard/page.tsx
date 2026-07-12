'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePermission } from '@/hooks/usePermission';
import { Clock3 } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, Column } from '@/components/Table';
import { formatDateTime, formatMinutes } from '@/utils/date';
import { Grid, StatCard, MainGrid, ClockCardWrapper, ClockStatus, SectionTitle, AdminDashboardGrid, ChartsCol } from './styles';

// Modular Dashboard Widgets
import { StatisticsCards } from './components/StatisticsCards';
import { HoursChart } from './components/HoursChart';
import { ClockChart } from './components/ClockChart';
import { RolesChart } from './components/RolesChart';
import { UsersGrowthChart } from './components/UsersGrowthChart';
import { TopUsersHoursChart } from './components/TopUsersHoursChart';
import { ActivityTimeline } from './components/ActivityTimeline';
import { AverageTimesChart } from './components/AverageTimesChart';
import { AuditChangesChart } from './components/AuditChangesChart';
import { RecentUsersWidget } from './components/RecentUsersWidget';

interface ClockStatusResponse {
  isClockedIn: boolean;
  activeRecord: {
    id: string;
    clockIn: string;
    notes?: string;
  } | null;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { can, user } = usePermission();
  const [notes, setNotes] = useState('');

  const { data: clockStatus, isLoading: isClockLoading } = useQuery<ClockStatusResponse>({
    queryKey: ['clockStatus'],
    queryFn: async () => {
      const res = await axios.get('/api/clock');
      return res.data;
    },
    enabled: !!user?.id,
  });

  const { data: reportData } = useQuery({
    queryKey: ['recentRecords', user?.id],
    queryFn: async () => {
      const url = can('reports.view') ? '/api/reports' : `/api/reports?userId=${user?.id}`;
      const res = await axios.get(url);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const { data: bankHoursBalance } = useQuery<any>({
    queryKey: ['myBankHoursBalance'],
    queryFn: async () => {
      const res = await axios.get('/api/bank-hours');
      return res.data;
    },
    enabled: !!user?.id && can('bank_hours.view'),
  });

  const { data: adminStats, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await axios.get('/api/dashboard');
      return res.data;
    },
    enabled: can('admin'),
  });

  const { data: chartsData, isLoading: isChartsLoading } = useQuery<any>({
    queryKey: ['chartsData'],
    queryFn: async () => {
      const res = await axios.get('/api/dashboard/charts');
      return res.data;
    },
    enabled: can('admin'),
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery<any[]>({
    queryKey: ['activityTimeline'],
    queryFn: async () => {
      const res = await axios.get('/api/dashboard/activity');
      return res.data;
    },
    enabled: can('admin'),
  });

  const clockMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post('/api/clock', { notes });
      return res.data;
    },
    onSuccess: () => {
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['clockStatus'] });
      queryClient.invalidateQueries({ queryKey: ['recentRecords'] });
      if (can('admin')) {
        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
        queryClient.invalidateQueries({ queryKey: ['chartsData'] });
        queryClient.invalidateQueries({ queryKey: ['activityTimeline'] });
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao registrar ponto');
    },
  });

  const handleClockAction = () => {
    clockMutation.mutate();
  };

  const recentRecords = reportData?.records?.slice(0, 5) || [];

  const columns: Column<any>[] = [
    {
      key: 'user',
      header: 'Colaborador',
      render: (row) => row.user?.name || '-',
    },
    {
      key: 'clockIn',
      header: 'Entrada',
      render: (row) => formatDateTime(row.clockIn),
    },
    {
      key: 'clockOut',
      header: 'Saída',
      render: (row) => row.clockOut ? formatDateTime(row.clockOut) : <span style={{ color: '#eab308', fontWeight: '500' }}>Em aberto</span>,
    },
    {
      key: 'totalMinutes',
      header: 'Total Trabalhado',
      render: (row) => formatMinutes(row.totalMinutes),
    },
    {
      key: 'notes',
      header: 'Observações',
    },
  ];

  return (
    <DashboardLayout title="Painel Geral">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Painel Geral' }]} />

      {can('admin') ? (
        <>
          <StatisticsCards stats={adminStats} isLoading={isStatsLoading} />

          <AdminDashboardGrid>
            <ChartsCol>
              <HoursChart />
              <ClockChart data={chartsData?.hoursAndRecords} isLoading={isChartsLoading} />
              <AverageTimesChart data={chartsData?.avgTimesData} isLoading={isChartsLoading} />
              <UsersGrowthChart data={chartsData?.usersGrowth} isLoading={isChartsLoading} />
            </ChartsCol>
            
            <ChartsCol>
              <RolesChart data={chartsData?.rolesDistribution} isLoading={isChartsLoading} />
              <AuditChangesChart />
              <RecentUsersWidget users={chartsData?.recentUsers} isLoading={isChartsLoading} />
              <TopUsersHoursChart />
              <ActivityTimeline data={activityData} isLoading={isActivityLoading} />
            </ChartsCol>
          </AdminDashboardGrid>
        </>
      ) : (
        <>
          {reportData?.stats && (
            <Grid style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <StatCard>
                <span className="title">Total de Registros</span>
                <span className="value">{reportData.stats.totalRecords}</span>
                <span className="sub">Registrados no período</span>
              </StatCard>
              <StatCard>
                <span className="title">Total de Horas</span>
                <span className="value">{parseFloat(reportData.stats.totalHours).toFixed(1)}h</span>
                <span className="sub">Horas trabalhadas acumuladas</span>
              </StatCard>
              <StatCard>
                <span className="title">Média Diária</span>
                <span className="value">{parseFloat(reportData.stats.dailyAverageHours).toFixed(1)}h</span>
                <span className="sub">Média por dia trabalhado</span>
              </StatCard>
              <StatCard>
                <span className="title">Dias com Registros</span>
                <span className="value">{reportData.stats.daysCount}</span>
                <span className="sub">Total de dias no controle</span>
              </StatCard>
              {can('bank_hours.view') && bankHoursBalance && (
                <StatCard style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/bank-hours'}>
                  <span className="title">Banco de Horas</span>
                  <span className="value" style={{ color: bankHoursBalance.currentBalanceMinutes >= 0 ? '#10b981' : '#ef4444' }}>
                    {(() => {
                      const mins = bankHoursBalance.currentBalanceMinutes;
                      const hrs = Math.floor(Math.abs(mins) / 60);
                      const mm = Math.abs(mins) % 60;
                      return `${mins < 0 ? '-' : ''}${hrs}h${String(mm).padStart(2, '0')}m`;
                    })()}
                  </span>
                  <span className="sub">Clique para ver extrato</span>
                </StatCard>
              )}
            </Grid>
          )}

          <MainGrid>
            <Card title="Últimos Registros" description="Visualização dos 5 registros de ponto mais recentes">
              <Table
                columns={columns.filter((c) => c.key !== 'user')}
                data={recentRecords}
                emptyMessage="Nenhum registro de ponto encontrado."
              />
            </Card>

            {can('clock.register') && (
              <ClockCardWrapper>
                <SectionTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock3 size={18} /> Ponto Eletrônico
                </SectionTitle>

                {isClockLoading ? (
                  <div>Carregando status...</div>
                ) : (
                  <>
                    <ClockStatus active={clockStatus?.isClockedIn}>
                      {clockStatus?.isClockedIn
                        ? `Jornada Ativa - Entrada: ${formatDateTime(clockStatus.activeRecord?.clockIn!)}`
                        : 'Expediente encerrado (Ponto fechado)'}
                    </ClockStatus>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label htmlFor="notes" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Observação
                      </label>
                      <textarea
                        id="notes"
                        placeholder="Adicione uma observação opcional..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '0.5rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    <Button
                      variant={clockStatus?.isClockedIn ? 'danger' : 'success'}
                      fullWidth
                      size="lg"
                      onClick={handleClockAction}
                      isLoading={clockMutation.isPending}
                    >
                      {clockStatus?.isClockedIn ? 'Registrar Saída' : 'Registrar Entrada'}
                    </Button>
                  </>
                )}
              </ClockCardWrapper>
            )}
          </MainGrid>
        </>
      )}
    </DashboardLayout>
  );
}
