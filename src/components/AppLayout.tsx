'use client';

import React, { useState, Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { RegisterModal } from '@/components/RegisterModal';
import { useKreno } from '@/context/KrenoContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const { addStudent } = useKreno();

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex antialiased transition-colors">
      {/* 1. Left Sidebar strictly on the left */}
      <Suspense fallback={<div className="w-72 bg-slate-900 h-screen fixed left-0 top-0" />}>
        <Sidebar />
      </Suspense>

      {/* 2. Main Content offset by sidebar width (w-72 = 18rem = 288px) */}
      <div className="flex-1 ml-72 flex flex-col min-w-0">
        <Header onOpenRegister={() => setIsRegisterOpen(true)} />
        <main className="p-8 flex-1 min-w-0">
          <Suspense fallback={<div className="p-8 text-xs text-slate-400">Chargement de la page...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Quick Register Modal */}
      <RegisterModal 
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSaveStudent={(data) => {
          addStudent(data);
        }}
      />
    </div>
  );
}
