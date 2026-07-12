import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { DashboardUseCases } from '@/useCases/DashboardUseCases';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('admin');
    const chartsData = await DashboardUseCases.getChartsData();
    return apiResponse(chartsData);
  } catch (error) {
    return apiError(error);
  }
}
