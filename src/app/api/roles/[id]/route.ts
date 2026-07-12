import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { RoleUseCases } from '@/useCases/RoleUseCases';
import { updateRoleSchema } from '@/validations/role';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await checkAuthAndPermission('roles.view');
    const { id } = await params;
    const role = await RoleUseCases.getRole(id);
    return apiResponse(role);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await checkAuthAndPermission('roles.update');
    const { id } = await params;
    const body = await request.json();
    const data = updateRoleSchema.parse(body);

    const role = await RoleUseCases.updateRole(actor.id, id, data);
    return apiResponse(role);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await checkAuthAndPermission('roles.delete');
    const { id } = await params;

    const result = await RoleUseCases.deleteRole(actor.id, id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
