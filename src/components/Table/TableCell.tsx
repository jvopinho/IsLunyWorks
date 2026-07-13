import React from 'react';
import { TD } from './styles';

interface TableCellProps {
  children: React.ReactNode;
  width?: string;
  allowWrap?: boolean;
}

export function TableCell({ children, width, allowWrap }: TableCellProps) {
  return (
    <TD $width={width} $allowWrap={allowWrap}>
      {children}
    </TD>
  );
}
