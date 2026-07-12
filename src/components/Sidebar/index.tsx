'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { Logo } from '@/components/Logo';
import {
  LayoutDashboard,
  UserRound,
  BadgeCheck,
  Shield,
  Clock3,
  BarChart3,
  Wallet,
  History,
  Settings,
  Users,
  BriefcaseBusiness,
  MonitorCog,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SidebarContainer, LogoSection, Navigation, NavGroupTitle, NavItem, SidebarFooter, CollapseButton } from './styles';

interface SidebarProps {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();
  const { can, user, role } = usePermission();

  const ICON_SIZE = 18;

  const dashboardMenu = {
    label: 'Painel Geral',
    href: '/dashboard',
    icon: <LayoutDashboard size={ICON_SIZE} />,
    show: true
  };

  const gestaoMenu = [
    { label: 'Colaboradores', href: '/users', icon: <UserRound size={ICON_SIZE} />, show: can('users.view') },
    { label: 'Cargos', href: '/roles', icon: <BadgeCheck size={ICON_SIZE} />, show: can('roles.view') },
    { label: 'Permissões', href: '/permissions', icon: <Shield size={ICON_SIZE} />, show: can('permissions.view') },
  ];

  const rhMenu = [
    { label: 'Controle de Ponto', href: '/clock', icon: <Clock3 size={ICON_SIZE} />, show: can('clock.register') },
    { label: 'Relatórios', href: '/reports', icon: <BarChart3 size={ICON_SIZE} />, show: can('reports.view') },
    { label: 'Banco de Horas', href: '/bank-hours', icon: <Wallet size={ICON_SIZE} />, show: can('bank_hours.view') || can('admin') },
  ];

  const configMenu = [
    { label: 'Configurações', href: '#', icon: <Settings size={ICON_SIZE} />, show: can('settings.manage') || can('admin') },
  ];

  const sistemaMenu = [
    { label: 'Audit Logs', href: '/audit', icon: <History size={ICON_SIZE} />, show: can('audit.view') || can('admin') },
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
        <Logo collapsed={isCollapsed} size="sm" />
      </LogoSection>

      <Navigation>
        {renderItem(dashboardMenu)}

        {hasGestaoVisible && (
          <>
            <NavGroupTitle collapsed={isCollapsed}>
              <Users size={12} style={{ marginRight: '6px' }} />
              Gestão
            </NavGroupTitle>
            {gestaoMenu.filter(i => i.show).map(renderItem)}
          </>
        )}

        {hasRhVisible && (
          <>
            <NavGroupTitle collapsed={isCollapsed}>
              <BriefcaseBusiness size={12} style={{ marginRight: '6px' }} />
              Recursos Humanos
            </NavGroupTitle>
            {rhMenu.filter(i => i.show).map(renderItem)}
          </>
        )}

        {hasConfigVisible && (
          <>
            <NavGroupTitle collapsed={isCollapsed}>
              <Settings size={12} style={{ marginRight: '6px' }} />
              Configurações
            </NavGroupTitle>
            {configMenu.filter(i => i.show).map(renderItem)}
          </>
        )}

        {sistemaMenu.some(item => item.show) && (
          <>
            <NavGroupTitle collapsed={isCollapsed}>
              <MonitorCog size={12} style={{ marginRight: '6px' }} />
              Sistema
            </NavGroupTitle>
            {sistemaMenu.filter(i => i.show).map(renderItem)}
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
        {isCollapsed ? <ChevronRight size={18} /> : <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChevronLeft size={18} /> Recolher</div>}
      </CollapseButton>
    </SidebarContainer>
  );
};
