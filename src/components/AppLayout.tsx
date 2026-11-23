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
  const [newlyCreatedStudent, setNewlyCreatedStudent] = useState<Student | null>(null);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const { addStudent } = useKreno();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex antialiased transition-colors">
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
