'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/Card';
import { Table, Column } from '@/components/Table';

export default function PermissionsPage() {
  const { data: permissions = [], isLoading } = useQuery<any[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await axios.get('/api/permissions');
      return res.data;
    },
  });

  const columns: Column<any>[] = [
    {
      key: 'key',
      header: 'Chave de Permissão',
      render: (row) => <strong style={{ color: '#4f46e5' }}>{row.key}</strong>,
    },
    {
      key: 'description',
      header: 'Descrição do Privilégio',
      render: (row) => row.description || '-',
    },
  ];

  return (
    <DashboardLayout title="Permissões">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Permissões' }]} />

      <Card
        title="Lista de Permissões do Sistema"
        description="Permissões estáticas disponíveis para configuração e mapeamento de controle de acesso (RBAC)"
      >
        {isLoading ? (
          <div>Carregando permissões...</div>
        ) : (
          <Table columns={columns} data={permissions} emptyMessage="Nenhuma permissão cadastrada." />
        )}
      </Card>
    </DashboardLayout>
  );
}
