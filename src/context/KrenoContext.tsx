'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Student, 
  School, 
  Vehicle, 
  UserRole, 
  ThemeMode,
  SchoolSettings, 
  ScheduleSlot,
  ExamType, 
  ExamResult,
  ExamRecord,
  PaymentRecord,
  UnavailablePeriod,
  ExamSessionCandidateSelection,
  AuditLogEntry,
  Ingenieur,
  ExamCenter,
  DayOfWeek
} from '@/types/kreno';

export type ColorPalette = 'ocean' | 'warm';

interface KrenoContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
  lang: 'fr' | 'ar';
  setLang: (lang: 'fr' | 'ar') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  school: School;
  setSchool: React.Dispatch<React.SetStateAction<School>>;
  students: Student[];
  vehicles: Vehicle[];
  addVehicle: (vehicleData: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, updated: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  addUnavailablePeriod: (period: Omit<UnavailablePeriod, 'id'>) => void;
  removeUnavailablePeriod: (id: string) => void;
  addStudent: (studentData: Omit<Student, 'id' | 'exams' | 'schedule_slots' | 'payments'>) => Student;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (studentId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  deletePayment: (studentId: string, paymentId: string) => void;
  deleteExamRecord: (studentId: string, examId: string) => void;
  deleteExamSession: (sessionDate: string) => void;
  deleteScheduleSlot: (studentId: string, slotId: string) => void;
  updateScheduleSlot: (studentId: string, slotId: string, updated: Partial<ScheduleSlot>) => void;
  programExam: (
    studentId: string, 
    examType: ExamType, 
    examDate: string, 
    examCenter: string, 
    feeAmount: number, 
    feePaid: boolean,
    examinerName?: string
  ) => void;
  recordExamResult: (
    studentId: string, 
    examType: ExamType, 
    result: ExamResult, 
    date: string, 
    examiner: string, 
    notes?: string
  ) => void;
  createExamDaySession: (
    date: string,
    center: string,
    examiner: string,
    candidates: ExamSessionCandidateSelection[]
  ) => void;
  updateExamSession: (
    originalDate: string,
    newDate: string,
    newCenter: string,
    newExaminer: string,
    candidates: ExamSessionCandidateSelection[]
  ) => void;
  updateExamResultById: (
    studentId: string,
    examId: string,
    result: ExamResult
  ) => void;
  toggleExamFeePayment: (
    studentId: string,
    examId: string,
    feePaid: boolean
  ) => void;
  generateScheduleForStudent: (
    student: Student, 
    preferredDays?: DayOfWeek[], 
    preferredTime?: 'morning' | 'afternoon' | 'any',
    startDate?: string
  ) => ScheduleSlot[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  auditLogs: AuditLogEntry[];
  engineers: Ingenieur[];
  addEngineer: (name: string, title?: string, phone?: string) => Ingenieur;
  examCenters: ExamCenter[];
  addExamCenter: (name: string, commune?: string) => ExamCenter;
  logAction: (
    action: AuditLogEntry['action'],
    target_type: AuditLogEntry['target_type'],
    target_id: string,
    target_name: string,
    details: string
  ) => void;
}

const DEFAULT_SCHOOL: School = {
  id: 'school-1',
  name: 'Auto-École Kreno',
  agrement_number: '19/2021/DZ',
  agrement_date: '2021-04-15',
  owner_name: 'Ahmed Benali',
  commercial_name: 'KRENO Formation Conduite',
  wilaya: 'Sétif',
  daira: 'Aïn Oulmene',
  commune: 'Beidha Bordj',
  address: 'Cité 20 Août, Beidha Bordj, Sétif',
  phone: '0555 12 34 56',
  email: 'contact@kreno-autoecole.dz',
  insurance_policy_number: 'POL-784521-SAA',
};

const DEFAULT_ENGINEERS: Ingenieur[] = [
  { id: 'eng-1', name: 'Ing. Makhloufi', title: 'Ingénieur Principal d\'État', phone: '0550 11 22 33', is_active: true },
  { id: 'eng-2', name: 'Ing. Benali', title: 'Ingénieur d\'État', phone: '0661 44 55 66', is_active: true },
  { id: 'eng-3', name: 'Ing. Khelifi', title: 'Ingénieur d\'État', phone: '0772 77 88 99', is_active: true },
  { id: 'eng-4', name: 'Ing. Rahmani', title: 'Ingénieur Chef de Centre', phone: '0555 88 99 00', is_active: true },
];

const DEFAULT_EXAM_CENTERS: ExamCenter[] = [
  { id: 'ctr-1', name: 'Centre d\'Examen Aïn Oulmene', commune: 'Aïn Oulmene', is_active: true },
  { id: 'ctr-2', name: 'Piste Auto-École Beidha Bordj', commune: 'Beidha Bordj', is_active: true },
  { id: 'ctr-3', name: 'Centre d\'Examen Sétif Ville', commune: 'Sétif', is_active: true },
  { id: 'ctr-4', name: 'Centre d\'Examen El Eulma', commune: 'El Eulma', is_active: true },
];

const DEFAULT_SETTINGS: SchoolSettings = {
  working_days: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'], // Samedi au Jeudi
  start_hour: '08:00',
  end_hour: '17:00',
  slot_duration_hours: 1, // 1 heure fixe par unité
  lunch_break_start: '12:00',
  lunch_break_end: '13:00',
  standard_exam_fee: 2000, // 2000 DZD par défaut
  category_exam_fees: {
    'A1': 1500,
    'A': 1500,
    'B': 2000,
    'BE': 2500,
    'C1': 2500,
    'C1E': 3000,
    'C': 3000,
    'CE': 3500,
    'D': 3500,
    'DE': 4000,
    'F': 2000,
  },
  unavailable_periods: [
    {
      id: 'un-1',
      date: '2026-11-27',
      period: 'full_day',
      reason: 'Journée d\'entretien technique des véhicules',
    }
  ],
};

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    brand: 'Renault',
    model: 'Clio 4',
    plate_number: '12456-118-19',
    category: 'B',
    technical_control_expiry: '2027-02-15',
    insurance_expiry: '2027-04-10',
    is_active: true,
  },
  {
    id: 'v2',
    brand: 'Peugeot',
    model: '208',
    plate_number: '08945-120-19',
    category: 'B',
    technical_control_expiry: '2027-06-20',
    insurance_expiry: '2027-05-18',
    is_active: true,
  },
  {
    id: 'v3',
    brand: 'Sonacome',
    model: 'K120',
    plate_number: '00412-415-19',
    category: 'C',
    technical_control_expiry: '2026-12-01',
    insurance_expiry: '2027-01-15',
    is_active: true,
  },
];

