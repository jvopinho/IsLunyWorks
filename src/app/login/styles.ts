import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  padding: 1.5rem;
`;

export const CardWrapper = styled.div`
  width: 100%;
  max-width: 440px;
  background-color: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
  padding: 2.5rem;
  
  @media (max-width: 480px) {
    padding: 2rem 1.5rem;
  }
`;

export const Title = styled.h1`
  font-size: ${(props) => props.theme.fontSizes['2xl']};
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 0.5rem;
`;

export const Subtitle = styled.p`
  font-size: ${(props) => props.theme.fontSizes.sm};
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 2rem;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  label {
    font-size: ${(props) => props.theme.fontSizes.sm};
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: ${(props) => props.theme.borderRadius.md};
    color: white;
    font-size: ${(props) => props.theme.fontSizes.sm};
    transition: all 0.2s ease-in-out;

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.primary};
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3);
      background-color: rgba(0, 0, 0, 0.3);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  span.error {
    font-size: ${(props) => props.theme.fontSizes.xs};
    color: #f87171;
  }
`;

export const ErrorBanner = styled.div`
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.75rem;
  border-radius: ${(props) => props.theme.borderRadius.md};
  color: #f87171;
  font-size: ${(props) => props.theme.fontSizes.sm};
  text-align: center;
`;
