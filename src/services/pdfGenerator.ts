import { jsPDF } from 'jspdf';
import type { TCData } from '../types';
import { TC_FIELDS } from '../types';

export function generateTCPDF(data: TCData, options?: { duplicate?: boolean }): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const LETTERHEAD_TOP = 38;
  let yPos = LETTERHEAD_TOP;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSFER CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  if (options?.duplicate) {
    doc.setFontSize(11);
    doc.text('DUPLICATE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }

  if (data.tcNumber) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`TC No: ${data.tcNumber}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const labelWidth = 55;

  TC_FIELDS.forEach((field) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    const value = data[field.key as keyof TCData];
    const displayValue = field.key.includes('Date') ? formatDate(value as string) : (value as string);

    const valueX = margin + labelWidth;
    const maxWidth = pageWidth - valueX - margin;

    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(displayValue || '—', maxWidth);

    doc.setFont('helvetica', 'bold');
    const labelLines = field.labelLines ?? doc.splitTextToSize(`${field.label}:`, labelWidth);
    doc.text(labelLines, margin, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text(lines, valueX, yPos);

    yPos += Math.max(10, labelLines.length * 6, lines.length * 6);
  });

  yPos += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const signY = yPos;
  const leftSignX = margin + 30;
  const rightSignX = pageWidth - margin - 80;

  doc.line(leftSignX, signY, leftSignX + 80, signY);
  doc.text('Principal', leftSignX + 20, signY + 6);

  doc.line(rightSignX, signY, rightSignX + 80, signY);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, rightSignX, signY + 6);

  return doc;
}

export function generateBulkTCPDF(records: TCData[]): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');

  records.forEach((record, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const LETTERHEAD_TOP = 38;
    let yPos = LETTERHEAD_TOP;

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSFER CERTIFICATE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    if (record.tcNumber) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`TC No: ${record.tcNumber}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const labelWidth = 55;

    TC_FIELDS.forEach((field) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      const value = record[field.key as keyof TCData];
      const displayValue = field.key.includes('Date') ? formatDate(value as string) : (value as string);

      const valueX = margin + labelWidth;
      const maxWidth = pageWidth - valueX - margin;

      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(displayValue || '—', maxWidth);

      doc.setFont('helvetica', 'bold');
      const labelLines = field.labelLines ?? doc.splitTextToSize(`${field.label}:`, labelWidth);
      doc.text(labelLines, margin, yPos);

      doc.setFont('helvetica', 'normal');
      doc.text(lines, valueX, yPos);

      yPos += Math.max(10, labelLines.length * 6, lines.length * 6);
    });

    yPos += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const signY = yPos;
    const leftSignX = margin + 30;
    const rightSignX = pageWidth - margin - 80;

    doc.line(leftSignX, signY, leftSignX + 80, signY);
    doc.text('Principal', leftSignX + 20, signY + 6);

    doc.line(rightSignX, signY, rightSignX + 80, signY);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, rightSignX, signY + 6);
  });

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}