// Helper to auto-generate the 30-hour regulatory training syllabus for Algerian Driving Schools
function ensureFull30HourSlots(student: Student, offset: number = 2): ScheduleSlot[] {
  if (student.schedule_slots && student.schedule_slots.length >= 30) {
    return student.schedule_slots;
  }
  const slots: ScheduleSlot[] = [];
  const dayMap: Record<number, DayOfWeek> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
  };
  const workingDays: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const possibleHours = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  const sessionTypes: Array<'code' | 'creneau' | 'circulation'> = [
    ...Array(10).fill('code'),
    ...Array(10).fill('creneau'),
    ...Array(10).fill('circulation')
  ];

  const codePassed = (student.exams || []).some(e => e.exam_type === 'code' && e.result === 'passed');
  const creneauPassed = (student.exams || []).some(e => e.exam_type === 'creneau' && e.result === 'passed');
  const circulationPassed = (student.exams || []).some(e => e.exam_type === 'circulation' && e.result === 'passed');

  const startBase = student.deposit_date ? new Date(student.deposit_date) : new Date('2026-10-01');
  startBase.setDate(startBase.getDate() + offset);

  let current = new Date(startBase);
  let sessionIdx = 0;
  let safety = 0;

  while (sessionIdx < sessionTypes.length && safety < 140) {
    safety++;
    const dayName = dayMap[current.getDay()];
    if (workingDays.includes(dayName)) {
      const type = sessionTypes[sessionIdx];
      const timeStart = possibleHours[sessionIdx % possibleHours.length];
      const [startHourNum] = timeStart.split(':').map(Number);
      const timeEnd = (startHourNum + 1 < 10 ? '0' : '') + (startHourNum + 1) + ':00';
      const dateIso = current.toISOString().split('T')[0];

      let status: 'completed' | 'scheduled' = 'scheduled';
      if (type === 'code' && codePassed) status = 'completed';
      else if (type === 'creneau' && creneauPassed) status = 'completed';
      else if (type === 'circulation' && circulationPassed) status = 'completed';
      else if (current < new Date('2026-11-23')) {
        if (sessionIdx < 16) status = 'completed';
      }

      const typeLabel = type === 'code' ? 'Code théorique' : type === 'creneau' ? 'Créneau sur piste' : 'Circulation';
      slots.push({
        id: 'sc-' + student.id + '-' + (sessionIdx + 1),
        student_id: student.id,
        student_name: student.first_name + ' ' + student.last_name,
        category: student.requested_category,
        date: dateIso,
        time_start: timeStart,
        time_end: timeEnd,
        type: type,
        instructor_name: type === 'code' ? 'M. Amine' : type === 'creneau' ? 'M. Khaled' : 'M. Toufik',
        status: status,
        notes: 'Séance N° ' + (sessionIdx + 1) + ' / 30 (' + typeLabel + ')',
      });
      sessionIdx++;
    }
    current.setDate(current.getDate() + 1);
  }
  return slots;
}

