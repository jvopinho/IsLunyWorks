import React from 'react';
import { TR } from './styles';

interface TableRowProps {
  children: React.ReactNode;
}

export function TableRow({ children }: TableRowProps) {
  return <TR>{children}</TR>;
}
