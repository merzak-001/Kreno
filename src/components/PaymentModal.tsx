'use client';

import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, Receipt, FileText, CheckCircle2 } from 'lucide-react';
import { Student } from '@/types/kreno';
import { useKreno } from '@/context/KrenoContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess?: () => void;
}

export function PaymentModal({ isOpen, onClose, student, onSuccess }: PaymentModalProps) {
  const { addPayment } = useKreno();

  const [amount, setAmount] = useState<number>(10000);
  const [date, setDate] = useState<string>('2026-11-21');
  const [type, setType] = useState<'installment' | 'exam_fee' | 'initial_deposit'>('installment');
  const [method, setMethod] = useState<'especes' | 'virement' | 'cheque'>('especes');
  const [receiptNumber, setReceiptNumber] = useState<string>(`REC-${Math.floor(100 + Math.random() * 900)}`);
  const [notes, setNotes] = useState<string>('');

  useEscapeKey(isOpen, onClose);

  if (!isOpen || !student) return null;

  const currentPaid = student.amount_paid || 0;
  const totalPrice = student.total_package_price || 0;
  const remainingBefore = Math.max(0, totalPrice - currentPaid);
  const remainingAfter = Math.max(0, remainingBefore - (type === 'installment' ? amount : 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addPayment(student.id, {
      student_id: student.id,
      amount: Number(amount),
      date,
      type,
      method,
      receipt_number: receiptNumber,
      notes: notes || (type === 'installment' ? 'Versement tranche formation' : 'Paiement frais d\'examen'),
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl border border-border-subtle overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary border border-primary-subtle-border flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                Encaisser un Versement / Règlement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidat: <strong className="text-slate-800 dark:text-slate-200">{student.first_name} {student.last_name}</strong> ({student.dossier_number})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Recap Box */}
        <div className="p-6 pb-2 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-border-subtle grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Total Forfait</span>
              <strong className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200">{totalPrice.toLocaleString()} DZD</strong>
            </div>
            <div>
              <span className="text-[10px] text-primary uppercase font-semibold block">Déjà Encaissé</span>
              <strong className="text-xs font-mono font-bold text-primary">{currentPaid.toLocaleString()} DZD</strong>
            </div>
            <div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold block">Reste Dû</span>
              <strong className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{remainingBefore.toLocaleString()} DZD</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Payment Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Type de versement:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('installment');
                    if (remainingBefore > 0 && amount > remainingBefore) setAmount(remainingBefore);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    type === 'installment'
                      ? 'bg-primary-subtle border-primary text-primary ring-1 ring-primary/20'
                      : 'bg-surface border-border-subtle text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Tranche Forfait
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('exam_fee');
                    setAmount(2000);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    type === 'exam_fee'
                      ? 'bg-primary-subtle border-primary text-primary ring-1 ring-primary/20'
                      : 'bg-surface border-border-subtle text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Frais d&apos;Examen (2000)
                </button>
                <button
                  type="button"
                  onClick={() => setType('initial_deposit')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    type === 'initial_deposit'
                      ? 'bg-primary-subtle border-primary text-primary ring-1 ring-primary/20'
                      : 'bg-surface border-border-subtle text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Acompte
                </button>
              </div>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Montant à encaisser (DZD):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-3 pr-12 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DZD</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date d&apos;encaissement:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl font-mono text-xs font-medium text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Payment Method & Receipt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mode de règlement:
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl text-xs font-medium text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                >
                  <option value="especes">Espèces (Cash)</option>
                  <option value="virement">Virement bancaire / CCP</option>
                  <option value="cheque">Chèque bancaire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  N° de Reçu / Bon de caisse:
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl font-mono text-xs font-medium text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  placeholder="ex: REC-542"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Observations / Motif (facultatif):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: 2ème versement avant examen de créneau"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border-subtle rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Dynamic Forecast info */}
            {type === 'installment' && (
              <div className="p-3 bg-primary-subtle rounded-xl border border-primary-subtle-border text-xs text-primary dark:text-blue-300 flex items-center justify-between">
                <span>Nouveau solde restant après encaissement :</span>
                <strong className="font-mono text-sm font-bold">{remainingAfter.toLocaleString()} DZD</strong>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border-subtle text-slate-600 dark:text-slate-400 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Valider l&apos;encaissement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
