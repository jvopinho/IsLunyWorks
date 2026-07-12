import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { ClockUseCases } from '@/useCases/ClockUseCases';
import { registerClockSchema } from '@/validations/clock';

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission();
    const status = await ClockUseCases.getStatus(actor.id);
    return apiResponse(status);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('clock.register');
    const body = await request.json().catch(() => ({}));
    const data = registerClockSchema.parse(body);

    const record = await ClockUseCases.registerClock(actor.id, data);
    return apiResponse(record);
  } catch (error) {
    return apiError(error);
  }
}
