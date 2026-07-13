import React from 'react';
import { PaginationContainer, PageButton, InfoText, LimitSelect } from './styles';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <PaginationContainer>
      <InfoText>
        Exibindo <strong>{startRecord}-{endRecord}</strong> de <strong>{totalRecords}</strong> registros
      </InfoText>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Itens por página:</span>
            <LimitSelect value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </LimitSelect>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <PageButton
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Anterior
          </PageButton>
          
          {getPageNumbers().map((p) => (
            <PageButton
              key={p}
              $active={p === currentPage}
              onClick={() => onPageChange(p)}
            >
              {p}
            </PageButton>
          ))}

          <PageButton
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Próximo
          </PageButton>
        </div>
      </div>
    </PaginationContainer>
  );
}
