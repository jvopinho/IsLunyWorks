'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { usePermission } from '@/hooks/usePermission';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table, Column } from '@/components/Table';
import { Modal } from '@/components/Modal';
import { formatDateTime, formatMinutes } from '@/utils/date';
import { Filter, RefreshCw, FileSpreadsheet, ChevronLeft, ChevronRight, History } from 'lucide-react';
import {
  FilterCard,
  FilterGrid,
  FormGroup,
  ActionsRow,
  PaginationWrapper,
  PageBtnRow,
  DiffGrid,
  DiffColumn,
  DiffItem,
  DetailRow,
} from './styles';

export default function AuditPage() {
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [filterActor, setFilterActor] = useState('');
  const [filterTarget, setFilterTarget] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [searchText, setSearchText] = useState('');
  const [adminOnly, setAdminOnly] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<any>({
    userId: '',
    targetUserId: '',
    action: '',
    module: '',
    category: '',
    startDate: '',
    endDate: '',
    searchText: '',
    adminOnly: false,
  });

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['usersForAuditFilters'],
    queryFn: async () => {
      const res = await axios.get('/api/users');
      return res.data;
    },
  });

  const { data: auditData, isLoading } = useQuery<any>({
    queryKey: ['auditLogs', page, appliedFilters],
    queryFn: async () => {
      let url = `/api/audit?page=${page}&limit=15&`;
      const { userId, targetUserId, action, module, category, startDate, endDate, searchText, adminOnly } = appliedFilters;
      
      if (userId) url += `userId=${userId}&`;
      if (targetUserId) url += `targetUserId=${targetUserId}&`;
      if (action) url += `action=${action}&`;
      if (module) url += `module=${module}&`;
      if (category) url += `category=${category}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (searchText) url += `searchText=${searchText}&`;
      if (adminOnly) url += `adminOnly=true&`;

      const res = await axios.get(url);
      return res.data;
    },
  });

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      userId: filterActor,
      targetUserId: filterTarget,
      module: filterModule,
      category: filterCategory,
      startDate: filterStart,
      endDate: filterEnd,
      searchText,
      adminOnly,
    });
  };

  const handleClearFilters = () => {
    setFilterActor('');
    setFilterTarget('');
    setFilterModule('');
    setFilterCategory('');
    setFilterStart('');
    setFilterEnd('');
    setSearchText('');
    setAdminOnly(false);
    setPage(1);
    setAppliedFilters({
      userId: '',
      targetUserId: '',
      module: '',
      category: '',
      startDate: '',
      endDate: '',
      searchText: '',
      adminOnly: false,
    });
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get('/api/audit/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'isluny-works-auditoria.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erro ao exportar logs de auditoria');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenDetails = (log: any) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedLog(null);
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return 'Não informado';
    const uaLower = ua.toLowerCase();
    
    let os = 'Outro';
    if (uaLower.includes('windows')) os = 'Windows';
    else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) os = 'macOS';
    else if (uaLower.includes('linux')) os = 'Linux';
    else if (uaLower.includes('android')) os = 'Android';
    else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS';

    let browser = 'Outro';
    if (uaLower.includes('firefox')) browser = 'Firefox';
    else if (uaLower.includes('chrome')) browser = 'Chrome';
    else if (uaLower.includes('safari')) browser = 'Safari';
    else if (uaLower.includes('edge')) browser = 'Edge';
    
    return `${browser} no ${os}`;
  };

  const getLogDiff = (log: any) => {
    if (!log.details) return null;
    try {
      const parsed = JSON.parse(log.details);
      const prev = parsed.previous;
      const curr = parsed.current;
      
      if (!prev || !curr) return null;

      const prevItems: any[] = [];
      const currItems: any[] = [];

      Object.keys({ ...prev, ...curr }).forEach((key) => {
        if (prev[key] !== curr[key]) {
          const valPrev = prev[key] === null ? 'null' : typeof prev[key] === 'object' ? JSON.stringify(prev[key]) : String(prev[key]);
          const valCurr = curr[key] === null ? 'null' : typeof curr[key] === 'object' ? JSON.stringify(curr[key]) : String(curr[key]);
          
          prevItems.push({ key, val: valPrev });
          currItems.push({ key, val: valCurr });
        }
      });

      return { prevItems, currItems };
    } catch {
      return null;
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Data e Hora',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'actor',
      header: 'Usuário',
      render: (row) => row.actor ? `${row.actor.name} (${row.actor.email})` : 'Sistema',
    },
    {
      key: 'label',
      header: 'Ação',
    },
    {
      key: 'module',
      header: 'Módulo',
    },
    {
      key: 'category',
      header: 'Categoria',
    },
    {
      key: 'ipAddress',
      header: 'Endereço IP',
      render: (row) => row.ipAddress || '-',
    },
    {
      key: 'actions',
      header: 'Visualizar',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => handleOpenDetails(row)}>
          Detalhes
        </Button>
      ),
    },
  ];

  const logsList = auditData?.logs || [];
  const pagination = auditData?.pagination || { page: 1, pages: 1, total: 0 };
  const diffData = selectedLog ? getLogDiff(selectedLog) : null;

  return (
    <DashboardLayout title="Logs de Auditoria">
      <Breadcrumbs items={[{ label: 'Home', href: '/dashboard' }, { label: 'Audit Logs' }]} />

      <FilterCard>
        <FilterGrid>
          <FormGroup>
            <label htmlFor="actor">Autor</label>
            <select id="actor" value={filterActor} onChange={(e) => setFilterActor(e.target.value)}>
              <option value="">Todos os autores</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label htmlFor="target">Alvo / Afetado</label>
            <select id="target" value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)}>
              <option value="">Todos os alvos</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup>
            <label htmlFor="module">Módulo</label>
            <select id="module" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
              <option value="">Todos os módulos</option>
              <option value="Gestão">Gestão</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Autenticação">Autenticação</option>
              <option value="Sistema">Sistema</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label htmlFor="category">Categoria</label>
            <select id="category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">Todas as categorias</option>
              <option value="Colaboradores">Colaboradores</option>
              <option value="Cargos">Cargos</option>
              <option value="Permissões">Permissões</option>
              <option value="Controle de Ponto">Controle de Ponto</option>
              <option value="Acesso">Acesso</option>
              <option value="Exportações">Exportações</option>
            </select>
          </FormGroup>

          <FormGroup>
            <label htmlFor="searchText">Pesquisa Livre</label>
            <input
              type="text"
              id="searchText"
              placeholder="IP, navegador, ação, entidade..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <label htmlFor="startDate">Data Inicial</label>
            <input type="date" id="startDate" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
          </FormGroup>

          <FormGroup>
            <label htmlFor="endDate">Data Final</label>
            <input type="date" id="endDate" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
          </FormGroup>

          <FormGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem' }}>
            <input
              type="checkbox"
              id="adminOnly"
              checked={adminOnly}
              onChange={(e) => setAdminOnly(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="adminOnly" style={{ cursor: 'pointer', userSelect: 'none' }}>Ações Admins</label>
          </FormGroup>

          <ActionsRow>
            <Button variant="primary" onClick={handleApplyFilters}>
              Filtrar <Filter size={16} style={{ marginLeft: '6px' }} />
            </Button>
            <Button variant="secondary" onClick={handleClearFilters}>
              Limpar <RefreshCw size={16} style={{ marginLeft: '6px' }} />
            </Button>
            {can('audit.export') && (
              <Button variant="success" onClick={handleExportExcel} isLoading={isExporting}>
                Exportar Excel <FileSpreadsheet size={16} style={{ marginLeft: '6px' }} />
              </Button>
            )}
          </ActionsRow>
        </FilterGrid>
      </FilterCard>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} />
            <span>Logs do Sistema</span>
          </div>
        }
        description="Linha do tempo paginada e rastreável de todas as modificações no banco de dados"
      >
        {isLoading ? (
          <div>Carregando auditoria...</div>
        ) : (
          <>
            <Table columns={columns} data={logsList} emptyMessage="Nenhum log de auditoria encontrado." />
            
            <PaginationWrapper>
              <span>Exibindo total de {pagination.total} registros</span>
              <PageBtnRow>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Anterior
                </Button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page === pagination.pages}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                >
                  Próxima <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                </Button>
              </PageBtnRow>
            </PaginationWrapper>
          </>
        )}
      </Card>

      <Modal isOpen={isDetailsOpen} onClose={handleCloseDetails} title="Detalhes do Log de Auditoria">
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <DetailRow>
              <div className="label">Autor</div>
              <div className="value">{selectedLog.actor ? `${selectedLog.actor.name} (${selectedLog.actor.email})` : 'Sistema'}</div>
            </DetailRow>
            <DetailRow>
              <div className="label">Data / Hora</div>
              <div className="value">{formatDateTime(selectedLog.createdAt)}</div>
            </DetailRow>
            <DetailRow>
              <div className="label">Módulo / Categoria</div>
              <div className="value">{selectedLog.module} ➔ {selectedLog.category}</div>
            </DetailRow>
            <DetailRow>
              <div className="label">Ação Executada</div>
              <div className="value"><strong>{selectedLog.label}</strong> ({selectedLog.action})</div>
            </DetailRow>
            <DetailRow>
              <div className="label">Entidade / ID</div>
              <div className="value">{selectedLog.entity} ({selectedLog.entityId || '-'})</div>
            </DetailRow>
            <DetailRow>
              <div className="label">Descrição da Ação</div>
              <div className="value">{selectedLog.description}</div>
            </DetailRow>
            {selectedLog.reason && (
              <DetailRow>
                <div className="label" style={{ color: '#ef4444' }}>Motivo Justificado</div>
                <div className="value" style={{ fontWeight: 600 }}>{selectedLog.reason}</div>
              </DetailRow>
            )}
            <DetailRow>
              <div className="label">Endereço IP</div>
              <div className="value">{selectedLog.ipAddress || 'Não disponível'}</div>
            </DetailRow>
            <DetailRow>
              <div className="label">Navegador / OS</div>
              <div className="value">{parseUserAgent(selectedLog.userAgent)}</div>
            </DetailRow>

            {diffData && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a', display: 'block' }}>
                  🔍 Comparação de Dados Modificados
                </strong>
                <DiffGrid>
                  <DiffColumn variant="prev">
                    <h5>Antes (Valor Original)</h5>
                    {diffData.prevItems.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>(Sem alterações)</div>
                    ) : (
                      diffData.prevItems.map((item) => (
                        <DiffItem key={item.key}>
                          <strong>{item.key}:</strong> {item.val}
                        </DiffItem>
                      ))
                    )}
                  </DiffColumn>
                  <DiffColumn variant="curr">
                    <h5>Depois (Novo Valor)</h5>
                    {diffData.currItems.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: '#166534' }}>(Sem alterações)</div>
                    ) : (
                      diffData.currItems.map((item) => (
                        <DiffItem key={item.key}>
                          <strong>{item.key}:</strong> {item.val}
                        </DiffItem>
                      ))
                    )}
                  </DiffColumn>
                </DiffGrid>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
