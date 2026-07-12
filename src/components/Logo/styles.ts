import styled from 'styled-components';

export const LogoContainer = styled.div<{ collapsed: boolean; size: 'sm' | 'md' | 'lg' }>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.collapsed ? 'center' : 'flex-start')};
  gap: 0.75rem;
  width: 100%;
  padding: ${(props) => (props.size === 'lg' ? '1rem 0' : '0')};
  transition: all 0.2s ease-in-out;
`;

export const LogoImageWrapper = styled.div<{ size: 'sm' | 'md' | 'lg' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    object-fit: contain;
  }
`;

export const LogoTextWrapper = styled.div<{ size: 'sm' | 'md' | 'lg' }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.1;
`;

export const LogoTitle = styled.span<{ size: 'sm' | 'md' | 'lg' }>`
  font-weight: 700;
  color: ${(props) => props.theme.colors.text};
  font-size: ${(props) => (props.size === 'lg' ? '1.5rem' : props.size === 'md' ? '1.125rem' : '0.9rem')};
  white-space: nowrap;
`;

export const LogoSubtitle = styled.span<{ size: 'sm' | 'md' | 'lg' }>`
  font-weight: 500;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: ${(props) => (props.size === 'lg' ? '0.875rem' : props.size === 'md' ? '0.75rem' : '0.625rem')};
  white-space: nowrap;
`;
