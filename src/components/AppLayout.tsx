'use client';

import React, { useState, Suspense } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { RegisterModal } from '@/components/RegisterModal';
import { CandidateAvailabilityModal } from '@/components/CandidateAvailabilityModal';
import { useKreno } from '@/context/KrenoContext';
import { Student } from '@/types/kreno';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newlyCreatedStudent, setNewlyCreatedStudent] = useState<Student | null>(null);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const { addStudent } = useKreno();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex antialiased transition-colors">
      {/* 1. Left Sidebar - 64 (16rem = 256px) on laptop screens (lg/xl), 72 on large desktop (2xl), drawer on mobile */}
      <Suspense fallback={<div className="hidden lg:block w-64 2xl:w-72 bg-slate-900 h-screen fixed left-0 top-0" />}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </Suspense>

      {/* 2. Main Content offset by responsive sidebar width, taking 100% full width with responsive padding */}
      <div className="flex-1 lg:ml-64 2xl:ml-72 flex flex-col min-w-0 w-full overflow-x-hidden">
        <Header onOpenRegister={() => setIsRegisterOpen(true)} onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0 w-full">
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
          const created = addStudent(data);
          // Directly prompt for student weekly availability to dispatch the 30 hours
          setNewlyCreatedStudent(created);
          setIsAvailabilityOpen(true);
        }}
      />

      {/* Post-Creation Availability & 30-Hour Auto-Scheduler Modal */}
      <CandidateAvailabilityModal
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        student={newlyCreatedStudent}
      />
    </div>
  );
}
