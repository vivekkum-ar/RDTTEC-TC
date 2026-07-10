import type { TCData } from '../types';
import { TC_FIELDS, DEFAULT_SCHOOL_INFO } from '../types';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Eye } from 'lucide-react';

interface TCPreviewProps {
  data: Partial<TCData>;
  tcNumber?: string;
  schoolInfo?: typeof DEFAULT_SCHOOL_INFO;
  onOpenPreview?: () => void;
  compact?: boolean;
}

export function TCPreview({ data, tcNumber, onOpenPreview, compact }: TCPreviewProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const hasData = Object.values(data).some((v) => v && String(v).trim());
  const isDateField = (key: string) => key.toLowerCase().includes('date');

  const content = (
    <div className={compact ? '' : 'mx-auto max-w-[600px]'}>
      <div className="text-center mb-6">
        <h3 className="text-sm font-semibold underline underline-offset-4 tracking-wide">TRANSFER CERTIFICATE</h3>
        {tcNumber && (
          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
            TC No: <span className="font-medium text-foreground">{tcNumber}</span>
          </p>
        )}
      </div>

      <div className="space-y-0">
        {TC_FIELDS.map((field) => {
          const value = data[field.key as keyof TCData];
          const displayValue = isDateField(field.key)
            ? formatDate(value as string)
            : (value as string);
          return (
            <div
              key={field.key}
              className="flex border-b border-dashed border-border/40 py-4 last:border-0"
            >
              <span className="w-48 shrink-0 text-xs font-medium text-muted-foreground leading-6">
                {field.label}:
              </span>
              <span className="text-sm text-foreground leading-6">
                {displayValue || '—'}
              </span>
            </div>
          );
        })}
      </div>

      <Separator className="my-8" />

      <div className="flex justify-between">
        <div className="text-center">
          <div className="mb-1.5 w-44 border-t-2 border-foreground/20" />
          <span className="text-[11px] text-muted-foreground">Principal / Authorised Signatory</span>
        </div>
        <div className="text-center">
          <div className="mb-1.5 w-44 border-t-2 border-foreground/20" />
          <span className="text-[11px] text-muted-foreground">
            Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <Card>
      <CardContent className="p-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <span className="text-2xl text-muted-foreground">📜</span>
            </div>
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">No preview available</h3>
            <p className="max-w-xs text-xs text-muted-foreground/70">
              Fill in the form on the left to see a live preview of the Transfer Certificate.
            </p>
          </div>
        ) : (
          <>
            {content}
            {onOpenPreview && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={onOpenPreview} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Full Page Preview
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
