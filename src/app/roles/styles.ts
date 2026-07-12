import styled from 'styled-components';

export const ActionsBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
`;

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const PermissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 1rem;
  border-radius: ${(props) => props.theme.borderRadius.md};
  background-color: #f8fafc;
`;

export const PermissionCheckbox = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: ${(props) => props.theme.fontSizes.sm};
  cursor: pointer;
  user-select: none;
  
  input {
    margin-top: 0.2rem;
    accent-color: ${(props) => props.theme.colors.primary};
  }
  
  div {
    display: flex;
    flex-direction: column;
    
    span.key {
      font-weight: 600;
      color: ${(props) => props.theme.colors.text};
    }
    
    span.desc {
      font-size: 0.75rem;
      color: ${(props) => props.theme.colors.textMuted};
    }
  }
`;

export const UsersListWrapper = styled.div`
  margin-top: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: 0.5rem;
  background-color: #f8fafc;
  
  .user-item {
    font-size: ${(props) => props.theme.fontSizes.sm};
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid ${(props) => props.theme.colors.border};
    display: flex;
    justify-content: space-between;
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

export const PermissionsListText = styled.div`
  font-size: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  
  span {
    background-color: #e2e8f0;
    color: #334155;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-weight: 500;
  }
`;

export const RowActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;
