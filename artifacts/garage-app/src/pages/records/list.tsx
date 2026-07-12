import { useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { useListRecords, useDeleteRecord, getListRecordsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, FileText, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditSecretDialog } from '@/components/edit-secret-dialog';
import { useEditSecret } from '@/hooks/use-edit-secret';

export default function RecordsList() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { deviceId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteRecord();

  const { editSecretOpen, editTarget, requestEdit, closeEditSecret, confirmEdit } = useEditSecret();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const { data: records, isLoading } = useListRecords({
    search: debouncedSearch || undefined,
    deviceId,
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: t('msg.success') });
        queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: t('msg.error'), variant: 'destructive' });
        setDeleteId(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* View selector */}
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-primary text-primary-foreground"
          >
            <Users className="w-4 h-4" />
            {t('records.view')}
          </button>
          <button
            onClick={() => setLocation('/invoices')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-s border-slate-200 dark:border-slate-700"
          >
            <FileText className="w-4 h-4" />
            {t('invoices.view')}
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-[180px] gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value === '') setDebouncedSearch('');
              }}
              placeholder={t('records.search')}
              className="ps-9 h-10"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-10 px-3">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Add button */}
        <Button onClick={() => setLocation('/records/new')} className="h-10 font-semibold shrink-0">
          <Plus className="w-4 h-4 me-1.5" />
          {t('records.add_new')}
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('field.firstName')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('field.lastName')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('field.carType')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('field.licensePlate')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('field.visitCount')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-sm">{t('field.totalAmount')}</TableHead>
              <TableHead className="w-[90px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-base text-slate-400">...</TableCell>
              </TableRow>
            ) : records && records.length > 0 ? (
              records.map((record) => (
                <TableRow key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <TableCell className="font-bold text-base text-slate-900 dark:text-white">{record.firstName}</TableCell>
                  <TableCell className="text-base text-slate-700 dark:text-slate-300">{record.lastName}</TableCell>
                  <TableCell className="text-base text-slate-700 dark:text-slate-300">{record.carType}</TableCell>
                  <TableCell dir="ltr" className="font-mono text-base font-semibold text-slate-800 dark:text-slate-200">{record.licensePlate}</TableCell>
                  <TableCell>
                    {(() => {
                      const vc = (record as unknown as { visitCount?: number }).visitCount ?? 0;
                      return vc > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          vc >= 3
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {vc}× {t('records.visit_count')}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>;
                    })()}
                  </TableCell>
                  <TableCell className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {record.totalAmount.toLocaleString()} <span className="text-xs text-slate-400">DZD</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => requestEdit(`/records/${record.id}/edit`, setLocation)}
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(record.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-base text-slate-500 dark:text-slate-400">
                  {t('msg.empty_state')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">{t('msg.confirm_delete')}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('msg.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('records.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit secret dialog */}
      <EditSecretDialog
        open={editSecretOpen}
        onClose={closeEditSecret}
        onSuccess={confirmEdit}
      />
    </div>
  );
}
