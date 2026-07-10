import { useState, useRef, useCallback } from 'react';
import { ExcelParser } from '../services/excelParser';
import { googleSheetsService } from '../services/googleSheets';
import { generateBulkTCPDF, downloadPDF } from '../services/pdfGenerator';
import type { TCData } from '../types';
import { TC_FIELDS } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Upload, Download, FileSpreadsheet, FileDown, Save, Loader2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DuplicateState {
  show: boolean;
  tcNumber: string;
  studentName: string;
  resolve: (choice: 'yes' | 'yesToAll' | 'skip' | 'noToAll' | 'cancel') => void;
}

interface ProgressState {
  current: number;
  total: number;
  phase: 'idle' | 'saving' | 'generating' | 'done' | 'error';
}

export function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<TCData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [savingToSheets, setSavingToSheets] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, phase: 'idle' });
  const [duplicate, setDuplicate] = useState<DuplicateState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const yesToAllRef = useRef(false);
  const noToAllRef = useRef(false);

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setErrors(['Please select an Excel file (.xlsx or .xls)']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setParsedData([]);
    setGeneratedCount(0);

    try {
      const result = await ExcelParser.parseFile(selectedFile);
      setParsedData(result.data);
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
    } catch {
      setErrors(['Failed to parse file. Please check the format.']);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) await processFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const showDuplicatePrompt = useCallback((tcNumber: string, studentName: string): Promise<'yes' | 'yesToAll' | 'skip' | 'noToAll' | 'cancel'> => {
    return new Promise((resolve) => {
      setDuplicate({ show: true, tcNumber, studentName, resolve });
    });
  }, []);

  const handleDuplicateChoice = (choice: 'yes' | 'yesToAll' | 'noToAll' | 'skip' | 'cancel') => {
    if (choice === 'yesToAll') yesToAllRef.current = true;
    if (choice === 'noToAll') noToAllRef.current = true;
    duplicate?.resolve(choice);
    setDuplicate(null);
  };

  const getDuplicateHandler = useCallback(() => {
    if (yesToAllRef.current) return async () => 'yes' as const;
    if (noToAllRef.current) return async () => 'skip' as const;
    return showDuplicatePrompt;
  }, [showDuplicatePrompt]);

  const handleGeneratePDF = async () => {
    if (parsedData.length === 0) return;
    yesToAllRef.current = false;
    noToAllRef.current = false;
    setProgress({ current: 0, total: parsedData.length, phase: 'saving' });
    setGeneratedCount(0);

    try {
      const recordsWithTC: TCData[] = [];

      for (let i = 0; i < parsedData.length; i++) {
        const data = parsedData[i];
        setProgress({ current: i, total: parsedData.length, phase: 'saving' });

        try {
          const { tcNumber, rowIndex } = await googleSheetsService.addTCWithUniqueNumber(
            data,
            getDuplicateHandler()
          );
          if (rowIndex !== -1) {
            recordsWithTC.push({ ...data, tcNumber });
          }
        } catch (err: any) {
          if (err.message === 'Bulk operation cancelled by user') {
            setProgress({ current: i, total: parsedData.length, phase: 'error' });
            return;
          }
          const fallbackTc = googleSheetsService.generateTCNumber(data.centreStudied, data.tokenNumber);
          recordsWithTC.push({ ...data, tcNumber: fallbackTc });
        }
      }

      setProgress((p) => ({ ...p, phase: 'generating' }));

      if (recordsWithTC.length > 0) {
        const doc = generateBulkTCPDF(recordsWithTC as any);
        downloadPDF(doc, `Bulk_TCs_${recordsWithTC.length}_students_${Date.now()}.pdf`);
      }

      setGeneratedCount(recordsWithTC.length);
      setProgress((p) => ({ ...p, phase: 'done' }));
    } catch {
      setProgress((p) => ({ ...p, phase: 'error' }));
    }
  };

  const handleSaveToSheets = async () => {
    if (parsedData.length === 0) return;
    yesToAllRef.current = false;
    noToAllRef.current = false;
    setSavingToSheets(true);
    setProgress({ current: 0, total: parsedData.length, phase: 'saving' });

    try {
      for (let i = 0; i < parsedData.length; i++) {
        const data = parsedData[i];
        setProgress({ current: i + 1, total: parsedData.length, phase: 'saving' });

        try {
          const { rowIndex } = await googleSheetsService.addTCWithUniqueNumber(
            data,
            getDuplicateHandler()
          );
          if (rowIndex === -1) continue;
        } catch (err: any) {
          if (err.message === 'Bulk operation cancelled by user') break;
        }
      }

      setProgress((p) => ({ ...p, phase: 'done' }));
    } catch (error: any) {
      alert('Failed to save: ' + error.message);
    } finally {
      setSavingToSheets(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = ExcelParser.generateTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TC_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isDateField = (key: string) => key.toLowerCase().includes('date');
  const isProcessing = progress.phase === 'saving' || progress.phase === 'generating';
  const progressPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  const getTCNumber = (data: TCData) => googleSheetsService.generateTCNumber(data.centreStudied, data.tokenNumber);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d8bcb]/10">
              <FileSpreadsheet className="h-5 w-5 text-[#1d8bcb]" />
            </div>
            <div>
              <CardTitle>Bulk TC Generation</CardTitle>
              <CardDescription>
                Upload an Excel file with student data to generate multiple Transfer Certificates at once.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
              isDragging
                ? 'border-primary bg-primary/10 animate-pulse shadow-lg shadow-primary/10'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className={`mb-3 h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium">
              {isDragging ? 'Drop your file here' : 'Drop your Excel file here, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Supports .xlsx and .xls files</p>
            <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }}>
              <Download className="h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <CardTitle className="text-sm">Validation Errors</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-xs text-destructive/80 flex items-start gap-2">
                  <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-destructive" />
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {parsedData.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mt-1 text-xs">{parsedData.length} records found</Badge>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGeneratePDF} disabled={isProcessing} className="gap-2">
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  {isProcessing ? 'Processing...' : `Generate PDF (${parsedData.length})`}
                </Button>
                <Button variant="secondary" onClick={handleSaveToSheets} disabled={savingToSheets} className="gap-2">
                  {savingToSheets ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingToSheets ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardHeader>

          {isProcessing && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {progress.phase === 'saving' ? 'Saving...' : 'Generating PDF...'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress.current} / {progress.total} records ({progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#1d8bcb] transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <Separator />
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="whitespace-nowrap font-mono text-[11px]">TC Number</TableHead>
                    {TC_FIELDS.map((field) => (
                      <TableHead key={field.key} className="whitespace-nowrap">{field.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((record, index) => (
                    <TableRow key={index} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {getTCNumber(record)}
                      </TableCell>
                      {TC_FIELDS.map((field) => (
                        <TableCell key={field.key} className="whitespace-nowrap">
                          {isDateField(field.key)
                            ? formatDate(record[field.key as keyof TCData] as string)
                            : record[field.key as keyof TCData] || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {generatedCount > 0 && progress.phase === 'done' && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Successfully generated {generatedCount} Transfer Certificates in a single PDF file.
                </div>
              </CardContent>
            </>
          )}

          {progress.phase === 'error' && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Operation cancelled.
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}

      <Dialog open={!!duplicate} onOpenChange={(open) => !open && duplicate?.resolve('cancel')}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Duplicate TC Number</DialogTitle>
                <DialogDescription>
                  This TC number already exists in the database.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TC Number:</span>
              <span className="font-mono font-medium">{duplicate?.tcNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{duplicate?.studentName}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            How would you like to handle this?
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleDuplicateChoice('yes')} variant="default" className="flex-1">
                Yes — Create with suffix
              </Button>
              <Button onClick={() => handleDuplicateChoice('yesToAll')} variant="secondary" className="flex-1">
                Yes to All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleDuplicateChoice('skip')} variant="outline" className="flex-1">
                Skip & Continue
              </Button>
              <Button onClick={() => handleDuplicateChoice('noToAll')} variant="secondary" className="flex-1">
                No to All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleDuplicateChoice('cancel')} variant="ghost" className="flex-1 text-destructive">
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
