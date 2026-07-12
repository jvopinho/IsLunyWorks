import styled, { css } from 'styled-components';

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;
`;

export const Label = styled.label`
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
`;

interface StyledInputElementProps {
  hasError?: boolean;
}

export const StyledInputElement = styled.input<StyledInputElementProps>`
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: ${(props) => props.theme.fontSizes.sm};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  background-color: white;
  color: ${(props) => props.theme.colors.text};
  transition: ${(props) => props.theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
  }

  &:disabled {
    background-color: #f1f5f9;
    color: ${(props) => props.theme.colors.textMuted};
    cursor: not-allowed;
  }

  ${(props) =>
    props.hasError &&
    css`
      border-color: ${props.theme.colors.error};
      &:focus {
        border-color: ${props.theme.colors.error};
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
      }
    `}
`;

export const ErrorText = styled.span`
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.error};
  font-weight: 500;
`;
