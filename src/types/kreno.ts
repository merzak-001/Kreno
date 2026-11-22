export type UserRole = 'owner' | 'secretary';
export type ThemeMode = 'light' | 'dark';

export type LicenseCategory = 
  | 'A1' | 'A' | 'B' | 'BE' 
  | 'C1' | 'C1E' | 'C' | 'CE' 
  | 'D' | 'DE' | 'F';

export type ExamType = 'code' | 'creneau' | 'circulation';
export type ExamResult = 'pending' | 'passed' | 'failed' | 'absent_excused' | 'absent_unexcused';

export interface ExamRecord {
  id: string;
  student_id: string;
  exam_type: ExamType;
  attempt_number: number;
  exam_date?: string;
  examiner_name?: string;
  exam_center?: string;
  result: ExamResult;
  fee_amount: number;      // Droits d'examen payables à chaque passage (ex: 2000 DZD)
  fee_paid: boolean;       // Statut de paiement des frais d'examen
  notes?: string;
}

export interface ExamSessionCandidateSelection {
  student_id: string;
  exam_type: ExamType;
  fee_amount: number;
  fee_paid: boolean;
}

export interface PaymentRecord {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  type: 'initial_deposit' | 'installment' | 'exam_fee';
  method: 'especes' | 'virement' | 'cheque';
  receipt_number?: string;
  notes?: string;
}

export interface ScheduleSlot {
  id: string;
  student_id: string;
  student_name: string;
  category: LicenseCategory;
  date: string;         // YYYY-MM-DD
  time_start: string;   // e.g. "08:00"
  time_end: string;     // e.g. "09:00" (1-hour unit)
  type: 'code' | 'creneau' | 'circulation';
  instructor_name: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface UnavailablePeriod {
  id: string;
  date: string;
  period: 'full_day' | 'morning' | 'afternoon';
  reason: string;
}

export interface SchoolSettings {
  working_days: DayOfWeek[];          // Par défaut: Samedi au Jeudi
  start_hour: string;                 // Par défaut: "08:00"
  end_hour: string;                   // Par défaut: "17:00"
  slot_duration_hours: number;        // Par défaut: 1 (unité de 1 heure)
  lunch_break_start: string;          // Par défaut: "12:00"
  lunch_break_end: string;            // Par défaut: "13:00"
  standard_exam_fee: number;          // Par défaut: 2000 DZD
  unavailable_periods: UnavailablePeriod[];
}

export interface Student {
  id: string;
  school_id: string;
  dossier_number: string;
  registration_number?: string;
  deposit_date: string;
  
  // Identification
  nin: string;
  blood_type?: string;
  first_name: string;
  last_name: string;
  first_name_ar?: string;
  last_name_ar?: string;
  gender: 'Homme' | 'Femme';
  birth_date: string;
  birth_commune?: string;
  birth_wilaya?: string;
  
  // Family
  father_name?: string;
  mother_full_name?: string;
  marital_status: 'Celibataire' | 'Marie' | 'Divorce' | 'Veuf';
  
  // Contact
  address_wilaya?: string;
  address_commune?: string;
  address_details?: string;
  phone_number: string;
  email?: string;
  
  // Course & Finances
  requested_category: LicenseCategory;
  total_package_price: number;
  amount_paid: number;
  
  // Historique & Progression
  exams: ExamRecord[];
  payments: PaymentRecord[];
  schedule_slots: ScheduleSlot[];
  
  created_at?: string;
}

export interface School {
  id: string;
  name: string;
  agrement_number: string;
  agrement_date: string;
  owner_name: string;
  commercial_name: string;
  wilaya: string;
  daira: string;
  commune: string;
  address: string;
  phone: string;
  email: string;
  insurance_policy_number: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate_number: string;
  category: LicenseCategory;
  technical_control_expiry: string;
  insurance_expiry: string;
  is_active: boolean;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_role: UserRole;
  action: 'create' | 'update' | 'delete' | 'cancel_payment' | 'add_payment' | 'record_result' | 'toggle_fee' | 'create_session' | 'delete_session';
  target_type: 'candidate' | 'payment' | 'exam' | 'session' | 'schedule' | 'settings';
  target_id: string;
  target_name: string;
  details: string;
}

// Distinct, friendly modern color badge mappings matching our accessible UI tokens
export function getCategoryBadgeClass(category: LicenseCategory | string): string {
  switch (category) {
    case 'A1':
    case 'A':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50 font-semibold';
    case 'B':
      return 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 font-semibold';
    case 'BE':
      return 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50 font-semibold';
    case 'C1':
    case 'C1E':
    case 'C':
    case 'CE':
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 font-semibold';
    case 'D':
    case 'DE':
      return 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50 font-semibold';
    case 'F':
      return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 font-semibold';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-surface dark:text-slate-300 dark:border-border-subtle font-semibold';
  }
}

export function getCategoryDotClass(category: LicenseCategory | string): string {
  switch (category) {
    case 'A1':
    case 'A':
      return 'bg-indigo-500';
    case 'B':
      return 'bg-teal-500';
    case 'BE':
      return 'bg-sky-500';
    case 'C1':
    case 'C1E':
    case 'C':
    case 'CE':
      return 'bg-amber-500';
    case 'D':
    case 'DE':
      return 'bg-orange-500';
    case 'F':
      return 'bg-rose-500';
    default:
      return 'bg-slate-500';
  }
}
