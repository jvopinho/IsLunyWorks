'use client';

import React from 'react';
import styled from 'styled-components';
import { formatDate } from '@/utils/date';
import { WidgetContainer, WidgetTitle, WidgetSubtitle, LoadingPlaceholder } from './styles';

const UsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  overflow-y: auto;
  max-height: 320px;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  background-color: ${(props) => props.theme.colors.background};
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  .name {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.text};
  }

  .email {
    font-size: 0.75rem;
    color: ${(props) => props.theme.colors.textMuted};
  }
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;

  .role {
    font-size: 0.75rem;
    font-weight: 500;
    background-color: rgba(79, 70, 229, 0.1);
    color: ${(props) => props.theme.colors.primary};
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .date {
    font-size: 0.675rem;
    color: ${(props) => props.theme.colors.textMuted};
  }
`;

interface RecentUsersWidgetProps {
  users?: { id: string; name: string; email: string; createdAt: string; role: string }[];
  isLoading: boolean;
}

export const RecentUsersWidget: React.FC<RecentUsersWidgetProps> = ({ users = [], isLoading }) => {
  return (
    <WidgetContainer>
      <div>
        <WidgetTitle>👥 Últimos Colaboradores Cadastrados</WidgetTitle>
        <WidgetSubtitle>Novos funcionários recém-adicionados ao IsLuny Works</WidgetSubtitle>
      </div>

      {isLoading ? (
        <LoadingPlaceholder>Carregando novos colaboradores...</LoadingPlaceholder>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
          Nenhum colaborador cadastrado recentemente.
        </div>
      ) : (
        <UsersList>
          {users.map((user) => (
            <UserItem key={user.id}>
              <UserInfo>
                <span className="name">{user.name}</span>
                <span className="email">{user.email}</span>
              </UserInfo>
              <UserMeta>
                <span className="role">{user.role}</span>
                <span className="date">Registrado em {formatDate(user.createdAt)}</span>
              </UserMeta>
            </UserItem>
          ))}
        </UsersList>
      )}
    </WidgetContainer>
  );
};
