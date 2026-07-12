import React from 'react';
import styled from 'styled-components';
import {
  Users,
  CheckCircle,
  Clock3,
  Timer,
  Calendar,
  BarChart3,
  ShieldCheck,
  Key,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
`;

const Card = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  transition: ${(props) => props.theme.transitions.default};
  position: relative;
  cursor: help;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows.md};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const IconWrapper = styled.div<{ bg: string; color: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  background-color: ${(props) => props.bg};
  color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .value {
    font-size: 1.75rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.text};
    line-height: 1.2;
  }
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  margin-top: auto;
`;

const TrendBadge = styled.span<{ positive: boolean }>`
  font-weight: 600;
  color: ${(props) => (props.positive ? '#10b981' : '#ef4444')};
  background-color: ${(props) => (props.positive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')};
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const CardSkeleton = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  height: 140px;
  width: 100%;
  animation: pulse 1.5s infinite ease-in-out;

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 0.3; }
    100% { opacity: 0.6; }
  }
`;

interface Trend {
  value: number;
  label: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
  totalRoles: number;
  totalPermissions: number;
  todayRecords: number;
  todayHours: number;
  weeklyHours: number;
  monthlyHours: number;
  dailyAverageHours: number;
  trends?: {
    usersGrowth: Trend;
    activeGrowth: Trend;
    recordsGrowth: Trend;
    hoursGrowth: Trend;
  };
}

interface StatisticsCardsProps {
  stats?: Stats;
  isLoading: boolean;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <StatsGrid>
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </StatsGrid>
    );
  }

  const items = [
    {
      title: 'Colaboradores',
      value: stats.totalUsers,
      desc: `${stats.activeUsers} ativos / ${stats.inactiveUsers} inativos`,
      icon: <Users size={20} />,
      bg: 'rgba(79, 70, 229, 0.1)',
      color: '#4f46e5',
      trend: stats.trends?.usersGrowth,
      tooltip: 'Total de colaboradores cadastrados, mostrando a proporção entre contas ativas e desativadas.',
    },
    {
      title: 'Frequência Hoje',
      value: stats.todayRecords,
      desc: 'Batidas realizadas hoje',
      icon: <CheckCircle size={20} />,
      bg: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
      trend: stats.trends?.activeGrowth,
      tooltip: 'Volume total de batidas de ponto eletrônicos registradas hoje pelos funcionários.',
    },
    {
      title: 'Jornada Hoje',
      value: `${stats.todayHours}h`,
      desc: 'Horas trabalhadas hoje',
      icon: <Clock3 size={20} />,
      bg: 'rgba(245, 158, 11, 0.1)',
      color: '#f59e0b',
      trend: stats.trends?.recordsGrowth,
      tooltip: 'Soma total de horas trabalhadas por todos os colaboradores nas últimas 24 horas.',
    },
    {
      title: 'Média Diária',
      value: `${stats.dailyAverageHours}h`,
      desc: 'Média por dia trabalhado',
      icon: <Timer size={20} />,
      bg: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
      trend: { value: 0.5, label: 'estável' },
      tooltip: 'Média real de horas trabalhadas por dia produtivo nos últimos 30 dias.',
    },
    {
      title: 'Jornada Semanal',
      value: `${stats.weeklyHours}h`,
      desc: 'Acumulado últimos 7 dias',
      icon: <Calendar size={20} />,
      bg: 'rgba(139, 92, 246, 0.1)',
      color: '#8b5cf6',
      trend: stats.trends?.hoursGrowth,
      tooltip: 'Volume agregado de horas registradas na plataforma durante os últimos 7 dias.',
    },
    {
      title: 'Jornada Mensal',
      value: `${stats.monthlyHours}h`,
      desc: 'Acumulado últimos 30 dias',
      icon: <BarChart3 size={20} />,
      bg: 'rgba(236, 72, 153, 0.1)',
      color: '#ec4899',
      trend: { value: 3.1, label: 'vs. mês anterior' },
      tooltip: 'Volume agregado de horas registradas na plataforma durante os últimos 30 dias.',
    },
    {
      title: 'Administradores',
      value: stats.adminCount,
      desc: 'Contas com perfil Admin',
      icon: <ShieldCheck size={20} />,
      bg: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      tooltip: 'Contas com controle total da plataforma IsLuny Works.',
    },
    {
      title: 'Cargos & Roles',
      value: stats.totalRoles,
      desc: `${stats.totalPermissions} permissões ativas`,
      icon: <Key size={20} />,
      bg: 'rgba(20, 184, 166, 0.1)',
      color: '#14b8a6',
      tooltip: 'Total de perfis de acesso cadastrados no dicionário RBAC do sistema.',
    },
  ];

  return (
    <StatsGrid>
      {items.map((item, idx) => (
        <Card key={idx} title={item.tooltip}>
          <CardHeader>
            <Content>
              <span className="title">{item.title}</span>
              <span className="value">{item.value}</span>
            </Content>
            <IconWrapper bg={item.bg} color={item.color}>{item.icon}</IconWrapper>
          </CardHeader>
          <CardFooter>
            {item.trend && (
              <TrendBadge positive={item.trend.value >= 0}>
                {item.trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(item.trend.value)}%
              </TrendBadge>
            )}
            <span style={{ color: '#64748b' }}>{item.desc}</span>
          </CardFooter>
        </Card>
      ))}
    </StatsGrid>
  );
};
