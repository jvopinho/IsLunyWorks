import React from 'react';
import { TH, THead } from './styles';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  allowWrap?: boolean;
}

interface TableHeaderProps<T> {
  columns: Column<T>[];
}

export function TableHeader<T>({ columns }: TableHeaderProps<T>) {
  return (
    <THead>
      <tr>
        {columns.map((col) => (
          <TH key={col.key} $width={col.width}>
            {col.header}
          </TH>
        ))}
      </tr>
    </THead>
  );
}
