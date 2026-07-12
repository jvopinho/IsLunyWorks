'use client';

import React, { useState } from 'react';
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
import { ActionsBar, SearchWrapper, FormContainer, FormGroup, Badge, RowActions, ToggleWrapper } from './styles';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

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
              Editar
            </Button>
          )}
          {can('users.delete') && (
            <Button
              variant={row.active ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleActive(row)}
            >
              {row.active ? 'Desativar' : 'Ativar'}
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
            <Button onClick={handleSearch}>Buscar</Button>
          </SearchWrapper>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {can('users.export') && (
              <Button variant="secondary" onClick={handleExportExcel} isLoading={isExporting}>
                Exportar Excel
              </Button>
            )}
            {can('users.create') && (
              <Button variant="primary" onClick={handleOpenCreate}>
                Novo Colaborador
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
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {selectedUser ? 'Salvar Alterações' : 'Criar Colaborador'}
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
    </DashboardLayout>
  );
}
