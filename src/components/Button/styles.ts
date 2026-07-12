import styled, { css } from 'styled-components';

export interface StyledButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const StyledButton = styled.button<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: ${(props) => props.theme.borderRadius.md};
  transition: ${(props) => props.theme.transitions.default};
  font-size: ${(props) => props.theme.fontSizes.sm};
  border: 1px solid transparent;
  gap: 0.5rem;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${(props) =>
    props.fullWidth &&
    css`
      width: 100%;
    `}

  /* Variants */
  ${(props) => {
    switch (props.variant) {
      case 'secondary':
        return css`
          background-color: transparent;
          border-color: ${props.theme.colors.border};
          color: ${props.theme.colors.text};
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.border};
          }
        `;
      case 'danger':
        return css`
          background-color: ${props.theme.colors.error};
          color: white;
          &:hover:not(:disabled) {
            background-color: #dc2626;
          }
        `;
      case 'success':
        return css`
          background-color: ${props.theme.colors.success};
          color: white;
          &:hover:not(:disabled) {
            background-color: #059669;
          }
        `;
      case 'primary':
      default:
        return css`
          background-color: ${props.theme.colors.primary};
          color: white;
          &:hover:not(:disabled) {
            background-color: ${props.theme.colors.primaryHover};
          }
        `;
    }
  }}

  /* Sizes */
  ${(props) => {
    switch (props.size) {
      case 'sm':
        return css`
          padding: 0.375rem 0.75rem;
          font-size: ${props.theme.fontSizes.xs};
        `;
      case 'lg':
        return css`
          padding: 0.75rem 1.5rem;
          font-size: ${props.theme.fontSizes.md};
        `;
      case 'md':
      default:
        return css`
          padding: 0.5rem 1rem;
        `;
    }
  }}
`;
