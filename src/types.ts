export interface TCField {
  label: string;
  key: string;
  type: 'text' | 'date' | 'number' | 'select';
  required?: boolean;
  options?: string[];
}

export const TC_FIELDS: TCField[] = [
  { label: 'Name of the student', key: 'studentName', type: 'text', required: true },
  { label: 'Token Number', key: 'tokenNumber', type: 'text', required: true },
  { label: 'Date of Birth', key: 'dateOfBirth', type: 'date', required: true },
  { label: "Father's Name", key: 'fatherName', type: 'text', required: true },
  { label: 'Nationality', key: 'nationality', type: 'text', required: true },
  { label: 'Date of Admission', key: 'dateOfAdmission', type: 'date', required: true },
  { label: 'Course to which admitted', key: 'courseAdmitted', type: 'text', required: true },
  { label: 'Date of Leaving', key: 'dateOfLeaving', type: 'date', required: true },
  { label: 'Reason for leaving', key: 'reasonForLeaving', type: 'text', required: true },
  { label: 'Date of Application for Transfer Certificate', key: 'dateOfApplication', type: 'date', required: true },
  { label: 'Conduct and character', key: 'conductCharacter', type: 'text', required: true },
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
  'TC Number',
  'Name of the student',
  'Token Number',
  'Date of Birth',
  "Father's Name",
  'Nationality',
  'Date of Admission',
  'Course to which admitted',
  'Date of Leaving',
  'Reason for leaving',
  'Date of Application for Transfer Certificate',
  'Conduct and character',
  'Centre Studied',
];

export function generateTCNumber(centreName: string, tokenNumber: string): string {
  const session = new Date().getFullYear().toString().slice(-2);
  const rollNumber = tokenNumber.padStart(3, '0');
  return `${centreName}/TC/${session}/${rollNumber}`;
}

export {};