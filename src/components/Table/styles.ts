import styled from 'styled-components';

export const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: ${(props) => props.theme.fontSizes.sm};
`;

export const THead = styled.thead`
  background-color: #f8fafc;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

export const TBody = styled.tbody``;

export const TR = styled.tr`
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  transition: ${(props) => props.theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f1f5f9;
  }
`;

export const TH = styled.th`
  padding: 0.875rem 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const TD = styled.td`
  padding: 0.875rem 1rem;
  color: ${(props) => props.theme.colors.text};
  vertical-align: middle;
`;

export const EmptyState = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.sm};
`;
