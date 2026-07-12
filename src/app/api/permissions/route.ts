import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { PermissionUseCases } from '@/useCases/PermissionUseCases';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('permissions.view');
    const permissions = await PermissionUseCases.listPermissions();
    return apiResponse(permissions);
  } catch (error) {
    return apiError(error);
  }
}
