'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePermission } from '@/hooks/usePermission';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, Column } from '@/components/Table';
import { formatDateTime, formatMinutes } from '@/utils/date';
import { ClockContainer, LiveTime, LiveDate, FormWrapper, StatusIndicator } from './styles';

export default function ClockPage() {
  const queryClient = useQueryClient();
  const { user } = usePermission();
  const [time, setTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: clockStatus, isLoading: isClockLoading } = useQuery<any>({
    queryKey: ['clockStatus'],
    queryFn: async () => {
      const res = await axios.get('/api/clock');
      return res.data;
    },
  });

  const { data: reportData, isLoading: isHistoryLoading } = useQuery<any>({
    queryKey: ['recentRecords', user?.id],
    queryFn: async () => {
      const res = await axios.get(`/api/reports?userId=${user?.id}`);
      return res.data;
    },
    enabled: !!user?.id,
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
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao registrar ponto');
    },
  });

  const handleClockAction = () => {
    clockMutation.mutate();
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get('/api/clock/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'isluny-works-meu-ponto.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erro ao exportar registros de ponto para Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const formattedTime = time.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const records = reportData?.records || [];

  const columns: Column<any>[] = [
    {
      key: 'clockIn',
      header: 'Entrada',
      render: (row) => formatDateTime(row.clockIn),
    },
    {
      key: 'clockOut',
      header: 'Saída',
      render: (row) => (row.clockOut ? formatDateTime(row.clockOut) : <span style={{ color: '#eab308', fontWeight: '500' }}>Em aberto</span>),
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
    <DashboardLayout title="Registrar Ponto">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Registrar Ponto' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        <Card title="Espelho de Ponto" description="Realize o registro de suas batidas em tempo real">
          <ClockContainer>
            <LiveTime>{formattedTime}</LiveTime>
            <LiveDate>{formattedDate}</LiveDate>

            {isClockLoading ? (
              <div>Carregando status...</div>
            ) : (
              <StatusIndicator active={clockStatus?.isClockedIn}>
                {clockStatus?.isClockedIn
                  ? `Jornada Ativa - Entrada registrada às ${new Date(clockStatus.activeRecord.clockIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Expediente Encerrado - Nenhum ponto ativo'}
              </StatusIndicator>
            )}

            <FormWrapper>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label htmlFor="notes" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>
                  Observações / Notas do Registro
                </label>
                <textarea
                  id="notes"
                  placeholder="Descreva detalhes ou observações caso necessário..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.625rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
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
                {clockStatus?.isClockedIn ? 'Registrar Saída (Clock Out)' : 'Registrar Entrada (Clock In)'}
              </Button>
            </FormWrapper>
          </ClockContainer>
        </Card>

        <Card
          title="Seus Registros Recentes"
          description="Histórico de batidas de ponto recentes do colaborador"
          extra={
            <Button size="sm" variant="secondary" onClick={handleExportExcel} isLoading={isExporting}>
              Exportar Excel
            </Button>
          }
        >
          {isHistoryLoading ? (
            <div>Carregando histórico...</div>
          ) : (
            <Table columns={columns} data={records} emptyMessage="Nenhum ponto registrado no sistema." />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
