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

export const BalanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

export const BalanceCard = styled.div<{ positive?: boolean }>`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: ${(props) => props.theme.shadows.sm};

  .label {
    font-size: 0.75rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
    text-transform: uppercase;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    color: ${(props) => (props.positive === undefined ? props.theme.colors.text : props.positive ? '#10b981' : '#ef4444')};
  }

  .sub {
    font-size: 0.75rem;
    color: ${(props) => props.theme.colors.textMuted};
  }
`;

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const TransactionBadge = styled.span<{ type: string }>`
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.725rem;
  display: inline-block;

  ${(props) => {
    switch (props.type) {
      case 'WORKED_EXTRA':
      case 'MANUAL_CREDIT':
        return 'color: #10b981; background-color: rgba(16, 185, 129, 0.1);';
      case 'MANUAL_DEBIT':
      case 'USED_IN_WORKDAY':
        return 'color: #ef4444; background-color: rgba(239, 68, 68, 0.1);';
      default:
        return 'color: #64748b; background-color: rgba(100, 116, 139, 0.1);';
    }
  }}
`;
