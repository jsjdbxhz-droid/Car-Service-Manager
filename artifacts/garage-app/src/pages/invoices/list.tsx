import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText, Users, CalendarDays, ChevronRight, ChevronLeft } from 'lucide-react';

type InvoiceCustomer = {
  firstName: string;
  lastName: string;
  invoiceCount: number;
  lastInvoice: string | null;
};

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

function formatDate(isoStr: string | null, lang: string) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const year = d.getFullYear();
  const months = lang === 'fr' ? MONTH_NAMES_FR : lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_AR;
  return `${day} ${months[d.getMonth()] ?? ''} ${year}`;
}

export default function InvoicesList() {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [searchFirst, setSearchFirst] = useState('');
  const [searchLast,  setSearchLast]  = useState('');

  const [dateFilter,  setDateFilter]  = useState('');
  const [appliedDate, setAppliedDate] = useState('');

  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const { session, deviceId } = useAuth();

  const base = ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
  const isRtl = language === 'ar';
  const ChevronEnd = isRtl ? ChevronLeft : ChevronRight;

  const { data: customers, isLoading } = useQuery<InvoiceCustomer[]>({
    queryKey: ['invoice-customers', searchFirst, searchLast, appliedDate, deviceId],
    queryFn: async () => {
      const qp = new URLSearchParams();
      if (searchFirst) qp.set('firstName', searchFirst);
      if (searchLast)  qp.set('lastName',  searchLast);
      if (appliedDate) qp.set('date',       appliedDate);
      if (deviceId)    qp.set('deviceId',   deviceId);
      const res = await fetch(`${base}/api/invoices/customers?${qp}`, {
        headers: { Authorization: `Bearer ${session?.token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!session?.token,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFirst(firstName.trim());
    setSearchLast(lastName.trim());
  };

  const clearSearch = () => {
    setFirstName(''); setLastName('');
    setSearchFirst(''); setSearchLast('');
  };

  return (
    <div className="space-y-4">
      {/* ── View tabs ── */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-fit">
        <button
          onClick={() => setLocation('/records')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Users className="w-4 h-4" />
          {t('nav.records')}
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-primary text-primary-foreground border-s border-slate-200 dark:border-slate-700">
          <FileText className="w-4 h-4" />
          {t('invoices.view')}
        </button>
      </div>

      {/* ── Search row ── */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ms-0.5">
            {t('field.firstName')}
          </label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={language === 'ar' ? 'الاسم...' : language === 'fr' ? 'Prénom...' : 'First name...'}
            className="h-10"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ms-0.5">
            {t('field.lastName')}
          </label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={language === 'ar' ? 'اللقب...' : language === 'fr' ? 'Nom...' : 'Last name...'}
            className="h-10"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button type="submit" variant="secondary" className="h-10 px-4">
            <Search className="w-4 h-4 me-1.5" />
            {t('customers.search_btn')}
          </Button>
          {(searchFirst || searchLast) && (
            <Button type="button" variant="ghost" className="h-10 px-3 text-slate-500" onClick={clearSearch}>
              ✕
            </Button>
          )}
        </div>

        {/* Add buttons */}
        <div className="flex gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={() => setLocation('/invoices/new')} className="h-10 font-semibold">
            <Plus className="w-4 h-4 me-1.5" />
            {t('invoices.add_new')}
          </Button>
          <Button type="button" onClick={() => setLocation('/invoices/new')} className="h-10 font-semibold">
            <Plus className="w-4 h-4 me-1.5" />
            {t('customers.add_new')}
          </Button>
        </div>
      </form>

      {/* ── Date filter ── */}
      <div className="flex gap-2 items-center">
        <div className="relative max-w-xs">
          <CalendarDays className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              if (!e.target.value) setAppliedDate('');
            }}
            className="ps-9 h-10"
            dir="ltr"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          />
        </div>
        {dateFilter && !appliedDate && (
          <Button variant="secondary" size="sm" className="h-10" onClick={() => setAppliedDate(dateFilter)}>
            {t('customers.filter_apply')}
          </Button>
        )}
        {appliedDate && (
          <Button
            variant="ghost" size="sm" className="h-10 text-slate-500"
            onClick={() => { setDateFilter(''); setAppliedDate(''); }}
          >
            ✕ {t('customers.filter_clear')}
          </Button>
        )}
      </div>

      {/* ── Customer list ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">...</div>
        ) : customers && customers.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {customers.map((c) => {
              const qp = new URLSearchParams({ first: c.firstName, last: c.lastName });
              return (
                <li key={`${c.firstName}-${c.lastName}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/invoices/customers?${qp}`)}
                    onKeyDown={(e) => e.key === 'Enter' && setLocation(`/invoices/customers?${qp}`)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 select-none">
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </span>
                    </div>

                    {/* Name + last invoice */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-base truncate">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {formatDate(c.lastInvoice, language)}
                      </p>
                    </div>

                    {/* Invoice count badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 select-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {c.invoiceCount}× {t('invoices.invoice_count')}
                    </span>

                    <ChevronEnd className="w-4 h-4 text-slate-400 shrink-0 select-none" />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            {t('customers.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
