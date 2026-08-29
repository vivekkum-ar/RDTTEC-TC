import { jsPDF } from 'jspdf';
import type { BonafideData } from '../types';
import {
  calculateSemester,
  getCompletionDate,
  getAdmissionMonthYear,
  getGenderProps,
  getOrdinalSuffix,
} from '../types';

export function generateBonafidePDF(data: BonafideData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 42;

  const genderProps = getGenderProps(data.gender);
  const semester = data.semester ?? calculateSemester(data.dateOfAdmission);
  const completionDate = data.completionDate || getCompletionDate(data.dateOfAdmission);
  const admissionMonthYear = getAdmissionMonthYear(data.dateOfAdmission);
  const semWithSuffix = getOrdinalSuffix(semester) + ' semester';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Bonafide number - LHS
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.bonafideNumber || '', margin, yPos);

  // Date - RHS
  doc.setFont('helvetica', 'normal');
  const dateText = `Date: ${formatDate(new Date().toISOString())}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, pageWidth - margin - dateWidth, yPos);

  yPos += 15;

  // Title - centered, bold
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BONAFIDE CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // "To Whomsoever It May Concern" - centered, bold
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('To Whomsoever It May Concern', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // Body text - single flowing paragraph
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const bodyText = `This is to certify that ${genderProps.title} ${data.studentName}, ${genderProps.parentPrefix} Mr. ${data.fatherName}, Token No. ${data.tokenNumber} is a bonafide student of ${data.centreStudied}. ${genderProps.pronoun} has taken admission in 3-year Diploma course in "${data.courseAdmitted}" branch, in ${admissionMonthYear} and will be completing ${genderProps.possessive} course of study by ${completionDate}. Presently ${genderProps.pronoun.toLowerCase()} is studying in ${semWithSuffix} of the course.`;

  const bodyWrapped = doc.splitTextToSize(bodyText, contentWidth);
  bodyWrapped.forEach((l: string) => {
    doc.text(l, margin, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Issue line
  const issueLine = `This certificate is issued to ${genderProps.object} on ${genderProps.possessive} request.`;
  doc.text(issueLine, margin, yPos);
  yPos += 20;

  // Signature
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const signX = pageWidth - margin - 60;
  doc.line(signX, yPos, signX + 60, yPos);
  yPos += 6;
  doc.text('Preeta John', signX + 30, yPos, { align: 'center' });
  yPos += 5;
  doc.setFontSize(10);
  doc.text('Principal / Authorized Signatory', signX + 30, yPos, { align: 'center' });

  return doc;
}

export function generateBulkBonafidePDF(records: BonafideData[]): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');

  records.forEach((record, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const pageWidth = doc.internal.pageSize.width;
    const margin = 25;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = 42;

    const genderProps = getGenderProps(record.gender);
    const semester = record.semester ?? calculateSemester(record.dateOfAdmission);
    const completionDate = record.completionDate || getCompletionDate(record.dateOfAdmission);
    const admissionMonthYear = getAdmissionMonthYear(record.dateOfAdmission);
    const semWithSuffix = getOrdinalSuffix(semester) + ' semester';

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Bonafide number - LHS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(record.bonafideNumber || '', margin, yPos);

    // Date - RHS
    doc.setFont('helvetica', 'normal');
    const dateText = `Date: ${formatDate(new Date().toISOString())}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin - dateWidth, yPos);

    yPos += 15;

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BONAFIDE CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;

    // "To Whomsoever It May Concern"
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('To Whomsoever It May Concern', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;

    // Body - single flowing paragraph
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const bodyText = `This is to certify that ${genderProps.title} ${record.studentName}, ${genderProps.parentPrefix} Mr. ${record.fatherName}, Token No. ${record.tokenNumber} is a bonafide student of ${record.centreStudied}. ${genderProps.pronoun} has taken admission in 3-year Diploma course in "${record.courseAdmitted}" branch, in ${admissionMonthYear} and will be completing ${genderProps.possessive} course of study by ${completionDate}. Presently ${genderProps.pronoun.toLowerCase()} is studying in ${semWithSuffix} of the course.`;

    const bodyWrapped = doc.splitTextToSize(bodyText, contentWidth);
    bodyWrapped.forEach((l: string) => {
      doc.text(l, margin, yPos);
      yPos += 6;
    });

    yPos += 10;

    const issueLine = `This certificate is issued to ${genderProps.object} on ${genderProps.possessive} request.`;
    doc.text(issueLine, margin, yPos);
    yPos += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const signX = pageWidth - margin - 60;
    doc.line(signX, yPos, signX + 60, yPos);
    yPos += 6;
    doc.text('Preeta John', signX + 30, yPos, { align: 'center' });
    yPos += 5;
    doc.setFontSize(10);
    doc.text('Principal / Authorized Signatory', signX + 30, yPos, { align: 'center' });
  });

  return doc;
}