const RAW_DEFAULT_STUDENTS: Student[] = [
  {
    id: 'st-1',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-001',
    registration_number: '19042581',
    deposit_date: '2026-10-05',
    nin: '102198901234567890',
    blood_type: 'O+',
    first_name: 'Yassine',
    last_name: 'Boussaha',
    first_name_ar: 'ياسين',
    last_name_ar: 'بوساحة',
    gender: 'Homme',
    birth_date: '2001-06-14',
    birth_commune: 'Beidha Bordj',
    birth_wilaya: 'Sétif',
    father_name: 'Omar',
    mother_full_name: 'Fatima Zerrouki',
    marital_status: 'Celibataire',
    address_wilaya: 'Sétif',
    address_commune: 'Beidha Bordj',
    address_details: 'Cité En-Nasr N° 12',
    phone_number: '0661 45 89 23',
    email: 'yassine.b@example.com',
    requested_category: 'B',
    total_package_price: 42000,
    amount_paid: 42000,
    exams: [
      {
        id: 'ex-1',
        student_id: 'st-1',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-10-25',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-2',
        student_id: 'st-1',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-10',
        exam_center: 'Piste Aïn Oulmene',
        examiner_name: 'M. Rabhi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-3',
        student_id: 'st-1',
        exam_type: 'circulation',
        attempt_number: 1,
        exam_date: '2026-11-28',
        exam_center: 'Circuit Routier Beidha Bordj',
        result: 'pending',
        fee_amount: 2000,
        fee_paid: true,
      },
    ],
    payments: [
      {
        id: 'p-1',
        student_id: 'st-1',
        amount: 20000,
        date: '2026-10-05',
        type: 'initial_deposit',
        method: 'especes',
        receipt_number: 'REC-001',
        notes: 'Versement initial à l\'inscription',
      },
      {
        id: 'p-2',
        student_id: 'st-1',
        amount: 22000,
        date: '2026-11-08',
        type: 'installment',
        method: 'especes',
        receipt_number: 'REC-014',
        notes: 'Solde complet du forfait formation',
      }
    ],
    schedule_slots: [
      {
        id: 'sc-1',
        student_id: 'st-1',
        student_name: 'Yassine Boussaha',
        category: 'B',
        date: '2026-11-22',
        time_start: '09:00',
        time_end: '10:00',
        type: 'circulation',
        instructor_name: 'M. Amine',
        status: 'scheduled',
        notes: 'Préparation examen circuit urbain',
      }
    ],
  },
  {
    id: 'st-2',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-002',
    registration_number: '19042582',
    deposit_date: '2026-10-12',
    nin: '204200201987654321',
    blood_type: 'A+',
    first_name: 'Ines',
    last_name: 'Mansouri',
    first_name_ar: 'إيناس',
    last_name_ar: 'منصوري',
    gender: 'Femme',
    birth_date: '2004-03-22',
    birth_commune: 'Aïn Oulmene',
    birth_wilaya: 'Sétif',
    father_name: 'Djamel',
    mother_full_name: 'Yamina Kadri',
    marital_status: 'Celibataire',
    address_wilaya: 'Sétif',
    address_commune: 'Aïn Oulmene',
    address_details: 'Rue 1er Novembre, Bâtiment B',
    phone_number: '0772 18 90 44',
    email: 'ines.mansouri@example.com',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 20000,
    exams: [
      {
        id: 'ex-4',
        student_id: 'st-2',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-05',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'failed',
        fee_amount: 2000,
        fee_paid: true,
        notes: 'Erreur priorité feux tricolores',
      },
      {
        id: 'ex-5',
        student_id: 'st-2',
        exam_type: 'code',
        attempt_number: 2,
        exam_date: '2026-11-20',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-6',
        student_id: 'st-2',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-12-05',
        exam_center: 'Piste Aïn Oulmene',
        result: 'pending',
        fee_amount: 2000,
        fee_paid: false, // Non payé encore
      },
    ],
    payments: [
      {
        id: 'p-3',
        student_id: 'st-2',
        amount: 20000,
        date: '2026-10-12',
        type: 'initial_deposit',
        method: 'especes',
        receipt_number: 'REC-002',
        notes: 'Premier acompte (50%)',
      }
    ],
    schedule_slots: [
      {
        id: 'sc-3',
        student_id: 'st-2',
        student_name: 'Ines Mansouri',
        category: 'B',
        date: '2026-11-23',
        time_start: '10:00',
        time_end: '11:00',
        type: 'creneau',
        instructor_name: 'M. Khaled',
        status: 'scheduled',
        notes: 'Initiation stationnement en créneau',
      }
    ],
  },
  {
    id: 'st-3',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-003',
    registration_number: '19042583',
    deposit_date: '2026-11-02',
    nin: '101199501567890123',
    blood_type: 'B+',
    first_name: 'Abderraouf',
    last_name: 'Gasmi',
    first_name_ar: 'عبد الرؤوف',
    last_name_ar: 'قاسمي',
    gender: 'Homme',
    birth_date: '1995-11-08',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    father_name: 'Slimane',
    mother_full_name: 'Aïcha Belaabed',
    marital_status: 'Marie',
    address_wilaya: 'Sétif',
    address_commune: 'Sétif',
    address_details: 'Cité El-Hidhab, Sétif',
    phone_number: '0560 33 21 88',
    email: 'abderraouf.gasmi@example.com',
    requested_category: 'C',
    total_package_price: 55000,
    amount_paid: 30000,
    exams: [
      {
        id: 'ex-7',
        student_id: 'st-3',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-18',
        exam_center: 'Centre Poids Lourd Sétif',
        examiner_name: 'M. Bouchama',
        result: 'passed',
        fee_amount: 2500,
        fee_paid: true,
      },
    ],
    payments: [
      {
        id: 'p-4',
        student_id: 'st-3',
        amount: 30000,
        date: '2026-11-02',
        type: 'initial_deposit',
        method: 'virement',
        receipt_number: 'REC-003',
        notes: 'Virement bancaire 1ère tranche',
      }
    ],
    schedule_slots: [],
  },
  {
    id: 'st-4',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-004',
    deposit_date: '2026-10-18',
    nin: '103200101456789123',
    blood_type: 'O+',
    first_name: 'Sofiane',
    last_name: 'Belkacem',
    gender: 'Homme',
    birth_date: '2001-09-12',
    birth_commune: 'Aïn Oulmene',
    birth_wilaya: 'Sétif',
    marital_status: 'Celibataire',
    phone_number: '0671 22 45 99',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 20000,
    exams: [
      {
        id: 'ex-bel-1',
        student_id: 'st-4',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-28',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'pending',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-bel-1', student_id: 'st-4', amount: 20000, date: '2026-10-18', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-5',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-005',
    deposit_date: '2026-10-22',
    nin: '204200301789123456',
    blood_type: 'A+',
    first_name: 'Amira',
    last_name: 'Chaouche',
    gender: 'Femme',
    birth_date: '2003-04-19',
    birth_commune: 'Beidha Bordj',
    birth_wilaya: 'Sétif',
    marital_status: 'Celibataire',
    phone_number: '0558 77 11 34',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 40000,
    exams: [
      {
        id: 'ex-ch-1',
        student_id: 'st-5',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-07',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-ch-2',
        student_id: 'st-5',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-28',
        exam_center: 'Piste Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'pending',
        fee_amount: 2000,
        fee_paid: false,
      }
    ],
    payments: [{ id: 'p-ch-1', student_id: 'st-5', amount: 40000, date: '2026-10-22', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-6',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-006',
    deposit_date: '2026-09-15',
    nin: '101199801987123456',
    blood_type: 'B+',
    first_name: 'Farouk',
    last_name: 'Benhamida',
    gender: 'Homme',
    birth_date: '1998-12-03',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    marital_status: 'Marie',
    phone_number: '0770 99 44 21',
    requested_category: 'B',
    total_package_price: 42000,
    amount_paid: 42000,
    exams: [
      {
        id: 'ex-fa-1',
        student_id: 'st-6',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-10-15',
        exam_center: 'Centre Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-fa-2',
        student_id: 'st-6',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-07',
        exam_center: 'Piste Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-fa-3',
        student_id: 'st-6',
        exam_type: 'circulation',
        attempt_number: 1,
        exam_date: '2026-11-28',
        exam_center: 'Circuit Routier Beidha Bordj',
        examiner_name: 'M. Makhloufi',
        result: 'pending',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-fa-1', student_id: 'st-6', amount: 42000, date: '2026-09-15', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-7',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-007',
    deposit_date: '2026-10-02',
    nin: '205200201321654987',
    blood_type: 'O+',
    first_name: 'Meriem',
    last_name: 'Bouzid',
    gender: 'Femme',
    birth_date: '2002-07-28',
    birth_commune: 'Aïn Oulmene',
    birth_wilaya: 'Sétif',
    marital_status: 'Celibataire',
    phone_number: '0663 12 88 50',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 40000,
    exams: [
      {
        id: 'ex-me-1',
        student_id: 'st-7',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-me-1', student_id: 'st-7', amount: 40000, date: '2026-10-02', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-8',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-008',
    deposit_date: '2026-10-10',
    nin: '102200001654987321',
    blood_type: 'A+',
    first_name: 'Walid',
    last_name: 'Zitouni',
    gender: 'Homme',
    birth_date: '2000-02-14',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    marital_status: 'Celibataire',
    phone_number: '0550 44 88 12',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 25000,
    exams: [
      {
        id: 'ex-wz-1',
        student_id: 'st-8',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-wz-1', student_id: 'st-8', amount: 25000, date: '2026-10-10', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-9',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-009',
    deposit_date: '2026-10-15',
    nin: '204200401852963741',
    blood_type: 'B+',
    first_name: 'Khadidja',
    last_name: 'Meftah',
    gender: 'Femme',
    birth_date: '2004-11-10',
    birth_commune: 'Beidha Bordj',
    birth_wilaya: 'Sétif',
    marital_status: 'Celibataire',
    phone_number: '0799 11 22 33',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 20000,
    exams: [
      {
        id: 'ex-kh-1',
        student_id: 'st-9',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Centre Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'failed',
        fee_amount: 2000,
        fee_paid: true,
        notes: 'Dépassement du nombre de fautes autorisées (6 fautes)',
      }
    ],
    payments: [{ id: 'p-kh-1', student_id: 'st-9', amount: 20000, date: '2026-10-15', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-10',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-010',
    deposit_date: '2026-09-20',
    nin: '101199701741852963',
    blood_type: 'O+',
    first_name: 'Bilal',
    last_name: 'Mansour',
    gender: 'Homme',
    birth_date: '1997-05-18',
    birth_commune: 'Aïn Oulmene',
    birth_wilaya: 'Sétif',
    marital_status: 'Marie',
    phone_number: '0662 33 66 99',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 40000,
    exams: [
      {
        id: 'ex-bi-1',
        student_id: 'st-10',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-10-25',
        exam_center: 'Centre Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-bi-2',
        student_id: 'st-10',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Piste Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-bi-1', student_id: 'st-10', amount: 40000, date: '2026-09-20', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-11',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-011',
    deposit_date: '2026-09-25',
    nin: '203200101963852741',
    blood_type: 'A+',
    first_name: 'Nadia',
    last_name: 'Touati',
    gender: 'Femme',
    birth_date: '2001-08-30',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    marital_status: 'Celibataire',
    phone_number: '0555 88 99 00',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 30000,
    exams: [
      {
        id: 'ex-na-1',
        student_id: 'st-11',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-10-25',
        exam_center: 'Centre Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-na-2',
        student_id: 'st-11',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Piste Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-na-1', student_id: 'st-11', amount: 30000, date: '2026-09-25', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-12',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-012',
    deposit_date: '2026-09-10',
    nin: '101199301258369147',
    blood_type: 'B+',
    first_name: 'Samir',
    last_name: 'Khelifi',
    gender: 'Homme',
    birth_date: '1993-03-17',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    marital_status: 'Marie',
    phone_number: '0661 55 44 33',
    requested_category: 'C',
    total_package_price: 55000,
    amount_paid: 55000,
    exams: [
      {
        id: 'ex-sa-1',
        student_id: 'st-12',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-10-25',
        exam_center: 'Centre Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-sa-2',
        student_id: 'st-12',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Piste Aïn Oulmene',
        examiner_name: 'M. Makhloufi',
        result: 'failed',
        fee_amount: 2000,
        fee_paid: true,
        notes: 'Touche de piquet en marche arrière',
      }
    ],
    payments: [{ id: 'p-sa-1', student_id: 'st-12', amount: 55000, date: '2026-09-10', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-13',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-013',
    deposit_date: '2026-08-20',
    nin: '101199601369258147',
    blood_type: 'O+',
    first_name: 'Riad',
    last_name: 'Guellati',
    gender: 'Homme',
    birth_date: '1996-10-09',
    birth_commune: 'Beidha Bordj',
    birth_wilaya: 'Sétif',
    marital_status: 'Marie',
    phone_number: '0773 22 11 00',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 40000,
    exams: [
      {
        id: 'ex-ri-1',
        student_id: 'st-13',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-09-20',
        exam_center: 'Centre Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-ri-2',
        student_id: 'st-13',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-10-15',
        exam_center: 'Piste Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-ri-3',
        student_id: 'st-13',
        exam_type: 'circulation',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Circuit Routier Beidha Bordj',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-ri-1', student_id: 'st-13', amount: 40000, date: '2026-08-20', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-14',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-014',
    deposit_date: '2026-08-25',
    nin: '204200001147258369',
    blood_type: 'A+',
    first_name: 'Houda',
    last_name: 'Rahmani',
    gender: 'Femme',
    birth_date: '2000-06-21',
    birth_commune: 'Aïn Oulmene',
    birth_wilaya: 'Sétif',
    marital_status: 'Celibataire',
    phone_number: '0561 77 88 99',
    requested_category: 'B',
    total_package_price: 40000,
    amount_paid: 40000,
    exams: [
      {
        id: 'ex-ho-1',
        student_id: 'st-14',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-09-20',
        exam_center: 'Centre Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-ho-2',
        student_id: 'st-14',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-10-15',
        exam_center: 'Piste Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-ho-3',
        student_id: 'st-14',
        exam_type: 'circulation',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Circuit Routier Beidha Bordj',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-ho-1', student_id: 'st-14', amount: 40000, date: '2026-08-25', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
  {
    id: 'st-15',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-015',
    deposit_date: '2026-08-10',
    nin: '101199401753951852',
    blood_type: 'O+',
    first_name: 'Karim',
    last_name: 'Slimani',
    gender: 'Homme',
    birth_date: '1994-01-15',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    marital_status: 'Marie',
    phone_number: '0670 11 33 55',
    requested_category: 'BE',
    total_package_price: 48000,
    amount_paid: 48000,
    exams: [
      {
        id: 'ex-ka-1',
        student_id: 'st-15',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-09-20',
        exam_center: 'Centre Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-ka-2',
        student_id: 'st-15',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-10-15',
        exam_center: 'Piste Aïn Oulmene',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-ka-3',
        student_id: 'st-15',
        exam_type: 'circulation',
        attempt_number: 1,
        exam_date: '2026-11-21',
        exam_center: 'Circuit Routier Beidha Bordj',
        examiner_name: 'M. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      }
    ],
    payments: [{ id: 'p-ka-1', student_id: 'st-15', amount: 48000, date: '2026-08-10', type: 'initial_deposit', method: 'especes' }],
    schedule_slots: [],
  },
];

const DEFAULT_STUDENTS: Student[] = RAW_DEFAULT_STUDENTS.map((st, idx) => ({
  ...st,
  schedule_slots: ensureFull30HourSlots(st, (idx % 4) + 1),
}));

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-21T18:30:00Z',
    user_role: 'owner',
    action: 'record_result',
    target_type: 'exam',
    target_id: 'ex-bel-1',
    target_name: 'Sofiane Belkacem',
    details: 'Validation de l\'inscription à la session d\'examen du 28/11/2026 (Centre Aïn Oulmene)',
  },
  {
    id: 'log-2',
    timestamp: '2026-11-21T16:15:00Z',
    user_role: 'secretary',
    action: 'add_payment',
    target_type: 'payment',
    target_id: 'p-2',
    target_name: 'Yassine Boussaha',
    details: 'Encaissement versement complémentaire de 22,000 DZD (Quittance REC-014)',
  },
  {
    id: 'log-3',
    timestamp: '2026-11-20T14:20:00Z',
    user_role: 'owner',
    action: 'create_session',
    target_type: 'session',
    target_id: 'sess-2026-11-28',
    target_name: 'Session du 28/11/2026',
    details: 'Programmation de la session hebdomadaire au Centre Aïn Oulmene avec l\'inspecteur M. Makhloufi (4 candidats)',
  },
  {
    id: 'log-4',
    timestamp: '2026-11-20T11:45:00Z',
    user_role: 'owner',
    action: 'record_result',
    target_type: 'exam',
    target_id: 'ex-5',
    target_name: 'Ines Mansouri',
    details: 'Résultat examen Code : Admis (Tentative #2)',
  },
  {
    id: 'log-5',
    timestamp: '2026-11-18T10:00:00Z',
    user_role: 'secretary',
    action: 'create',
    target_type: 'candidate',
    target_id: 'st-4',
    target_name: 'Sofiane Belkacem',
    details: 'Création du dossier de candidature Permis B (DOS-2026-004) et acompte initial de 20,000 DZD',
  },
];

const KrenoContext = createContext<KrenoContextType | undefined>(undefined);

export function KrenoProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [palette, setPaletteState] = useState<ColorPalette>('ocean');
  const [lang, setLangState] = useState<'fr' | 'ar'>('fr');
  const [userRole, setUserRoleState] = useState<UserRole>('owner');
  const [school, setSchool] = useState<School>(DEFAULT_SCHOOL);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(DEFAULT_AUDIT_LOGS);
  const [engineers, setEngineers] = useState<Ingenieur[]>(DEFAULT_ENGINEERS);
  const [examCenters, setExamCenters] = useState<ExamCenter[]>(DEFAULT_EXAM_CENTERS);

  // 1. Load preferences and data from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('kreno_theme') as ThemeMode | null;
      if (savedTheme) {
        setThemeState(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      const savedPalette = localStorage.getItem('kreno_palette') as ColorPalette | null;
      if (savedPalette) {
        setPaletteState(savedPalette);
        document.documentElement.setAttribute('data-palette', savedPalette);
      } else {
        document.documentElement.setAttribute('data-palette', 'ocean');
      }

      const savedLang = localStorage.getItem('kreno_lang') as 'fr' | 'ar' | null;
      if (savedLang) setLangState(savedLang);

      const savedRole = localStorage.getItem('kreno_role') as UserRole | null;
      if (savedRole) setUserRoleState(savedRole);

      const savedStudents = localStorage.getItem('kreno_students');
      if (savedStudents) {
        const parsed = JSON.parse(savedStudents);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          // Guarantee all candidate profiles have the complete 30h syllabus
          const populated = parsed.map((st: Student, idx: number) => ({
            ...st,
            schedule_slots: ensureFull30HourSlots(st, (idx % 4) + 1),
          }));
          setStudents(populated);
          localStorage.setItem('kreno_students', JSON.stringify(populated));
        } else {
          setStudents(DEFAULT_STUDENTS);
          localStorage.setItem('kreno_students', JSON.stringify(DEFAULT_STUDENTS));
        }
      } else {
        setStudents(DEFAULT_STUDENTS);
        localStorage.setItem('kreno_students', JSON.stringify(DEFAULT_STUDENTS));
      }

      const savedVehicles = localStorage.getItem('kreno_vehicles');
      if (savedVehicles) {
        setVehicles(JSON.parse(savedVehicles));
      } else {
        localStorage.setItem('kreno_vehicles', JSON.stringify(DEFAULT_VEHICLES));
      }

      const savedSettings = localStorage.getItem('kreno_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedLogs = localStorage.getItem('kreno_audit_logs');
      if (savedLogs) {
        setAuditLogs(JSON.parse(savedLogs));
      } else {
        localStorage.setItem('kreno_audit_logs', JSON.stringify(DEFAULT_AUDIT_LOGS));
      }

      const savedEngineers = localStorage.getItem('kreno_engineers');
      if (savedEngineers) {
        setEngineers(JSON.parse(savedEngineers));
      } else {
        localStorage.setItem('kreno_engineers', JSON.stringify(DEFAULT_ENGINEERS));
      }

      const savedCenters = localStorage.getItem('kreno_exam_centers');
      if (savedCenters) {
        setExamCenters(JSON.parse(savedCenters));
      } else {
        localStorage.setItem('kreno_exam_centers', JSON.stringify(DEFAULT_EXAM_CENTERS));
      }
    } catch (err) {
      console.warn('Failed to load local storage state:', err);
    }
  }, []);

  const addEngineer = (name: string, title?: string, phone?: string): Ingenieur => {
    const newEng: Ingenieur = {
      id: `eng-${Date.now()}`,
      name: name.trim(),
      title: title?.trim() || 'Ingénieur d\'État',
      phone: phone?.trim(),
      is_active: true,
    };
    setEngineers(prev => {
      const updated = [...prev, newEng];
      localStorage.setItem('kreno_engineers', JSON.stringify(updated));
      return updated;
    });
    logAction('create', 'settings', newEng.id, newEng.name, `Ajout de l'ingénieur examinateur ${newEng.name}`);
    return newEng;
  };

  const addExamCenter = (name: string, commune?: string): ExamCenter => {
    const newCenter: ExamCenter = {
      id: `ctr-${Date.now()}`,
      name: name.trim(),
      commune: commune?.trim(),
      is_active: true,
    };
    setExamCenters(prev => {
      const updated = [...prev, newCenter];
      localStorage.setItem('kreno_exam_centers', JSON.stringify(updated));
      return updated;
    });
    logAction('create', 'settings', newCenter.id, newCenter.name, `Ajout du centre d'examen ${newCenter.name}`);
    return newCenter;
  };

  const logAction = (
    action: AuditLogEntry['action'],
    target_type: AuditLogEntry['target_type'],
    target_id: string,
    target_name: string,
    details: string
  ) => {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_role: userRole,
      action,
      target_type,
      target_id,
      target_name,
      details,
    };
    setAuditLogs(prev => {
      const updated = [entry, ...prev];
      localStorage.setItem('kreno_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('kreno_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setPalette = (newPalette: ColorPalette) => {
    setPaletteState(newPalette);
    localStorage.setItem('kreno_palette', newPalette);
    document.documentElement.setAttribute('data-palette', newPalette);
  };

  const setLang = (newLang: 'fr' | 'ar') => {
    setLangState(newLang);
    localStorage.setItem('kreno_lang', newLang);
  };

  const setUserRole = (newRole: UserRole) => {
    setUserRoleState(newRole);
    localStorage.setItem('kreno_role', newRole);
  };

  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('kreno_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const addUnavailablePeriod = (period: Omit<UnavailablePeriod, 'id'>) => {
    const newPeriod: UnavailablePeriod = {
      ...period,
      id: `un-${Date.now()}`,
    };
    setSettings(prev => {
      const updated = {
        ...prev,
        unavailable_periods: [...prev.unavailable_periods, newPeriod],
      };
      localStorage.setItem('kreno_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v-${Date.now()}`,
    };
    setVehicles(prev => {
      const updated = [...prev, newVehicle];
      localStorage.setItem('kreno_vehicles', JSON.stringify(updated));
      return updated;
    });
    logAction('create', 'settings', newVehicle.id, `${newVehicle.brand} ${newVehicle.model}`, `Ajout du véhicule matriculé ${newVehicle.plate_number}`);
    return newVehicle;
  };

  const updateVehicle = (id: string, updated: Partial<Vehicle>) => {
    setVehicles(prev => {
      const updatedList = prev.map(v => v.id === id ? { ...v, ...updated } : v);
      localStorage.setItem('kreno_vehicles', JSON.stringify(updatedList));
      return updatedList;
    });
    logAction('update', 'settings', id, updated.plate_number || 'Véhicule', 'Mise à jour des informations du véhicule');
  };

  const deleteVehicle = (id: string) => {
    const target = vehicles.find(v => v.id === id);
    setVehicles(prev => {
      const updatedList = prev.filter(v => v.id !== id);
      localStorage.setItem('kreno_vehicles', JSON.stringify(updatedList));
      return updatedList;
    });
    logAction('delete', 'settings', id, target?.plate_number || 'Véhicule', 'Suppression du véhicule du parc automobile');
  };

  const removeUnavailablePeriod = (id: string) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        unavailable_periods: prev.unavailable_periods.filter(p => p.id !== id),
      };
      localStorage.setItem('kreno_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Automatic 30-Hour Conflict-Free Schedule Generator
  const generateScheduleForStudent = (
    student: Student,
    preferredDays?: DayOfWeek[],
    preferredTime?: 'morning' | 'afternoon' | 'any',
    startDateStr?: string
  ): ScheduleSlot[] => {
    const slots: ScheduleSlot[] = [];
    const dayMap: Record<number, DayOfWeek> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    // Collect all already booked slots across all existing students to avoid conflicts
    const bookedSlotMap = new Set<string>();
    students.forEach(st => {
      if (st.id === student.id) return; // ignore current student if regenerating
      (st.schedule_slots || []).forEach(slot => {
        if (slot.status !== 'cancelled') {
          bookedSlotMap.add(`${slot.date}_${slot.time_start}`);
        }
      });
    });

    let currentDate = startDateStr ? new Date(startDateStr) : new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    // Working days filtering with preferred days
    const allowedDays = preferredDays && preferredDays.length > 0 
      ? preferredDays.filter(d => settings.working_days.includes(d))
      : settings.working_days;

    // Time ranges based on preference
    let possibleHours = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    if (preferredTime === 'morning') {
      possibleHours = ['08:00', '09:00', '10:00', '11:00'];
    } else if (preferredTime === 'afternoon') {
      possibleHours = ['14:00', '15:00', '16:00'];
    }

    // Official Algerian 30-Hour Dispatch:
    // 10 hours Code Theorique, 10 hours Creneau/Manoeuvres, 10 hours Circulation
    const sessionTypes: Array<'code' | 'creneau' | 'circulation'> = [
      ...Array(10).fill('code'),
      ...Array(10).fill('creneau'),
      ...Array(10).fill('circulation'),
    ];

    let sessionIdx = 0;
    let dayScanCount = 0;

    // Scan days and find empty conflict-free slots (max 1 or 2 slots per day)
    while (sessionIdx < sessionTypes.length && dayScanCount < 120) {
      dayScanCount++;
      const dayOfWeek = dayMap[currentDate.getDay()];
      const dateIso = currentDate.toISOString().split('T')[0];

      const isWorkingDay = allowedDays.includes(dayOfWeek);
      const isUnavailable = settings.unavailable_periods.some(
        p => p.date === dateIso && p.period === 'full_day'
      );

      if (isWorkingDay && !isUnavailable) {
        // Find first free hour slot on this day
        let bookedOnDay = false;
        for (const timeStart of possibleHours) {
          const key = `${dateIso}_${timeStart}`;
          if (!bookedSlotMap.has(key)) {
            const [startHourNum] = timeStart.split(':').map(Number);
            const endHourNum = startHourNum + 1;
            const timeEnd = `${endHourNum < 10 ? '0' : ''}${endHourNum}:00`;
            const currentType = sessionTypes[sessionIdx];

            slots.push({
              id: `sc-auto-${Date.now()}-${sessionIdx}`,
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              category: student.requested_category,
              date: dateIso,
              time_start: timeStart,
              time_end: timeEnd,
              type: currentType,
              instructor_name: currentType === 'code' ? 'M. Amine' : currentType === 'creneau' ? 'M. Khaled' : 'M. Toufik',
              status: 'scheduled',
              notes: `Séance N° ${sessionIdx + 1} / 30 (${currentType === 'code' ? 'Code théorique' : currentType === 'creneau' ? 'Créneau sur piste' : 'Circulation'})`,
            });

            bookedSlotMap.add(key); // reserve this slot
            sessionIdx++;
            bookedOnDay = true;
            break; // Move to next day (1 hour per day for optimal progressive training)
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  };

  // Add new Student with optional availability preferences
  const addStudent = (studentData: Omit<Student, 'id' | 'exams' | 'schedule_slots' | 'payments'>): Student => {
    const studentId = `st-${Date.now()}`;
    const initialPayment: PaymentRecord[] = studentData.amount_paid > 0 ? [
      {
        id: `p-${Date.now()}`,
        student_id: studentId,
        amount: studentData.amount_paid,
        date: studentData.deposit_date || '2026-11-21',
        type: 'initial_deposit',
        method: 'especes',
        receipt_number: `REC-${Math.floor(100 + Math.random() * 900)}`,
        notes: 'Versement initial encaissé à la création du dossier',
      }
    ] : [];

    const newStudentBase: Student = {
      ...studentData,
      id: studentId,
      exams: [
        {
          id: `ex-${Date.now()}`,
          student_id: studentId,
          exam_type: 'code',
          attempt_number: 1,
          result: 'pending',
          fee_amount: settings.standard_exam_fee || 2000,
          fee_paid: false,
        }
      ],
      payments: initialPayment,
      schedule_slots: [],
    };

    // Auto-generate initial 30-hour dispatch
    const generatedSlots = generateScheduleForStudent(newStudentBase);
    const completeStudent: Student = {
      ...newStudentBase,
      schedule_slots: generatedSlots,
    };

    setStudents(prev => {
      const updated = [completeStudent, ...prev];
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });

    logAction(
      'create',
      'candidate',
      completeStudent.id,
      `${completeStudent.first_name} ${completeStudent.last_name}`,
      `Création du dossier ${completeStudent.dossier_number} et génération du programme légal de 30 heures`
    );

    return completeStudent;
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    let studentName = 'Candidat';
    setStudents(prev => {
      const updatedList = prev.map(s => {
        if (s.id === id) {
          studentName = `${s.first_name} ${s.last_name}`;
          return { ...s, ...updated };
        }
        return s;
      });
      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });

    logAction(
      'update',
      'candidate',
      id,
      studentName,
      `Mise à jour des informations du dossier candidat`
    );
  };

  const deleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    if (!target) return;
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });
    logAction(
      'delete',
      'candidate',
      id,
      `${target.first_name} ${target.last_name}`,
      `Suppression définitive du dossier ${target.dossier_number}`
    );
  };

  // Add Payment / Installment
  const addPayment = (studentId: string, payment: Omit<PaymentRecord, 'id'>) => {
    const newRecord: PaymentRecord = {
      ...payment,
      id: `p-${Date.now()}`,
    };

    let studentName = 'Candidat';

    setStudents(prev => {
      const updatedList = prev.map(st => {
        if (st.id !== studentId) return st;
        studentName = `${st.first_name} ${st.last_name}`;
        const newPayments = [...(st.payments || []), newRecord];
        const newTotalPaid = st.amount_paid + payment.amount;
        return {
          ...st,
          amount_paid: newTotalPaid,
          payments: newPayments,
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });

    logAction(
      'add_payment',
      'payment',
      newRecord.id,
      studentName,
      `Encaissement d'un versement de ${payment.amount.toLocaleString()} DZD (${payment.method})`
    );
  };

  // Delete / Cancel Payment (Prevents accidental clicks via confirmation modal in UI)
  const deletePayment = (studentId: string, paymentId: string) => {
    const st = students.find(s => s.id === studentId);
    if (!st) return;
    const payment = st.payments.find(p => p.id === paymentId);
    if (!payment) return;

    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        const newPayments = s.payments.filter(p => p.id !== paymentId);
        const newTotalPaid = Math.max(0, s.amount_paid - payment.amount);
        return {
          ...s,
          amount_paid: newTotalPaid,
          payments: newPayments,
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });

    logAction(
      'cancel_payment',
      'payment',
      paymentId,
      `${st.first_name} ${st.last_name}`,
      `Annulation du paiement de ${payment.amount.toLocaleString()} DZD (${payment.receipt_number || payment.type})`
    );
  };

  const deleteExamRecord = (studentId: string, examId: string) => {
    const st = students.find(s => s.id === studentId);
    if (!st) return;
    const exam = st.exams.find(e => e.id === examId);
    if (!exam) return;

    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          exams: s.exams.filter(e => e.id !== examId),
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });

    logAction(
      'delete',
      'exam',
      examId,
      `${st.first_name} ${st.last_name}`,
      `Suppression de l'épreuve ${exam.exam_type.toUpperCase()} du ${exam.exam_date || 'date indéfinie'}`
    );
  };

  const deleteExamSession = (sessionDate: string) => {
    let affectedCount = 0;
    setStudents(prev => {
      const updated = prev.map(s => {
        const hasExamsOnDate = s.exams.some(e => e.exam_date === sessionDate);
        if (hasExamsOnDate) {
          affectedCount++;
          return {
            ...s,
            exams: s.exams.filter(e => e.exam_date !== sessionDate),
          };
        }
        return s;
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });

    logAction(
      'delete_session',
      'session',
      sessionDate,
      `Session du ${sessionDate}`,
      `Suppression complète de la session d'examen (${affectedCount} candidat(s) déprogrammés)`
    );
  };

  const deleteScheduleSlot = (studentId: string, slotId: string) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          schedule_slots: s.schedule_slots.filter(sc => sc.id !== slotId),
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });
  };

  const updateScheduleSlot = (studentId: string, slotId: string, updatedSlot: Partial<ScheduleSlot>) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          schedule_slots: s.schedule_slots.map(sc => sc.id === slotId ? { ...sc, ...updatedSlot } : sc),
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });
  };

  // Program an Exam with Fee status
  const programExam = (
    studentId: string, 
    examType: ExamType, 
    examDate: string, 
    examCenter: string, 
    feeAmount: number, 
    feePaid: boolean,
    examinerName?: string
  ) => {
    setStudents(prev => {
      const updatedList = prev.map(st => {
        if (st.id !== studentId) return st;

        const previousAttempts = st.exams.filter(e => e.exam_type === examType);
        const attemptNum = previousAttempts.length + 1;

        const newExam: ExamRecord = {
          id: `ex-${Date.now()}`,
          student_id: studentId,
          exam_type: examType,
          attempt_number: attemptNum,
          exam_date: examDate,
          exam_center: examCenter,
          examiner_name: examinerName || 'Inspecteur d\'État',
          result: 'pending',
          fee_amount: feeAmount,
          fee_paid: feePaid,
        };

        const updatedPayments = [...(st.payments || [])];
        let newTotalPaid = st.amount_paid;

        // If exam fee is paid right now, record payment entry
        if (feePaid) {
          updatedPayments.push({
            id: `p-${Date.now()}`,
            student_id: studentId,
            amount: feeAmount,
            date: examDate,
            type: 'exam_fee',
            method: 'especes',
            receipt_number: `REC-EX-${Math.floor(100 + Math.random() * 900)}`,
            notes: `Frais d'examen ${examType.toUpperCase()} (Tentative ${attemptNum})`,
          });
          newTotalPaid += feeAmount;
        }

        return {
          ...st,
          amount_paid: newTotalPaid,
          payments: updatedPayments,
          exams: [...st.exams, newExam],
        };
      });

      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Record Exam Result
  const recordExamResult = (
    studentId: string,
    examType: ExamType,
    result: ExamResult,
    date: string,
    examiner: string,
    notes?: string
  ) => {
    setStudents(prev => {
      const updatedList = prev.map(st => {
        if (st.id !== studentId) return st;

        const existingPending = st.exams.find(e => e.exam_type === examType && e.result === 'pending');
        let updatedExams: ExamRecord[];

        if (existingPending) {
          updatedExams = st.exams.map(e => {
            if (e.id === existingPending.id) {
              return {
                ...e,
                result,
                exam_date: date,
                examiner_name: examiner,
                notes,
              };
            }
            return e;
          });
        } else {
          const previousAttempts = st.exams.filter(e => e.exam_type === examType);
          const attemptNum = previousAttempts.length + 1;
          const newExam: ExamRecord = {
            id: `ex-${Date.now()}`,
            student_id: studentId,
            exam_type: examType,
            attempt_number: attemptNum,
            exam_date: date,
            examiner_name: examiner,
            result,
            fee_amount: settings.standard_exam_fee || 2000,
            fee_paid: true,
            notes,
          };
          updatedExams = [...st.exams, newExam];
        }

        // Auto unlock next stage upon pass
        if (result === 'passed') {
          if (examType === 'code' && !updatedExams.some(e => e.exam_type === 'creneau')) {
            updatedExams.push({
              id: `ex-${Date.now()}-c`,
              student_id: studentId,
              exam_type: 'creneau',
              attempt_number: 1,
              result: 'pending',
              fee_amount: settings.standard_exam_fee || 2000,
              fee_paid: false,
            });
          } else if (examType === 'creneau' && !updatedExams.some(e => e.exam_type === 'circulation')) {
            updatedExams.push({
              id: `ex-${Date.now()}-cir`,
              student_id: studentId,
              exam_type: 'circulation',
              attempt_number: 1,
              result: 'pending',
              fee_amount: settings.standard_exam_fee || 2000,
              fee_paid: false,
            });
          }
        }

        return {
          ...st,
          exams: updatedExams,
        };
      });

      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Direct update of exam result for session table
  const updateExamResultById = (studentId: string, examId: string, result: ExamResult) => {
    setStudents(prev => {
      const updatedList = prev.map(st => {
        if (st.id !== studentId) return st;
        const examTarget = st.exams.find(e => e.id === examId);
        if (!examTarget) return st;

        let updatedExams = st.exams.map(e => e.id === examId ? { ...e, result } : e);

        // Auto unlock next stage upon pass
        if (result === 'passed') {
          if (examTarget.exam_type === 'code' && !updatedExams.some(e => e.exam_type === 'creneau')) {
            updatedExams.push({
              id: `ex-${Date.now()}-c`,
              student_id: studentId,
              exam_type: 'creneau',
              attempt_number: 1,
              result: 'pending',
              fee_amount: settings.standard_exam_fee || 2000,
              fee_paid: false,
            });
          } else if (examTarget.exam_type === 'creneau' && !updatedExams.some(e => e.exam_type === 'circulation')) {
            updatedExams.push({
              id: `ex-${Date.now()}-cir`,
              student_id: studentId,
              exam_type: 'circulation',
              attempt_number: 1,
              result: 'pending',
              fee_amount: settings.standard_exam_fee || 2000,
              fee_paid: false,
            });
          }
        }

        return { ...st, exams: updatedExams };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Toggle fee payment for an exam sitting
  const toggleExamFeePayment = (studentId: string, examId: string, feePaid: boolean) => {
    setStudents(prev => {
      const updatedList = prev.map(st => {
        if (st.id !== studentId) return st;
        const examTarget = st.exams.find(e => e.id === examId);
        if (!examTarget) return st;

        const updatedExams = st.exams.map(e => e.id === examId ? { ...e, fee_paid: feePaid } : e);
        const updatedPayments = [...(st.payments || [])];
        let newAmountPaid = st.amount_paid;

        if (feePaid && !examTarget.fee_paid) {
          const fee = examTarget.fee_amount || settings.standard_exam_fee || 2000;
          updatedPayments.push({
            id: `p-${Date.now()}`,
            student_id: studentId,
            amount: fee,
            date: new Date().toISOString().split('T')[0],
            type: 'exam_fee',
            method: 'especes',
            receipt_number: `REC-EX-${Math.floor(100 + Math.random() * 900)}`,
            notes: `Règlement frais d'examen ${examTarget.exam_type.toUpperCase()}`,
          });
          newAmountPaid += fee;
        }

        return {
          ...st,
          amount_paid: newAmountPaid,
          payments: updatedPayments,
          exams: updatedExams,
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Create new weekly exam session for selected candidates
  const createExamDaySession = (
    date: string,
    center: string,
    examiner: string,
    candidateSelections: ExamSessionCandidateSelection[]
  ) => {
    setStudents(prev => {
      const updatedList = prev.map(st => {
        const selection = candidateSelections.find(c => c.student_id === st.id);
        if (!selection) return st;

        const previousAttempts = st.exams.filter(e => e.exam_type === selection.exam_type);
        const attemptNum = previousAttempts.length + 1;

        const newExam: ExamRecord = {
          id: `ex-${Date.now()}-${st.id}`,
          student_id: st.id,
          exam_type: selection.exam_type,
          attempt_number: attemptNum,
          exam_date: date,
          exam_center: center,
          examiner_name: examiner,
          result: 'pending',
          fee_amount: selection.fee_amount,
          fee_paid: selection.fee_paid,
        };

        const updatedPayments = [...(st.payments || [])];
        let newTotalPaid = st.amount_paid;

        if (selection.fee_paid) {
          updatedPayments.push({
            id: `p-${Date.now()}-${st.id}`,
            student_id: st.id,
            amount: selection.fee_amount,
            date,
            type: 'exam_fee',
            method: 'especes',
            receipt_number: `REC-EX-${Math.floor(100 + Math.random() * 900)}`,
            notes: `Frais d'examen ${selection.exam_type.toUpperCase()} - Session du ${date}`,
          });
          newTotalPaid += selection.fee_amount;
        }

        return {
          ...st,
          amount_paid: newTotalPaid,
          payments: updatedPayments,
          exams: [...st.exams, newExam],
        };
      });

      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  // Edit/Update an existing weekly exam session
  const updateExamSession = (
    originalDate: string,
    newDate: string,
    newCenter: string,
    newExaminer: string,
    candidateSelections: ExamSessionCandidateSelection[]
  ) => {
    setStudents(prev => {
      const updatedList = prev.map(st => {
        const isSelected = candidateSelections.find(c => c.student_id === st.id);
        const hadExamOnDate = st.exams.find(e => e.exam_date === originalDate);

        // Case 1: Was in session and is still selected -> update session info
        if (hadExamOnDate && isSelected) {
          const updatedExams = st.exams.map(e => {
            if (e.id === hadExamOnDate.id) {
              return {
                ...e,
                exam_date: newDate,
                exam_center: newCenter,
                examiner_name: newExaminer,
                exam_type: isSelected.exam_type,
                fee_amount: isSelected.fee_amount,
              };
            }
            return e;
          });
          return { ...st, exams: updatedExams };
        }

        // Case 2: Was in session but removed -> delete exam record
        if (hadExamOnDate && !isSelected) {
          const updatedExams = st.exams.filter(e => e.id !== hadExamOnDate.id);
          return { ...st, exams: updatedExams };
        }

        // Case 3: Wasn't in session but was added now
        if (!hadExamOnDate && isSelected) {
          const previousAttempts = st.exams.filter(e => e.exam_type === isSelected.exam_type);
          const attemptNum = previousAttempts.length + 1;
          const newExam: ExamRecord = {
            id: `ex-${Date.now()}-${st.id}`,
            student_id: st.id,
            exam_type: isSelected.exam_type,
            attempt_number: attemptNum,
            exam_date: newDate,
            exam_center: newCenter,
            examiner_name: newExaminer,
            result: 'pending',
            fee_amount: isSelected.fee_amount,
            fee_paid: false,
          };
          return { ...st, exams: [...st.exams, newExam] };
        }

        return st;
      });

      localStorage.setItem('kreno_students', JSON.stringify(updatedList));
      return updatedList;
    });

    logAction(
      'update',
      'session',
      newDate,
      `Session du ${newDate}`,
      `Modification de la session d'examen du ${originalDate} (${candidateSelections.length} candidat(s))`
    );
  };

  return (
    <KrenoContext.Provider
      value={{
        theme,
        setTheme,
        palette,
        setPalette,
        lang,
        setLang,
        userRole,
        setUserRole,
        school,
        setSchool,
        students,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        settings,
        updateSettings,
        addUnavailablePeriod,
        removeUnavailablePeriod,
        addStudent,
        updateStudent,
        deleteStudent,
        addPayment,
        deletePayment,
        deleteExamRecord,
        deleteExamSession,
        deleteScheduleSlot,
        updateScheduleSlot,
        programExam,
        recordExamResult,
        createExamDaySession,
        updateExamSession,
        updateExamResultById,
        toggleExamFeePayment,
        generateScheduleForStudent,
        searchQuery,
        setSearchQuery,
        auditLogs,
        engineers,
        addEngineer,
        examCenters,
        addExamCenter,
        logAction,
      }}
    >
      {children}
    </KrenoContext.Provider>
  );
}

export function useKreno() {
  const context = useContext(KrenoContext);
  if (!context) {
    throw new Error('useKreno must be used within a KrenoProvider');
  }
  return context;
}
