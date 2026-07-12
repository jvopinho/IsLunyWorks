'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { usePermission } from '@/hooks/usePermission';
import { HeaderContainer, MenuButton, Title, UserActions, UserInfo, LogoutButton } from './styles';

interface HeaderProps {
  title: string;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar }) => {
  const { user, role } = usePermission();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <HeaderContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <MenuButton onClick={onToggleSidebar} aria-label="Toggle menu">
          ☰
        </MenuButton>
        <Title>{title}</Title>
      </div>
      <UserActions>
        {user && (
          <UserInfo>
            <span className="name">{user.name}</span>
            <span className="role">{role?.name || 'Colaborador'}</span>
          </UserInfo>
        )}
        <LogoutButton onClick={handleLogout}>
          Sair 🚪
        </LogoutButton>
      </UserActions>
    </HeaderContainer>
  );
};
