import { useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useI18n } from '@/contexts/i18n-context';
import {
  useGetRecord,
  useCreateRecord,
  useUpdateRecord,
  getListRecordsQueryKey,
  getGetRecordQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft, CalendarDays, Printer, Save, X } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

function getMonthName(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const idx = d.getMonth();
  if (lang === 'fr') return MONTH_NAMES_FR[idx] ?? '';
  if (lang === 'en') return MONTH_NAMES_EN[idx] ?? '';
  return MONTH_NAMES_AR[idx] ?? '';
}

// ── schema ───────────────────────────────────────────────────────────────────
const formSchema = z.object({
  firstName:         z.string().min(1, 'مطلوب'),
  lastName:          z.string().min(1, 'مطلوب'),
  carType:           z.string().min(1, 'مطلوب'),
  licensePlate:      z.string().min(1, 'مطلوب'),
  customerNumber:    z.string().min(1, 'مطلوب'),
  visitCount:        z.coerce.number().int().min(1),
  breakdownType:     z.string().min(1, 'مطلوب'),
  repairDescription: z.string().optional(),
  totalAmount:       z.coerce.number().min(0),
  paymentStatus:     z.enum(['unpaid', 'paid', 'partial']),
  entryDate:         z.string().min(1, 'مطلوب'),
});

type FormValues = z.infer<typeof formSchema>;

// ── component ─────────────────────────────────────────────────────────────────
export default function RecordForm() {
  const params     = useParams();
  const id         = params.id ? parseInt(params.id, 10) : null;
  const isEdit     = !!id;
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const { toast }  = useToast();
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useGetRecord(id as number, {
    query: { enabled: isEdit, queryKey: getGetRecordQueryKey(id as number) },
  });

  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '', lastName: '', carType: '', licensePlate: '',
      customerNumber: '', visitCount: 1, breakdownType: '', repairDescription: '',
      totalAmount: 0, paymentStatus: 'unpaid', entryDate: todayIso(),
    },
  });

  // prefill on edit
  useEffect(() => {
    if (record) {
      form.reset({
        firstName:         record.firstName,
        lastName:          record.lastName,
        carType:           record.carType,
        licensePlate:      record.licensePlate,
        customerNumber:    record.customerNumber ?? '',
        visitCount:        (record as typeof record & { visitCount?: number }).visitCount ?? 1,
        breakdownType:     record.breakdownType,
        repairDescription: record.repairDescription ?? '',
        totalAmount:       record.totalAmount,
        paymentStatus:     (record.paymentStatus as 'unpaid' | 'paid' | 'partial') ?? 'unpaid',
        entryDate:         record.entryDate
          ? record.entryDate.slice(0, 10)
          : todayIso(),
      });
    }
  }, [record, form]);

  const watchedDate = form.watch('entryDate');
  const monthLabel  = getMonthName(watchedDate, language);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      totalAmount: Number(values.totalAmount),
      entryDate: values.entryDate,   // "YYYY-MM-DD" – server converts to Date
    };

    if (isEdit) {
      updateMutation.mutate({ id: id as number, data: payload }, {
        onSuccess: () => {
          toast({ title: t('msg.success') });
          void queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          if (printAfterSave.current) {
            setTimeout(() => window.print(), 300);
          } else {
            setLocation('/records');
          }
        },
        onError: () => toast({ title: t('msg.error'), variant: 'destructive' }),
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: t('msg.success') });
          void queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          if (printAfterSave.current) {
            setTimeout(() => window.print(), 300);
          } else {
            setLocation('/records');
          }
        },
        onError: () => toast({ title: t('msg.error'), variant: 'destructive' }),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const printAfterSave = useRef(false);

  if (isEdit && isLoading) return <div className="p-8 text-center text-slate-400">...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation('/records')}>
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEdit ? t('records.edit') : t('records.add_new')}
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Row 1: الاسم + اللقب */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.firstName')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.lastName')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 2: نوع المركبة + رقم اللوحة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="carType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.carType')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="licensePlate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.licensePlate')}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" className="text-end font-mono tracking-widest uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Row 3: رقم الزبون + عدد مرات الدخول (new entry: readonly badge) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="customerNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.customerNumber')}</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="text-end" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="visitCount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.visitCount')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} {...field} dir="ltr" className="text-start" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* نوع العطل */}
            <FormField control={form.control} name="breakdownType" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('field.breakdownType')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('field.breakdownType_placeholder')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* الإصلاح الذي تم */}
            <FormField control={form.control} name="repairDescription" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('field.repairDescription')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-[90px]"
                    placeholder="Description de la réparation effectuée..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Row: المبلغ + حالة الدفع */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="totalAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.totalAmount_dzd')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.paymentStatus')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unpaid">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                          {t('payment.unpaid')}
                        </span>
                      </SelectItem>
                      <SelectItem value="partial">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                          {t('payment.partial')}
                        </span>
                      </SelectItem>
                      <SelectItem value="paid">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          {t('payment.paid')}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* تاريخ الدخول + الشهر */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="entryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    {t('field.entryDate')}
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} dir="ltr" className="text-start" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium leading-none">{t('field.month')}</span>
                <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm select-none">
                  {monthLabel || '—'}
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={() => setLocation('/records')}
                disabled={isPending}
              >
                <X className="w-4 h-4 me-2" />
                {t('msg.cancel')}
              </Button>
              <Button
                type="submit"
                variant="outline"
                className="flex-1 h-12 border-slate-400"
                disabled={isPending}
                onClick={() => { printAfterSave.current = false; }}
              >
                <Save className="w-4 h-4 me-2" />
                {isPending && !printAfterSave.current ? '...' : t('records.save')}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isPending}
                onClick={() => { printAfterSave.current = true; }}
              >
                <Printer className="w-4 h-4 me-2" />
                {isPending && printAfterSave.current ? '...' : t('invoices.print')}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}
