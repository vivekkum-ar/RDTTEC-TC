import { useState, useEffect, useMemo, useCallback } from 'react';
import { googleSheetsService } from '../services/googleSheets';
import { generateBonafidePDF, generateBulkBonafidePDF } from '../services/bonafidePdfGenerator';
import { downloadPDF } from '../services/pdfGenerator';
import type { BonafideRecord } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { Search, RefreshCw, FileDown, Trash2, Download, Loader2, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZES = [20, 40, 60, 80, 100];

export function BonafideHistory() {
  const [records, setRecords] = useState<BonafideRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.getAllBonafides();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const filteredRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.bonafideNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.fatherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.courseAdmitted?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [records, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(
    () => filteredRecords.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize),
    [filteredRecords, safeCurrentPage, pageSize]
  );

  const allSelectedOnPage = paginatedRecords.length > 0 && paginatedRecords.every((r) => selectedIds.has(r.id));
  const someSelectedOnPage = paginatedRecords.some((r) => selectedIds.has(r.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        paginatedRecords.forEach((r) => next.delete(r.id));
      } else {
        paginatedRecords.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDelete = async (record: BonafideRecord) => {
    if (!confirm(`Delete bonafide for ${record.studentName}? This cannot be undone.`)) return;
    setDeleting(record.id);
    try {
      await googleSheetsService.deleteBonafide(record.rowIndex);
      setRecords(records.filter((r) => r.id !== record.id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(record.id); return next; });
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (record: BonafideRecord) => {
    const doc = generateBonafidePDF(record);
    downloadPDF(doc, `Bonafide_${record.studentName.replace(/\s+/g, '_')}_${record.bonafideNumber?.replace(/\//g, '_')}.pdf`);
  };

  const handleDownloadAll = useCallback(() => {
    if (filteredRecords.length === 0) return;
    const doc = generateBulkBonafidePDF(filteredRecords);
    downloadPDF(doc, `All_Bonafides_${filteredRecords.length}_students_${Date.now()}.pdf`);
  }, [filteredRecords]);

  const handleDownloadSelected = useCallback(() => {
    const selected = records.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;
    const doc = generateBulkBonafidePDF(selected);
    downloadPDF(doc, `Selected_Bonafides_${selected.length}_students_${Date.now()}.pdf`);
  }, [records, selectedIds]);

  const formatCreatedAt = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bonafide History</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {records.length > 0
                  ? `${filteredRecords.length} of ${records.length} records`
                  : 'No records yet'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button size="sm" onClick={handleDownloadSelected} className="gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Download Selected ({selectedIds.size})
                </Button>
              )}
              {filteredRecords.length > 0 && selectedIds.size === 0 && (
                <Button size="sm" onClick={handleDownloadAll} className="gap-2">
                  <FileDown className="h-3.5 w-3.5" />
                  Download All ({filteredRecords.length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={loadRecords} disabled={loading} className="gap-2">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, token, father name, course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size} rows</option>
              ))}
            </select>
            {selectedIds.size > 0 && (
              <Button variant="outline" size="sm" onClick={clearSelection} className="text-muted-foreground">
                Clear selection
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">{records.length === 0 ? 'No bonafide records yet.' : 'No records match your search.'}</p>
            </div>
          ) : (
            <TooltipProvider>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allSelectedOnPage}
                          ref={(el) => { if (el) el.indeterminate = someSelectedOnPage && !allSelectedOnPage; }}
                          onChange={toggleSelectAll}
                          className="h-4 w-4"
                        />
                      </TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-xs">Bonafide No.</TableHead>
                      <TableHead className="text-xs">Student Name</TableHead>
                      <TableHead className="text-xs">Father Name</TableHead>
                      <TableHead className="text-xs">Token No.</TableHead>
                      <TableHead className="text-xs">Course</TableHead>
                      <TableHead className="text-xs">Semester</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => (
                      <TableRow key={record.id} className={selectedIds.has(record.id) ? 'bg-muted/30' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCreatedAt(record.createdAt || '')}
                        </TableCell>
                        <TableCell className="font-medium text-xs whitespace-nowrap">
                          {record.bonafideNumber || '—'}
                        </TableCell>
                        <TableCell className="text-xs">{record.studentName}</TableCell>
                        <TableCell className="text-xs">{record.fatherName}</TableCell>
                        <TableCell className="text-xs">{record.tokenNumber}</TableCell>
                        <TableCell className="text-xs">{record.courseAdmitted}</TableCell>
                        <TableCell className="text-xs">{record.semester ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDownload(record)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PDF</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(record)}
                                  disabled={deleting === record.id}
                                >
                                  {deleting === record.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {safeCurrentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage === totalPages}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
