import React from 'react';
import { ToolbarContainer } from './styles';

interface TableToolbarProps {
  children?: React.ReactNode;
}

export function TableToolbar({ children }: TableToolbarProps) {
  if (!children) return null;
  return <ToolbarContainer>{children}</ToolbarContainer>;
}
