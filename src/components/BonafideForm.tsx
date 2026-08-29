import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { BonafideData } from '../types';
import {
  generateBonafideNumber,
  calculateSemester,
  getCompletionDate,
  getAdmissionMonthYear,
  getGenderProps,
  getOrdinalSuffix,
} from '../types';
import { generateBonafidePDF } from '../services/bonafidePdfGenerator';
import { googleSheetsService } from '../services/googleSheets';
import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { FileDown, Save, Eye, Loader2, AlertTriangle } from 'lucide-react';

const COURSE_OPTIONS = [
  'CP01: Tool Engineering & Digital Manufacturing',
  'CP04: Electronics & Embedded Systems',
  'CP08: Computer Technology & IT Infrastructure',
  'CP09: Information Technology & Data Science',
  'CP15: Mechatronics Engineering & Smart Factory',
  'CP23: Electrical & Electronics Systems',
  'CPCCM',
];

const bonafideSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  tokenNumber: z.string().min(1, 'Token number is required'),
  gender: z.enum(['Male', 'Female']),
  centreStudied: z.string().min(1, 'Centre studied is required'),
  courseAdmitted: z.string().min(1, 'Course is required'),
  dateOfAdmission: z.string().min(1, 'Date of admission is required'),
});

type BonafideFormValues = z.infer<typeof bonafideSchema>;

interface DuplicateState {
  show: boolean;
  bonafideNumber: string;
  studentName: string;
  resolve: (choice: 'yes' | 'yesToAll' | 'skip' | 'noToAll' | 'cancel') => void;
}

