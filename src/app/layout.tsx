import type { Metadata } from 'next';
import AppProviders from '@/providers/AppProviders';

export const metadata: Metadata = {
  title: 'IsLuny Works',
  description: 'Plataforma corporativa de gestão integrada - IsLuny Org',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
