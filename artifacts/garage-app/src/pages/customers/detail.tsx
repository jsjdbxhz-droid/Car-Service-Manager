import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { useDeleteRecord, getListRecordsQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Edit, Trash2, CalendarDays, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditSecretDialog } from '@/components/edit-secret-dialog';
import { useEditSecret } from '@/hooks/use-edit-secret';

const MONTH_NAMES_AR = [
  'جانفي','فيفري','مارس','أفريل','ماي','جوان',
  'جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const MONTH_NAMES_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const MONTH_NAMES_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function formatDate(isoStr: string, lang: string) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = d.getDate();
  const year = d.getFullYear();
  const months = lang === 'fr' ? MONTH_NAMES_FR : lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_AR;
  const month = months[d.getMonth()] ?? '';
  return `${day} ${month} ${year}`;
}

type Record = {
  id: number;
  firstName: string;
  lastName: string;
  breakdownType: string;
  repairDescription?: string;
  totalAmount: number;
  carType: string;
  licensePlate: string;
  paymentStatus: string;
  visitCount: number;
  entryDate: string;
  customerNumber?: string;
};

export default function CustomerDetail() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const firstName = params.get('first') ?? '';
  const lastName = params.get('last') ?? '';

  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const { session, deviceId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteRecord();

  const [dateFilter, setDateFilter] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { editSecretOpen, editTarget, requestEdit, closeEditSecret, confirmEdit } = useEditSecret();

  const base = ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');

  const { data: records, isLoading } = useQuery<Record[]>({
    queryKey: ['customer-records', firstName, lastName, deviceId, appliedDate],
    queryFn: async () => {
      const qp = new URLSearchParams({ firstName, lastName });
      if (deviceId) qp.set('deviceId', deviceId);
      if (appliedDate) qp.set('date', appliedDate);
      const res = await fetch(`${base}/api/customers/records?${qp}`, {
        headers: { Authorization: `Bearer ${session?.token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!session?.token && !!firstName && !!lastName,
  });

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: t('msg.success') });
        queryClient.invalidateQueries({ queryKey: ['customer-records', firstName, lastName] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
        setDeleteId(null);
      },
      onError: () => {
        toast({ title: t('msg.error'), variant: 'destructive' });
        setDeleteId(null);
      },
    });
  };

  const paymentColor: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setLocation('/records')}>
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {firstName} {lastName}
            </h1>
            <p className="text-sm text-slate-500">
              {records && records.length > 0
                ? `${records.length} ${t('records.visit_count')}`
                : t('msg.empty_state')}
            </p>
          </div>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <CalendarDays className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              if (!e.target.value) setAppliedDate('');
            }}
            className="ps-9 h-10"
            dir="ltr"
          />
        </div>
        {dateFilter && (
          <Button
            variant="secondary"
            size="sm"
            className="h-10"
            onClick={() => setAppliedDate(dateFilter)}
          >
            {t('customers.filter_apply')}
          </Button>
        )}
        {appliedDate && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-slate-500"
            onClick={() => { setDateFilter(''); setAppliedDate(''); }}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Records list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">...</div>
        ) : records && records.length > 0 ? (
          records.map((record, idx) => (
            <div
              key={record.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* Visit badge + date */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {t('records.visit_count')} {records.length - idx}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDate(record.entryDate, language)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        paymentColor[record.paymentStatus] ?? paymentColor.unpaid
                      }`}
                    >
                      {t(`payment.${record.paymentStatus}`)}
                    </span>
                  </div>

                  {/* Breakdown */}
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                    {record.breakdownType}
                  </p>

                  {/* Car info */}
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span>{record.carType}</span>
                    <span className="font-mono font-semibold" dir="ltr">{record.licensePlate}</span>
                  </div>

                  {/* Amount */}
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {record.totalAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">DZD</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => requestEdit(`/records/${record.id}/edit`, setLocation)}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteId(record.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-slate-400">
            {t('msg.empty_state')}
          </div>
        )}
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

      <EditSecretDialog
        open={editSecretOpen}
        onClose={closeEditSecret}
        onSuccess={confirmEdit}
      />
    </div>
  );
}
