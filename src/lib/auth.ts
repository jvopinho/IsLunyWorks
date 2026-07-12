import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-mail e senha são obrigatórios.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error('E-mail ou senha incorretos.');
        }

        if (!user.active) {
          throw new Error('Esta conta foi desativada. Entre em contato com o administrador.');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('E-mail ou senha incorretos.');
        }

        // Format role permissions into a flat array of keys
        const permissions = user.role.permissions.map((p) => p.key);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: {
            id: user.role.id,
            name: user.role.name,
            permissions,
          },
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      // Dynamically update session permissions if requested
      if (trigger === 'update' && session?.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        });
        if (dbUser && dbUser.active) {
          token.role = {
            id: dbUser.role.id,
            name: dbUser.role.name,
            permissions: dbUser.role.permissions.map((p) => p.key),
          };
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
