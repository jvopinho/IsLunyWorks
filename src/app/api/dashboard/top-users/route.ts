import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { DashboardUseCases } from '@/useCases/DashboardUseCases';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('admin');
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const topUsers = await DashboardUseCases.getTopUsers(days);
    return apiResponse(topUsers);
  } catch (error) {
    return apiError(error);
  }
}
