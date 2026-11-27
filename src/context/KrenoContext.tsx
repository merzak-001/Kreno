'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  fetchSchoolBundle,
  isUuid,
  dbSaveSchoolAndSettings,
  dbUpsertMentor,
  dbDeleteMentor,
  dbUpsertVehicle,
  dbDeleteVehicle,
  dbUpsertEngineer,
  dbUpsertStudentFull,
  dbDeleteStudent,
  dbInsertAuditLog,
} from '@/lib/supabase/krenoDb';
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
  DayOfWeek,
  Mentor,
  SessionDiscipline,
  LicenseCapacityRules,
  LicenseCategory
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
  accountRole: UserRole;
  authEmail: string | null;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
  refreshFromSupabase: () => Promise<void>;
  setUserRole: (role: UserRole) => void;
  school: School;
  setSchool: React.Dispatch<React.SetStateAction<School>>;
  students: Student[];
  vehicles: Vehicle[];
  addVehicle: (vehicleData: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, updated: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  mentors: Mentor[];
  addMentor: (mentorData: Omit<Mentor, 'id'>) => Mentor;
  updateMentor: (id: string, updated: Partial<Mentor>) => void;
  deleteMentor: (id: string) => void;
  getSlotCapacityLimit: (type: SessionDiscipline, category: LicenseCategory) => number;
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
  addScheduleSlot: (
    studentId: string,
    date: string,
    timeStart: string,
    timeEnd: string,
    type: SessionDiscipline,
    instructorName: string
  ) => { ok: boolean; error?: string };
  deleteScheduleSlot: (studentId: string, slotId: string) => void;
  updateScheduleSlot: (studentId: string, slotId: string, updated: Partial<ScheduleSlot>) => void;
  resolveScheduleSlot: (
    studentId: string,
    slotId: string,
    resolution: 'completed' | 'absent_student' | 'cancelled_school' | 'scheduled'
  ) => { addedSlot?: ScheduleSlot; extraFee?: number } | void;
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
    startDate?: string,
    maxPerDay?: number
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
  end_hour: '16:00',
  slot_duration_hours: 1, // 1 heure fixe par unité
  lunch_break_start: '12:00',
  lunch_break_end: '14:00',
  libre_hour: '', // Planning réduit à 6h/jour (08h-12h & 14h-16h)
  max_hours_per_day: 6,
  candidates_per_vehicle: 3, // Jusqu'à 3 candidats par véhicule en pratique
  capacity_rules: {
    'A1': { code: 10, creneau: 2, circulation: 1 },
    'A':  { code: 10, creneau: 2, circulation: 1 },
    'B':  { code: 10, creneau: 3, circulation: 3 },
    'BE': { code: 10, creneau: 2, circulation: 2 },
    'C1': { code: 10, creneau: 2, circulation: 2 },
    'C1E':{ code: 10, creneau: 2, circulation: 2 },
    'C':  { code: 10, creneau: 2, circulation: 2 },
    'CE': { code: 10, creneau: 2, circulation: 2 },
    'D':  { code: 10, creneau: 2, circulation: 2 },
    'DE': { code: 10, creneau: 2, circulation: 2 },
    'F':  { code: 10, creneau: 2, circulation: 2 },
  },
  extra_theory_hour_fee: 800,
  extra_practical_hour_fee: 1500,
  standard_exam_fee: 2000, // 2000 DZD par défaut
  owner_pin: '1234',
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

const SAMPLE_AVAILABILITIES: Array<{ days: DayOfWeek[]; time: 'morning' | 'afternoon' | 'any'; max_per_day: number }> = [
  { days: ['saturday', 'monday', 'wednesday'], time: 'morning', max_per_day: 2 },
  { days: ['sunday', 'tuesday', 'thursday'], time: 'afternoon', max_per_day: 2 },
  { days: ['saturday', 'tuesday'], time: 'any', max_per_day: 3 },
  { days: ['sunday', 'wednesday'], time: 'morning', max_per_day: 2 },
  { days: ['monday', 'thursday'], time: 'afternoon', max_per_day: 2 },
];

// Helper to auto-generate the 30-hour regulatory training syllabus on the 6h/day schedule (08h-12h, 14h-16h)
// Tracks practical slots across students when provided (up to 3 candidates per active vehicle)
function ensureFull30HourSlots(
  student: Student,
  offset: number = 0,
  sharedPracticalCountMap?: Map<string, number>,
  maxPracticalPerSlot: number = 3
): ScheduleSlot[] {
  const valid6Hours = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'];
  if (student.schedule_slots && student.schedule_slots.length >= 30) {
    const hasOutOfRange = student.schedule_slots.some(s => !valid6Hours.includes(s.time_start));
    if (!hasOutOfRange) {
      return student.schedule_slots;
    }
    return student.schedule_slots.map((s) => {
      if (valid6Hours.includes(s.time_start)) return s;
      const mappedStart = s.time_start === '13:00' ? '14:00' : '15:00';
      const mappedEnd = s.time_start === '13:00' ? '15:00' : '16:00';
      return { ...s, time_start: mappedStart, time_end: mappedEnd };
    });
  }

  const slots: ScheduleSlot[] = [];
  const dayMap: Record<number, DayOfWeek> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
  };

  const avail = student.availability || SAMPLE_AVAILABILITIES[offset % SAMPLE_AVAILABILITIES.length];
  const allowedDays = avail.days;
  const maxPerDay = avail.max_per_day || 2;
  const allHours = avail.time === 'morning'
    ? ['08:00', '09:00', '10:00', '11:00']
    : avail.time === 'afternoon'
    ? ['14:00', '15:00']
    : ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'];

  const sessionTypes: Array<'code' | 'creneau' | 'circulation'> = [
    ...Array(10).fill('code'),
    ...Array(10).fill('creneau'),
    ...Array(10).fill('circulation')
  ];

  const codePassed = (student.exams || []).some(e => e.exam_type === 'code' && e.result === 'passed');
  const creneauPassed = (student.exams || []).some(e => e.exam_type === 'creneau' && e.result === 'passed');
  const circulationPassed = (student.exams || []).some(e => e.exam_type === 'circulation' && e.result === 'passed');

  let startBase: Date;
  if (student.deposit_date && /^\d{4}-\d{2}-\d{2}$/.test(student.deposit_date)) {
    const [sy, sm, sd] = student.deposit_date.split('-').map(Number);
    startBase = new Date(sy, sm - 1, sd);
  } else {
    startBase = new Date(2026, 10, 10);
  }
  startBase.setDate(startBase.getDate() + 1);

  const current = new Date(startBase);
  const todayRef = new Date();
  todayRef.setHours(0, 0, 0, 0);

  const ownKeys = new Set<string>();
  let sessionIdx = 0;
  let safety = 0;

  while (sessionIdx < sessionTypes.length && safety < 360) {
    safety++;
    const dayName = dayMap[current.getDay()];
    if (allowedDays.includes(dayName)) {
      const yy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateIso = `${yy}-${mm}-${dd}`;

      let bookedToday = 0;
      for (let hIdx = 0; hIdx < allHours.length && bookedToday < maxPerDay && sessionIdx < sessionTypes.length; hIdx++) {
        const timeStart = allHours[(offset + hIdx) % allHours.length];
        const key = `${dateIso}_${timeStart}`;
        const catKey = `${dateIso}_${timeStart}_${student.requested_category}`;
        const type = sessionTypes[sessionIdx];

        if (ownKeys.has(key)) continue;
        if (type !== 'code' && sharedPracticalCountMap && (sharedPracticalCountMap.get(catKey) || 0) >= maxPracticalPerSlot) continue;

        const [startHourNum] = timeStart.split(':').map(Number);
        const timeEnd = `${startHourNum + 1 < 10 ? '0' : ''}${startHourNum + 1}:00`;

        let status: ScheduleSlot['status'] = 'scheduled';
        if (type === 'code' && codePassed) status = 'completed';
        else if (type === 'creneau' && creneauPassed) status = 'completed';
        else if (type === 'circulation' && circulationPassed) status = 'completed';
        else if (current < todayRef) {
          status = 'completed';
        }

        const typeLabel = type === 'code' ? 'Code théorique' : type === 'creneau' ? 'Créneau sur piste' : 'Circulation';
        slots.push({
          id: `sc-${student.id}-${sessionIdx + 1}`,
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          category: student.requested_category,
          date: dateIso,
          time_start: timeStart,
          time_end: timeEnd,
          type,
          instructor_name: type === 'code' ? 'M. Amine' : type === 'creneau' ? 'M. Khaled' : 'M. Toufik',
          status,
          notes: `Séance N° ${sessionIdx + 1} / 30 (${typeLabel})`,
        });

        ownKeys.add(key);
        if (type !== 'code' && sharedPracticalCountMap) {
          const catKey = `${dateIso}_${timeStart}_${student.requested_category}`;
          sharedPracticalCountMap.set(catKey, (sharedPracticalCountMap.get(catKey) || 0) + 1);
        }
        sessionIdx++;
        bookedToday++;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start));
}

const RAW_DEFAULT_STUDENTS: Student[] = [
  {
    id: 'st-101',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-101',
    registration_number: '260101',
    deposit_date: '2026-11-05',
    nin: '102199919012345001',
    blood_type: 'O+',
    first_name: 'Amine',
    last_name: 'Khelifi',
    first_name_ar: 'أمين',
    last_name_ar: 'خليفي',
    gender: 'Homme',
    birth_date: '1999-04-12',
    birth_commune: 'Beidha Bordj',
    birth_wilaya: 'Sétif',
    father_name: 'Rachid',
    mother_full_name: 'Salima Bouaziz',
    marital_status: 'Celibataire',
    address_wilaya: 'Sétif',
    address_commune: 'Beidha Bordj',
    address_details: 'Cité 5 Juillet N° 08',
    phone_number: '0661 24 18 90',
    email: 'amine.khelifi@example.com',
    requested_category: 'B',
    total_package_price: 42000,
    amount_paid: 25000,
    availability: { days: ['saturday', 'monday', 'wednesday'], time: 'morning', max_per_day: 2 },
    exams: [
      {
        id: 'ex-101-1',
        student_id: 'st-101',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-19',
        exam_center: 'Centre d\'Examen Aïn Oulmene',
        examiner_name: 'Ing. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-101-2',
        student_id: 'st-101',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-12-03',
        exam_center: 'Piste Auto-École Beidha Bordj',
        examiner_name: 'Ing. Benali',
        result: 'pending',
        fee_amount: 2000,
        fee_paid: true,
      },
    ],
    payments: [
      { id: 'p-101-1', student_id: 'st-101', amount: 15000, date: '2026-11-05', type: 'initial_deposit', method: 'especes', receipt_number: 'REC-101', notes: 'Acompte inscription' },
      { id: 'p-101-2', student_id: 'st-101', amount: 10000, date: '2026-11-18', type: 'installment', method: 'especes', receipt_number: 'REC-109', notes: '2ème tranche' },
    ],
    schedule_slots: [],
  },
  {
    id: 'st-102',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-102',
    registration_number: '260102',
    deposit_date: '2026-11-12',
    nin: '204200319045678002',
    blood_type: 'A+',
    first_name: 'Meriem',
    last_name: 'Bensalem',
    first_name_ar: 'مريم',
    last_name_ar: 'بن سالم',
    gender: 'Femme',
    birth_date: '2003-08-22',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    father_name: 'Karim',
    mother_full_name: 'Nadia Haddadi',
    marital_status: 'Celibataire',
    address_wilaya: 'Sétif',
    address_commune: 'Beidha Bordj',
    address_details: 'Rue des Martyrs N° 14',
    phone_number: '0770 55 31 42',
    requested_category: 'B',
    total_package_price: 42000,
    amount_paid: 20000,
    availability: { days: ['sunday', 'tuesday', 'thursday'], time: 'afternoon', max_per_day: 2 },
    exams: [
      {
        id: 'ex-102-1',
        student_id: 'st-102',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-12-03',
        exam_center: 'Centre d\'Examen Aïn Oulmene',
        examiner_name: 'Ing. Makhloufi',
        result: 'pending',
        fee_amount: 2000,
        fee_paid: true,
      },
    ],
    payments: [
      { id: 'p-102-1', student_id: 'st-102', amount: 20000, date: '2026-11-12', type: 'initial_deposit', method: 'especes', receipt_number: 'REC-104', notes: 'Versement initial' },
    ],
    schedule_slots: [],
  },
  {
    id: 'st-103',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-103',
    registration_number: '260103',
    deposit_date: '2026-10-25',
    nin: '101199519078912003',
    blood_type: 'B+',
    first_name: 'Bilal',
    last_name: 'Haddad',
    first_name_ar: 'بلال',
    last_name_ar: 'حداد',
    gender: 'Homme',
    birth_date: '1995-02-10',
    birth_commune: 'Aïn Oulmene',
    birth_wilaya: 'Sétif',
    father_name: 'Mourad',
    mother_full_name: 'Khadidja Saadi',
    marital_status: 'Marie',
    address_wilaya: 'Sétif',
    address_commune: 'Aïn Oulmene',
    address_details: 'Lotissement El-Wiam N° 03',
    phone_number: '0552 88 19 04',
    requested_category: 'C',
    total_package_price: 55000,
    amount_paid: 55000,
    availability: { days: ['sunday', 'wednesday'], time: 'morning', max_per_day: 2 },
    exams: [
      {
        id: 'ex-103-1',
        student_id: 'st-103',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-05',
        exam_center: 'Centre d\'Examen Aïn Oulmene',
        examiner_name: 'Ing. Makhloufi',
        result: 'passed',
        fee_amount: 3000,
        fee_paid: true,
      },
      {
        id: 'ex-103-2',
        student_id: 'st-103',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-19',
        exam_center: 'Piste Auto-École Beidha Bordj',
        examiner_name: 'Ing. Khelifi',
        result: 'passed',
        fee_amount: 3000,
        fee_paid: true,
      },
      {
        id: 'ex-103-3',
        student_id: 'st-103',
        exam_type: 'circulation',
        attempt_number: 1,
        exam_date: '2026-12-03',
        exam_center: 'Centre d\'Examen Sétif Ville',
        examiner_name: 'Ing. Rahmani',
        result: 'pending',
        fee_amount: 3000,
        fee_paid: true,
      },
    ],
    payments: [
      { id: 'p-103-1', student_id: 'st-103', amount: 30000, date: '2026-10-25', type: 'initial_deposit', method: 'especes', receipt_number: 'REC-098' },
      { id: 'p-103-2', student_id: 'st-103', amount: 25000, date: '2026-11-15', type: 'installment', method: 'virement', receipt_number: 'REC-107' },
    ],
    schedule_slots: [],
  },
  {
    id: 'st-104',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-104',
    registration_number: '260104',
    deposit_date: '2026-11-18',
    nin: '205200419011223004',
    blood_type: 'O-',
    first_name: 'Sara',
    last_name: 'Touati',
    first_name_ar: 'سارة',
    last_name_ar: 'تواتي',
    gender: 'Femme',
    birth_date: '2004-11-03',
    birth_commune: 'El Eulma',
    birth_wilaya: 'Sétif',
    father_name: 'Abdelkader',
    mother_full_name: 'Houria Meziani',
    marital_status: 'Celibataire',
    address_wilaya: 'Sétif',
    address_commune: 'Beidha Bordj',
    address_details: 'Cité El-Moustakbal N° 21',
    phone_number: '0671 33 74 12',
    requested_category: 'B',
    total_package_price: 42000,
    amount_paid: 15000,
    availability: { days: ['saturday', 'tuesday'], time: 'any', max_per_day: 2 },
    exams: [
      {
        id: 'ex-104-1',
        student_id: 'st-104',
        exam_type: 'code',
        attempt_number: 1,
        result: 'pending',
        fee_amount: 2000,
        fee_paid: false,
      },
    ],
    payments: [
      { id: 'p-104-1', student_id: 'st-104', amount: 15000, date: '2026-11-18', type: 'initial_deposit', method: 'especes', receipt_number: 'REC-110' },
    ],
    schedule_slots: [],
  },
  {
    id: 'st-105',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-105',
    registration_number: '260105',
    deposit_date: '2026-11-14',
    nin: '103200019033445005',
    blood_type: 'A-',
    first_name: 'Walid',
    last_name: 'Mansour',
    first_name_ar: 'وليد',
    last_name_ar: 'منصور',
    gender: 'Homme',
    birth_date: '2000-07-19',
    birth_commune: 'Beidha Bordj',
    birth_wilaya: 'Sétif',
    father_name: 'Djamel',
    mother_full_name: 'Zineb Kaci',
    marital_status: 'Celibataire',
    address_wilaya: 'Sétif',
    address_commune: 'Beidha Bordj',
    phone_number: '0558 41 62 09',
    requested_category: 'A',
    total_package_price: 28000,
    amount_paid: 28000,
    availability: { days: ['monday', 'thursday'], time: 'afternoon', max_per_day: 2 },
    exams: [
      {
        id: 'ex-105-1',
        student_id: 'st-105',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-24',
        exam_center: 'Centre d\'Examen Aïn Oulmene',
        examiner_name: 'Ing. Benali',
        result: 'passed',
        fee_amount: 1500,
        fee_paid: true,
      },
      {
        id: 'ex-105-2',
        student_id: 'st-105',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-12-03',
        exam_center: 'Piste Auto-École Beidha Bordj',
        examiner_name: 'Ing. Benali',
        result: 'pending',
        fee_amount: 1500,
        fee_paid: true,
      },
    ],
    payments: [
      { id: 'p-105-1', student_id: 'st-105', amount: 28000, date: '2026-11-14', type: 'initial_deposit', method: 'especes', receipt_number: 'REC-106' },
    ],
    schedule_slots: [],
  },
  {
    id: 'st-106',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-106',
    registration_number: '260106',
    deposit_date: '2026-11-01',
    nin: '201199819055667006',
    blood_type: 'AB+',
    first_name: 'Nour El Houda',
    last_name: 'Brahimi',
    first_name_ar: 'نور الهدى',
    last_name_ar: 'براهيمي',
    gender: 'Femme',
    birth_date: '1998-03-27',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    father_name: 'Said',
    mother_full_name: 'Samira Chaouch',
    marital_status: 'Marie',
    address_wilaya: 'Sétif',
    address_commune: 'Beidha Bordj',
    phone_number: '0664 90 12 34',
    requested_category: 'B',
    total_package_price: 42000,
    amount_paid: 35000,
    availability: { days: ['saturday', 'sunday', 'thursday'], time: 'morning', max_per_day: 2 },
    exams: [
      {
        id: 'ex-106-1',
        student_id: 'st-106',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-11-12',
        exam_center: 'Centre d\'Examen Aïn Oulmene',
        examiner_name: 'Ing. Makhloufi',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-106-2',
        student_id: 'st-106',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-24',
        exam_center: 'Piste Auto-École Beidha Bordj',
        examiner_name: 'Ing. Benali',
        result: 'passed',
        fee_amount: 2000,
        fee_paid: true,
      },
      {
        id: 'ex-106-3',
        student_id: 'st-106',
        exam_type: 'circulation',
        attempt_number: 1,
        result: 'pending',
        fee_amount: 2000,
        fee_paid: false,
      },
    ],
    payments: [
      { id: 'p-106-1', student_id: 'st-106', amount: 20000, date: '2026-11-01', type: 'initial_deposit', method: 'especes', receipt_number: 'REC-099' },
      { id: 'p-106-2', student_id: 'st-106', amount: 15000, date: '2026-11-16', type: 'installment', method: 'especes', receipt_number: 'REC-108' },
    ],
    schedule_slots: [],
  },
  {
    id: 'st-107',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-107',
    registration_number: '260107',
    deposit_date: '2026-10-15',
    nin: '101199219088991007',
    blood_type: 'O+',
    first_name: 'Riad',
    last_name: 'Zerguine',
    first_name_ar: 'رياض',
    last_name_ar: 'زرقين',
    gender: 'Homme',
    birth_date: '1992-09-05',
    birth_commune: 'Sétif',
    birth_wilaya: 'Sétif',
    father_name: 'Taher',
    mother_full_name: 'Malika Boudiaf',
    marital_status: 'Marie',
    address_wilaya: 'Sétif',
    address_commune: 'Aïn Oulmene',
    phone_number: '0771 65 43 21',
    requested_category: 'D',
    total_package_price: 60000,
    amount_paid: 60000,
    availability: { days: ['saturday', 'monday', 'wednesday'], time: 'morning', max_per_day: 2 },
    exams: [
      {
        id: 'ex-107-1',
        student_id: 'st-107',
        exam_type: 'code',
        attempt_number: 1,
        exam_date: '2026-10-29',
        exam_center: 'Centre d\'Examen Sétif Ville',
        result: 'passed',
        fee_amount: 3500,
        fee_paid: true,
      },
      {
        id: 'ex-107-2',
        student_id: 'st-107',
        exam_type: 'creneau',
        attempt_number: 1,
        exam_date: '2026-11-10',
        exam_center: 'Centre d\'Examen Sétif Ville',
        result: 'passed',
        fee_amount: 3500,
        fee_paid: true,
      },
      {
        id: 'ex-107-3',
        student_id: 'st-107',
        exam_type: 'circulation',
        attempt_number: 1,
        exam_date: '2026-11-24',
        exam_center: 'Centre d\'Examen Sétif Ville',
        examiner_name: 'Ing. Rahmani',
        result: 'passed',
        fee_amount: 3500,
        fee_paid: true,
      },
    ],
    payments: [
      { id: 'p-107-1', student_id: 'st-107', amount: 60000, date: '2026-10-15', type: 'initial_deposit', method: 'cheque', receipt_number: 'REC-095' },
    ],
    schedule_slots: [],
  },
  {
    id: 'st-108',
    school_id: 'school-1',
    dossier_number: 'DOS-2026-108',
    registration_number: '260108',
    deposit_date: '2026-11-20',
    nin: '204200119022334008',
    blood_type: 'B-',
    first_name: 'Lina',
    last_name: 'Boumediene',
    first_name_ar: 'لينة',
    last_name_ar: 'بومدين',
    gender: 'Femme',
    birth_date: '2001-12-11',
    birth_commune: 'El Eulma',
    birth_wilaya: 'Sétif',
    father_name: 'Nabil',
    mother_full_name: 'Amina Guerfi',
    marital_status: 'Celibataire',
    address_wilaya: 'Sétif',
    address_commune: 'Beidha Bordj',
    phone_number: '0669 17 28 39',
    requested_category: 'BE',
    total_package_price: 48000,
    amount_paid: 22000,
    availability: { days: ['monday', 'wednesday'], time: 'morning', max_per_day: 2 },
    exams: [
      {
        id: 'ex-108-1',
        student_id: 'st-108',
        exam_type: 'code',
        attempt_number: 1,
        result: 'pending',
        fee_amount: 2500,
        fee_paid: false,
      },
    ],
    payments: [
      { id: 'p-108-1', student_id: 'st-108', amount: 22000, date: '2026-11-20', type: 'initial_deposit', method: 'especes', receipt_number: 'REC-111' },
    ],
    schedule_slots: [],
  },
];

const DEFAULT_STUDENTS: Student[] = (() => {
  const sharedPracticalCountMap = new Map<string, number>();
  return RAW_DEFAULT_STUDENTS.map((st, idx) => {
    const activeForCat = DEFAULT_VEHICLES.filter(v => v.is_active && v.category === st.requested_category).length;
    const cap = Math.max(1, activeForCat) * 3;
    return {
      ...st,
      schedule_slots: ensureFull30HourSlots(st, idx, sharedPracticalCountMap, cap),
    };
  });
})();

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-101',
    timestamp: '2026-11-24T15:30:00Z',
    user_role: 'owner',
    action: 'record_result',
    target_type: 'exam',
    target_id: 'ex-107-3',
    target_name: 'Riad Zerguine',
    details: 'Validation finale Circulation Catégorie D : Admis (Permis obtenu)',
  },
  {
    id: 'log-102',
    timestamp: '2026-11-24T11:15:00Z',
    user_role: 'owner',
    action: 'record_result',
    target_type: 'exam',
    target_id: 'ex-106-2',
    target_name: 'Nour El Houda Brahimi',
    details: 'Résultat examen Créneau : Admis (Tentative #1)',
  },
  {
    id: 'log-103',
    timestamp: '2026-11-20T10:00:00Z',
    user_role: 'secretary',
    action: 'create',
    target_type: 'candidate',
    target_id: 'st-108',
    target_name: 'Lina Boumediene',
    details: 'Création du dossier DOS-2026-108 (Permis BE) et planning 30h sur 6h/jour',
  },
];

