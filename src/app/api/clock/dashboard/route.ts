import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { ClockUseCases } from '@/useCases/ClockUseCases';

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('admin');
    const stats = await ClockUseCases.getDashboardStats(actor.id);
    return apiResponse(stats);
  } catch (error) {
    return apiError(error);
  }
}
