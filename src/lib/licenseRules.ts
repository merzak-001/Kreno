import { HeldLicense, LicenseCategory } from '@/types/kreno';

export interface CategoryRule {
  category: LicenseCategory;
  label: string;
  minAge: number;
  prerequisite?: LicenseCategory;
  minSeniorityYears: number;
  validityYears: number;
}

export const LICENSE_RULES: Record<LicenseCategory, CategoryRule> = {
  A1: { category: 'A1', label: 'Moto légère (≤ 125 cm³)', minAge: 16, minSeniorityYears: 0, validityYears: 10 },
  A: { category: 'A', label: 'Moto (> 125 cm³)', minAge: 18, minSeniorityYears: 0, validityYears: 10 },
  B: { category: 'B', label: 'Véhicule léger (≤ 3.5T)', minAge: 18, minSeniorityYears: 0, validityYears: 10 },
  BE: { category: 'BE', label: 'Cat. B + remorque (> 750 kg)', minAge: 23, prerequisite: 'B', minSeniorityYears: 2, validityYears: 10 },
  C1: { category: 'C1', label: 'Poids moyen (3.5T – 19T)', minAge: 23, prerequisite: 'B', minSeniorityYears: 2, validityYears: 5 },
  C1E: { category: 'C1E', label: 'Cat. C1 + remorque', minAge: 23, prerequisite: 'C1', minSeniorityYears: 2, validityYears: 5 },
  C: { category: 'C', label: 'Poids lourd (> 19T)', minAge: 25, prerequisite: 'B', minSeniorityYears: 2, validityYears: 5 },
  CE: { category: 'CE', label: 'Poids lourd + remorque', minAge: 25, prerequisite: 'C', minSeniorityYears: 2, validityYears: 5 },
  D: { category: 'D', label: 'Transport en commun (> 8 places)', minAge: 25, prerequisite: 'B', minSeniorityYears: 2, validityYears: 5 },
  DE: { category: 'DE', label: 'Cat. D + remorque', minAge: 25, prerequisite: 'D', minSeniorityYears: 2, validityYears: 5 },
  F: { category: 'F', label: 'Véhicule aménagé (Handicap)', minAge: 18, minSeniorityYears: 0, validityYears: 10 },
};

export function formatDateFR(iso?: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

export function addYearsToIso(isoDate: string, years: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const target = new Date(y + years, m - 1, d);
  const yy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function calculateAgeAsOf(birthDate: string, asOfDate?: string): number {
  if (!birthDate) return 0;
  const ref = asOfDate ? new Date(asOfDate) : new Date();
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) return 0;
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

export interface EligibilityReport {
  age: number;
  minAge: number;
  ageMet: boolean;
  ageUnlockDate: string | null;
  isMinor: boolean;
  prerequisite: LicenseCategory | null;
  minSeniorityYears: number;
  hasPrerequisiteLicense: boolean;
  seniorityMet: boolean;
  seniorityUnlockDate: string | null;
  circulationEligible: boolean;
  circulationUnlockDate: string | null;
  blockingReasons: string[];
}

/**
 * Evaluates Algerian driving license eligibility:
 * - Candidates below minAge or seniority CAN still take Code & Créneau.
 * - Circulation is blocked until BOTH minAge and prerequisite seniority are met.
 */
export function checkCirculationEligibility(params: {
  requestedCategory: LicenseCategory;
  birthDate: string;
  heldLicenses?: HeldLicense[];
  asOfDate?: string;
}): EligibilityReport {
  const { requestedCategory, birthDate, heldLicenses = [], asOfDate } = params;
  const rule = LICENSE_RULES[requestedCategory] ?? LICENSE_RULES.B;
  const refIso = asOfDate || new Date().toISOString().split('T')[0];

  const age = calculateAgeAsOf(birthDate, refIso);
  const ageUnlockDate = birthDate ? addYearsToIso(birthDate, rule.minAge) : null;
  const ageMet = Boolean(ageUnlockDate && refIso >= ageUnlockDate);
  const isMinor = age > 0 && age < 18;

  const prerequisite = rule.prerequisite ?? null;
  const minSeniorityYears = rule.minSeniorityYears;

  const matchingLicense = prerequisite
    ? heldLicenses.find((l) => l.category === prerequisite && Boolean(l.obtained_date))
    : undefined;

  const hasPrerequisiteLicense = !prerequisite || Boolean(matchingLicense);
  const seniorityUnlockDate =
    prerequisite && matchingLicense?.obtained_date
      ? addYearsToIso(matchingLicense.obtained_date, minSeniorityYears)
      : null;

  const seniorityMet = !prerequisite || Boolean(seniorityUnlockDate && refIso >= seniorityUnlockDate);

  const blockingReasons: string[] = [];
  if (!ageMet && ageUnlockDate) {
    blockingReasons.push(
      `Âge minimum ${rule.minAge} ans requis pour la Circulation (actuel : ${age} ans, éligible le ${formatDateFR(ageUnlockDate)}).`
    );
  }
  if (prerequisite) {
    if (!hasPrerequisiteLicense) {
      blockingReasons.push(
        `Permis catégorie ${prerequisite} (${minSeniorityYears} ans d'ancienneté) requis pour la Circulation en ${requestedCategory}.`
      );
    } else if (!seniorityMet && seniorityUnlockDate) {
      blockingReasons.push(
        `Ancienneté insuffisante en catégorie ${prerequisite} (${minSeniorityYears} ans requis, éligible le ${formatDateFR(seniorityUnlockDate)}).`
      );
    }
  }

  let circulationUnlockDate: string | null = null;
  if (!ageMet || !seniorityMet) {
    if (ageUnlockDate && seniorityUnlockDate) {
      circulationUnlockDate = ageUnlockDate > seniorityUnlockDate ? ageUnlockDate : seniorityUnlockDate;
    } else {
      circulationUnlockDate = !ageMet ? ageUnlockDate : seniorityUnlockDate;
    }
  }

  return {
    age,
    minAge: rule.minAge,
    ageMet,
    ageUnlockDate,
    isMinor,
    prerequisite,
    minSeniorityYears,
    hasPrerequisiteLicense,
    seniorityMet,
    seniorityUnlockDate,
    circulationEligible: ageMet && hasPrerequisiteLicense && seniorityMet,
    circulationUnlockDate,
    blockingReasons,
  };
}
