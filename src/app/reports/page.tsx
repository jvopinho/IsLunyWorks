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
import { FilterCard, FilterGrid, FormGroup } from './styles';
import { ReportsDashboard } from './components/ReportsDashboard';
import { Filter, RefreshCw, FileSpreadsheet, BarChart3, Pencil, Check, CircleX, Save, History } from 'lucide-react';

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

  const [isCompensateOpen, setIsCompensateOpen] = useState(false);
  const [compensateRecord, setCompensateRecord] = useState<any>(null);
  const [compensateHours, setCompensateHours] = useState('');
  const [compensateReason, setCompensateReason] = useState('');
  const [isCompensating, setIsCompensating] = useState(false);

  const handleOpenCompensate = (record: any) => {
    setCompensateRecord(record);
    setCompensateHours((record.deficit / 60).toFixed(1));
    setCompensateReason('Compensação de jornada pendente pelo saldo do banco de horas');
    setIsCompensateOpen(true);
  };

  const handleCloseCompensate = () => {
    setIsCompensateOpen(false);
    setCompensateRecord(null);
  };

  const handleSaveCompensate = async () => {
    if (!compensateHours || isNaN(Number(compensateHours)) || Number(compensateHours) <= 0) {
      alert('Por favor, informe uma quantidade de horas válida.');
      return;
    }
    if (!compensateReason || compensateReason.trim().length < 5) {
      alert('Por favor, informe uma justificativa detalhada (mínimo 5 caracteres).');
      return;
    }

    setIsCompensating(true);
    try {
      const minutes = Math.round(parseFloat(compensateHours) * 60);
      await axios.post('/api/bank-hours/use', {
        clockRecordId: compensateRecord.id,
        minutes,
        reason: compensateReason,
      });
      handleCloseCompensate();
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao realizar compensação.');
    } finally {
      setIsCompensating(false);
    }
  };

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
      let url = '/api/reports/work-hours?';
      
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
      render: (row) => row.userName || '-',
    },
    {
      key: 'date',
      header: 'Data',
      render: (row) => formatDate(row.clockIn),
    },
    {
      key: 'plannedIn',
      header: 'Entrada Prevista',
      render: (row) => row.plannedIn ? new Date(row.plannedIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      key: 'clockIn',
      header: 'Entrada Realizada',
      render: (row) => formatDateTime(row.clockIn),
    },
    {
      key: 'delay',
      header: 'Atraso Entrada',
      render: (row) => row.delayInMinutes > 0 ? (
        <span style={{ color: '#ef4444', fontWeight: 600 }}>+{row.delayInMinutes} min</span>
      ) : (
        <span style={{ color: '#10b981' }}>No horário</span>
      ),
    },
    {
      key: 'plannedOut',
      header: 'Saída Prevista',
      render: (row) => row.plannedOut ? new Date(row.plannedOut).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
    },
    {
      key: 'clockOut',
      header: 'Saída Realizada',
      render: (row) => row.clockOut ? formatDateTime(row.clockOut) : <span style={{ color: '#eab308', fontWeight: '500' }}>Em aberto</span>,
    },
    {
      key: 'outDiff',
      header: 'Desvio Saída',
      render: (row) => {
        if (row.earlyOutMinutes > 0) {
          return <span style={{ color: '#ef4444', fontWeight: 600 }}>-{row.earlyOutMinutes} min</span>;
        }
        if (row.extraOutMinutes > 0) {
          return <span style={{ color: '#10b981', fontWeight: 600 }}>+{row.extraOutMinutes} min</span>;
        }
        return <span style={{ color: '#10b981' }}>No horário</span>;
      },
    },
    {
      key: 'expected',
      header: 'Tempo Previsto',
      render: (row) => formatMinutes(row.expected),
    },
    {
      key: 'worked',
      header: 'Tempo Trabalhado',
      render: (row) => formatMinutes(row.worked),
    },
    {
      key: 'breaks',
      header: 'Tempo em Pausa',
      render: (row) => formatMinutes(row.actualBreakMinutes),
    },
    {
      key: 'normal',
      header: 'Normais',
      render: (row) => formatMinutes(row.normal),
    },
    {
      key: 'extra',
      header: 'Extras',
      render: (row) => formatMinutes(row.extra),
    },
    {
      key: 'bank',
      header: 'Banco (+)',
      render: (row) => formatMinutes(row.bank),
    },
    {
      key: 'used',
      header: 'Banco Usado (-)',
      render: (row) => formatMinutes(row.used),
    },
    {
      key: 'deficit',
      header: 'Déficit',
      render: (row) => formatMinutes(row.deficit),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        let color = '#ef4444';
        if (row.status.includes('cumprida') && !row.status.includes('parcialmente') && !row.status.includes('não')) {
          color = '#10b981';
        } else if (row.status.includes('parcialmente')) {
          color = '#f59e0b';
        } else if (row.status.includes('Sem expediente')) {
          color = '#64748b';
        }
        return <span style={{ color, fontWeight: 600, fontSize: '0.8rem' }}>{row.status}</span>;
      },
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
              Editar <Pencil size={12} style={{ marginLeft: '4px' }} />
            </Button>
          )}
          {can('bank_hours.manage') && row.deficit > 0 && (
            <Button size="sm" variant="success" onClick={() => handleOpenCompensate(row)}>
              Compensar <Check size={12} style={{ marginLeft: '4px' }} />
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
              Filtrar <Filter size={16} style={{ marginLeft: '6px' }} />
            </Button>
            <Button variant="secondary" onClick={handleClearFilters}>
              Limpar <RefreshCw size={16} style={{ marginLeft: '6px' }} />
            </Button>
            {can('reports.export') && (
              <Button variant="success" onClick={handleExportExcel} isLoading={isExporting}>
                Exportar Excel <FileSpreadsheet size={16} style={{ marginLeft: '6px' }} />
              </Button>
            )}
          </div>
        </FilterGrid>
      </FilterCard>

      <ReportsDashboard
        userId={queryParams.userId}
        startDate={queryParams.startDate}
        endDate={queryParams.endDate}
      />

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} />
            <span>Espelho de Ponto Consolidado</span>
          </div>
        }
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
              Cancelar <CircleX size={16} style={{ marginLeft: '6px' }} />
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} isLoading={editMutation.isPending}>
              Salvar Alterações <Save size={16} style={{ marginLeft: '6px' }} />
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
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                <History size={16} /> Histórico de Alterações
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

      <Modal
        isOpen={isCompensateOpen}
        onClose={handleCloseCompensate}
        title={`Compensar Jornada - ${compensateRecord?.userName}`}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseCompensate}>
              Cancelar <CircleX size={16} style={{ marginLeft: '6px' }} />
            </Button>
            <Button variant="primary" onClick={handleSaveCompensate} isLoading={isCompensating}>
              Confirmar Compensação <Check size={16} style={{ marginLeft: '6px' }} />
            </Button>
          </>
        }
      >
        {compensateRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong>Déficit Pendente:</strong> {formatMinutes(compensateRecord.deficit)}
            </div>
            <FormGroup>
              <label htmlFor="compensateHours">Horas a Compensar (Banco)</label>
              <input
                type="number"
                step="0.1"
                id="compensateHours"
                value={compensateHours}
                onChange={(e) => setCompensateHours(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="compensateReason">Justificativa / Motivo</label>
              <input
                type="text"
                id="compensateReason"
                value={compensateReason}
                onChange={(e) => setCompensateReason(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </FormGroup>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
