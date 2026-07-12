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
import { createRoleSchema, updateRoleSchema, CreateRoleInput, UpdateRoleInput } from '@/validations/role';
import { ActionsBar, FormContainer, PermissionsGrid, PermissionCheckbox, UsersListWrapper, PermissionsListText, RowActions } from './styles';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const { data: roles = [], isLoading: isRolesLoading } = useQuery<any[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await axios.get('/api/roles');
      return res.data;
    },
  });

  const { data: permissions = [] } = useQuery<any[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await axios.get('/api/permissions');
      return res.data;
    },
    enabled: can('roles.create') || can('roles.update'),
  });

  const { data: roleDetails, isLoading: isDetailsLoading } = useQuery<any>({
    queryKey: ['roleDetails', selectedRole?.id],
    queryFn: async () => {
      const res = await axios.get(`/api/roles/${selectedRole.id}`);
      return res.data;
    },
    enabled: !!selectedRole?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(selectedRole ? updateRoleSchema : createRoleSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      const res = await axios.post('/api/roles', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleClose();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao criar cargo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleInput }) => {
      const res = await axios.put(`/api/roles/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleClose();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao editar cargo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/roles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao excluir cargo');
    },
  });

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setSelectedPermissionIds([]);
    reset({
      name: '',
      description: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (role: any) => {
    setSelectedRole(role);
    setSelectedPermissionIds(role.permissions.map((p: any) => p.id));
    reset({
      name: role.name,
      description: role.description || '',
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedRole(null);
    setSelectedPermissionIds([]);
    reset();
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      permissionIds: selectedPermissionIds,
    };

    if (selectedRole) {
      updateMutation.mutate({ id: selectedRole.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (role: any) => {
    if (confirm(`Deseja realmente excluir o cargo ${role.name}?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (row) => <strong style={{ color: '#0f172a' }}>{row.name}</strong>,
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (row) => row.description || '-',
    },
    {
      key: 'permissions',
      header: 'Permissões',
      render: (row) => (
        <PermissionsListText>
          {row.permissions.map((p: any) => (
            <span key={p.id}>{p.key}</span>
          ))}
        </PermissionsListText>
      ),
    },
    {
      key: 'usersCount',
      header: 'Colaboradores',
      render: (row) => `${row._count?.users || 0} vinculados`,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <RowActions>
          {can('roles.update') && (
            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(row)}>
              Editar
            </Button>
          )}
          {can('roles.delete') && row.name !== 'Administrador' && (
            <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>
              Excluir
            </Button>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <DashboardLayout title="Cargos">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Cargos' }]} />

      <Card
        title="Gerenciamento de Cargos e Permissões"
        description="Defina os perfis de acesso, vincule permissões e visualize colaboradores vinculados"
      >
        <ActionsBar>
          {can('roles.create') && (
            <Button variant="primary" onClick={handleOpenCreate}>
              Novo Cargo
            </Button>
          )}
        </ActionsBar>

        {isRolesLoading ? (
          <div>Carregando cargos...</div>
        ) : (
          <Table columns={columns} data={roles} emptyMessage="Nenhum cargo cadastrado." />
        )}
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={selectedRole ? 'Editar Cargo' : 'Novo Cargo'}
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
              {selectedRole ? 'Salvar Alterações' : 'Criar Cargo'}
            </Button>
          </>
        }
      >
        <FormContainer onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nome do Cargo"
            placeholder="Ex: Desenvolvedor Senior"
            error={errors.name?.message as string}
            {...register('name')}
            disabled={selectedRole?.name === 'Administrador'}
          />

          <Input
            label="Descrição"
            placeholder="Ex: Permissões básicas para desenvolvimento de software"
            error={errors.description?.message as string}
            {...register('description')}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>
              Selecionar Permissões (RBAC)
            </label>
            <PermissionsGrid>
              {permissions.map((perm) => (
                <PermissionCheckbox key={perm.id}>
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds.includes(perm.id)}
                    onChange={() => handlePermissionToggle(perm.id)}
                    disabled={selectedRole?.name === 'Administrador'}
                  />
                  <div>
                    <span className="key">{perm.key}</span>
                    <span className="desc">{perm.description}</span>
                  </div>
                </PermissionCheckbox>
              ))}
            </PermissionsGrid>
          </div>

          {selectedRole && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>
                Colaboradores Vinculados
              </label>
              {isDetailsLoading ? (
                <div>Buscando colaboradores vinculados...</div>
              ) : (
                <UsersListWrapper>
                  {roleDetails?.users && roleDetails.users.length > 0 ? (
                    roleDetails.users.map((u: any) => (
                      <div key={u.id} className="user-item">
                        <span>{u.name} ({u.email})</span>
                        <span style={{ color: u.active ? '#059669' : '#64748b', fontWeight: '600', fontSize: '0.75rem' }}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>
                      Nenhum colaborador vinculado a este cargo.
                    </div>
                  )}
                </UsersListWrapper>
              )}
            </div>
          )}
        </FormContainer>
      </Modal>
    </DashboardLayout>
  );
}
