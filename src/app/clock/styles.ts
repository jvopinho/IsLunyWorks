import styled from 'styled-components';

export const ClockContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
`;

export const LiveTime = styled.div`
  font-size: 3.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.secondary};
  font-family: monospace;
  text-align: center;
  letter-spacing: 0.05em;
  text-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

export const LiveDate = styled.div`
  font-size: 1.125rem;
  color: ${(props) => props.theme.colors.textMuted};
  text-align: center;
  margin-top: -1rem;
  font-weight: 500;
`;

export const FormWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const StatusIndicator = styled.div<{ active?: boolean }>`
  padding: 1rem;
  border-radius: ${(props) => props.theme.borderRadius.lg};
  font-size: ${(props) => props.theme.fontSizes.md};
  font-weight: 600;
  text-align: center;
  width: 100%;
  background-color: ${(props) => (props.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')};
  color: ${(props) => (props.active ? '#059669' : '#dc2626')};
  border: 1px solid ${(props) => (props.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)')};
`;
