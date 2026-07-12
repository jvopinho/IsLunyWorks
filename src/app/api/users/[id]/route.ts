import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { UserUseCases } from '@/useCases/UserUseCases';
import { updateUserSchema } from '@/validations/user';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await checkAuthAndPermission('users.view');
    const { id } = await params;
    const user = await UserUseCases.getUser(id);
    return apiResponse(user);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await checkAuthAndPermission('users.update');
    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const user = await UserUseCases.updateUser(actor.id, id, data);
    return apiResponse(user);
  } catch (error) {
    return apiError(error);
  }
}
