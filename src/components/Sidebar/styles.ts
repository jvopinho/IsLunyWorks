import styled from 'styled-components';

export const SidebarContainer = styled.aside<{ collapsed?: boolean }>`
  width: ${(props) => (props.collapsed ? '70px' : '260px')};
  height: 100vh;
  background-color: ${(props) => props.theme.colors.sidebarBg};
  color: ${(props) => props.theme.colors.sidebarText};
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  box-shadow: ${(props) => props.theme.shadows.md};
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-in-out;
  
  @media (max-width: 768px) {
    transform: translateX(-100%);
    width: 260px;
    
    &.open {
      transform: translateX(0);
    }
  }
`;

export const LogoSection = styled.div<{ collapsed?: boolean }>`
  padding: 1.5rem 1rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
  white-space: nowrap;
  justify-content: ${(props) => (props.collapsed ? 'center' : 'flex-start')};
  
  .logo-text {
    display: ${(props) => (props.collapsed ? 'none' : 'block')};
  }
`;

export const Navigation = styled.nav`
  flex: 1;
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

export const NavGroupTitle = styled.div<{ collapsed?: boolean }>`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.3);
  padding: 0.75rem 0.75rem 0.25rem;
  display: ${(props) => (props.collapsed ? 'none' : 'flex')};
  align-items: center;
  user-select: none;
`;

export const NavItem = styled.div<{ active?: boolean; collapsed?: boolean }>`
  a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.75rem;
    border-radius: ${(props) => props.theme.borderRadius.md};
    color: ${(props) => (props.active ? props.theme.colors.sidebarTextActive : props.theme.colors.sidebarText)};
    background-color: ${(props) => (props.active ? 'rgba(79, 70, 229, 0.15)' : 'transparent')};
    font-weight: ${(props) => (props.active ? '600' : '400')};
    transition: ${(props) => props.theme.transitions.fast};
    border-left: 3px solid ${(props) => (props.active ? props.theme.colors.primary : 'transparent')};
    justify-content: ${(props) => (props.collapsed ? 'center' : 'flex-start')};

    span.label {
      display: ${(props) => (props.collapsed ? 'none' : 'block')};
      white-space: nowrap;
    }

    span.icon {
      font-size: 1.15rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
    }

    &:hover {
      color: ${(props) => props.theme.colors.sidebarTextActive};
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
`;

export const SidebarFooter = styled.div<{ collapsed?: boolean }>`
  padding: 1.25rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.sidebarText};
  overflow: hidden;
  white-space: nowrap;
  
  .footer-text {
    display: ${(props) => (props.collapsed ? 'none' : 'block')};
  }

  strong {
    color: white;
  }
`;

export const CollapseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  transition: color 0.2s;
  
  &:hover {
    color: white;
  }
`;
