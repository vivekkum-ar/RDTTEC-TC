import * as XLSX from 'xlsx';
import type { TCData } from '../types';
import { TC_FIELDS, EXCEL_HEADERS } from '../types';

export interface ExcelParseResult {
  data: TCData[];
  errors: string[];
}

export class ExcelParser {
  static parseFile(file: File): Promise<ExcelParseResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          const result = this.parseRows(jsonData as any[][]);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private static parseRows(rows: any[][]): ExcelParseResult {
    if (rows.length === 0) {
      return { data: [], errors: ['Empty file'] };
    }

    const headers = rows[0] as string[];
    const expectedHeaders = [
      'Name of the student',
      'Token Number',
      'Date of Birth',
      "Father's Name",
      'Nationality',
      'Date of Admission',
      'Course to which admitted',
      'Date of Leaving',
      'Reason for leaving',
      'Date of Application for <br/> Transfer Certificate',
      'Conduct and character',
      'Centre Studied',
    ];

    const headerMap: Record<string, number> = {};
    expectedHeaders.forEach((h) => {
      const idx = headers.findIndex((col) => col?.toLowerCase().trim() === h.toLowerCase().trim());
      if (idx >= 0) headerMap[h] = idx;
    });

    const missingHeaders = expectedHeaders.filter((h) => !(h in headerMap));
    const errors: string[] = [];

    if (missingHeaders.length > 0) {
      errors.push(`Missing columns: ${missingHeaders.join(', ')}`);
    }

    const data: TCData[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((cell) => !cell || String(cell).trim() === '')) {
        continue;
      }

      const record: Partial<TCData> = {};
      let hasData = false;

      TC_FIELDS.forEach((field) => {
        const headerName = this.getHeaderName(field.key);
        const colIndex = headerMap[headerName];
        if (colIndex !== undefined && row[colIndex] !== undefined) {
          const value = String(row[colIndex]).trim();
          if (value) {
            (record as Record<string, string>)[field.key] = value;
            hasData = true;
          }
        }
      });

      if (hasData) {
        data.push(record as TCData);
      }
    }

    if (data.length === 0 && rows.length > 1) {
      errors.push('No valid data rows found');
    }

    return { data, errors };
  }

  private static getHeaderName(key: string): string {
    const map: Record<string, string> = {
      studentName: 'Name of the student',
      tokenNumber: 'Token Number',
      dateOfBirth: 'Date of Birth',
      fatherName: "Father's Name",
      nationality: 'Nationality',
      dateOfAdmission: 'Date of Admission',
      courseAdmitted: 'Course to which admitted',
      dateOfLeaving: 'Date of Leaving',
      reasonForLeaving: 'Reason for leaving',
      dateOfApplication: 'Date of Application for Transfer Certificate',
      conductCharacter: 'Conduct and character',
      centreStudied: 'Centre Studied',
    };
    return map[key] || key;
  }

  static generateTemplate(): Blob {
    const workbook = XLSX.utils.book_new();

    const headerRow = EXCEL_HEADERS;
    const sampleRow = [
      '',
      'John Doe',
      'TOK001',
      '2010-05-15',
      'Robert Doe',
      'Indian',
      '2015-04-01',
      'Class 10',
      '2024-03-31',
      'Completed Course',
      '2024-03-15',
      'Good',
      'Main Campus',
    ];

    const data = [headerRow, sampleRow];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    const colWidths = EXCEL_HEADERS.map((h) => ({ wch: Math.max(h.length + 5, 20) }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'TC Data');

    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}