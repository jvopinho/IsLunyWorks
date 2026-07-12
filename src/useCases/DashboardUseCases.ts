import { DashboardRepository } from '@/repositories/DashboardRepository';

const ACTION_MAP: Record<string, string> = {
  CREATE_USER: 'Cadastrou um novo colaborador',
  UPDATE_USER: 'Atualizou dados de um colaborador',
  CREATE_ROLE: 'Criou um novo cargo',
  UPDATE_ROLE: 'Atualizou as configurações de um cargo',
  DELETE_ROLE: 'Excluiu um cargo do sistema',
  CLOCK_IN: 'Registrou entrada (Clock In)',
  CLOCK_OUT: 'Registrou saída (Clock Out)',
  LOGIN: 'Realizou login na plataforma',
  LOGOUT: 'Realizou logout da plataforma',
};

export class DashboardUseCases {
  static async getGeneralStats() {
    return DashboardRepository.getGeneralStats();
  }

  static async getChartsData() {
    const hoursAndRecords = await DashboardRepository.getHoursAndRecordsChartData();
    const rolesDistribution = await DashboardRepository.getRolesChartData();
    const usersGrowth = await DashboardRepository.getUsersGrowthData();

    return {
      hoursAndRecords,
      rolesDistribution,
      usersGrowth,
    };
  }

  static async getTopUsers(days: number) {
    const validDays = [7, 30, 90].includes(days) ? days : 30;
    return DashboardRepository.getTopUsersHoursData(validDays);
  }

  static async getActivityTimeline() {
    const logs = await DashboardRepository.getActivityTimeline();
    return logs.map((log) => ({
      id: log.id,
      userName: log.user?.name || 'Sistema',
      userEmail: log.user?.email || '',
      action: ACTION_MAP[log.action] || log.action,
      entity: log.entity,
      entityId: log.entityId,
      createdAt: log.createdAt,
    }));
  }
}
