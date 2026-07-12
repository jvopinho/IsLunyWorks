import styled from 'styled-components';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

export const StatCard = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  transition: ${(props) => props.theme.transitions.default};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${(props) => props.theme.shadows.md};
  }
  
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .value {
    font-size: ${(props) => props.theme.fontSizes['3xl']};
    font-weight: 700;
    color: ${(props) => props.theme.colors.text};
    line-height: 1.1;
  }

  .sub {
    font-size: ${(props) => props.theme.fontSizes.xs};
    color: ${(props) => props.theme.colors.textMuted};
  }
`;

export const SectionTitle = styled.h2`
  font-size: ${(props) => props.theme.fontSizes.lg};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

export const ClockCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 1.5rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  height: fit-content;
`;

export const ClockStatus = styled.div<{ active?: boolean }>`
  padding: 0.625rem;
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-size: ${(props) => props.theme.fontSizes.sm};
  font-weight: 600;
  text-align: center;
  background-color: ${(props) => (props.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')};
  color: ${(props) => (props.active ? '#059669' : '#dc2626')};
  border: 1px solid ${(props) => (props.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)')};
`;

export const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const LogItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.border};
  font-size: ${(props) => props.theme.fontSizes.sm};
  
  .time {
    font-size: ${(props) => props.theme.fontSizes.xs};
    color: ${(props) => props.theme.colors.textMuted};
    font-weight: 500;
  }
`;

export const AdminDashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const ChartsCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
