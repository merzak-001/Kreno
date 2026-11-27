import { createClient } from '@/lib/supabase/client';
import {
  AuditLogEntry,
  ExamRecord,
  Ingenieur,
  Mentor,
  PaymentRecord,
  ScheduleSlot,
  School,
  SchoolSettings,
  Student,
  Vehicle,
} from '@/types/kreno';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(val: string | undefined | null): val is string {
  return Boolean(val && UUID_RE.test(val));
}

export interface SchoolBundle {
  school: Partial<School> | null;
  settings: Partial<SchoolSettings> | null;
  mentors: Mentor[];
  vehicles: Vehicle[];
  engineers: Ingenieur[];
  students: Student[];
  auditLogs: AuditLogEntry[];
}

export async function fetchSchoolBundle(schoolId: string): Promise<SchoolBundle | null> {
  if (!isUuid(schoolId)) return null;
  const supabase = createClient();

  const [
    { data: schoolRow },
    { data: mentorRows },
    { data: vehicleRows },
    { data: engineerRows },
    { data: studentRows },
    { data: slotRows },
    { data: examRows },
    { data: paymentRows },
    { data: auditRows },
  ] = await Promise.all([
    supabase.from('schools').select('*').eq('id', schoolId).maybeSingle(),
    supabase.from('mentors').select('*').eq('school_id', schoolId).order('created_at', { ascending: true }),
    supabase.from('vehicles').select('*').eq('school_id', schoolId).order('created_at', { ascending: true }),
    supabase.from('engineers').select('*').eq('school_id', schoolId).order('created_at', { ascending: true }),
    supabase.from('students').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    supabase.from('schedule_slots').select('*').eq('school_id', schoolId).order('date', { ascending: true }),
    supabase.from('exams').select('*').eq('school_id', schoolId).order('attempt_number', { ascending: true }),
    supabase.from('payments').select('*').eq('school_id', schoolId).order('date', { ascending: true }),
    supabase.from('audit_logs').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(200),
  ]);

  const slotsByStudent = new Map<string, ScheduleSlot[]>();
  (slotRows || []).forEach((r) => {
    const list = slotsByStudent.get(r.student_id) || [];
    list.push({
      id: r.id,
      student_id: r.student_id,
      student_name: r.student_name,
      category: r.category,
      date: r.date,
      time_start: r.time_start,
      time_end: r.time_end,
      type: r.type,
      instructor_name: r.instructor_name,
      status: r.status,
      fault: r.fault ?? undefined,
      billing_type: r.billing_type ?? undefined,
      extra_fee: r.extra_fee != null ? Number(r.extra_fee) : undefined,
      compensation_for_slot_id: r.compensation_for_slot_id ?? undefined,
      compensated_by_slot_id: r.compensated_by_slot_id ?? undefined,
      notes: r.notes ?? undefined,
    });
    slotsByStudent.set(r.student_id, list);
  });

  const examsByStudent = new Map<string, ExamRecord[]>();
  (examRows || []).forEach((r) => {
    const list = examsByStudent.get(r.student_id) || [];
    list.push({
      id: r.id,
      student_id: r.student_id,
      exam_type: r.exam_type,
      attempt_number: r.attempt_number,
      exam_date: r.exam_date ?? undefined,
      examiner_name: r.examiner_name ?? undefined,
      exam_center: r.exam_center ?? undefined,
      result: r.result,
      fee_amount: Number(r.fee_amount ?? 2000),
      fee_paid: Boolean(r.fee_paid),
      notes: r.notes ?? undefined,
    });
    examsByStudent.set(r.student_id, list);
  });

  const paymentsByStudent = new Map<string, PaymentRecord[]>();
  (paymentRows || []).forEach((r) => {
    const list = paymentsByStudent.get(r.student_id) || [];
    list.push({
      id: r.id,
      student_id: r.student_id,
      amount: Number(r.amount),
      date: r.date,
      type: r.type,
      method: r.method,
      receipt_number: r.receipt_number ?? undefined,
      notes: r.notes ?? undefined,
    });
    paymentsByStudent.set(r.student_id, list);
  });

  const students: Student[] = (studentRows || []).map((r) => ({
    id: r.id,
    school_id: r.school_id,
    dossier_number: r.dossier_number,
    registration_number: r.registration_number ?? undefined,
    deposit_date: r.deposit_date,
    nin: r.nin,
    blood_type: r.blood_type ?? undefined,
    first_name: r.first_name,
    last_name: r.last_name,
    first_name_ar: r.first_name_ar ?? undefined,
    last_name_ar: r.last_name_ar ?? undefined,
    gender: r.gender,
    birth_date: r.birth_date,
    birth_commune: r.birth_commune ?? undefined,
    birth_wilaya: r.birth_wilaya ?? undefined,
    father_name: r.father_name ?? undefined,
    mother_full_name: r.mother_full_name ?? undefined,
    marital_status: r.marital_status,
    address_wilaya: r.address_wilaya ?? undefined,
    address_commune: r.address_commune ?? undefined,
    address_details: r.address_details ?? undefined,
    phone_number: r.phone_number,
    email: r.email ?? undefined,
    requested_category: r.requested_category,
    total_package_price: Number(r.total_package_price ?? 0),
    amount_paid: Number(r.amount_paid ?? 0),
    contract_details: r.contract_details ?? undefined,
    held_licenses: r.held_licenses ?? undefined,
    availability: r.availability ?? undefined,
    exams: examsByStudent.get(r.id) || [],
    payments: paymentsByStudent.get(r.id) || [],
    schedule_slots: slotsByStudent.get(r.id) || [],
    created_at: r.created_at,
  }));

  const mentors: Mentor[] = (mentorRows || []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    specialties: r.specialties || [],
    license_categories: r.license_categories || [],
    is_active: Boolean(r.is_active),
  }));

  const vehicles: Vehicle[] = (vehicleRows || []).map((r) => ({
    id: r.id,
    brand: r.brand,
    model: r.model,
    plate_number: r.plate_number,
    category: r.category,
    technical_control_expiry: r.technical_control_expiry || '',
    insurance_expiry: r.insurance_expiry || '',
    is_active: Boolean(r.is_active),
  }));

  const engineers: Ingenieur[] = (engineerRows || []).map((r) => ({
    id: r.id,
    name: r.name,
    title: r.title ?? undefined,
    phone: r.phone ?? undefined,
    is_active: Boolean(r.is_active),
  }));

  const auditLogs: AuditLogEntry[] = (auditRows || []).map((r) => ({
    id: r.id,
    timestamp: r.created_at,
    user_role: r.user_role,
    action: r.action,
    target_type: r.target_type,
    target_id: r.target_id,
    target_name: r.target_name,
    details: r.details,
  }));

  return {
    school: schoolRow
      ? {
          id: schoolRow.id,
          name: schoolRow.name,
          agrement_number: schoolRow.agrement_number || '',
          agrement_date: schoolRow.agrement_date || '',
          owner_name: schoolRow.owner_name || '',
          commercial_name: schoolRow.commercial_name || '',
          wilaya: schoolRow.wilaya || '',
          daira: schoolRow.daira || '',
          commune: schoolRow.commune || '',
          address: schoolRow.address || '',
          phone: schoolRow.phone || '',
          email: schoolRow.email || '',
          insurance_policy_number: schoolRow.insurance_policy_number || '',
        }
      : null,
    settings: (schoolRow?.settings as Partial<SchoolSettings>) || null,
    mentors,
    vehicles,
    engineers,
    students,
    auditLogs,
  };
}

