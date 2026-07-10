import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TCData } from '../types';
import { TC_FIELDS } from '../types';
import { generateTCPDF, downloadPDF } from '../services/pdfGenerator';
import { googleSheetsService } from '../services/googleSheets';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { FileDown, Save, Eye, Loader2 } from 'lucide-react';

const tcSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  tokenNumber: z.string().min(1, 'Token number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  dateOfAdmission: z.string().min(1, 'Date of admission is required'),
  courseAdmitted: z.string().min(1, 'Course is required'),
  dateOfLeaving: z.string().min(1, 'Date of leaving is required'),
  reasonForLeaving: z.string().min(1, 'Reason is required'),
  dateOfApplication: z.string().min(1, 'Date of application is required'),
  conductCharacter: z.string().min(1, 'Conduct is required'),
  centreStudied: z.string().min(1, 'Centre is required'),
});

type TCFormValues = z.infer<typeof tcSchema>;

const FIELD_KEYS = [
  'studentName', 'tokenNumber', 'dateOfBirth', 'fatherName', 'nationality',
  'dateOfAdmission', 'courseAdmitted', 'dateOfLeaving', 'reasonForLeaving',
  'dateOfApplication', 'conductCharacter', 'centreStudied'
] as const;

type TCFormKey = typeof FIELD_KEYS[number];

interface TCFormProps {
  onPreviewUpdate: (data: Partial<TCData>) => void;
}

export function TCForm({ onPreviewUpdate }: TCFormProps) {
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm<TCFormValues>({
    resolver: zodResolver(tcSchema),
    mode: 'onChange',
  });

  const watchedValues = watch();

  const handleChange = (name: TCFormKey, value: string) => {
    setValue(name, value, { shouldValidate: true });
    onPreviewUpdate({ [name]: value } as Partial<TCData>);
  };

  const handleGeneratePDF = async () => {
    const valid = await trigger();
    if (!valid) return;
    setGenerating(true);
    try {
      const { tcNumber } = await googleSheetsService.addTCWithUniqueNumber(watchedValues as TCData);
      const doc = generateTCPDF({ ...(watchedValues as TCData), tcNumber });
      downloadPDF(doc, `TC_${watchedValues.studentName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (error: any) {
      if (error.message !== 'Not configured' && error.message !== 'Not authenticated. Please sign in with Google.') {
        const doc = generateTCPDF(watchedValues as TCData);
        downloadPDF(doc, `TC_${watchedValues.studentName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToSheets = async () => {
    const valid = await trigger();
    if (!valid) return;
    setSaving(true);
    try {
      await googleSheetsService.addTCWithUniqueNumber(watchedValues as TCData);
    } catch (error: any) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const isDateField = (key: string) => key.toLowerCase().includes('date');

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>TC Form</CardTitle>
            <CardDescription>Fill in the student's details below</CardDescription>
          </div>
          <Badge variant={isValid ? 'success' : 'secondary'} className="text-[11px]">
            {isValid ? 'All fields valid' : `${Object.keys(errors).length} errors`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 md:grid-cols-2">
          {TC_FIELDS.map((field) => {
            const key = field.key as TCFormKey;
            const error = errors[key];
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className={error ? 'text-destructive' : ''}>
                  {field.label}
                  {field.required && <span className="ml-1 text-destructive">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={isDateField(field.key) ? 'date' : 'text'}
                  className={error ? 'border-destructive ring-destructive/20' : ''}
                  {...register(key)}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={isDateField(field.key) ? '' : `Enter ${field.label.toLowerCase()}`}
                />
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {error.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex-col gap-3 pt-6">
        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => onPreviewUpdate(watchedValues)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="default"
            className="flex-1 gap-2"
            onClick={handleGeneratePDF}
            disabled={!isValid || generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {generating ? 'Generating...' : 'Generate PDF'}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 gap-2"
            onClick={handleSaveToSheets}
            disabled={!isValid || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
        {saving && (
          <p className="text-xs text-muted-foreground animate-pulse">Saving...</p>
        )}
      </CardFooter>
    </Card>
  );
}
