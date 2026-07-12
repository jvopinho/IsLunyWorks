import React from 'react';
import styled from 'styled-components';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
  align-items: flex-start;
  gap: 1rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  transition: ${(props) => props.theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows.md};
  }
`;

const IconWrapper = styled.div<{ bg: string }>`
  font-size: 1.5rem;
  width: 48px;
  height: 48px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  background-color: ${(props) => props.bg};
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
  overflow: hidden;
  
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .value {
    font-size: 1.75rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.text};
    line-height: 1.2;
  }
  
  .desc {
    font-size: 0.75rem;
    color: ${(props) => props.theme.colors.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const CardSkeleton = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  height: 96px;
  width: 100%;
  animation: pulse 1.5s infinite ease-in-out;

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 0.3; }
    100% { opacity: 0.6; }
  }
`;

interface Stats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  totalRoles: number;
  totalPermissions: number;
  todayRecords: number;
  todayHours: number;
  weeklyHours: number;
  monthlyHours: number;
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
      title: 'Total de Colaboradores',
      value: stats.totalUsers,
      desc: 'Cadastrados na plataforma',
      icon: '👥',
      bg: 'rgba(79, 70, 229, 0.1)',
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers,
      desc: 'Com acesso ativo hoje',
      icon: '🟢',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Batidas Hoje',
      value: stats.todayRecords,
      desc: 'Batidas registradas hoje',
      icon: '⏱️',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'Horas Hoje',
      value: `${stats.todayHours}h`,
      desc: 'Total trabalhado hoje',
      icon: '⚡',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Horas na Semana',
      value: `${stats.weeklyHours}h`,
      desc: 'Acumulado últimos 7 dias',
      icon: '📅',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
    {
      title: 'Horas no Mês',
      value: `${stats.monthlyHours}h`,
      desc: 'Acumulado últimos 30 dias',
      icon: '📊',
      bg: 'rgba(236, 72, 153, 0.1)',
    },
    {
      title: 'Administradores',
      value: stats.adminCount,
      desc: 'Acesso irrestrito (Admin)',
      icon: '🛡️',
      bg: 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Total de Cargos',
      value: stats.totalRoles,
      desc: 'Cargos ativos no RBAC',
      icon: '📂',
      bg: 'rgba(100, 116, 139, 0.1)',
    },
    {
      title: 'Total de Permissões',
      value: stats.totalPermissions,
      desc: 'Chaves de privilégio ativas',
      icon: '🔑',
      bg: 'rgba(20, 184, 166, 0.1)',
    },
  ];

  return (
    <StatsGrid>
      {items.map((item, idx) => (
        <Card key={idx}>
          <IconWrapper bg={item.bg}>{item.icon}</IconWrapper>
          <Content>
            <span className="title" title={item.title}>{item.title}</span>
            <span className="value">{item.value}</span>
            <span className="desc" title={item.desc}>{item.desc}</span>
          </Content>
        </Card>
      ))}
    </StatsGrid>
  );
};
