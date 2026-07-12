import styled from 'styled-components';

export const StyledCard = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
  padding: ${(props) => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
  position: relative;
  overflow: hidden;
`;

export const CardTitle = styled.h3`
  font-size: ${(props) => props.theme.fontSizes.md};
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

export const CardDescription = styled.p`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: ${(props) => props.theme.colors.textMuted};
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spacing.sm};
`;

export const CardContent = styled.div`
  font-size: ${(props) => props.theme.fontSizes.md};
`;
