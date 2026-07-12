import styled from 'styled-components';

export const HeaderContainer = styled.header`
  height: 70px;
  background-color: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 90;
  box-shadow: ${(props) => props.theme.shadows.sm};
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

export const MenuButton = styled.button`
  display: none;
  font-size: 1.5rem;
  color: ${(props) => props.theme.colors.text};
  line-height: 1;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const Title = styled.h1`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  
  @media (max-width: 768px) {
    font-size: ${(props) => props.theme.fontSizes.md};
  }
`;

export const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  text-align: right;
  
  span.name {
    font-size: ${(props) => props.theme.fontSizes.sm};
    font-weight: 500;
    color: ${(props) => props.theme.colors.text};
  }
  
  span.role {
    font-size: ${(props) => props.theme.fontSizes.xs};
    color: ${(props) => props.theme.colors.textMuted};
  }
  
  @media (max-width: 480px) {
    display: none;
  }
`;

export const LogoutButton = styled.button`
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: 500;
  color: ${(props) => props.theme.colors.error};
  padding: 0.375rem 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid transparent;
  transition: ${(props) => props.theme.transitions.default};
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background-color: #fef2f2;
    border-color: #fee2e2;
  }
`;
