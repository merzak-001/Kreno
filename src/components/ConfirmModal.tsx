'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningNote?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  warningNote,
  confirmText = 'Confirmer la suppression',
  cancelText = 'Annuler',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header with warning icon */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            danger 
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Note Callout */}
        {warningNote && (
          <div className="mx-6 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{warningNote}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 pt-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2 ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
