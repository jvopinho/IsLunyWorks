'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { usePermission } from '@/hooks/usePermission';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/Card';
import { Table, Column } from '@/components/Table';
import { Button } from '@/components/Button';
import { formatDateTime, formatDate, formatMinutes } from '@/utils/date';
import { FilterCard, FilterGrid, StatsGrid, StatBox, FormGroup } from './styles';

export default function ReportsPage() {
  const { can, user } = usePermission();
  
  const [filterUser, setFilterUser] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState({
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [isExporting, setIsExporting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editInTime, setEditInTime] = useState('');
  const [editOutTime, setEditOutTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editReason, setEditReason] = useState('');

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['usersList'],
    queryFn: async () => {
      const res = await axios.get('/api/users');
      return res.data;
    },
    enabled: can('users.view'),
  });

  const { data: reportData, isLoading } = useQuery<any>({
    queryKey: ['reports', queryParams],
    queryFn: async () => {
      const { userId, startDate, endDate } = queryParams;
      let url = '/api/reports?';
      
      const targetUserId = can('users.view') ? userId : user?.id;
      if (targetUserId) url += `userId=${targetUserId}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      
      const res = await axios.get(url);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const handleApplyFilters = () => {
    setQueryParams({
      userId: filterUser,
      startDate: filterStart,
      endDate: filterEnd,
    });
  };

  const handleClearFilters = () => {
    setFilterUser('');
    setFilterStart('');
    setFilterEnd('');
    setQueryParams({
      userId: '',
      startDate: '',
      endDate: '',
    });
  };

  const { data: recordDetails, isLoading: isRecordDetailsLoading } = useQuery<any>({
    queryKey: ['recordDetails', selectedRecord?.id],
    queryFn: async () => {
      const res = await axios.get(`/api/clock/${selectedRecord.id}`);
      return res.data;
    },
    enabled: !!selectedRecord?.id,
  });

  const handleOpenEdit = (record: any) => {
    setSelectedRecord(record);
    const inDateObj = new Date(record.clockIn);
    
    const yyyy = inDateObj.getFullYear();
    const mm = String(inDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(inDateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const inTimeStr = inDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    let outTimeStr = '';
    if (record.clockOut) {
      const outDateObj = new Date(record.clockOut);
      outTimeStr = outDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    setEditDate(dateStr);
    setEditInTime(inTimeStr);
    setEditOutTime(outTimeStr);
    setEditNotes(record.notes || '');
    setEditReason('');
    
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedRecord(null);
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      const clockIn = new Date(`${editDate}T${editInTime}:00`).toISOString();
      const clockOut = editOutTime ? new Date(`${editDate}T${editOutTime}:00`).toISOString() : null;
      
      const res = await axios.patch(`/api/clock/${selectedRecord.id}`, {
        clockIn,
        clockOut,
        notes: editNotes,
        reason: editReason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['recordDetails'] });
      handleCloseEdit();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao atualizar registro de ponto.');
    },
  });

  const handleSaveEdit = () => {
    if (!editDate || !editInTime) {
      alert('Data e horário de entrada são obrigatórios.');
      return;
    }
    if (!editReason || editReason.length < 5) {
      alert('O motivo é obrigatório e deve ter no mínimo 5 caracteres.');
      return;
    }
    editMutation.mutate();
  };

  const calculatedHours = (() => {
    if (!editDate || !editInTime || !editOutTime) return '-';
    try {
      const start = new Date(`${editDate}T${editInTime}:00`);
      const end = new Date(`${editDate}T${editOutTime}:00`);
      if (end <= start) return 'Saída antes da entrada';
      const diff = Math.round((end.getTime() - start.getTime()) / 60000);
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${String(hrs).padStart(2, '0')}h${String(mins).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  })();

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { userId, startDate, endDate } = queryParams;
      let url = '/api/reports/export?';
      
      const targetUserId = can('users.view') ? userId : user?.id;
      if (targetUserId) url += `userId=${targetUserId}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;

      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const fileDate = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `isluny-works-relatorio-${fileDate}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erro ao exportar relatório para Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const stats = reportData?.stats || {
    totalRecords: 0,
    totalHours: '0.00',
    dailyAverageHours: '0.00',
    daysCount: 0,
  };

  const records = reportData?.records || [];

  const columns: Column<any>[] = [
    {
      key: 'user',
      header: 'Colaborador',
      render: (row) => row.user?.name || '-',
    },
    {
      key: 'date',
      header: 'Data',
      render: (row) => formatDate(row.clockIn),
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
      header: 'Tempo Trabalhado',
      render: (row) => formatMinutes(row.totalMinutes),
    },
    {
      key: 'notes',
      header: 'Observações',
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {can('clock.edit') && (
            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)}>
              Editar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Relatórios">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Relatórios' }]} />

      <FilterCard>
        <FilterGrid>
          {can('users.view') && (
            <FormGroup>
              <label htmlFor="filterUser">Colaborador</label>
              <select
                id="filterUser"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="">Todos os colaboradores</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </FormGroup>
          )}

          <FormGroup>
            <label htmlFor="filterStart">Data Inicial</label>
            <input
              type="date"
              id="filterStart"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <label htmlFor="filterEnd">Data Final</label>
            <input
              type="date"
              id="filterEnd"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
            />
          </FormGroup>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleApplyFilters}>
              Filtrar
            </Button>
            <Button variant="secondary" onClick={handleClearFilters}>
              Limpar
            </Button>
            {can('reports.export') && (
              <Button variant="success" onClick={handleExportExcel} isLoading={isExporting}>
                Exportar Excel
              </Button>
            )}
          </div>
        </FilterGrid>
      </FilterCard>

      <StatsGrid>
        <StatBox>
          <span className="label">Total de Horas</span>
          <span className="value">{parseFloat(stats.totalHours).toFixed(1)}h</span>
        </StatBox>
        <StatBox>
          <span className="label">Média Diária</span>
          <span className="value">{parseFloat(stats.dailyAverageHours).toFixed(1)}h</span>
        </StatBox>
        <StatBox>
          <span className="label">Dias Trabalhados</span>
          <span className="value">{stats.daysCount}</span>
        </StatBox>
        <StatBox>
          <span className="label">Total de Registros</span>
          <span className="value">{stats.totalRecords}</span>
        </StatBox>
      </StatsGrid>

      <Card
        title="Espelho de Ponto Consolidado"
        description="Registros de ponto detalhados de acordo com os filtros aplicados"
      >
        {isLoading ? (
          <div>Gerando relatório...</div>
        ) : (
          <Table
            columns={can('users.view') ? columns : columns.filter(c => c.key !== 'user')}
            data={records}
            emptyMessage="Nenhum registro encontrado para os filtros selecionados."
          />
        )}
      </Card>

      <Modal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        title="Corrigir Registro de Ponto"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseEdit}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} isLoading={editMutation.isPending}>
              Salvar Alterações
            </Button>
          </>
        }
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <strong style={{ fontSize: '0.875rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                Colaborador
              </strong>
              <div style={{ fontSize: '0.925rem', fontWeight: 600 }}>
                {selectedRecord.user?.name} ({selectedRecord.user?.email})
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Data</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Total Calculado</label>
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#4f46e5',
                }}>
                  {calculatedHours}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Horário de Entrada</label>
                <input
                  type="text"
                  placeholder="HH:MM"
                  value={editInTime}
                  onChange={(e) => setEditInTime(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Horário de Saída</label>
                <input
                  type="text"
                  placeholder="HH:MM"
                  value={editOutTime}
                  onChange={(e) => setEditOutTime(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Observações</label>
              <textarea
                placeholder="Insira notas do ponto..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  minHeight: '60px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#ef4444' }}>Motivo da Alteração *</label>
              <input
                type="text"
                placeholder="Ex: Registro esquecido, Ajuste solicitado pelo gestor..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ef4444',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                📜 Histórico de Alterações
              </h4>

              {isRecordDetailsLoading ? (
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Carregando histórico...</div>
              ) : !recordDetails?.history || recordDetails.history.length === 0 ? (
                <div style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  backgroundColor: '#f8fafc',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                }}>
                  Este registro nunca foi alterado.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem',
                }}>
                  {recordDetails.history.map((h: any) => {
                    const prevIn = h.details?.previous?.clockIn ? new Date(h.details.previous.clockIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';
                    const prevOut = h.details?.previous?.clockOut ? new Date(h.details.previous.clockOut).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Em aberto';
                    
                    const newIn = h.details?.current?.clockIn ? new Date(h.details.current.clockIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';
                    const newOut = h.details?.current?.clockOut ? new Date(h.details.current.clockOut).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Em aberto';

                    const prevTotalStr = formatMinutes(h.details?.previous?.totalMinutes);
                    const newTotalStr = formatMinutes(h.details?.current?.totalMinutes);

                    return (
                      <div key={h.id} style={{
                        fontSize: '0.825rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.375rem',
                        padding: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                          <span>Por {h.actorName}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(h.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div style={{ color: '#475569' }}>
                          <div><strong>Entrada:</strong> {prevIn} ➔ {newIn}</div>
                          <div><strong>Saída:</strong> {prevOut} ➔ {newOut}</div>
                          <div><strong>Total:</strong> {prevTotalStr} ➔ {newTotalStr}</div>
                          {h.reason && <div style={{ marginTop: '0.125rem', color: '#0f172a' }}><strong>Motivo:</strong> {h.reason}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
