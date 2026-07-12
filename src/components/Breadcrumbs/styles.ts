import styled from 'styled-components';

export const BreadcrumbsContainer = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${(props) => props.theme.fontSizes.sm};
  margin-bottom: ${(props) => props.theme.spacing.md};
`;

export const BreadcrumbItem = styled.span<{ active?: boolean }>`
  color: ${(props) => (props.active ? props.theme.colors.text : props.theme.colors.textMuted)};
  font-weight: ${(props) => (props.active ? '500' : '400')};
  
  a {
    transition: ${(props) => props.theme.transitions.fast};
    &:hover {
      color: ${(props) => props.theme.colors.primary};
    }
  }
`;

export const Separator = styled.span`
  color: ${(props) => props.theme.colors.textMuted};
  user-select: none;
`;
