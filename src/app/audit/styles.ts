import styled from 'styled-components';

export const FilterCard = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
`;

export const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: flex-end;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  label {
    font-size: ${(props) => props.theme.fontSizes.xs};
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input, select {
    padding: 0.5rem;
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.borderRadius.md};
    font-size: ${(props) => props.theme.fontSizes.sm};
    background-color: white;
    outline: none;
    transition: ${(props) => props.theme.transitions.fast};

    &:focus {
      border-color: ${(props) => props.theme.colors.primary};
    }
  }
`;

export const ActionsRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  grid-column: 1 / -1;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

export const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding: 0.5rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textMuted};
`;

export const PageBtnRow = styled.div`
  display: flex;
  gap: 0.25rem;
`;

export const DiffGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const DiffColumn = styled.div<{ variant: 'prev' | 'curr' }>`
  background-color: ${(props) => (props.variant === 'prev' ? '#fef2f2' : '#f0fdf4')};
  border: 1px solid ${(props) => (props.variant === 'prev' ? '#fee2e2' : '#dcfce7')};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: 1rem;

  h5 {
    font-size: 0.8rem;
    font-weight: 700;
    color: ${(props) => (props.variant === 'prev' ? '#991b1b' : '#166534')};
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    border-bottom: 1px dashed ${(props) => (props.variant === 'prev' ? '#fca5a5' : '#86efac')};
    padding-bottom: 0.25rem;
  }
`;

export const DiffItem = styled.div`
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
  margin-bottom: 0.25rem;
  color: #334155;
`;

export const DetailRow = styled.div`
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 1rem;
  font-size: ${(props) => props.theme.fontSizes.sm};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  padding: 0.5rem 0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
  }

  .value {
    color: ${(props) => props.theme.colors.text};
    word-break: break-word;
  }
`;
