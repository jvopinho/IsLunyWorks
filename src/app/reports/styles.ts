import styled from 'styled-components';

export const FilterCard = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => props.theme.shadows.sm};
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

export const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) auto;
  gap: 1rem;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    
    button {
      width: 100%;
    }
  }
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

export const StatBox = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-shadow: ${(props) => props.theme.shadows.sm};
  border-left: 4px solid ${(props) => props.theme.colors.primary};
  
  .label {
    font-size: 0.75rem;
    color: ${(props) => props.theme.colors.textMuted};
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  
  .value {
    font-size: 1.75rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.text};
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  width: 100%;

  label {
    font-size: ${(props) => props.theme.fontSizes.sm};
    font-weight: 500;
    color: ${(props) => props.theme.colors.text};
  }

  select, input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    font-size: ${(props) => props.theme.fontSizes.sm};
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.borderRadius.md};
    background-color: white;
    color: ${(props) => props.theme.colors.text};
    transition: ${(props) => props.theme.transitions.default};

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.primary};
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
    }
  }
`;