const DEFAULT_MENTORS: Mentor[] = [
  {
    id: 'm-1',
    name: 'M. Amine',
    phone: '0551 22 33 44',
    specialties: ['code'],
    license_categories: ['A1', 'A', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE', 'F'],
    is_active: true,
  },
  {
    id: 'm-2',
    name: 'M. Khaled',
    phone: '0662 33 44 55',
    specialties: ['creneau', 'circulation'],
    license_categories: ['B', 'BE', 'A', 'A1', 'F'],
    is_active: true,
  },
  {
    id: 'm-3',
    name: 'M. Toufik',
    phone: '0773 44 55 66',
    specialties: ['creneau', 'circulation'],
    license_categories: ['B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D', 'DE'],
    is_active: true,
  },
];

const KrenoContext = createContext<KrenoContextType | undefined>(undefined);

export function KrenoProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [palette, setPaletteState] = useState<ColorPalette>('ocean');
  const [lang, setLangState] = useState<'fr' | 'ar'>('fr');
  const [userRole, setUserRoleState] = useState<UserRole>('owner');
  const [accountRole, setAccountRole] = useState<UserRole>('owner');
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const dbHydratedRef = useRef(false);
  const skipNextSchoolSyncRef = useRef(true);
  const prevStudentsRef = useRef<Map<string, Student>>(new Map());
  const activeSchoolIdRef = useRef<string | null>(null);
  const realtimeChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBundleForSchool = async (sid: string) => {
    setSyncStatus('syncing');
    try {
      const bundle = await fetchSchoolBundle(sid);
      if (bundle) {
        skipNextSchoolSyncRef.current = true;
        if (bundle.school) {
          setSchool(prev => ({ ...prev, ...bundle.school, id: sid }));
        }
        if (bundle.settings && Object.keys(bundle.settings).length > 0) {
          setSettings(prev => ({ ...prev, ...bundle.settings }));
        }
        setMentors(bundle.mentors);
        setVehicles(bundle.vehicles);
        setEngineers(bundle.engineers);
        setStudents(bundle.students);
        setAuditLogs(bundle.auditLogs);
        prevStudentsRef.current = new Map(bundle.students.map(s => [s.id, s]));
        dbHydratedRef.current = true;
        setSyncStatus('synced');
      }
    } catch {
      setSyncStatus('error');
    }
  };

  const refreshFromSupabase = async () => {
    if (activeSchoolIdRef.current && isUuid(activeSchoolIdRef.current)) {
      await loadBundleForSchool(activeSchoolIdRef.current);
    }
  };
  const [school, setSchool] = useState<School>(DEFAULT_SCHOOL);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [mentors, setMentors] = useState<Mentor[]>(DEFAULT_MENTORS);
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

      // Sync authenticated Supabase user, role, school_id & Postgres bundle
      const supabase = createClient();
      supabase.auth.getUser().then(async ({ data }) => {
        if (data.user) {
          setAuthEmail(data.user.email || null);
          const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role;
          const resolvedRole: UserRole = metaRole === 'secretary' ? 'secretary' : 'owner';
          setAccountRole(resolvedRole);
          if (resolvedRole === 'secretary') {
            setUserRoleState('secretary');
          }
          const metaSchoolId =
            data.user.app_metadata?.school_id || data.user.user_metadata?.school_id;
          if (typeof metaSchoolId === 'string' && isUuid(metaSchoolId.trim())) {
            const sid = metaSchoolId.trim();
            activeSchoolIdRef.current = sid;
            await loadBundleForSchool(sid);

            // Remove any prior channel instance (prevents StrictMode double-mount error)
            const channelName = `school-sync-${sid}`;
            const existingChannels = supabase.getChannels().filter(c => c.topic === `realtime:${channelName}`);
            for (const ch of existingChannels) {
              await supabase.removeChannel(ch);
            }

            // Live Realtime sync across Owner & Secretary PCs
            const scheduleRefresh = () => {
              if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
              realtimeTimerRef.current = setTimeout(() => {
                loadBundleForSchool(sid);
              }, 500);
            };

            const ch = supabase
              .channel(`${channelName}-${Date.now()}`)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `school_id=eq.${sid}` }, scheduleRefresh)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_slots', filter: `school_id=eq.${sid}` }, scheduleRefresh)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'exams', filter: `school_id=eq.${sid}` }, scheduleRefresh)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `school_id=eq.${sid}` }, scheduleRefresh)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'mentors', filter: `school_id=eq.${sid}` }, scheduleRefresh)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles', filter: `school_id=eq.${sid}` }, scheduleRefresh)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'engineers', filter: `school_id=eq.${sid}` }, scheduleRefresh)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'schools', filter: `id=eq.${sid}` }, scheduleRefresh)
              .subscribe();
            realtimeChannelRef.current = ch;
          }
        }
      });

      const DATA_VERSION = 'v3_3per_car_6h_2026_11_26';
      if (localStorage.getItem('kreno_data_version') !== DATA_VERSION) {
        localStorage.removeItem('kreno_students');
        localStorage.removeItem('kreno_vehicles');
        localStorage.removeItem('kreno_audit_logs');
        localStorage.removeItem('kreno_settings');
        localStorage.setItem('kreno_data_version', DATA_VERSION);
      }

      const savedStudents = localStorage.getItem('kreno_students');
      if (savedStudents) {
        const parsed = JSON.parse(savedStudents);
        if (Array.isArray(parsed)) {
          // Guarantee all candidate profiles have availability & complete 30h syllabus
          const populated = parsed.map((st: Student, idx: number) => ({
            ...st,
            availability: st.availability || SAMPLE_AVAILABILITIES[idx % SAMPLE_AVAILABILITIES.length],
            schedule_slots: ensureFull30HourSlots(st, idx),
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

      const savedMentors = localStorage.getItem('kreno_mentors');
      if (savedMentors) {
        setMentors(JSON.parse(savedMentors));
      } else {
        localStorage.setItem('kreno_mentors', JSON.stringify(DEFAULT_MENTORS));
      }

      const savedSettings = localStorage.getItem('kreno_settings');
      if (savedSettings) {
        const parsedSettings: SchoolSettings = JSON.parse(savedSettings);
        // Migrate legacy 7h/8h schedule settings to the 6-hour daily schedule (08h-12h, 14h-16h)
        if (parsedSettings.end_hour === '17:00' || parsedSettings.lunch_break_end === '13:00') {
          const migrated: SchoolSettings = {
            ...parsedSettings,
            end_hour: '16:00',
            lunch_break_end: '14:00',
            libre_hour: parsedSettings.libre_hour === '16:00' ? '' : (parsedSettings.libre_hour || ''),
            max_hours_per_day: Math.min(parsedSettings.max_hours_per_day ?? 6, 6),
          };
          setSettings(migrated);
          localStorage.setItem('kreno_settings', JSON.stringify(migrated));
        } else {
          setSettings(parsedSettings);
        }
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
    return () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      if (realtimeChannelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, []);

  // Auto-sync changed students to Supabase Postgres
  useEffect(() => {
    if (!dbHydratedRef.current || !isUuid(school.id)) return;
    students.forEach(st => {
      if (prevStudentsRef.current.get(st.id) !== st) {
        dbUpsertStudentFull(school.id, st);
      }
    });
    prevStudentsRef.current = new Map(students.map(s => [s.id, s]));
  }, [students, school.id]);

  // Auto-sync school profile & settings to Supabase Postgres
  useEffect(() => {
    if (!dbHydratedRef.current || !isUuid(school.id)) return;
    if (skipNextSchoolSyncRef.current) {
      skipNextSchoolSyncRef.current = false;
      return;
    }
    dbSaveSchoolAndSettings(school, settings);
  }, [school, settings]);

  const addEngineer = (name: string, title?: string, phone?: string): Ingenieur => {
    const newEng: Ingenieur = {
      id: crypto.randomUUID(),
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
    dbUpsertEngineer(school.id, newEng);
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
    dbInsertAuditLog(school.id, entry);
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
    if (accountRole === 'secretary' && newRole === 'owner') return;
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

  const addMentor = (mentorData: Omit<Mentor, 'id'>): Mentor => {
    const newMentor: Mentor = {
      ...mentorData,
      id: crypto.randomUUID(),
    };
    setMentors(prev => {
      const updated = [...prev, newMentor];
      localStorage.setItem('kreno_mentors', JSON.stringify(updated));
      return updated;
    });
    dbUpsertMentor(school.id, newMentor);
    logAction('create', 'settings', newMentor.id, newMentor.name, `Ajout du moniteur ${newMentor.name}`);
    return newMentor;
  };

  const updateMentor = (id: string, updated: Partial<Mentor>) => {
    const oldMentor = mentors.find(m => m.id === id);
    setMentors(prev => {
      const updatedList = prev.map(m => m.id === id ? { ...m, ...updated } : m);
      localStorage.setItem('kreno_mentors', JSON.stringify(updatedList));
      const next = updatedList.find(m => m.id === id);
      if (next) dbUpsertMentor(school.id, next);
      return updatedList;
    });
    if (oldMentor && updated.name && updated.name.trim() && updated.name.trim() !== oldMentor.name) {
      const newName = updated.name.trim();
      setStudents(prev => {
        const updatedStudents = prev.map(st => ({
          ...st,
          schedule_slots: (st.schedule_slots || []).map(sc =>
            sc.instructor_name === oldMentor.name ? { ...sc, instructor_name: newName } : sc
          ),
        }));
        localStorage.setItem('kreno_students', JSON.stringify(updatedStudents));
        return updatedStudents;
      });
    }
    logAction('update', 'settings', id, updated.name || oldMentor?.name || 'Moniteur', 'Mise à jour du profil moniteur');
  };

  const deleteMentor = (id: string) => {
    const target = mentors.find(m => m.id === id);
    setMentors(prev => {
      const updatedList = prev.filter(m => m.id !== id);
      localStorage.setItem('kreno_mentors', JSON.stringify(updatedList));
      return updatedList;
    });
    dbDeleteMentor(school.id, id);
    logAction('delete', 'settings', id, target?.name || 'Moniteur', 'Suppression du moniteur');
  };

  const getSlotCapacityLimit = (type: SessionDiscipline, category: LicenseCategory): number => {
    const rule = settings.capacity_rules?.[category] || DEFAULT_SETTINGS.capacity_rules?.[category];
    if (rule && typeof rule[type] === 'number') {
      return Math.max(1, rule[type]);
    }
    if (type === 'code') return 10;
    return settings.candidates_per_vehicle ?? 3;
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
      id: crypto.randomUUID(),
    };
    setVehicles(prev => {
      const updated = [...prev, newVehicle];
      localStorage.setItem('kreno_vehicles', JSON.stringify(updated));
      return updated;
    });
    dbUpsertVehicle(school.id, newVehicle);
    logAction('create', 'settings', newVehicle.id, `${newVehicle.brand} ${newVehicle.model}`, `Ajout du véhicule matriculé ${newVehicle.plate_number}`);
    return newVehicle;
  };

  const updateVehicle = (id: string, updated: Partial<Vehicle>) => {
    setVehicles(prev => {
      const updatedList = prev.map(v => v.id === id ? { ...v, ...updated } : v);
      localStorage.setItem('kreno_vehicles', JSON.stringify(updatedList));
      const next = updatedList.find(v => v.id === id);
      if (next) dbUpsertVehicle(school.id, next);
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
    dbDeleteVehicle(school.id, id);
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

  // Automatic 30-Hour Conflict-Free Schedule Generator & Reflow
  // Preserves finalized slots (completed/absent/cancelled) and reflows only remaining 'scheduled' slots
  const generateScheduleForStudent = (
    student: Student,
    preferredDays?: DayOfWeek[],
    preferredTime?: 'morning' | 'afternoon' | 'any',
    startDateStr?: string,
    maxPerDay: number = 2
  ): ScheduleSlot[] => {
    const existingSlots = student.schedule_slots || [];
    const preservedSlots = existingSlots.filter(
      (s) => s.status === 'completed' || s.status === 'absent' || s.status === 'cancelled'
    );
    const existingScheduled = existingSlots.filter((s) => s.status === 'scheduled');

    // Determine remaining session types to schedule
    let sessionTypesToSchedule: Array<{ type: 'code' | 'creneau' | 'circulation'; existingId?: string; instructor?: string; notes?: string }>;
    if (existingSlots.length > 0 && existingScheduled.length > 0) {
      sessionTypesToSchedule = existingScheduled.map((s) => ({
        type: s.type,
        existingId: s.id,
        instructor: s.instructor_name,
        notes: s.notes,
      }));
    } else if (preservedSlots.length >= 30) {
      return preservedSlots;
    } else {
      const doneCode = preservedSlots.filter((s) => s.type === 'code').length;
      const doneCreneau = preservedSlots.filter((s) => s.type === 'creneau').length;
      const doneCirc = preservedSlots.filter((s) => s.type === 'circulation').length;
      sessionTypesToSchedule = [
        ...Array(Math.max(0, 10 - doneCode)).fill({ type: 'code' as const }),
        ...Array(Math.max(0, 10 - doneCreneau)).fill({ type: 'creneau' as const }),
        ...Array(Math.max(0, 10 - doneCirc)).fill({ type: 'circulation' as const }),
      ];
    }

    const newScheduledSlots: ScheduleSlot[] = [];
    const dayMap: Record<number, DayOfWeek> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    // Separate conflict tracking per (date, time_start, instructor_name):
    // - A mentor at a given hour is locked to ONE vehicle/category & activity for practical lessons (creneau/circulation),
    //   so they CANNOT teach 2 Cat.B + 1 Cat.C at the same hour, nor mix creneau & circulation.
    // - For Code, a mentor can teach a classroom group across categories up to the code limit.
    const slotMentorEntriesMap = new Map<string, Array<{ type: SessionDiscipline; category: LicenseCategory }>>();
    const mentorDayHoursMap = new Map<string, Set<string>>();
    students.forEach(st => {
      (st.schedule_slots || []).forEach(slot => {
        if (slot.status !== 'cancelled' && slot.status !== 'absent') {
          if (st.id !== student.id) {
            const mKey = `${slot.date}_${slot.time_start}_${slot.instructor_name}`;
            const arr = slotMentorEntriesMap.get(mKey) || [];
            arr.push({ type: slot.type, category: slot.category });
            slotMentorEntriesMap.set(mKey, arr);
            const mdKey = `${slot.date}_${slot.instructor_name}`;
            if (!mentorDayHoursMap.has(mdKey)) mentorDayHoursMap.set(mdKey, new Set());
            mentorDayHoursMap.get(mdKey)!.add(slot.time_start);
          }
        }
      });
    });

    const canMentorTake = (
      existing: Array<{ type: SessionDiscipline; category: LicenseCategory }>,
      newType: SessionDiscipline,
      newCat: LicenseCategory,
      limit: number
    ) => {
      if (existing.length >= limit) return false;
      if (existing.length === 0) return true;
      if (newType === 'code') return existing.every(s => s.type === 'code');
      return existing.every(s => s.type === newType && s.category === newCat);
    };

    const getEligibleMentors = (type: SessionDiscipline, category: LicenseCategory): Mentor[] => {
      const exact = mentors.filter(
        m => m.is_active && m.specialties.includes(type) && m.license_categories.includes(category)
      );
      if (exact.length > 0) return exact;
      const bySpecialty = mentors.filter(m => m.is_active && m.specialties.includes(type));
      if (bySpecialty.length > 0) return bySpecialty;
      return mentors.filter(m => m.is_active);
    };

    const studentOwnSlots = new Set<string>();
    preservedSlots.forEach((slot) => {
      studentOwnSlots.add(`${slot.date}_${slot.time_start}`);
    });

    // Local date parsing (avoids UTC midnight off-by-one day shift)
    let currentDate: Date;
    if (startDateStr && /^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
      const [sy, sm, sd] = startDateStr.split('-').map(Number);
      currentDate = new Date(sy, sm - 1, sd);
    } else {
      currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1);
    }
    currentDate.setHours(0, 0, 0, 0);

    const allowedDays = preferredDays && preferredDays.length > 0
      ? preferredDays.filter(d => settings.working_days.includes(d))
      : settings.working_days;

    // Build working hours from school settings, excluding lunch break and optional Libre hour
    const startH = parseInt((settings.start_hour || '08:00').split(':')[0], 10);
    const endH = parseInt((settings.end_hour || '16:00').split(':')[0], 10);
    const lunchStart = settings.lunch_break_start || '12:00';
    const lunchEnd = settings.lunch_break_end || '14:00';
    const libreHour = settings.libre_hour || '';
    const maxHoursPerDay = settings.max_hours_per_day ?? 6;

    const allHours: string[] = [];
    for (let h = startH; h < endH; h++) {
      const t = `${String(h).padStart(2, '0')}:00`;
      if (t >= lunchStart && t < lunchEnd) continue;
      if (libreHour && t === libreHour) continue;
      allHours.push(t);
    }

    const morningHours = allHours.filter(t => t < lunchStart);
    const afternoonHours = allHours.filter(t => t >= lunchEnd);

    const possibleHours =
      preferredTime === 'morning' && morningHours.length > 0
        ? morningHours
        : preferredTime === 'afternoon' && afternoonHours.length > 0
        ? afternoonHours
        : allHours;

    let sessionIdx = 0;
    let dayScanCount = 0;

    // Scan up to 420 days (~60 weeks) so even 1 day/week schedules all 30 hours completely
    while (sessionIdx < sessionTypesToSchedule.length && dayScanCount < 420 && allowedDays.length > 0) {
      dayScanCount++;
      const dayOfWeek = dayMap[currentDate.getDay()];
      const yy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const dateIso = `${yy}-${mm}-${dd}`;

      const isWorkingDay = allowedDays.includes(dayOfWeek);
      const isFullDayClosed = settings.unavailable_periods.some(
        p => p.date === dateIso && p.period === 'full_day'
      );
      const isMorningClosed = settings.unavailable_periods.some(
        p => p.date === dateIso && p.period === 'morning'
      );
      const isAfternoonClosed = settings.unavailable_periods.some(
        p => p.date === dateIso && p.period === 'afternoon'
      );

      if (isWorkingDay && !isFullDayClosed) {
        let bookedToday = 0;

        for (const timeStart of possibleHours) {
          if (sessionIdx >= sessionTypesToSchedule.length || bookedToday >= maxPerDay) break;
          if (isMorningClosed && timeStart < lunchStart) continue;
          if (isAfternoonClosed && timeStart >= lunchEnd) continue;

          const item = sessionTypesToSchedule[sessionIdx];
          const currentType = item.type;
          const key = `${dateIso}_${timeStart}`;
          const isTakenByStudent = studentOwnSlots.has(key);
          const capLimit = getSlotCapacityLimit(currentType, student.requested_category);
          const eligible = getEligibleMentors(currentType, student.requested_category);
          const orderedEligible = item.instructor
            ? [
                ...eligible.filter(m => m.name === item.instructor),
                ...eligible.filter(m => m.name !== item.instructor),
              ]
            : eligible;

          // Find an eligible mentor who still has room, has not hit their daily hour cap, and has no conflicting category/type at this hour
          let chosenMentorName: string | null = null;
          if (!isTakenByStudent) {
            for (const m of orderedEligible) {
              const mdKey = `${dateIso}_${m.name}`;
              const mentorHours = mentorDayHoursMap.get(mdKey) || new Set<string>();
              if (!mentorHours.has(timeStart) && mentorHours.size >= maxHoursPerDay) continue;

              const mKey = `${dateIso}_${timeStart}_${m.name}`;
              const existingAtHour = slotMentorEntriesMap.get(mKey) || [];
              if (canMentorTake(existingAtHour, currentType, student.requested_category, capLimit)) {
                chosenMentorName = m.name;
                break;
              }
            }
          }

          if (!isTakenByStudent && chosenMentorName) {
            const [startHourNum] = timeStart.split(':').map(Number);
            const endHourNum = startHourNum + 1;
            const timeEnd = `${endHourNum < 10 ? '0' : ''}${endHourNum}:00`;

            newScheduledSlots.push({
              id: item.existingId || crypto.randomUUID(),
              student_id: student.id,
              student_name: `${student.first_name} ${student.last_name}`,
              category: student.requested_category,
              date: dateIso,
              time_start: timeStart,
              time_end: timeEnd,
              type: currentType,
              instructor_name: chosenMentorName,
              status: 'scheduled',
              notes: item.notes || `Séance N° ${preservedSlots.length + sessionIdx + 1} / 30 (${currentType === 'code' ? 'Code théorique' : currentType === 'creneau' ? 'Créneau sur piste' : 'Circulation'})`,
            });

            studentOwnSlots.add(key);
            const mdKey = `${dateIso}_${chosenMentorName}`;
            if (!mentorDayHoursMap.has(mdKey)) mentorDayHoursMap.set(mdKey, new Set());
            mentorDayHoursMap.get(mdKey)!.add(timeStart);
            const mKey = `${dateIso}_${timeStart}_${chosenMentorName}`;
            const arr = slotMentorEntriesMap.get(mKey) || [];
            arr.push({ type: currentType, category: student.requested_category });
            slotMentorEntriesMap.set(mKey, arr);
            sessionIdx++;
            bookedToday++;
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return [...preservedSlots, ...newScheduledSlots].sort(
      (a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start)
    );
  };

  // Add new Student with optional availability preferences
  const addStudent = (studentData: Omit<Student, 'id' | 'exams' | 'schedule_slots' | 'payments'>): Student => {
    const studentId = crypto.randomUUID();
    const initialPayment: PaymentRecord[] = studentData.amount_paid > 0 ? [
      {
        id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
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
    dbDeleteStudent(school.id, id);
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
      id: crypto.randomUUID(),
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

  const addScheduleSlot = (
    studentId: string,
    date: string,
    timeStart: string,
    timeEnd: string,
    type: SessionDiscipline,
    instructorName: string
  ): { ok: boolean; error?: string } => {
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return { ok: false, error: 'Candidat introuvable.' };

    const mentor = mentors.find(m => m.name === instructorName);
    if (
      !mentor ||
      !mentor.is_active ||
      !mentor.specialties.includes(type) ||
      !mentor.license_categories.includes(targetStudent.requested_category)
    ) {
      return { ok: false, error: `${instructorName} n'est pas habilité pour cette discipline/catégorie.` };
    }

    const studentBusy = (targetStudent.schedule_slots || []).some(
      sc => sc.status !== 'cancelled' && sc.status !== 'absent' && sc.date === date && sc.time_start === timeStart
    );
    if (studentBusy) {
      return { ok: false, error: `${targetStudent.first_name} ${targetStudent.last_name} a déjà une séance à ${timeStart}.` };
    }

    const mentorSlotsAtTarget = students.flatMap(st =>
      (st.schedule_slots || []).filter(
        sc =>
          sc.instructor_name === instructorName &&
          sc.status !== 'cancelled' &&
          sc.status !== 'absent' &&
          sc.date === date &&
          sc.time_start === timeStart
      )
    );
    const hasIncompatible =
      type === 'code'
        ? mentorSlotsAtTarget.some(sc => sc.type !== 'code')
        : mentorSlotsAtTarget.some(sc => sc.type !== type || sc.category !== targetStudent.requested_category);
    if (hasIncompatible) {
      return { ok: false, error: `${instructorName} encadre déjà une autre discipline ou catégorie à ${timeStart}.` };
    }

    const capLimit = getSlotCapacityLimit(type, targetStudent.requested_category);
    if (mentorSlotsAtTarget.length >= capLimit) {
      return { ok: false, error: `${instructorName} est complet (${mentorSlotsAtTarget.length}/${capLimit}) à ${timeStart}.` };
    }

    const newSlot: ScheduleSlot = {
      id: crypto.randomUUID(),
      student_id: targetStudent.id,
      student_name: `${targetStudent.first_name} ${targetStudent.last_name}`,
      category: targetStudent.requested_category,
      date,
      time_start: timeStart,
      time_end: timeEnd,
      type,
      instructor_name: instructorName,
      status: 'scheduled',
      notes: 'Séance ajoutée manuellement',
    };

    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        const updatedSlots = [...(s.schedule_slots || []), newSlot].sort(
          (a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start)
        );
        return { ...s, schedule_slots: updatedSlots };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });

    logAction(
      'create',
      'schedule',
      newSlot.id,
      `${targetStudent.first_name} ${targetStudent.last_name}`,
      `Ajout manuel d'une séance (${type}) le ${date} à ${timeStart} avec ${instructorName}`
    );
    return { ok: true };
  };

  const deleteScheduleSlot = (studentId: string, slotId: string) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        const target = s.schedule_slots.find(sc => sc.id === slotId);
        const refund = target?.billing_type === 'paid_extra' && target.extra_fee ? target.extra_fee : 0;
        return {
          ...s,
          total_package_price: Math.max(0, s.total_package_price - refund),
          schedule_slots: s.schedule_slots.filter(sc => sc.id !== slotId),
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });
  };

  const updateScheduleSlot = (studentId: string, slotId: string, updatedSlot: Partial<ScheduleSlot>) => {
    setStudents(prev => {
      const targetStudent = prev.find(s => s.id === studentId);
      const currentSlot = targetStudent?.schedule_slots.find(sc => sc.id === slotId);
      if (!targetStudent || !currentSlot) return prev;

      const targetDate = updatedSlot.date ?? currentSlot.date;
      const targetTime = updatedSlot.time_start ?? currentSlot.time_start;
      const targetStatus = updatedSlot.status ?? currentSlot.status;
      const targetInstructor = updatedSlot.instructor_name ?? currentSlot.instructor_name;
      const targetType = updatedSlot.type ?? currentSlot.type;
      const targetCategory = updatedSlot.category ?? currentSlot.category;

      // Enforce: if changing mentor, target mentor must be active and qualified for (type, category)
      if (updatedSlot.instructor_name && updatedSlot.instructor_name !== currentSlot.instructor_name) {
        const targetMentor = mentors.find(m => m.name === updatedSlot.instructor_name);
        if (
          !targetMentor ||
          !targetMentor.is_active ||
          !targetMentor.specialties.includes(targetType) ||
          !targetMentor.license_categories.includes(targetCategory)
        ) {
          return prev;
        }
      }

      if (targetStatus !== 'cancelled' && targetStatus !== 'absent') {
        // Enforce: the same candidate can NEVER be placed twice in the same (date, time_start) hour
        const hasSamePersonAtHour = targetStudent.schedule_slots.some(
          sc =>
            sc.id !== slotId &&
            sc.status !== 'cancelled' &&
            sc.status !== 'absent' &&
            sc.date === targetDate &&
            sc.time_start === targetTime
        );
        if (hasSamePersonAtHour) {
          return prev;
        }

        // Enforce: mentor physical exclusivity & capacity at target (date, time_start)
        const isReschedulingOrReassigning =
          targetDate !== currentSlot.date ||
          targetTime !== currentSlot.time_start ||
          targetInstructor !== currentSlot.instructor_name ||
          (currentSlot.status === 'cancelled' || currentSlot.status === 'absent');

        if (isReschedulingOrReassigning) {
          const mentorSlotsAtTarget = prev.flatMap(st =>
            (st.schedule_slots || []).filter(
              sc =>
                sc.id !== slotId &&
                sc.instructor_name === targetInstructor &&
                sc.status !== 'cancelled' &&
                sc.status !== 'absent' &&
                sc.date === targetDate &&
                sc.time_start === targetTime
            )
          );
          const hasIncompatible =
            targetType === 'code'
              ? mentorSlotsAtTarget.some(sc => sc.type !== 'code')
              : mentorSlotsAtTarget.some(sc => sc.type !== targetType || sc.category !== targetCategory);
          if (hasIncompatible) {
            return prev;
          }
          const capLimit = getSlotCapacityLimit(targetType, targetCategory);
          if (mentorSlotsAtTarget.length >= capLimit) {
            return prev;
          }
        }
      }

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

  // Helper: Find the next conflict-free 1h slot for a single makeup/extra session
  const findNextAvailableSlot = (
    allStudents: Student[],
    targetStudent: Student,
    sessionType: 'code' | 'creneau' | 'circulation',
    afterDateIso: string,
    preferredInstructor?: string
  ): { date: string; time_start: string; time_end: string; instructor_name: string } | null => {
    const dayMap: Record<number, DayOfWeek> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    const capLimit = getSlotCapacityLimit(sessionType, targetStudent.requested_category);
    const baseEligibleMentors = (() => {
      const exact = mentors.filter(
        m => m.is_active && m.specialties.includes(sessionType) && m.license_categories.includes(targetStudent.requested_category)
      );
      if (exact.length > 0) return exact;
      const bySpec = mentors.filter(m => m.is_active && m.specialties.includes(sessionType));
      if (bySpec.length > 0) return bySpec;
      return mentors.filter(m => m.is_active);
    })();
    const eligibleMentors = preferredInstructor
      ? [
          ...baseEligibleMentors.filter(m => m.name === preferredInstructor),
          ...baseEligibleMentors.filter(m => m.name !== preferredInstructor),
        ]
      : baseEligibleMentors;

    const slotMentorEntriesMap = new Map<string, Array<{ type: SessionDiscipline; category: LicenseCategory }>>();
    const mentorDayHoursMap = new Map<string, Set<string>>();
    const studentOwnSlots = new Set<string>();

    allStudents.forEach(st => {
      (st.schedule_slots || []).forEach(slot => {
        if (slot.status !== 'cancelled' && slot.status !== 'absent') {
          if (st.id === targetStudent.id) {
            studentOwnSlots.add(`${slot.date}_${slot.time_start}`);
          } else {
            const mKey = `${slot.date}_${slot.time_start}_${slot.instructor_name}`;
            const arr = slotMentorEntriesMap.get(mKey) || [];
            arr.push({ type: slot.type, category: slot.category });
            slotMentorEntriesMap.set(mKey, arr);
            const mdKey = `${slot.date}_${slot.instructor_name}`;
            if (!mentorDayHoursMap.has(mdKey)) mentorDayHoursMap.set(mdKey, new Set());
            mentorDayHoursMap.get(mdKey)!.add(slot.time_start);
          }
        }
      });
    });

    const startH = parseInt((settings.start_hour || '08:00').split(':')[0], 10);
    const endH = parseInt((settings.end_hour || '16:00').split(':')[0], 10);
    const lunchStart = settings.lunch_break_start || '12:00';
    const lunchEnd = settings.lunch_break_end || '14:00';
    const libreHour = settings.libre_hour || '';
    const maxHoursPerDay = settings.max_hours_per_day ?? 6;

    const allHours: string[] = [];
    for (let h = startH; h < endH; h++) {
      const t = `${String(h).padStart(2, '0')}:00`;
      if (t >= lunchStart && t < lunchEnd) continue;
      if (libreHour && t === libreHour) continue;
      allHours.push(t);
    }

    const prefTime = targetStudent.availability?.time || 'any';
    const morningHours = allHours.filter(t => t < lunchStart);
    const afternoonHours = allHours.filter(t => t >= lunchEnd);
    const orderedHours =
      prefTime === 'morning'
        ? [...morningHours, ...afternoonHours]
        : prefTime === 'afternoon'
        ? [...afternoonHours, ...morningHours]
        : allHours;

    const workingDays = settings.working_days.length > 0
      ? settings.working_days
      : (['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as DayOfWeek[]);
    const preferredDays = targetStudent.availability?.days?.filter(d => workingDays.includes(d));
    const allowedDays = preferredDays && preferredDays.length > 0 ? preferredDays : workingDays;

    // Start scanning from the day after the missed/cancelled session (or tomorrow if in the past)
    const [ay, am, ad] = afterDateIso.split('-').map(Number);
    const scanStart = Number.isFinite(ay) ? new Date(ay, am - 1, ad + 1) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scanStart < today) {
      scanStart.setTime(today.getTime());
      scanStart.setDate(scanStart.getDate() + 1);
    }
    scanStart.setHours(0, 0, 0, 0);

    for (let pass = 0; pass < 2; pass++) {
      const daysToUse = pass === 0 ? allowedDays : workingDays;
      const d = new Date(scanStart);
      for (let i = 0; i < 180; i++) {
        const dayOfWeek = dayMap[d.getDay()];
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateIso = `${yy}-${mm}-${dd}`;

        const isFullDayClosed = settings.unavailable_periods.some(p => p.date === dateIso && p.period === 'full_day');
        const isMorningClosed = settings.unavailable_periods.some(p => p.date === dateIso && p.period === 'morning');
        const isAfternoonClosed = settings.unavailable_periods.some(p => p.date === dateIso && p.period === 'afternoon');

        if (daysToUse.includes(dayOfWeek) && !isFullDayClosed) {
          for (const timeStart of orderedHours) {
            if (isMorningClosed && timeStart < lunchStart) continue;
            if (isAfternoonClosed && timeStart >= lunchEnd) continue;

            const key = `${dateIso}_${timeStart}`;
            const isTakenByStudent = studentOwnSlots.has(key);
            if (!isTakenByStudent) {
              const availableMentor = eligibleMentors.find(m => {
                const mdKey = `${dateIso}_${m.name}`;
                const mentorHours = mentorDayHoursMap.get(mdKey) || new Set<string>();
                if (!mentorHours.has(timeStart) && mentorHours.size >= maxHoursPerDay) return false;

                const existing = slotMentorEntriesMap.get(`${dateIso}_${timeStart}_${m.name}`) || [];
                if (existing.length >= capLimit) return false;
                if (existing.length === 0) return true;
                if (sessionType === 'code') return existing.every(s => s.type === 'code');
                return existing.every(s => s.type === sessionType && s.category === targetStudent.requested_category);
              });
              if (availableMentor) {
                const [startHourNum] = timeStart.split(':').map(Number);
                const endHourNum = startHourNum + 1;
                const timeEnd = `${endHourNum < 10 ? '0' : ''}${endHourNum}:00`;
                return { date: dateIso, time_start: timeStart, time_end: timeEnd, instructor_name: availableMentor.name };
              }
            }
          }
        }
        d.setDate(d.getDate() + 1);
      }
    }
    return null;
  };

  // Resolve a session with accountability:
  // - absent_student: counted on candidate -> automatically adds 1 PAID hour
  // - cancelled_school: counted on school -> automatically adds 1 FREE hour
  // - completed / scheduled: standard transition (reverts compensation if reverting to scheduled)
  const resolveScheduleSlot = (
    studentId: string,
    slotId: string,
    resolution: 'completed' | 'absent_student' | 'cancelled_school' | 'scheduled'
  ): { addedSlot?: ScheduleSlot; extraFee?: number } | void => {
    const targetStudent = students.find(s => s.id === studentId);
    const targetSlot = targetStudent?.schedule_slots.find(sc => sc.id === slotId);
    if (!targetStudent || !targetSlot) return;

    let resultPayload: { addedSlot?: ScheduleSlot; extraFee?: number } | undefined;

    if (resolution === 'completed') {
      updateScheduleSlot(studentId, slotId, { status: 'completed', fault: undefined });
      return;
    }

    if (resolution === 'scheduled') {
      setStudents(prev => {
        const updated = prev.map(s => {
          if (s.id !== studentId) return s;
          const compId = targetSlot.compensated_by_slot_id;
          const compSlot = compId ? s.schedule_slots.find(sc => sc.id === compId) : undefined;
          let feeDelta = 0;
          let filteredSlots = s.schedule_slots;

          if (compSlot && compSlot.status === 'scheduled') {
            if (compSlot.billing_type === 'paid_extra' && compSlot.extra_fee) {
              feeDelta = compSlot.extra_fee;
            }
            filteredSlots = s.schedule_slots.filter(sc => sc.id !== compId);
          }

          return {
            ...s,
            total_package_price: Math.max(0, s.total_package_price - feeDelta),
            schedule_slots: filteredSlots.map(sc =>
              sc.id === slotId
                ? { ...sc, status: 'scheduled' as const, fault: undefined, compensated_by_slot_id: undefined }
                : sc
            ),
          };
        });
        localStorage.setItem('kreno_students', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    // absent_student OR cancelled_school
    const isSchoolFault = resolution === 'cancelled_school';
    const alreadyCompensated = Boolean(targetSlot.compensated_by_slot_id);
    let newSlot: ScheduleSlot | undefined;
    let extraFee = 0;

    if (!alreadyCompensated) {
      const nextPos = findNextAvailableSlot(students, targetStudent, targetSlot.type, targetSlot.date, targetSlot.instructor_name);
      if (nextPos) {
        if (!isSchoolFault) {
          extraFee =
            targetSlot.type === 'code'
              ? targetStudent.contract_details?.theory_hour_rate ?? settings.extra_theory_hour_fee ?? 800
              : targetStudent.contract_details?.practical_hour_rate ?? settings.extra_practical_hour_fee ?? 1500;
        }
        newSlot = {
          id: crypto.randomUUID(),
          student_id: targetStudent.id,
          student_name: `${targetStudent.first_name} ${targetStudent.last_name}`,
          category: targetStudent.requested_category,
          date: nextPos.date,
          time_start: nextPos.time_start,
          time_end: nextPos.time_end,
          type: targetSlot.type,
          instructor_name: nextPos.instructor_name,
          status: 'scheduled',
          billing_type: isSchoolFault ? 'free_makeup' : 'paid_extra',
          extra_fee: extraFee,
          compensation_for_slot_id: targetSlot.id,
          notes: isSchoolFault
            ? `Séance offerte (0 DZD) — Annulation auto-école du ${targetSlot.date}`
            : `Séance supplémentaire payante (+${extraFee} DZD) — Absence candidat du ${targetSlot.date}`,
        };
        resultPayload = { addedSlot: newSlot, extraFee };
      }
    }

    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        const updatedSlots = s.schedule_slots.map(sc =>
          sc.id === slotId
            ? {
                ...sc,
                status: isSchoolFault ? ('cancelled' as const) : ('absent' as const),
                fault: isSchoolFault ? ('school' as const) : ('student' as const),
                compensated_by_slot_id: newSlot ? newSlot.id : sc.compensated_by_slot_id,
              }
            : sc
        );
        if (newSlot) {
          updatedSlots.push(newSlot);
          updatedSlots.sort((a, b) => a.date.localeCompare(b.date) || a.time_start.localeCompare(b.time_start));
        }
        return {
          ...s,
          total_package_price: s.total_package_price + extraFee,
          schedule_slots: updatedSlots,
        };
      });
      localStorage.setItem('kreno_students', JSON.stringify(updated));
      return updated;
    });

    logAction(
      'update',
      'schedule',
      slotId,
      `${targetStudent.first_name} ${targetStudent.last_name}`,
      isSchoolFault
        ? `Annulation auto-école (${targetSlot.date} ${targetSlot.time_start}) → +1h gratuite ajoutée${newSlot ? ` le ${newSlot.date} à ${newSlot.time_start}` : ''}`
        : `Absence candidat (${targetSlot.date} ${targetSlot.time_start}) → comptée sur candidat + 1h payante (+${extraFee} DZD)${newSlot ? ` le ${newSlot.date} à ${newSlot.time_start}` : ''}`
    );

    return resultPayload;
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
          id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
              id: crypto.randomUUID(),
              student_id: studentId,
              exam_type: 'creneau',
              attempt_number: 1,
              result: 'pending',
              fee_amount: settings.standard_exam_fee || 2000,
              fee_paid: false,
            });
          } else if (examType === 'creneau' && !updatedExams.some(e => e.exam_type === 'circulation')) {
            updatedExams.push({
              id: crypto.randomUUID(),
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
              id: crypto.randomUUID(),
              student_id: studentId,
              exam_type: 'creneau',
              attempt_number: 1,
              result: 'pending',
              fee_amount: settings.standard_exam_fee || 2000,
              fee_paid: false,
            });
          } else if (examTarget.exam_type === 'creneau' && !updatedExams.some(e => e.exam_type === 'circulation')) {
            updatedExams.push({
              id: crypto.randomUUID(),
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
          const nowLocal = new Date();
          const localIso = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
          updatedPayments.push({
            id: crypto.randomUUID(),
            student_id: studentId,
            amount: fee,
            date: localIso,
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
          id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
        accountRole,
        authEmail,
        syncStatus,
        refreshFromSupabase,
        setUserRole,
        school,
        setSchool,
        students,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        mentors,
        addMentor,
        updateMentor,
        deleteMentor,
        getSlotCapacityLimit,
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
        addScheduleSlot,
        deleteScheduleSlot,
        updateScheduleSlot,
        resolveScheduleSlot,
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
