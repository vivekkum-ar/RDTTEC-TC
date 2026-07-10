import { type TCData, type TCRecord } from '../types';

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
    if (rows.length <= 1) return [];

    return rows.slice(1).map((row: any[], index: number) => ({
      id: row[0] || `row-${index}`,
      rowIndex: index + 2,
      tcNumber: row[0] || '',
      studentName: row[1] || '',
      tokenNumber: row[2] || '',
      dateOfBirth: row[3] || '',
      fatherName: row[4] || '',
      nationality: row[5] || '',
      dateOfAdmission: row[6] || '',
      courseAdmitted: row[7] || '',
      dateOfLeaving: row[8] || '',
      reasonForLeaving: row[9] || '',
      dateOfApplication: row[10] || '',
      conductCharacter: row[11] || '',
      centreStudied: row[12] || '',
    }));
  }

  async addTC(data: TCData, tcNumber?: string): Promise<number> {
    const values = [
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
      return [
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
      createdAt: new Date().toISOString(),
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
}

export const googleSheetsService = new GoogleSheetsService();
