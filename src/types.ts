export interface TCField {
  label: string;
  key: string;
  type: 'text' | 'date' | 'number' | 'select';
  required?: boolean;
  options?: string[];
  labelLines?: string[];
}

export const TC_FIELDS: TCField[] = [
  { label: 'Name of the student', key: 'studentName', type: 'text', required: true },
  { label: 'Token Number', key: 'tokenNumber', type: 'text', required: true },
  { label: 'Date of Birth', key: 'dateOfBirth', type: 'date', required: true },
  { label: "Father's Name", key: 'fatherName', type: 'text', required: true },
  { label: 'Nationality', key: 'nationality', type: 'text', required: true },
  { label: 'Date of Admission', key: 'dateOfAdmission', type: 'date', required: true },
  {
    label: 'Course to which admitted',
    key: 'courseAdmitted',
    type: 'select',
    required: true,
    options: [
      'CP01: Tool Engineering & Digital Manufacturing',
      'CP04: Electronics & Embedded Systems',
      'CP08: Computer Technology & IT Infrastructure',
      'CP09: Information Technology & Data Science',
      'CP15: Mechatronics Engineering & Smart Factory',
      'CP23: Electrical & Electronics Systems',
      'CPCCM',
    ],
  },
  { label: 'Date of Leaving', key: 'dateOfLeaving', type: 'date', required: true },
  { label: 'Reason for leaving', key: 'reasonForLeaving', type: 'text', required: true },
  {
    label: 'Date of Application for Transfer Certificate',
    key: 'dateOfApplication',
    type: 'date',
    required: true,
    labelLines: ['Date of Application for', 'Transfer Certificate:'],
  },
  {
    label: 'Conduct and character',
    key: 'conductCharacter',
    type: 'select',
    required: true,
    options: ['Excellent', 'Good', 'Satisfactory', 'Not satisfactory'],
  },
  { label: 'Centre Studied', key: 'centreStudied', type: 'text', required: true },
];

export interface TCData {
  tcNumber?: string;
  studentName: string;
  tokenNumber: string;
  dateOfBirth: string;
  fatherName: string;
  nationality: string;
  dateOfAdmission: string;
  courseAdmitted: string;
  dateOfLeaving: string;
  reasonForLeaving: string;
  dateOfApplication: string;
  conductCharacter: string;
  centreStudied: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TCRecord extends TCData {
  id: string;
  rowIndex: number;
}

export interface SchoolInfo {
  name: string;
  address: string;
  affiliation: string;
  logo?: string;
}

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: 'SCHOOL NAME',
  address: 'School Address, City, State - PIN',
  affiliation: 'Affiliation No: XXXXXX',
};

export const EXCEL_HEADERS = [
  'Enquiry Number',
  'Hallticket Number',
  'Temporary Student Code',
  'Year of Study',
  'Semester',
  'Student Code',
  'Name',
  'Enrollment Center',
  'Status',
  'Quota',
  'Category',
  'Plan Template',
  'Admission Date',
  'Program',
  'Enquiry Course',
  'Enrollment Course',
  'Batch Name',
  'Section Name',
  'Punching Code',
  'Aadhar Number',
  'Date Of Birth',
  'Gender',
  'Student Mobile No',
  'Alternate Contact Number',
  'Email Address',
  'Address (Street 1)',
  'Address (Street 2)',
  'District',
  'State',
  'Others (If Any)',
  'Country',
  'Pin Code',
  'Insurance Nominee Name',
  'Father Name',
  'Father Mobile',
  'Father Email',
  'Father Occupation',
  'Mother Name',
  'Mother Mobile',
  'Mother Email',
  'Mother Occupation',
  'Guardian Name',
  'Guardian Mobile',
  'Guardian Email',
  'Guardian Occupation',
  'Registration Quota',
  'Domicile Category',
  'Qualifying Overall Percentage',
  'Entrance Exam Percentage',
  'Lateral Entry',
  'Entrance Exam Centre',
  'Created On',
  'Created By (Email)',
  'Wave-Off',
  'Updated By (Email)',
  'Last Status Change Date',
  'Days Since Status Update',
  'Lead',
  'Highest Qualification',
  '10th/SSLC Details',
  'Medium of Instruction',
  'Year of Passing',
  'School / Collage Name',
  'School Place',
  'District',
  'Other Details',
  'State',
  '12th/+2/PUC',
  'Medium of Instruction',
  'Year of Passing',
  'School / Collage Name',
  'School Place',
  'District',
  'Other Details',
  'State',
  'ITI',
  'Medium of Instruction',
  'Year of Passing',
  'School / Collage Name',
  'School Place',
  'District',
  'Other Details',
  'State',
  'Referral Type',
  'Referral Code',
  'Referral Name',
  'Referral Centre',
  'Referral Course',
  'Referral Phone',
  'Referral Roll Number',
  'Referral Year Of Passing',
  'Referral Program Name',
  'Referral Address',
  'Referral Agency Name',
  'Date of Leaving',
  'Reason for leaving',
  'Date of Application for Transfer Certificate',
  'Conduct and character',
];

export function generateTCNumber(centreName: string, tokenNumber: string): string {
  const session = new Date().getFullYear().toString().slice(-2);
  const rollNumber = tokenNumber.padStart(3, '0');
  return `${centreName}/TC/${session}/${rollNumber}`;
}

export function generateBonafideNumber(centreName: string, tokenNumber: string): string {
  const session = new Date().getFullYear().toString().slice(-2);
  const rollNumber = tokenNumber.padStart(3, '0');
  return `${centreName}/BF/${session}/${rollNumber}`;
}

export interface BonafideData {
  bonafideNumber?: string;
  studentName: string;
  fatherName: string;
  tokenNumber: string;
  gender: 'Male' | 'Female';
  centreStudied: string;
  courseAdmitted: string;
  dateOfAdmission: string;
  semester?: number;
  completionDate?: string;
  createdAt?: string;
}

export interface BonafideRecord extends BonafideData {
  id: string;
  rowIndex: number;
}

export function calculateSemester(dateOfAdmission: string): number {
  if (!dateOfAdmission) return 1;
  const admission = new Date(dateOfAdmission);
  if (isNaN(admission.getTime())) return 1;

  const now = new Date();
  const admissionYear = admission.getFullYear();
  const admissionMonth = admission.getMonth();

  let firstSemStart: Date;
  if (admissionMonth >= 6) {
    firstSemStart = new Date(admissionYear, 6, 1);
  } else {
    firstSemStart = new Date(admissionYear - 1, 6, 1);
  }

  const elapsedMs = now.getTime() - firstSemStart.getTime();
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
  const semester = Math.min(6, Math.floor(elapsedDays / 182) + 1);
  return Math.max(1, semester);
}

export function getCompletionDate(dateOfAdmission: string): string {
  if (!dateOfAdmission) return '';
  const date = new Date(dateOfAdmission);
  if (isNaN(date.getTime())) return '';
  date.setFullYear(date.getFullYear() + 3);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getAdmissionMonthYear(dateOfAdmission: string): string {
  if (!dateOfAdmission) return '';
  const date = new Date(dateOfAdmission);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getGenderProps(gender: string): {
  title: string;
  pronoun: string;
  possessive: string;
  object: string;
  parentPrefix: string;
} {
  if (gender === 'Female') {
    return { title: 'Ms.', pronoun: 'She', possessive: 'her', object: 'her', parentPrefix: 'D/o' };
  }
  return { title: 'Mr.', pronoun: 'He', possessive: 'his', object: 'him', parentPrefix: 'S/o' };
}

export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export {};