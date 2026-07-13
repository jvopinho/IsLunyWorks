import React from 'react';
import { TableContainer, StyledTable, TBody, EmptyState } from './styles';
import { TableHeader, Column } from './TableHeader';
import { TableRow } from './TableRow';
import { TableCell } from './TableCell';
import { TablePagination, TablePaginationProps } from './TablePagination';
import { TableToolbar } from './TableToolbar';

export type { Column };

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  pagination?: TablePaginationProps;
  toolbar?: React.ReactNode;
}

export function Table<T>({
  columns,
  data,
  emptyMessage = 'Nenhum registro encontrado.',
  pagination,
  toolbar,
}: TableProps<T>) {
  return (
    <TableContainer>
      {toolbar && <TableToolbar>{toolbar}</TableToolbar>}
      {data.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : (
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <StyledTable>
            <TableHeader columns={columns} />
            <TBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => (
                    <TableCell key={col.key} width={col.width} allowWrap={col.allowWrap}>
                      {col.render ? col.render(row, rowIndex) : (row as any)[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TBody>
          </StyledTable>
        </div>
      )}
      {pagination && <TablePagination {...pagination} />}
    </TableContainer>
  );
}
