import styled from 'styled-components';

export const LayoutWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
`;

export const MainContent = styled.main<{ collapsed?: boolean }>`
  flex: 1;
  margin-left: ${(props) => (props.collapsed ? '70px' : '260px')}; /* Match sidebar width */
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

export const ContentWrapper = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: ${(props) => props.theme.colors.background};
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

export const Backdrop = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    &.open {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(2px);
      z-index: 95;
    }
  }
`;
