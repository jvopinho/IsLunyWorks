'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { usePermission } from '@/hooks/usePermission';
import { Logo } from '@/components/Logo';
import { Menu, LogOut, User, Bell, Settings, SunMoon } from 'lucide-react';
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
          <Menu size={20} />
        </MenuButton>
        <div className="header-logo-mobile">
          <Logo collapsed size="sm" />
        </div>
        <Title>{title}</Title>
      </div>
      <UserActions>
        <span title="Notificações" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <Bell size={18} style={{ color: '#64748b' }} />
        </span>
        <span title="Alternar Tema" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <SunMoon size={18} style={{ color: '#64748b' }} />
        </span>
        <span title="Configurações" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <Settings size={18} style={{ color: '#64748b' }} />
        </span>
        <span title="Perfil" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <User size={18} style={{ color: '#64748b' }} />
        </span>
        
        {user && (
          <UserInfo>
            <span className="name">{user.name}</span>
            <span className="role">{role?.name || 'Colaborador'}</span>
          </UserInfo>
        )}
        <LogoutButton onClick={handleLogout}>
          Sair <LogOut size={14} />
        </LogoutButton>
      </UserActions>
    </HeaderContainer>
  );
};
