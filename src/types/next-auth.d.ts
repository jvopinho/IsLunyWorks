import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: {
        id: string;
        name: string;
        permissions: string[]; // list of permission keys, e.g., ["clock.register", "users.view"]
      };
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  }
}
