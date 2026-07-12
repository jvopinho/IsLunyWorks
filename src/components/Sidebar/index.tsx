'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { SidebarContainer, LogoSection, Navigation, NavGroupTitle, NavItem, SidebarFooter, CollapseButton } from './styles';

interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();
  const { can, user, role } = usePermission();

  const dashboardMenu = { label: 'Painel Geral', href: '/dashboard', icon: '📊', show: true };

  const gestaoMenu = [
    { label: 'Colaboradores', href: '/users', icon: '👥', show: can('users.view') },
    { label: 'Cargos', href: '/roles', icon: '🛡️', show: can('roles.view') },
    { label: 'Permissões', href: '/permissions', icon: '🔑', show: can('permissions.view') },
  ];

  const rhMenu = [
    { label: 'Controle de Ponto', href: '/clock', icon: '⏱️', show: can('clock.register') },
    { label: 'Relatórios', href: '/reports', icon: '📋', show: can('reports.view') },
  ];

  const configMenu = [
    { label: 'Configurações', href: '#', icon: '⚙️', show: can('settings.manage') || can('admin') },
  ];

  const renderItem = (item: any) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '#' && pathname?.startsWith(`${item.href}`));
    return (
      <NavItem key={item.label} active={isActive} collapsed={isCollapsed}>
        <Link href={item.href}>
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </Link>
      </NavItem>
    );
  };

  const hasGestaoVisible = gestaoMenu.some(item => item.show);
  const hasRhVisible = rhMenu.some(item => item.show);
  const hasConfigVisible = configMenu.some(item => item.show);

  return (
    <SidebarContainer className={isOpen ? 'open' : ''} collapsed={isCollapsed}>
      <LogoSection collapsed={isCollapsed}>
        <span style={{ fontSize: '1.25rem' }}>❄️</span>
        <span className="logo-text">IsLuny Works</span>
      </LogoSection>

      <Navigation>
        {renderItem(dashboardMenu)}

        {hasGestaoVisible && (
          <>
            <NavGroupTitle collapsed={isCollapsed}>Gestão</NavGroupTitle>
            {gestaoMenu.filter(i => i.show).map(renderItem)}
          </>
        )}

        {hasRhVisible && (
          <>
            <NavGroupTitle collapsed={isCollapsed}>Recursos Humanos</NavGroupTitle>
            {rhMenu.filter(i => i.show).map(renderItem)}
          </>
        )}

        {hasConfigVisible && (
          <>
            <NavGroupTitle collapsed={isCollapsed}>Configurações</NavGroupTitle>
            {configMenu.filter(i => i.show).map(renderItem)}
          </>
        )}
      </Navigation>

      {user && (
        <SidebarFooter collapsed={isCollapsed}>
          <div className="footer-text">
            <div>Plataforma <strong>IsLuny Org</strong>:</div>
            <strong style={{ display: 'block', margin: '2px 0' }}>{user.name}</strong>
            <div>{role?.name || 'Colaborador'}</div>
          </div>
          {isCollapsed && (
            <div style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 'bold', color: 'white' }}>
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
        </SidebarFooter>
      )}

      <CollapseButton onClick={onToggleCollapse} type="button">
        {isCollapsed ? '▶' : '◀ Recolher'}
      </CollapseButton>
    </SidebarContainer>
  );
};