export async function dbSaveSchoolAndSettings(school: School, settings: SchoolSettings) {
  if (!isUuid(school.id)) return;
  const supabase = createClient();
  await supabase
    .from('schools')
    .update({
      name: school.name,
      agrement_number: school.agrement_number || null,
      agrement_date: school.agrement_date || null,
      owner_name: school.owner_name || null,
      commercial_name: school.commercial_name || null,
      wilaya: school.wilaya || null,
      daira: school.daira || null,
      commune: school.commune || null,
      address: school.address || null,
      phone: school.phone || null,
      email: school.email || null,
      insurance_policy_number: school.insurance_policy_number || null,
      settings,
    })
    .eq('id', school.id);
}

export async function dbUpsertMentor(schoolId: string, mentor: Mentor) {
  if (!isUuid(schoolId) || !isUuid(mentor.id)) return;
  const supabase = createClient();
  await supabase.from('mentors').upsert({
    id: mentor.id,
    school_id: schoolId,
    name: mentor.name,
    phone: mentor.phone || null,
    specialties: mentor.specialties,
    license_categories: mentor.license_categories,
    is_active: mentor.is_active,
  });
}

export async function dbDeleteMentor(schoolId: string, id: string) {
  if (!isUuid(schoolId) || !isUuid(id)) return;
  const supabase = createClient();
  await supabase.from('mentors').delete().eq('id', id).eq('school_id', schoolId);
}

export async function dbUpsertVehicle(schoolId: string, v: Vehicle) {
  if (!isUuid(schoolId) || !isUuid(v.id)) return;
  const supabase = createClient();
  await supabase.from('vehicles').upsert({
    id: v.id,
    school_id: schoolId,
    brand: v.brand,
    model: v.model,
    plate_number: v.plate_number,
    category: v.category,
    technical_control_expiry: v.technical_control_expiry || null,
    insurance_expiry: v.insurance_expiry || null,
    is_active: v.is_active,
  });
}

export async function dbDeleteVehicle(schoolId: string, id: string) {
  if (!isUuid(schoolId) || !isUuid(id)) return;
  const supabase = createClient();
  await supabase.from('vehicles').delete().eq('id', id).eq('school_id', schoolId);
}

export async function dbUpsertEngineer(schoolId: string, eng: Ingenieur) {
  if (!isUuid(schoolId) || !isUuid(eng.id)) return;
  const supabase = createClient();
  await supabase.from('engineers').upsert({
    id: eng.id,
    school_id: schoolId,
    name: eng.name,
    title: eng.title || null,
    phone: eng.phone || null,
    is_active: eng.is_active,
  });
}

