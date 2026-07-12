export interface AuditActionMapping {
  action: string;
  label: string;
  module: string;
  category: string;
  description: string;
}

export const AUDIT_MAPPINGS: Record<string, { label: string; module: string; category: string; description: string }> = {
  CREATE_USER: { label: 'Cadastro de Colaborador', module: 'Gestão', category: 'Colaboradores', description: 'Cadastrou um novo colaborador no sistema' },
  UPDATE_USER: { label: 'Atualização de Colaborador', module: 'Gestão', category: 'Colaboradores', description: 'Atualizou dados cadastrais de um colaborador' },
  CREATE_ROLE: { label: 'Criação de Cargo', module: 'Gestão', category: 'Cargos', description: 'Criou um novo cargo e permissões' },
  UPDATE_ROLE: { label: 'Edição de Cargo', module: 'Gestão', category: 'Cargos', description: 'Atualizou as permissões e chaves de acesso de um cargo' },
  DELETE_ROLE: { label: 'Exclusão de Cargo', module: 'Gestão', category: 'Cargos', description: 'Excluiu um cargo do sistema' },
  'clock.record.updated': { label: 'Edição de Ponto', module: 'Recursos Humanos', category: 'Controle de Ponto', description: 'Alterou e corrigiu o registro de ponto de um colaborador' },
  CLOCK_IN: { label: 'Registro de Entrada', module: 'Recursos Humanos', category: 'Controle de Ponto', description: 'Realizou a batida de entrada (Clock In)' },
  CLOCK_OUT: { label: 'Registro de Saída', module: 'Recursos Humanos', category: 'Controle de Ponto', description: 'Realizou a batida de saída (Clock Out)' },
  LOGIN: { label: 'Login de Usuário', module: 'Autenticação', category: 'Acesso', description: 'Realizou login na plataforma IsLuny Works' },
  LOGOUT: { label: 'Logout de Usuário', module: 'Autenticação', category: 'Acesso', description: 'Realizou logout da plataforma IsLuny Works' },
  EXPORT_REPORTS: { label: 'Exportação de Relatório', module: 'Sistema', category: 'Exportações', description: 'Exportou o relatório consolidado de ponto para Excel' },
  EXPORT_USERS: { label: 'Exportação de Usuários', module: 'Sistema', category: 'Exportações', description: 'Exportou a listagem de colaboradores para Excel' },
  EXPORT_CLOCK: { label: 'Exportação Pessoal de Ponto', module: 'Sistema', category: 'Exportações', description: 'Exportou espelho de ponto pessoal para Excel' },
  EXPORT_AUDIT_LOGS: { label: 'Exportação de Auditoria', module: 'Sistema', category: 'Exportações', description: 'Exportou os logs de auditoria do sistema para Excel' },
};

export function getAuditMapping(action: string): AuditActionMapping {
  const mapped = AUDIT_MAPPINGS[action] || {
    label: action,
    module: 'Sistema',
    category: 'Geral',
    description: action,
  };
  return { action, ...mapped };
}
