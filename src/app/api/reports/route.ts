import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { ReportUseCases } from '@/useCases/ReportUseCases';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('reports.view');
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const report = await ReportUseCases.generateReport({
      userId,
      startDate,
      endDate,
    });

    return apiResponse(report);
  } catch (error) {
    return apiError(error);
  }
}
