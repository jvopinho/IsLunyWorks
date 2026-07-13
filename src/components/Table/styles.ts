import styled from 'styled-components';

export const TableContainer = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
  display: flex;
  flex-direction: column;
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: ${(props) => props.theme.fontSizes.sm};
  table-layout: auto;
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

export const TH = styled.th<{ $width?: string }>`
  padding: 0.875rem 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  background-color: #f8fafc;
  z-index: 10;
  box-shadow: inset 0 -1px 0 ${(props) => props.theme.colors.border};
  white-space: nowrap;
  width: ${(props) => props.$width || 'auto'};
  min-width: ${(props) => props.$width || 'auto'};
`;

export const TD = styled.td<{ $allowWrap?: boolean; $width?: string }>`
  padding: 0.875rem 1rem;
  color: ${(props) => props.theme.colors.text};
  vertical-align: middle;
  white-space: ${(props) => (props.$allowWrap ? 'normal' : 'nowrap')};
  width: ${(props) => props.$width || 'auto'};
  min-width: ${(props) => props.$width || 'auto'};
  max-width: ${(props) => props.$width || 'none'};
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const EmptyState = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.sm};
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  background-color: #fafafa;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

export const PageButton = styled.button<{ $active?: boolean }>`
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid ${(props) => (props.$active ? props.theme.colors.primary : props.theme.colors.border)};
  background-color: ${(props) => (props.$active ? props.theme.colors.primary : 'white')};
  color: ${(props) => (props.$active ? 'white' : props.theme.colors.text)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$active ? props.theme.colors.primary : '#f1f5f9')};
    border-color: ${(props) => (props.$active ? props.theme.colors.primary : '#cbd5e1')};
  }

  &:disabled {
    color: #94a3b8;
    background-color: #f8fafc;
    border-color: #e2e8f0;
    cursor: not-allowed;
  }
`;

export const InfoText = styled.span`
  font-size: 0.75rem;
  color: ${(props) => props.theme.colors.textMuted};

  strong {
    color: ${(props) => props.theme.colors.text};
  }
`;

export const LimitSelect = styled.select`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  background-color: white;
  color: ${(props) => props.theme.colors.text};
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

export const ToolbarContainer = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
