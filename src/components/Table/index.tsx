import React from 'react';
import { TableContainer, StyledTable, THead, TBody, TR, TH, TD, EmptyState } from './styles';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function Table<T>({ columns, data, emptyMessage = 'Nenhum registro encontrado.' }: TableProps<T>) {
  return (
    <TableContainer>
      {data.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : (
        <StyledTable>
          <THead>
            <tr>
              {columns.map((col) => (
                <TH key={col.key}>{col.header}</TH>
              ))}
            </tr>
          </THead>
          <TBody>
            {data.map((row, rowIndex) => (
              <TR key={rowIndex}>
                {columns.map((col) => (
                  <TD key={col.key}>
                    {col.render ? col.render(row, rowIndex) : (row as any)[col.key]}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </StyledTable>
      )}
    </TableContainer>
  );
}
