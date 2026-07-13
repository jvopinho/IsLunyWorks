'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePermission } from '@/hooks/usePermission';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, Column } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput } from '@/validations/user';
import { Plus, Pencil, BriefcaseBusiness, UserCheck, UserX, Search, FileSpreadsheet, CircleX, Save, Trash2, Coffee, Clock3 } from 'lucide-react';
import { ActionsBar, SearchWrapper, FormContainer, FormGroup, Badge, RowActions, ToggleWrapper } from './styles';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isWorkloadOpen, setIsWorkloadOpen] = useState(false);
  const [workloadUser, setWorkloadUser] = useState<any>(null);
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [expectedDailyHours, setExpectedDailyHours] = useState(8);
  const [mondayEnabled, setMondayEnabled] = useState(true);
  const [tuesdayEnabled, setTuesdayEnabled] = useState(true);
  const [wednesdayEnabled, setWednesdayEnabled] = useState(true);
  const [thursdayEnabled, setThursdayEnabled] = useState(true);
  const [fridayEnabled, setFridayEnabled] = useState(true);
  const [saturdayEnabled, setSaturdayEnabled] = useState(false);
  const [sundayEnabled, setSundayEnabled] = useState(false);
  const [extraHoursMode, setExtraHoursMode] = useState('BANK_HOURS');
  const [scheduleId, setScheduleId] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [flexibleSchedule, setFlexibleSchedule] = useState(false);
  const [schedStartTime, setSchedStartTime] = useState('08:00');
  const [schedEndTime, setSchedEndTime] = useState('17:00');
  const [schedDays, setSchedDays] = useState<any[]>([]);
  const [schedBreaks, setSchedBreaks] = useState<any[]>([]);
  const [newBreakDay, setNewBreakDay] = useState(1);
  const [newBreakName, setNewBreakName] = useState('');
  const [newBreakStart, setNewBreakStart] = useState('12:00');
  const [newBreakEnd, setNewBreakEnd] = useState('13:00');
  const [newBreakPaid, setNewBreakPaid] = useState(false);

  const { data: users = [], isLoading: isUsersLoading } = useQuery<any[]>({
    queryKey: ['users', search],
    queryFn: async () => {
      const res = await axios.get(`/api/users?search=${search}`);
      return res.data;
    },
  });

  const { data: roles = [] } = useQuery<any[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await axios.get('/api/roles');
      return res.data;
    },
    enabled: can('users.create') || can('users.update'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(selectedUser ? updateUserSchema : createUserSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const res = await axios.post('/api/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao criar usuário');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const res = await axios.put(`/api/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao editar usuário');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await axios.put(`/api/users/${id}`, { active });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao alterar status do usuário');
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get('/api/users/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'isluny-works-usuarios.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erro ao exportar dados para Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      roleId: roles[0]?.id || '',
      active: true,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    reset({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.roleId,
      active: user.active,
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedUser(null);
    reset();
  };

  const calculateExpectedMinutesForDay = (
    dayOfWeek: number,
    enabled: boolean,
    startTime: string | null,
    endTime: string | null,
    breaksList: any[]
  ) => {
    if (!enabled || !startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60; // overnight shift

    const dayBreaks = breaksList.filter((b) => b.dayOfWeek === dayOfWeek && !b.paid);
    let breakMins = 0;
    for (const b of dayBreaks) {
      const [bsh, bsm] = b.startTime.split(':').map(Number);
      const [beh, bem] = b.endTime.split(':').map(Number);
      let bdiff = (beh * 60 + bem) - (bsh * 60 + bsm);
      if (bdiff < 0) bdiff += 24 * 60;
      breakMins += bdiff;
    }
    return Math.max(0, diff - breakMins);
  };

  const handleToggleDayOfWeek = (dayOfWeek: number, enabled: boolean) => {
    if (dayOfWeek === 1) setMondayEnabled(enabled);
    else if (dayOfWeek === 2) setTuesdayEnabled(enabled);
    else if (dayOfWeek === 3) setWednesdayEnabled(enabled);
    else if (dayOfWeek === 4) setThursdayEnabled(enabled);
    else if (dayOfWeek === 5) setFridayEnabled(enabled);
    else if (dayOfWeek === 6) setSaturdayEnabled(enabled);
    else if (dayOfWeek === 0) setSundayEnabled(enabled);

    setSchedDays((prev) => {
      const existingIdx = prev.findIndex((d) => d.dayOfWeek === dayOfWeek);
      const updated = [...prev];
      if (existingIdx !== -1) {
        const item = updated[existingIdx];
        const start = enabled ? (item.startTime || schedStartTime || '08:00') : null;
        const end = enabled ? (item.endTime || schedEndTime || '17:00') : null;
        updated[existingIdx] = {
          ...item,
          enabled,
          startTime: start,
          endTime: end,
          expectedDailyMinutes: calculateExpectedMinutesForDay(dayOfWeek, enabled, start, end, schedBreaks),
        };
      } else {
        const start = enabled ? (schedStartTime || '08:00') : null;
        const end = enabled ? (schedEndTime || '17:00') : null;
        updated.push({
          dayOfWeek,
          enabled,
          startTime: start,
          endTime: end,
          expectedDailyMinutes: calculateExpectedMinutesForDay(dayOfWeek, enabled, start, end, schedBreaks),
        });
      }
      return updated.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  };

  const handleDayTimeChange = (idx: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedDays((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      const newStart = field === 'startTime' ? value : item.startTime;
      const newEnd = field === 'endTime' ? value : item.endTime;
      updated[idx] = {
        ...item,
        startTime: newStart,
        endTime: newEnd,
        expectedDailyMinutes: calculateExpectedMinutesForDay(item.dayOfWeek, item.enabled, newStart, newEnd, schedBreaks),
      };
      return updated;
    });
  };

  const syncDaysExpectedMinutes = (daysList: any[], breaksList: any[]) => {
    return daysList.map((d) => ({
      ...d,
      expectedDailyMinutes: calculateExpectedMinutesForDay(d.dayOfWeek, d.enabled, d.startTime, d.endTime, breaksList),
    }));
  };

  useEffect(() => {
    if (!isWorkloadOpen) return;
    const activeDays = schedDays.filter((d) => d.enabled);
    const totalMinutes = schedDays.reduce((sum, d) => sum + (d.enabled ? d.expectedDailyMinutes : 0), 0);
    setWeeklyHours(parseFloat((totalMinutes / 60).toFixed(1)));
    if (activeDays.length > 0) {
      setExpectedDailyHours(parseFloat(((totalMinutes / activeDays.length) / 60).toFixed(1)));
    } else {
      setExpectedDailyHours(0);
    }
  }, [schedDays, isWorkloadOpen]);

  const handleOpenWorkload = async (user: any) => {
    setWorkloadUser(user);
    try {
      const res = await axios.get(`/api/work-schedules?userId=${user.id}`);
      const schedule = res.data[0];
      if (schedule) {
        setScheduleId(schedule.id);
        setWeeklyHours(schedule.weeklyHours);
        setExpectedDailyHours(schedule.expectedDailyHours);
        setMondayEnabled(schedule.mondayEnabled);
        setTuesdayEnabled(schedule.tuesdayEnabled);
        setWednesdayEnabled(schedule.wednesdayEnabled);
        setThursdayEnabled(schedule.thursdayEnabled);
        setFridayEnabled(schedule.fridayEnabled);
        setSaturdayEnabled(schedule.saturdayEnabled);
        setSundayEnabled(schedule.sundayEnabled);
        setExtraHoursMode(schedule.extraHoursMode);
        setFlexibleSchedule(schedule.flexibleSchedule || false);
        setSchedStartTime(schedule.startTime || '08:00');
        setSchedEndTime(schedule.endTime || '17:00');

        const daysFromDb = schedule.days || [];
        const populatedDays = [0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
          const existingDay = daysFromDb.find((d: any) => d.dayOfWeek === dayNum);
          if (existingDay) {
            return existingDay;
          }
          const enabled = dayNum === 1 ? schedule.mondayEnabled
            : dayNum === 2 ? schedule.tuesdayEnabled
            : dayNum === 3 ? schedule.wednesdayEnabled
            : dayNum === 4 ? schedule.thursdayEnabled
            : dayNum === 5 ? schedule.fridayEnabled
            : dayNum === 6 ? schedule.saturdayEnabled
            : schedule.sundayEnabled;
          
          const isWorking = dayNum >= 1 && dayNum <= 5;
          const start = enabled ? (schedule.startTime || '08:00') : null;
          const end = enabled ? (schedule.endTime || '17:00') : null;
          return {
            dayOfWeek: dayNum,
            enabled,
            startTime: start,
            endTime: end,
            expectedDailyMinutes: calculateExpectedMinutesForDay(dayNum, enabled, start, end, schedule.breaks || []),
          };
        });

        setSchedDays(populatedDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
        setSchedBreaks(schedule.breaks || []);
      } else {
        setScheduleId('');
        setWeeklyHours(40);
        setExpectedDailyHours(8);
        setMondayEnabled(true);
        setTuesdayEnabled(true);
        setWednesdayEnabled(true);
        setThursdayEnabled(true);
        setFridayEnabled(true);
        setSaturdayEnabled(false);
        setSundayEnabled(false);
        setExtraHoursMode('BANK_HOURS');
        setFlexibleSchedule(false);
        setSchedStartTime('08:00');
        setSchedEndTime('17:00');

        const populatedDays = [0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
          const enabled = dayNum >= 1 && dayNum <= 5;
          const start = enabled ? '08:00' : null;
          const end = enabled ? '17:00' : null;
          return {
            dayOfWeek: dayNum,
            enabled,
            startTime: start,
            endTime: end,
            expectedDailyMinutes: enabled ? 480 : 0,
          };
        });

        setSchedDays(populatedDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
        setSchedBreaks([]);
      }
      setIsWorkloadOpen(true);
    } catch {
      alert('Erro ao carregar jornada de trabalho.');
    }
  };

  const handleSaveWorkload = async () => {
    if (!scheduleId) {
      alert('Nenhuma configuração de jornada encontrada para este usuário.');
      return;
    }

    const hasActiveDay = schedDays.some((d: any) => d.enabled === true);
    if (!hasActiveDay) {
      alert('Pelo menos um dia de expediente deve estar ativo.');
      return;
    }

    for (const d of schedDays) {
      if (d.enabled) {
        if (!d.startTime || !d.endTime) {
          alert('Todos os dias de expediente ativos devem possuir uma configuração válida de horários de entrada e saída.');
          return;
        }
      }
    }

    const reason = prompt('Justificativa para a alteração da jornada (opcional):') || 'Atualização de jornada de trabalho pelo gestor';

    setIsSavingSchedule(true);
    try {
      await axios.patch(`/api/work-schedules/${scheduleId}`, {
        weeklyHours,
        expectedDailyHours,
        mondayEnabled,
        tuesdayEnabled,
        wednesdayEnabled,
        thursdayEnabled,
        fridayEnabled,
        saturdayEnabled,
        sundayEnabled,
        extraHoursMode,
        flexibleSchedule,
        startTime: schedStartTime,
        endTime: schedEndTime,
        days: schedDays.map((d: any) => ({
          dayOfWeek: d.dayOfWeek,
          enabled: d.enabled,
          startTime: d.startTime,
          endTime: d.endTime,
          expectedDailyMinutes: d.expectedDailyMinutes,
        })),
        reason,
      });
      setIsWorkloadOpen(false);
      setWorkloadUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar jornada de trabalho.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleAddBreak = async () => {
    if (!newBreakName || !newBreakStart || !newBreakEnd) {
      alert('Preencha todos os campos do intervalo.');
      return;
    }
    try {
      const res = await axios.post(`/api/work-schedules/${scheduleId}/breaks`, {
        dayOfWeek: newBreakDay,
        name: newBreakName,
        startTime: newBreakStart,
        endTime: newBreakEnd,
        paid: newBreakPaid,
      });
      const newBreaks = [...schedBreaks, res.data];
      setSchedBreaks(newBreaks);
      setSchedDays((prev) => syncDaysExpectedMinutes(prev, newBreaks));

      setNewBreakName('');
      setNewBreakStart('12:00');
      setNewBreakEnd('13:00');
      setNewBreakPaid(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar intervalo.');
    }
  };

  const handleDeleteBreak = async (breakId: string) => {
    if (!confirm('Deseja remover este intervalo?')) return;
    try {
      await axios.delete(`/api/work-schedules/breaks/${breakId}`);
      const newBreaks = schedBreaks.filter((b: any) => b.id !== breakId);
      setSchedBreaks(newBreaks);
      setSchedDays((prev) => syncDaysExpectedMinutes(prev, newBreaks));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover intervalo.');
    }
  };

  const onSubmit = (data: any) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleActive = (user: any) => {
    const actionName = user.active ? 'desativar' : 'ativar';
    if (confirm(`Deseja realmente ${actionName} o colaborador ${user.name}?`)) {
      toggleActiveMutation.mutate({ id: user.id, active: !user.active });
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Nome',
    },
    {
      key: 'email',
      header: 'E-mail',
    },
    {
      key: 'role',
      header: 'Cargo',
      render: (row) => row.role?.name || '-',
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <Badge active={row.active}>{row.active ? 'Ativo' : 'Inativo'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <RowActions>
          {can('users.update') && (
            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(row)}>
              Editar <Pencil size={12} style={{ marginLeft: '4px' }} />
            </Button>
          )}
          {can('workload.manage') && (
            <Button variant="secondary" size="sm" onClick={() => handleOpenWorkload(row)}>
              Jornada <BriefcaseBusiness size={12} style={{ marginLeft: '4px' }} />
            </Button>
          )}
          {can('users.delete') && (
            <Button
              variant={row.active ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleActive(row)}
            >
              {row.active ? (
                <>Desativar <UserX size={12} style={{ marginLeft: '4px' }} /></>
              ) : (
                <>Ativar <UserCheck size={12} style={{ marginLeft: '4px' }} /></>
              )}
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <DashboardLayout title="Colaboradores">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Colaboradores' }]} />

      <Card title="Gerenciamento de Colaboradores" description="Listagem e administração dos usuários do sistema">
        <ActionsBar>
          <SearchWrapper>
            <Input
              placeholder="Pesquisar por nome ou e-mail..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              Buscar <Search size={16} style={{ marginLeft: '6px' }} />
            </Button>
          </SearchWrapper>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {can('users.export') && (
              <Button variant="secondary" onClick={handleExportExcel} isLoading={isExporting}>
                Exportar Excel <FileSpreadsheet size={16} style={{ marginLeft: '6px' }} />
              </Button>
            )}
            {can('users.create') && (
              <Button variant="primary" onClick={handleOpenCreate}>
                Novo Colaborador <Plus size={16} style={{ marginLeft: '6px' }} />
              </Button>
            )}
          </div>
        </ActionsBar>

        {isUsersLoading ? (
          <div>Carregando colaboradores...</div>
        ) : (
          <Table columns={columns} data={users} emptyMessage="Nenhum colaborador encontrado." />
        )}
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={selectedUser ? 'Editar Colaborador' : 'Novo Colaborador'}
        footer={
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar <CircleX size={16} style={{ marginLeft: '6px' }} />
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {selectedUser ? 'Salvar Alterações' : 'Criar Colaborador'} <Save size={16} style={{ marginLeft: '6px' }} />
            </Button>
          </>
        }
      >
        <FormContainer onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nome Completo"
            placeholder="Ex: João da Silva"
            error={errors.name?.message as string}
            {...register('name')}
          />
          <Input
            label="Endereço de E-mail"
            placeholder="Ex: joao@empresa.com"
            error={errors.email?.message as string}
            {...register('email')}
          />
          <Input
            label={selectedUser ? 'Senha (deixe em branco para manter a atual)' : 'Senha de Acesso'}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message as string}
            {...register('password')}
          />
          <FormGroup>
            <label htmlFor="roleId">Cargo / Função</label>
            <select id="roleId" {...register('roleId')}>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleId && <span className="error">{errors.roleId.message as string}</span>}
          </FormGroup>

          {selectedUser && (
            <ToggleWrapper>
              <input type="checkbox" id="active" {...register('active')} />
              <label htmlFor="active">Colaborador ativo (permite registrar ponto e fazer login)</label>
            </ToggleWrapper>
          )}
        </FormContainer>
      </Modal>

      <Modal
        isOpen={isWorkloadOpen}
        onClose={() => { setIsWorkloadOpen(false); setWorkloadUser(null); }}
        title={`Configurar Jornada - ${workloadUser?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsWorkloadOpen(false); setWorkloadUser(null); }}>
              Cancelar <CircleX size={16} style={{ marginLeft: '6px' }} />
            </Button>
            <Button variant="primary" onClick={handleSaveWorkload} isLoading={isSavingSchedule}>
              Salvar Jornada <Save size={16} style={{ marginLeft: '6px' }} />
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <label htmlFor="weeklyHours">Horas Semanais (Calculado)</label>
              <input
                type="number"
                id="weeklyHours"
                value={weeklyHours}
                disabled
                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
              />
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="expectedDailyHours">Horas Previstas/Dia (Calculado)</label>
              <input
                type="number"
                id="expectedDailyHours"
                value={expectedDailyHours}
                disabled
                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
              />
            </FormGroup>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <label htmlFor="schedStartTime" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock3 size={14} /> Entrada Padrão
              </label>
              <input
                type="time"
                id="schedStartTime"
                value={schedStartTime}
                onChange={(e) => setSchedStartTime(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="schedEndTime" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock3 size={14} /> Saída Padrão
              </label>
              <input
                type="time"
                id="schedEndTime"
                value={schedEndTime}
                onChange={(e) => setSchedEndTime(e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              />
            </FormGroup>
          </div>

          <FormGroup>
            <label htmlFor="extraHoursMode">Tratamento de Horas Excedentes</label>
            <select
              id="extraHoursMode"
              value={extraHoursMode}
              onChange={(e) => setExtraHoursMode(e.target.value)}
              style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', backgroundColor: 'white' }}
            >
              <option value="BANK_HOURS">Banco de Horas (BANK_HOURS)</option>
              <option value="OVERTIME">Horas Extras (OVERTIME)</option>
            </select>
          </FormGroup>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: flexibleSchedule ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
            <input type="checkbox" checked={flexibleSchedule} onChange={(e) => setFlexibleSchedule(e.target.checked)} />
            <div>
              <strong>Horário Flexível</strong>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Quando ativo, atrasos não são contabilizados automaticamente</div>
            </div>
          </label>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Dias de Expediente Ativos
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={mondayEnabled} onChange={(e) => handleToggleDayOfWeek(1, e.target.checked)} /> Segunda-feira
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={tuesdayEnabled} onChange={(e) => handleToggleDayOfWeek(2, e.target.checked)} /> Terça-feira
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={wednesdayEnabled} onChange={(e) => handleToggleDayOfWeek(3, e.target.checked)} /> Quarta-feira
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={thursdayEnabled} onChange={(e) => handleToggleDayOfWeek(4, e.target.checked)} /> Quinta-feira
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={fridayEnabled} onChange={(e) => handleToggleDayOfWeek(5, e.target.checked)} /> Sexta-feira
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={saturdayEnabled} onChange={(e) => handleToggleDayOfWeek(6, e.target.checked)} /> Sábado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={sundayEnabled} onChange={(e) => handleToggleDayOfWeek(0, e.target.checked)} /> Domingo
              </label>
            </div>
          </div>

          {/* Per-day schedule configuration */}
          {schedDays.length > 0 && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <Clock3 size={14} /> Horários por Dia da Semana
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {schedDays.map((day: any, idx: number) => {
                  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                  return (
                    <div key={day.dayOfWeek} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: day.enabled ? 'transparent' : '#f8fafc' }}>
                      <span style={{ fontWeight: 600, color: day.enabled ? '#0f172a' : '#94a3b8' }}>{DAYS[day.dayOfWeek]}</span>
                      <input
                        type="time"
                        value={day.startTime || ''}
                        disabled={!day.enabled}
                        onChange={(e) => handleDayTimeChange(idx, 'startTime', e.target.value)}
                        style={{ padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}
                      />
                      <input
                        type="time"
                        value={day.endTime || ''}
                        disabled={!day.enabled}
                        onChange={(e) => handleDayTimeChange(idx, 'endTime', e.target.value)}
                        style={{ padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}
                      />
                      <span style={{ color: '#64748b', textAlign: 'center' }}>
                        {day.enabled ? (() => {
                          const h = Math.floor(day.expectedDailyMinutes / 60);
                          const m = day.expectedDailyMinutes % 60;
                          return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
                        })() : 'Folga'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breaks Management */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
              <Coffee size={14} /> Intervalos / Pausas
            </label>

            {schedBreaks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
                {schedBreaks.map((brk: any) => {
                  const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  return (
                    <div key={brk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{brk.name}</strong>
                        <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>
                          {DAYS_SHORT[brk.dayOfWeek]} {brk.startTime} → {brk.endTime}
                        </span>
                        {brk.paid && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontWeight: 600 }}>Remunerado</span>}
                      </div>
                      <button
                        onClick={() => handleDeleteBreak(brk.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', padding: '0.5rem', border: '1px dashed #e2e8f0', borderRadius: '6px', textAlign: 'center' }}>
                Nenhum intervalo cadastrado.
              </div>
            )}

            {scheduleId && (
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 80px 1fr', gap: '0.5rem', alignItems: 'end' }}>
                <FormGroup>
                  <label style={{ fontSize: '0.7rem' }}>Dia</label>
                  <select value={newBreakDay} onChange={(e) => setNewBreakDay(parseInt(e.target.value))} style={{ padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                    <option value={0}>Dom</option>
                    <option value={1}>Seg</option>
                    <option value={2}>Ter</option>
                    <option value={3}>Qua</option>
                    <option value={4}>Qui</option>
                    <option value={5}>Sex</option>
                    <option value={6}>Sáb</option>
                  </select>
                </FormGroup>
                <FormGroup>
                  <label style={{ fontSize: '0.7rem' }}>Nome</label>
                  <input type="text" placeholder="Ex: Almoço" value={newBreakName} onChange={(e) => setNewBreakName(e.target.value)} style={{ padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }} />
                </FormGroup>
                <FormGroup>
                  <label style={{ fontSize: '0.7rem' }}>Início</label>
                  <input type="time" value={newBreakStart} onChange={(e) => setNewBreakStart(e.target.value)} style={{ padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }} />
                </FormGroup>
                <FormGroup>
                  <label style={{ fontSize: '0.7rem' }}>Fim</label>
                  <input type="time" value={newBreakEnd} onChange={(e) => setNewBreakEnd(e.target.value)} style={{ padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }} />
                </FormGroup>
                <Button size="sm" variant="primary" onClick={handleAddBreak}>
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