export function BonafideForm() {
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateState | null>(null);
  const [bonafideNumber, setBonafideNumber] = useState('');
  const yesToAllRef = useCallback(() => false, []);
  const noToAllRef = useCallback(() => false, []);

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm<BonafideFormValues>({
    resolver: zodResolver(bonafideSchema),
    mode: 'onChange',
  });

  const watchedValues = watch();

  const handleChange = (name: keyof BonafideFormValues, value: string) => {
    setValue(name, value as any, { shouldValidate: true });
    if (name === 'centreStudied' || name === 'tokenNumber') {
      const centre = name === 'centreStudied' ? value : watchedValues.centreStudied;
      const token = name === 'tokenNumber' ? value : watchedValues.tokenNumber;
      if (centre && token) {
        setBonafideNumber(generateBonafideNumber(centre, token));
      }
    }
  };

  const getBonafideData = (): BonafideData => {
    const v = watchedValues;
    return {
      bonafideNumber: bonafideNumber || generateBonafideNumber(v.centreStudied, v.tokenNumber),
      studentName: v.studentName || '',
      fatherName: v.fatherName || '',
      tokenNumber: v.tokenNumber || '',
      gender: (v.gender as 'Male' | 'Female') || 'Male',
      centreStudied: v.centreStudied || '',
      courseAdmitted: v.courseAdmitted || '',
      dateOfAdmission: v.dateOfAdmission || '',
      semester: calculateSemester(v.dateOfAdmission),
      completionDate: getCompletionDate(v.dateOfAdmission),
    };
  };

  const showDuplicatePrompt = useCallback((bfNumber: string, studentName: string): Promise<'yes' | 'yesToAll' | 'skip' | 'noToAll' | 'cancel'> => {
    return new Promise((resolve) => {
      setDuplicate({ show: true, bonafideNumber: bfNumber, studentName, resolve });
    });
  }, []);

  const handleDuplicateChoice = (choice: 'yes' | 'yesToAll' | 'skip' | 'noToAll' | 'cancel') => {
    if (choice === 'yesToAll') yesToAllRef();
    if (choice === 'noToAll') noToAllRef();
    duplicate?.resolve(choice);
    setDuplicate(null);
  };

  const handleSave = async () => {
    const valid = await trigger();
    if (!valid) return;
    setSaving(true);
    try {
      const data = getBonafideData();
      await googleSheetsService.addBonafideWithUniqueNumber(data, showDuplicatePrompt);
    } catch (error: any) {
      if (error.message !== 'Bulk operation cancelled by user') {
        alert('Failed to save: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    const valid = await trigger();
    if (!valid) return;
    setGenerating(true);
    try {
      const data = getBonafideData();
      const doc = generateBonafidePDF(data);
      const filename = `Bonafide_${watchedValues.studentName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(filename);
    } catch (error: any) {
      alert('Failed to generate PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndDownload = async () => {
    const valid = await trigger();
    if (!valid) return;
    setSaving(true);
    try {
      const data = getBonafideData();
      const { bonafideNumber: bfNum } = await googleSheetsService.addBonafideWithUniqueNumber(data, showDuplicatePrompt);
      data.bonafideNumber = bfNum;
      const doc = generateBonafidePDF(data);
      const filename = `Bonafide_${watchedValues.studentName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(filename);
    } catch (error: any) {
      if (error.message !== 'Bulk operation cancelled by user') {
        alert('Failed: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const sem = watchedValues.dateOfAdmission ? calculateSemester(watchedValues.dateOfAdmission) : 1;
  const compDate = watchedValues.dateOfAdmission ? getCompletionDate(watchedValues.dateOfAdmission) : '';
  const admMonth = watchedValues.dateOfAdmission ? getAdmissionMonthYear(watchedValues.dateOfAdmission) : '';
  const gProps = getGenderProps(watchedValues.gender || 'Male');

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bonafide Form</CardTitle>
              <CardDescription>Fill in the student's details to generate a bonafide certificate</CardDescription>
            </div>
            <Badge variant={isValid ? 'success' : 'secondary'} className="text-[11px]">
              {isValid ? 'All fields valid' : `${Object.keys(errors).length} errors`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentName" className={errors.studentName ? 'text-destructive' : ''}>
                Student Name<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="studentName"
                {...register('studentName')}
                onChange={(e) => handleChange('studentName', e.target.value)}
                placeholder="Enter student name"
                className={errors.studentName ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.studentName && <p className="text-xs text-destructive">{errors.studentName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherName" className={errors.fatherName ? 'text-destructive' : ''}>
                Father's Name<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="fatherName"
                {...register('fatherName')}
                onChange={(e) => handleChange('fatherName', e.target.value)}
                placeholder="Enter father's name"
                className={errors.fatherName ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.fatherName && <p className="text-xs text-destructive">{errors.fatherName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokenNumber" className={errors.tokenNumber ? 'text-destructive' : ''}>
                Token Number<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="tokenNumber"
                {...register('tokenNumber')}
                onChange={(e) => handleChange('tokenNumber', e.target.value)}
                placeholder="Enter token number"
                className={errors.tokenNumber ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.tokenNumber && <p className="text-xs text-destructive">{errors.tokenNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className={errors.gender ? 'text-destructive' : ''}>
                Gender<span className="ml-1 text-destructive">*</span>
              </Label>
              <Select
                value={watchedValues.gender || ''}
                onValueChange={(value) => handleChange('gender', value)}
              >
                <SelectTrigger id="gender" className={errors.gender ? 'border-destructive ring-destructive/20' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="centreStudied" className={errors.centreStudied ? 'text-destructive' : ''}>
                Centre Studied<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="centreStudied"
                {...register('centreStudied')}
                onChange={(e) => handleChange('centreStudied', e.target.value)}
                placeholder="Enter centre name"
                className={errors.centreStudied ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.centreStudied && <p className="text-xs text-destructive">{errors.centreStudied.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseAdmitted" className={errors.courseAdmitted ? 'text-destructive' : ''}>
                Course / Branch<span className="ml-1 text-destructive">*</span>
              </Label>
              <Select
                value={watchedValues.courseAdmitted || ''}
                onValueChange={(value) => handleChange('courseAdmitted', value)}
              >
                <SelectTrigger id="courseAdmitted" className={errors.courseAdmitted ? 'border-destructive ring-destructive/20' : ''}>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.courseAdmitted && <p className="text-xs text-destructive">{errors.courseAdmitted.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dateOfAdmission" className={errors.dateOfAdmission ? 'text-destructive' : ''}>
                Date of Admission<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="dateOfAdmission"
                type="date"
                {...register('dateOfAdmission')}
                onChange={(e) => handleChange('dateOfAdmission', e.target.value)}
                className={errors.dateOfAdmission ? 'border-destructive ring-destructive/20' : ''}
              />
              {errors.dateOfAdmission && <p className="text-xs text-destructive">{errors.dateOfAdmission.message}</p>}
            </div>
          </div>

          {bonafideNumber && (
            <div className="mt-4 rounded-lg bg-muted/50 px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Bonafide Number: </span>
              <span className="font-mono text-sm font-medium">{bonafideNumber}</span>
            </div>
          )}
        </CardContent>
        <Separator />
        <CardFooter className="flex-col gap-3 pt-6">
          <div className="flex w-full gap-3">
            <Button variant="default" className="flex-1 gap-2" onClick={handleSaveAndDownload} disabled={!isValid || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save & Download'}
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleGeneratePDF} disabled={!isValid || generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              {generating ? 'Generating...' : 'Preview PDF'}
            </Button>
          </div>
          <Button variant="secondary" className="w-full gap-2" onClick={handleSave} disabled={!isValid || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save to Sheets'}
          </Button>
        </CardFooter>
      </Card>

      {/* Live Preview */}
      <div className="xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardContent className="p-6">
            <div className="mx-auto max-w-[500px]">
              <div className="mb-4 flex items-center justify-between text-[10px]">
                <span className="font-mono font-bold">{bonafideNumber || 'BF/XX/000'}</span>
                <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <h3 className="mb-4 text-center text-sm font-bold underline">BONAFIDE CERTIFICATE</h3>
              <h4 className="mb-4 text-center text-xs font-bold">To Whomsoever It May Concern</h4>
              <div className="space-y-2 text-xs leading-5">
                <p>
                  This is to certify that {gProps.title} <span className="font-medium">{watchedValues.studentName || '___'}</span>,{' '}
                  {gProps.parentPrefix} Mr. <span className="font-medium">{watchedValues.fatherName || '___'}</span>,
                </p>
                <p>
                  Token No. <span className="font-medium">{watchedValues.tokenNumber || '___'}</span> is a bonafide student of{' '}
                  <span className="font-medium">{watchedValues.centreStudied || '___'}</span>.
                </p>
                <p>
                  {gProps.pronoun} has taken admission in 3-year Diploma course in "
                  <span className="font-medium">{watchedValues.courseAdmitted || '___'}</span>" branch,
                </p>
                <p>
                  in <span className="font-medium">{admMonth || '___'}</span> and will be completing {gProps.possessive} course of study
                  by <span className="font-medium">{compDate || '___'}</span>.
                </p>
                <p>
                  Presently {gProps.pronoun.toLowerCase()} is studying in <span className="font-medium">{getOrdinalSuffix(sem)} semester</span> of the
                  course.
                </p>
                <p className="pt-2">
                  This certificate is issued to {gProps.object} on {gProps.possessive} request.
                </p>
              </div>
              <div className="mt-10 flex justify-end">
                <div className="text-center">
                  <div className="mb-1 w-40 border-t border-foreground/20" />
                  <p className="text-[10px]">Preeta John</p>
                  <p className="text-[9px] text-muted-foreground">Principal / Authorized Signatory</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={!!duplicate} onOpenChange={(open) => !open && duplicate?.resolve('cancel')}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Duplicate Bonafide Number</DialogTitle>
                <DialogDescription>This bonafide number already exists in the database.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonafide Number:</span>
              <span className="font-mono font-medium">{duplicate?.bonafideNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{duplicate?.studentName}</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">How would you like to handle this?</div>
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
