import { useSession } from 'next-auth/react';
  import { hasPermission } from '@/utils/rbac';

  export function usePermission() {
    const { data: session, status } = useSession();
    
    const can = (permissionKey: string) => {
      if (!session || !session.user) return false;
      return hasPermission(session.user, permissionKey);
    };

    return {
      can,
      user: session?.user,
      role: session?.user?.role,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
    };
  }
