import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { RoleUseCases } from '@/useCases/RoleUseCases';
import { createRoleSchema } from '@/validations/role';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('roles.view');
    const roles = await RoleUseCases.listRoles();
    return apiResponse(roles);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('roles.create');
    const body = await request.json();
    const data = createRoleSchema.parse(body);

    const role = await RoleUseCases.createRole(actor.id, data);
    return apiResponse(role, 201);
  } catch (error) {
    return apiError(error);
  }
}
