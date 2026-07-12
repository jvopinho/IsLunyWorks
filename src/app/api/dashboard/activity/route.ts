import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { DashboardUseCases } from '@/useCases/DashboardUseCases';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('admin');
    const activity = await DashboardUseCases.getActivityTimeline();
    return apiResponse(activity);
  } catch (error) {
    return apiError(error);
  }
}
