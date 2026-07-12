import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/utils/rbac';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Type casting token to UserSessionPayload structure
    const userPayload = token ? {
      id: token.id as string,
      role: token.role as any,
    } : null;

    if (path.startsWith('/users') && !hasPermission(userPayload, 'users.view')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (path.startsWith('/roles') && !hasPermission(userPayload, 'roles.view')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (path.startsWith('/reports') && !hasPermission(userPayload, 'reports.view')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (path.startsWith('/permissions') && !hasPermission(userPayload, 'permissions.view')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (path.startsWith('/clock') && !hasPermission(userPayload, 'clock.register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/roles/:path*',
    '/permissions/:path*',
    '/reports/:path*',
    '/clock/:path*',
  ],
};