export async function dbUpsertStudentFull(schoolId: string, st: Student) {
  if (!isUuid(schoolId) || !isUuid(st.id)) return;
  const supabase = createClient();

  await supabase.from('students').upsert({
    id: st.id,
    school_id: schoolId,
    dossier_number: st.dossier_number,
    registration_number: st.registration_number || null,
    deposit_date: st.deposit_date,
    nin: st.nin,
    blood_type: st.blood_type || null,
    first_name: st.first_name,
    last_name: st.last_name,
    first_name_ar: st.first_name_ar || null,
    last_name_ar: st.last_name_ar || null,
    gender: st.gender,
    birth_date: st.birth_date,
    birth_commune: st.birth_commune || null,
    birth_wilaya: st.birth_wilaya || null,
    father_name: st.father_name || null,
    mother_full_name: st.mother_full_name || null,
    marital_status: st.marital_status,
    address_wilaya: st.address_wilaya || null,
    address_commune: st.address_commune || null,
    address_details: st.address_details || null,
    phone_number: st.phone_number,
    email: st.email || null,
    requested_category: st.requested_category,
    total_package_price: st.total_package_price,
    amount_paid: st.amount_paid,
    contract_details: st.contract_details || {},
    held_licenses: st.held_licenses || [],
    availability: st.availability || {},
  });

  const validSlots = st.schedule_slots.filter((s) => isUuid(s.id));
  if (validSlots.length > 0) {
    await supabase.from('schedule_slots').upsert(
      validSlots.map((s) => ({
        id: s.id,
        school_id: schoolId,
        student_id: st.id,
        student_name: s.student_name,
        category: s.category,
        date: s.date,
        time_start: s.time_start,
        time_end: s.time_end,
        type: s.type,
        instructor_name: s.instructor_name,
        status: s.status,
        fault: s.fault || null,
        billing_type: s.billing_type || null,
        extra_fee: s.extra_fee ?? 0,
        compensation_for_slot_id: isUuid(s.compensation_for_slot_id) ? s.compensation_for_slot_id : null,
        compensated_by_slot_id: isUuid(s.compensated_by_slot_id) ? s.compensated_by_slot_id : null,
        notes: s.notes || null,
      }))
    );
    await supabase
      .from('schedule_slots')
      .delete()
      .eq('school_id', schoolId)
      .eq('student_id', st.id)
      .not('id', 'in', `(${validSlots.map((s) => s.id).join(',')})`);
  } else {
    await supabase.from('schedule_slots').delete().eq('school_id', schoolId).eq('student_id', st.id);
  }

  const validExams = st.exams.filter((e) => isUuid(e.id));
  if (validExams.length > 0) {
    await supabase.from('exams').upsert(
      validExams.map((e) => ({
        id: e.id,
        school_id: schoolId,
        student_id: st.id,
        exam_type: e.exam_type,
        attempt_number: e.attempt_number,
        exam_date: e.exam_date || null,
        examiner_name: e.examiner_name || null,
        exam_center: e.exam_center || null,
        result: e.result,
        fee_amount: e.fee_amount,
        fee_paid: e.fee_paid,
        notes: e.notes || null,
      }))
    );
    await supabase
      .from('exams')
      .delete()
      .eq('school_id', schoolId)
      .eq('student_id', st.id)
      .not('id', 'in', `(${validExams.map((e) => e.id).join(',')})`);
  } else {
    await supabase.from('exams').delete().eq('school_id', schoolId).eq('student_id', st.id);
  }

  const validPayments = st.payments.filter((p) => isUuid(p.id));
  if (validPayments.length > 0) {
    await supabase.from('payments').upsert(
      validPayments.map((p) => ({
        id: p.id,
        school_id: schoolId,
        student_id: st.id,
        amount: p.amount,
        date: p.date,
        type: p.type,
        method: p.method,
        receipt_number: p.receipt_number || null,
        notes: p.notes || null,
      }))
    );
    await supabase
      .from('payments')
      .delete()
      .eq('school_id', schoolId)
      .eq('student_id', st.id)
      .not('id', 'in', `(${validPayments.map((p) => p.id).join(',')})`);
  } else {
    await supabase.from('payments').delete().eq('school_id', schoolId).eq('student_id', st.id);
  }
}

export async function dbDeleteStudent(schoolId: string, studentId: string) {
  if (!isUuid(schoolId) || !isUuid(studentId)) return;
  const supabase = createClient();
  await supabase.from('students').delete().eq('id', studentId).eq('school_id', schoolId);
}

export async function dbInsertAuditLog(schoolId: string, entry: AuditLogEntry) {
  if (!isUuid(schoolId)) return;
  const supabase = createClient();
  await supabase.from('audit_logs').insert({
    school_id: schoolId,
    user_role: entry.user_role,
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    target_name: entry.target_name,
    details: entry.details,
  });
}
