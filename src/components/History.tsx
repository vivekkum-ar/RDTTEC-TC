import { useState, useEffect, useMemo, useCallback } from 'react';
import { googleSheetsService } from '../services/googleSheets';
import { generateTCPDF, downloadPDF, generateBulkTCPDF } from '../services/pdfGenerator';
import type { TCRecord, TCData } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, RefreshCw, FileDown, Pencil, Trash2, Download, Loader2, AlertCircle, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DownloadIcon } from 'lucide-react';

const PAGE_SIZES = [20, 40, 60, 80, 100];

export function History() {
  const [records, setRecords] = useState<TCRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<TCRecord | null>(null);
  const [editData, setEditData] = useState<Partial<TCData>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.getAllTCs();
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
          r.tcNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.centreStudied?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleEdit = (record: TCRecord) => {
    setEditingRecord(record);
    setEditData({ ...record });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      await googleSheetsService.updateTC({ ...editingRecord, ...editData });
      setRecords(records.map((r) => (r.id === editingRecord.id ? { ...r, ...editData } : r)));
      setDialogOpen(false);
      setEditingRecord(null);
      setEditData({});
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: TCRecord) => {
    if (!confirm(`Delete TC for ${record.studentName}? This cannot be undone.`)) return;
    setDeleting(record.id);
    try {
      await googleSheetsService.deleteTC(record.rowIndex);
      setRecords(records.filter((r) => r.id !== record.id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(record.id); return next; });
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (record: TCRecord) => {
    const doc = generateTCPDF(record);
    downloadPDF(doc, `TC_${record.studentName.replace(/\s+/g, '_')}_${record.tcNumber?.replace(/\s+\//g, '_')}.pdf`);
  };

  const handleDownloadAll = useCallback(() => {
    if (filteredRecords.length === 0) return;
    const doc = generateBulkTCPDF(filteredRecords);
    downloadPDF(doc, `All_TCs_${filteredRecords.length}_students_${Date.now()}.pdf`);
  }, [filteredRecords]);

  const handleDownloadSelected = useCallback(() => {
    const selected = records.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;
    const doc = generateBulkTCPDF(selected);
    downloadPDF(doc, `Selected_TCs_${selected.length}_students_${Date.now()}.pdf`);
  }, [records, selectedIds]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const tcFields = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'tokenNumber', label: 'Token Number' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'nationality', label: 'Nationality' },
    { key: 'dateOfAdmission', label: 'Date of Admission', type: 'date' },
    { key: 'courseAdmitted', label: 'Course' },
    { key: 'dateOfLeaving', label: 'Date of Leaving', type: 'date' },
    { key: 'reasonForLeaving', label: 'Reason for Leaving' },
    { key: 'dateOfApplication', label: 'Date of Application', type: 'date' },
    { key: 'conductCharacter', label: 'Conduct & Character' },
    { key: 'centreStudied', label: 'Centre Studied' },
  ] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>TC History</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {records.length > 0
                  ? `${filteredRecords.length} of ${records.length} records`
                  : 'No records yet'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button size="sm" onClick={handleDownloadSelected} className="gap-2">
                  <DownloadIcon className="h-3.5 w-3.5" />
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

          {records.length > 0 && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, token, TC number, or centre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </CardHeader>

        {loading ? (
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading records...</p>
            </div>
          </CardContent>
        ) : error ? (
          <CardContent>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Failed to load records</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadRecords} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </CardContent>
        ) : records.length === 0 ? (
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No TC records found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate TCs from the form or bulk upload to see them here.
            </p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#1d8bcb]/5 via-transparent to-[#f5821f]/5">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      ref={(el) => { if (el) el.indeterminate = someSelectedOnPage && !allSelectedOnPage; }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-[#1d8bcb] focus:ring-[#1d8bcb]"
                    />
                  </TableHead>
                  <TableHead className="w-8 text-xs text-muted-foreground">#</TableHead>
                  <TableHead>TC Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Token No</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No records match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record, index) => (
                    <TableRow key={record.id} className={selectedIds.has(record.id) ? 'bg-[#1d8bcb]/5' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#1d8bcb] focus:ring-[#1d8bcb]"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{record.tcNumber || '—'}</TableCell>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.tokenNumber}</TableCell>
                      <TableCell>{record.centreStudied}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(record.dateOfBirth)}</TableCell>
                      <TableCell>{record.courseAdmitted}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} className="h-8 w-8 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(record)} className="h-8 w-8 p-0">
                            <Download className="h-3.5 w-3.5" />
                            <span className="sr-only">Download</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            disabled={deleting === record.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {deleting === record.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="h-8 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={String(size)} className="text-xs">
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xs text-muted-foreground">
                  {filteredRecords.length > 0
                    ? `${(safeCurrentPage - 1) * pageSize + 1}–${Math.min(safeCurrentPage * pageSize, filteredRecords.length)} of ${filteredRecords.length}`
                    : '0 records'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">First</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>

                <span className="mx-2 text-xs tabular-nums text-muted-foreground">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">Last</span>
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 border-t px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs text-muted-foreground">
              Clear selection
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Update the details for {editingRecord?.studentName}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 py-4 md:grid-cols-2">
            {tcFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
                <Input
                  id={`edit-${field.key}`}
                  type={(field as any).type || 'text'}
                  value={(editData as any)[field.key] || ''}
                  onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <Separator />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingRecord(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
