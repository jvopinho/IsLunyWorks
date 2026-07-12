import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/utils/rbac';
import { ZodError } from 'zod';

export async function getAuthenticatedSession() {
  return getServerSession(authOptions);
}

export function apiResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
  console.error('[API ERROR]', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Erro de validação',
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : 'Erro interno do servidor';
  
  let status = 500;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('não encontrado') || msg.includes('not found')) {
      status = 404;
    } else if (
      msg.includes('negado') || 
      msg.includes('insuficiente') || 
      msg.includes('permissão') ||
      msg.includes('acesso')
    ) {
      status = 403;
    } else if (msg.includes('autenticado') || msg.includes('login')) {
      status = 401;
    } else if (
      msg.includes('já cadastrado') || 
      msg.includes('já existe') || 
      msg.includes('inválido') || 
      msg.includes('obrigatório') ||
      msg.includes('impedir') ||
      msg.includes('consecutivas') ||
      msg.includes('sem entrada')
    ) {
      status = 400;
    }
  }

  return NextResponse.json({ error: message }, { status });
}

export async function checkAuthAndPermission(permissionKey?: string) {
  const session = await getAuthenticatedSession();
  
  if (!session || !session.user) {
    const err = new Error('Não autenticado. Por favor, faça login.');
    throw err;
  }

  if (permissionKey && !hasPermission(session.user, permissionKey)) {
    const err = new Error('Acesso negado. Você não possui permissão para executar esta ação.');
    throw err;
  }

  return session.user;
}
