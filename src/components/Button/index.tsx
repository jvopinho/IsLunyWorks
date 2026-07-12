import React from 'react';
import { StyledButton, StyledButtonProps } from './styles';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, StyledButtonProps {
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  disabled,
  ...props
}) => {
  return (
    <StyledButton disabled={disabled || isLoading} {...props}>
      {isLoading ? 'Carregando...' : children}
    </StyledButton>
  );
};
