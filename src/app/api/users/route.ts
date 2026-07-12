import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { UserUseCases } from '@/useCases/UserUseCases';
import { createUserSchema } from '@/validations/user';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('users.view');
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const activeStr = searchParams.get('active');
    const active = activeStr === 'true' ? true : activeStr === 'false' ? false : undefined;

    const users = await UserUseCases.listUsers({ search, active });
    return apiResponse(users);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('users.create');
    const body = await request.json();
    const data = createUserSchema.parse(body);

    const user = await UserUseCases.createUser(actor.id, data);
    return apiResponse(user, 201);
  } catch (error) {
    return apiError(error);
  }
}
