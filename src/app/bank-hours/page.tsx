'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePermission } from '@/hooks/usePermission';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/Card';
import { Table, Column } from '@/components/Table';
import { Button } from '@/components/Button';
import { formatDateTime } from '@/utils/date';
import { History, Settings, TrendingUp, WalletCards } from 'lucide-react';
import {
  FilterCard,
  FilterGrid,
  FormGroup,
  BalanceGrid,
  BalanceCard,
  ContentGrid,
  TransactionBadge,
} from './styles';

export default function BankHoursPage() {
  const queryClient = useQueryClient();
  const { can, user } = usePermission();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [actionType, setActionType] = useState('credit');
  const [inputHours, setInputHours] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user?.id) {
      setSelectedUserId(user.id);
    }
  }, [user]);

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['usersListForBankHours'],
    queryFn: async () => {
      const res = await axios.get('/api/users');
      return res.data;
    },
    enabled: can('bank_hours.manage') || can('admin'),
  });

  const { data: balanceData, isLoading: isBalanceLoading } = useQuery<any>({
    queryKey: ['bankHoursBalance', selectedUserId],
    queryFn: async () => {
      const res = await axios.get(`/api/bank-hours?userId=${selectedUserId}`);
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<any[]>({
    queryKey: ['bankHoursTransactions', selectedUserId],
    queryFn: async () => {
      const res = await axios.get(`/api/bank-hours/transactions?userId=${selectedUserId}`);
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  const transactionMutation = useMutation({
    mutationFn: async () => {
      const minutes = Math.round(parseFloat(inputHours) * 60);
      let endpoint = '/api/bank-hours/credit';
      let payload: any = { userId: selectedUserId, minutes, reason };

      if (actionType === 'debit') {
        endpoint = '/api/bank-hours/debit';
      } else if (actionType === 'adjust') {
        endpoint = '/api/bank-hours/adjust';
        payload = { userId: selectedUserId, targetMinutes: minutes, reason };
      }

      const res = await axios.post(endpoint, payload);
      return res.data;
    },
    onSuccess: () => {
      setInputHours('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['bankHoursBalance'] });
      queryClient.invalidateQueries({ queryKey: ['bankHoursTransactions'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao realizar lançamento no banco de horas.');
    },
  });

  const handleManualAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHours || isNaN(Number(inputHours)) || Number(inputHours) < 0) {
      alert('Por favor, informe uma quantidade de horas válida.');
      return;
    }
    if (!reason || reason.trim().length < 5) {
      alert('Por favor, informe uma justificativa detalhada (mínimo 5 caracteres).');
      return;
    }
    transactionMutation.mutate();
  };

  const formatMinutesToHoursStr = (minutes: number) => {
    const isNegative = minutes < 0;
    const absMinutes = Math.abs(minutes);
    const hrs = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    return `${isNegative ? '-' : ''}${hrs}h${String(mins).padStart(2, '0')}m`;
  };

  const translateTxType = (type: string) => {
    switch (type) {
      case 'WORKED_EXTRA': return 'Hora Extra Batida';
      case 'MANUAL_CREDIT': return 'Crédito Manual';
      case 'MANUAL_DEBIT': return 'Débito Manual';
      case 'USED_IN_WORKDAY': return 'Compensação Dia';
      case 'ADJUSTMENT': return 'Ajuste Geral';
      default: return type;
    }
  };

  const getEvolutionData = () => {
    if (transactions.length === 0) return [];
    let runningBalance = balanceData?.currentBalanceMinutes || 0;
    
    const sortedTxs = [...transactions];
    const dataPoints = [];

    for (let i = 0; i < sortedTxs.length; i++) {
      const tx = sortedTxs[i];
      dataPoints.push({
        date: new Date(tx.createdAt).toLocaleDateString('pt-BR'),
        saldo: parseFloat((runningBalance / 60).toFixed(1)),
      });
      
      const delta = tx.type === 'MANUAL_DEBIT' || tx.type === 'USED_IN_WORKDAY' || (tx.type === 'ADJUSTMENT' && tx.minutes < 0)
        ? -Math.abs(tx.minutes)
        : Math.abs(tx.minutes);
      
      const adjustmentDelta = tx.type === 'ADJUSTMENT' ? tx.minutes : delta;
      runningBalance -= adjustmentDelta;
    }

    dataPoints.push({
      date: 'Início',
      saldo: parseFloat((runningBalance / 60).toFixed(1)),
    });

    return dataPoints.reverse();
  };

  const evolutionData = getEvolutionData();
  const balanceVal = balanceData?.currentBalanceMinutes || 0;
  const isPositive = balanceVal >= 0;

  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Data e Hora',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => <TransactionBadge type={row.type}>{translateTxType(row.type)}</TransactionBadge>,
    },
    {
      key: 'minutes',
      header: 'Quantidade',
      render: (row) => {
        const isNeg = row.type === 'MANUAL_DEBIT' || row.type === 'USED_IN_WORKDAY' || (row.type === 'ADJUSTMENT' && row.minutes < 0);
        const prefix = isNeg ? '-' : '+';
        const displayVal = formatMinutesToHoursStr(Math.abs(row.minutes));
        return <span style={{ color: isNeg ? '#ef4444' : '#10b981', fontWeight: 600 }}>{prefix}{displayVal}</span>;
      },
    },
    {
      key: 'reason',
      header: 'Motivo',
    },
    {
      key: 'createdBy',
      header: 'Realizado por',
      render: (row) => row.createdBy === 'SYSTEM' || !row.createdBy ? 'Sistema' : 'Gestor',
    },
  ];

  return (
    <DashboardLayout title="Banco de Horas">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Banco de Horas' }]} />

      {(can('bank_hours.manage') || can('admin')) && (
        <FilterCard>
          <FilterGrid>
            <FormGroup>
              <label htmlFor="userSelect">Filtrar Colaborador</label>
              <select
                id="userSelect"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </FormGroup>
          </FilterGrid>
        </FilterCard>
      )}

      {isBalanceLoading ? (
        <div>Carregando saldo...</div>
      ) : (
        <BalanceGrid>
          <BalanceCard positive={isPositive}>
            <span className="label">Saldo Atual</span>
            <span className="value">{formatMinutesToHoursStr(balanceVal)}</span>
            <span className="sub">
              {isPositive
                ? 'Créditos acumulados a favor do colaborador'
                : 'Déficit acumulado (colaborador deve horas)'}
            </span>
          </BalanceCard>

          <BalanceCard>
            <span className="label">Total em Minutos</span>
            <span className="value">{balanceVal} min</span>
            <span className="sub">Conversão bruta de saldo em minutos</span>
          </BalanceCard>

          <BalanceCard>
            <span className="label">Última Movimentação</span>
            <span className="value" style={{ fontSize: '1.25rem' }}>
              {transactions[0]
                ? `${translateTxType(transactions[0].type)} (${formatMinutesToHoursStr(transactions[0].minutes)})`
                : 'Sem movimentações'}
            </span>
            <span className="sub">
              {transactions[0] ? formatDateTime(transactions[0].createdAt) : '-'}
            </span>
          </BalanceCard>
        </BalanceGrid>
      )}

      <ContentGrid>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} />
              <span>Extrato de Movimentações</span>
            </div>
          }
          description="Histórico de créditos, compensações e ajustes lançados"
        >
          {isTransactionsLoading ? (
            <div>Carregando histórico...</div>
          ) : (
            <Table columns={columns} data={transactions} emptyMessage="Sem transações registradas." />
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {can('bank_hours.manage') && (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Settings size={18} />
                  <span>Lançamento Manual</span>
                </div>
              }
              description="Crédito, débito ou ajuste geral de saldo de banco de horas"
            >
              <form onSubmit={handleManualAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormGroup>
                    <label htmlFor="actionType">Tipo de Operação</label>
                    <select
                      id="actionType"
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                    >
                      <option value="credit">Adicionar Crédito (+)</option>
                      <option value="debit">Remover Débito (-)</option>
                      <option value="adjust">Definir Saldo (Ajustar)</option>
                    </select>
                  </FormGroup>

                  <FormGroup>
                    <label htmlFor="inputHours">Quantidade (Horas)</label>
                    <input
                      type="number"
                      step="0.1"
                      id="inputHours"
                      placeholder="Ex: 2.5 (para 2h30)"
                      value={inputHours}
                      onChange={(e) => setInputHours(e.target.value)}
                      required
                    />
                  </FormGroup>
                </div>

                <FormGroup>
                  <label htmlFor="reason">Motivo / Justificativa</label>
                  <input
                    type="text"
                    id="reason"
                    placeholder="Ex: Acordo de compensação, Ajuste solicitado pela gerência..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </FormGroup>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={transactionMutation.isPending}
                >
                  Salvar Lançamento <WalletCards size={16} style={{ marginLeft: '6px' }} />
                </Button>
              </form>
            </Card>
          )}

          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} />
                <span>Evolução do Saldo</span>
              </div>
            }
            description="Histórico de oscilação do saldo do colaborador ao longo do tempo (horas)"
          >
            {isTransactionsLoading ? (
              <div>Carregando evolução...</div>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#94a3b8" tickLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      name="Saldo (Horas)"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </ContentGrid>
    </DashboardLayout>
  );
}
