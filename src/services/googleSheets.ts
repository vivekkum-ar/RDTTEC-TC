import { type TCData, type TCRecord, type BonafideData, type BonafideRecord, generateBonafideNumber } from '../types';

type DuplicateChoice = 'yes' | 'yesToAll' | 'skip' | 'noToAll' | 'cancel';

class GoogleSheetsService {
  private baseUrl = '/api/sheets';

  async getAllTCs(): Promise<TCRecord[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch records');
    }

    const data = await response.json();
    const rows = data.values || [];

    const hasHeader = rows.length > 0 && rows[0].some((cell: any) => String(cell).trim() === 'TC Number');
    const dataRows = hasHeader ? rows.slice(1) : rows;
    if (dataRows.length === 0) return [];

    return dataRows.map((row: any[], index: number) => ({
      id: row[1] || `row-${index}`,
      rowIndex: index + (hasHeader ? 2 : 1),
      createdAt: row[0] || '',
      tcNumber: row[1] || '',
      studentName: row[2] || '',
      tokenNumber: row[3] || '',
      dateOfBirth: row[4] || '',
      fatherName: row[5] || '',
      nationality: row[6] || '',
      dateOfAdmission: row[7] || '',
      courseAdmitted: row[8] || '',
      dateOfLeaving: row[9] || '',
      reasonForLeaving: row[10] || '',
      dateOfApplication: row[11] || '',
      conductCharacter: row[12] || '',
      centreStudied: row[13] || '',
    }));
  }

  async addTC(data: TCData, tcNumber?: string): Promise<number> {
    const values = [
      new Date().toISOString(),
      tcNumber || this.generateTCNumber(data.centreStudied, data.tokenNumber),
      data.studentName,
      data.tokenNumber,
      data.dateOfBirth,
      data.fatherName,
      data.nationality,
      data.dateOfAdmission,
      data.courseAdmitted,
      data.dateOfLeaving,
      data.reasonForLeaving,
      data.dateOfApplication,
      data.conductCharacter,
      data.centreStudied,
    ];

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save record');
    }

    const result = await response.json();
    return result.rowIndex;
  }

  async updateTC(record: TCRecord): Promise<void> {
    const values = [
      record.createdAt || '',
      record.tcNumber || '',
      record.studentName,
      record.tokenNumber,
      record.dateOfBirth,
      record.fatherName,
      record.nationality,
      record.dateOfAdmission,
      record.courseAdmitted,
      record.dateOfLeaving,
      record.reasonForLeaving,
      record.dateOfApplication,
      record.conductCharacter,
      record.centreStudied,
    ];

    const response = await fetch(`${this.baseUrl}/${record.rowIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update record');
    }
  }

  async deleteTC(rowIndex: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${rowIndex}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete record');
    }
  }

  async bulkImport(tcDataArray: TCData[]): Promise<TCRecord[]> {
    const rows = tcDataArray.map((data) => {
      const tcNumber = this.generateTCNumber(data.centreStudied, data.tokenNumber);
      const createdAt = data.createdAt || new Date().toISOString();
      return [
        createdAt,
        tcNumber,
        data.studentName,
        data.tokenNumber,
        data.dateOfBirth,
        data.fatherName,
        data.nationality,
        data.dateOfAdmission,
        data.courseAdmitted,
        data.dateOfLeaving,
        data.reasonForLeaving,
        data.dateOfApplication,
        data.conductCharacter,
        data.centreStudied,
      ];
    });

    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to bulk import');
    }

    return tcDataArray.map((data, index) => ({
      id: this.generateTCNumber(data.centreStudied, data.tokenNumber),
      rowIndex: index + 2,
      ...data,
      tcNumber: this.generateTCNumber(data.centreStudied, data.tokenNumber),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  generateTCNumber(centreName: string, tokenNumber: string): string {
    const session = new Date().getFullYear().toString().slice(-2);
    const rollNumber = tokenNumber.padStart(3, '0');
    return `${centreName}/TC/${session}/${rollNumber}`;
  }

  async isTCNumberTaken(tcNumber: string): Promise<boolean> {
    try {
      const records = await this.getAllTCs();
      return records.some(r => r.tcNumber === tcNumber);
    } catch {
      return false;
    }
  }

  async addTCWithUniqueNumber(
    data: TCData,
    onDuplicate?: (tcNumber: string, studentName: string) => Promise<DuplicateChoice>
  ): Promise<{ tcNumber: string; rowIndex: number }> {
    let tcNumber = this.generateTCNumber(data.centreStudied, data.tokenNumber);

    if (await this.isTCNumberTaken(tcNumber)) {
      if (!onDuplicate) throw new Error('Duplicate TC number');

      const choice = await onDuplicate(tcNumber, data.studentName);

      if (choice === 'cancel') throw new Error('Bulk operation cancelled by user');
      if (choice === 'skip' || choice === 'noToAll') return { tcNumber, rowIndex: -1 };

      let suffix = 2;
      while (await this.isTCNumberTaken(tcNumber)) {
        tcNumber = `${this.generateTCNumber(data.centreStudied, data.tokenNumber)}-${suffix}`;
        suffix++;
      }
    }

    const rowIndex = await this.addTC(data, tcNumber);
    return { tcNumber, rowIndex };
  }

  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) return false;
      const config = await response.json();
      return config.configured;
    } catch {
      return false;
    }
  }

  // --- Bonafide methods ---

  async getAllBonafides(): Promise<BonafideRecord[]> {
    const response = await fetch('/api/bonafide');
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch bonafide records');
    }
    const data = await response.json();
    const rows = data.values || [];
    const hasHeader = rows.length > 0 && rows[0].some((cell: any) => String(cell).trim() === 'Bonafide Number');
    const dataRows = hasHeader ? rows.slice(1) : rows;
    if (dataRows.length === 0) return [];
    return dataRows.map((row: any[], index: number) => ({
      id: row[0] || `bf-${index}`,
      rowIndex: index + (hasHeader ? 2 : 1),
      bonafideNumber: row[0] || '',
      createdAt: row[1] || '',
      studentName: row[2] || '',
      fatherName: row[3] || '',
      tokenNumber: row[4] || '',
      gender: row[5] || '',
      centreStudied: row[6] || '',
      courseAdmitted: row[7] || '',
      dateOfAdmission: row[8] || '',
      semester: row[9] ? parseInt(row[9]) : undefined,
      completionDate: row[10] || '',
    }));
  }

  async addBonafide(data: BonafideData, bonafideNumber: string): Promise<number> {
    const values = [
      bonafideNumber,
      new Date().toISOString(),
      data.studentName,
      data.fatherName,
      data.tokenNumber,
      data.gender,
      data.centreStudied,
      data.courseAdmitted,
      data.dateOfAdmission,
      data.semester?.toString() || '',
      data.completionDate || '',
    ];
    const response = await fetch('/api/bonafide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save bonafide record');
    }
    const result = await response.json();
    return result.rowIndex;
  }

  async isBonafideNumberTaken(bonafideNumber: string): Promise<boolean> {
    try {
      const records = await this.getAllBonafides();
      return records.some(r => r.bonafideNumber === bonafideNumber);
    } catch {
      return false;
    }
  }

  async addBonafideWithUniqueNumber(
    data: BonafideData,
    onDuplicate?: (bonafideNumber: string, studentName: string) => Promise<DuplicateChoice>
  ): Promise<{ bonafideNumber: string; rowIndex: number }> {
    let bfNumber = generateBonafideNumber(data.centreStudied, data.tokenNumber);

    if (await this.isBonafideNumberTaken(bfNumber)) {
      if (!onDuplicate) throw new Error('Duplicate bonafide number');
      const choice = await onDuplicate(bfNumber, data.studentName);
      if (choice === 'cancel') throw new Error('Bulk operation cancelled by user');
      if (choice === 'skip' || choice === 'noToAll') return { bonafideNumber: bfNumber, rowIndex: -1 };
      let suffix = 2;
      while (await this.isBonafideNumberTaken(bfNumber)) {
        bfNumber = `${generateBonafideNumber(data.centreStudied, data.tokenNumber)}-${suffix}`;
        suffix++;
      }
    }

    const rowIndex = await this.addBonafide(data, bfNumber);
    return { bonafideNumber: bfNumber, rowIndex };
  }

  async bulkAddBonafides(records: { data: BonafideData; bonafideNumber: string }[]): Promise<void> {
    const rows = records.map(r => [
      r.bonafideNumber,
      new Date().toISOString(),
      r.data.studentName,
      r.data.fatherName,
      r.data.tokenNumber,
      r.data.gender,
      r.data.centreStudied,
      r.data.courseAdmitted,
      r.data.dateOfAdmission,
      r.data.semester?.toString() || '',
      r.data.completionDate || '',
    ]);
    const response = await fetch('/api/bonafide/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to bulk add bonafides');
    }
  }
  async deleteBonafide(rowIndex: number): Promise<void> {
    const response = await fetch(`/api/bonafide/${rowIndex}`, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete bonafide record');
    }
  }

  async updateBonafide(record: BonafideRecord): Promise<void> {
    const values = [
      record.bonafideNumber,
      record.createdAt,
      record.studentName,
      record.fatherName,
      record.tokenNumber,
      record.gender,
      record.centreStudied,
      record.courseAdmitted,
      record.dateOfAdmission,
      record.semester?.toString() || '',
      record.completionDate || '',
    ];
    const response = await fetch(`/api/bonafide/${record.rowIndex}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update bonafide record');
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
