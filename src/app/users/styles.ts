import styled from 'styled-components';

export const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  max-width: 400px;
  width: 100%;
`;

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  label {
    font-size: ${(props) => props.theme.fontSizes.sm};
    font-weight: 500;
    color: ${(props) => props.theme.colors.text};
  }

  select {
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
  }

  span.error {
    font-size: ${(props) => props.theme.fontSizes.xs};
    color: ${(props) => props.theme.colors.error};
    font-weight: 500;
  }
`;

export const Badge = styled.span<{ active?: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${(props) => (props.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)')};
  color: ${(props) => (props.active ? '#059669' : '#475569')};
  border: 1px solid ${(props) => (props.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)')};
`;

export const RowActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;

  input[type='checkbox'] {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
    accent-color: ${(props) => props.theme.colors.primary};
  }

  span {
    font-size: ${(props) => props.theme.fontSizes.sm};
    color: ${(props) => props.theme.colors.text};
  }
`;
