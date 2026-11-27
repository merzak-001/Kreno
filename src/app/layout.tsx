import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { KrenoProvider } from '@/context/KrenoContext';
import { AppLayout } from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'Kreno - Logiciel de Gestion des Auto-Écoles',
  description: 'Solution complète pour la gestion des candidats, planning et examens de conduite',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-[var(--foreground)]">
        <KrenoProvider>
          <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <AppLayout>
              {children}
            </AppLayout>
          </Suspense>
        </KrenoProvider>
      </body>
    </html>
  );
}
