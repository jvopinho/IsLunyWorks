import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { DashboardUseCases } from '@/useCases/DashboardUseCases';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('admin');
    const stats = await DashboardUseCases.getGeneralStats();
    return apiResponse(stats);
  } catch (error) {
    return apiError(error);
  }
}
