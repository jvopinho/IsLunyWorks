import styled from 'styled-components';

export const WidgetContainer = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: ${(props) => props.theme.transitions.default};
  height: 100%;
  
  &:hover {
    box-shadow: ${(props) => props.theme.shadows.md};
  }
`;

export const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const WidgetTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizes.md};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const WidgetSubtitle = styled.p`
  font-size: ${(props) => props.theme.fontSizes.xs};
  color: ${(props) => props.theme.colors.textMuted};
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
`;

export const LoadingPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => props.theme.fontSizes.sm};
`;

export const ChartWrapper = styled.div`
  width: 100%;
  height: 260px;
  font-size: 0.75rem;
`;
