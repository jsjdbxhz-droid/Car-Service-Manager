import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText, Users, CalendarDays, ChevronRight, ChevronLeft } from 'lucide-react';

type Customer = {
  firstName: string;
  lastName: string;
  visitCount: number;
  lastVisit: string | null;
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
  const month = months[d.getMonth()] ?? '';
  return `${day} ${month} ${year}`;
}

export default function RecordsList() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [appliedDate, setAppliedDate] = useState('');

  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const { session, deviceId } = useAuth();

  const base = ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', submittedSearch, appliedDate, deviceId],
    queryFn: async () => {
      const qp = new URLSearchParams();
      if (submittedSearch) qp.set('search', submittedSearch);
      if (appliedDate) qp.set('date', appliedDate);
      if (deviceId) qp.set('deviceId', deviceId);
      const res = await fetch(`${base}/api/customers?${qp}`, {
        headers: { Authorization: `Bearer ${session?.token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!session?.token,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  const handleDateApply = () => {
    setAppliedDate(dateFilter);
  };

  const goToCustomer = (firstName: string, lastName: string) => {
    const qp = new URLSearchParams({ first: firstName, last: lastName });
    setLocation(`/customers/records?${qp}`);
  };

  const isRtl = language === 'ar';
  const ChevronEnd = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* View selector */}
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-primary text-primary-foreground">
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

        {/* Name search */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-[160px] gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) setSubmittedSearch('');
              }}
              placeholder={t('customers.search_placeholder')}
              className="ps-9 h-10"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-10 px-3">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Add buttons */}
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={() => setLocation('/records/new')}
            variant="outline"
            className="h-10 font-semibold"
          >
            <Plus className="w-4 h-4 me-1.5" />
            {t('records.add_new')}
          </Button>
          <Button
            onClick={() => setLocation('/records/new')}
            className="h-10 font-semibold"
          >
            <Plus className="w-4 h-4 me-1.5" />
            {t('customers.add_new')}
          </Button>
        </div>
      </div>

      {/* Date filter row */}
      <div className="flex gap-2 items-center">
        <div className="relative max-w-xs flex-1">
          <CalendarDays className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              if (!e.target.value) setAppliedDate('');
            }}
            placeholder={t('customers.filter_date')}
            className="ps-9 h-10"
            dir="ltr"
          />
        </div>
        {dateFilter && (
          <Button variant="secondary" size="sm" className="h-10" onClick={handleDateApply}>
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
            {customers.map((c) => (
              <li key={`${c.firstName}-${c.lastName}`}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-start"
                  onClick={() => goToCustomer(c.firstName, c.lastName)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                    </span>
                  </div>

                  {/* Name + last visit */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-base truncate">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {formatDate(c.lastVisit, language)}
                    </p>
                  </div>

                  {/* Visit count badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      c.visitCount >= 3
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {c.visitCount}× {t('records.visit_count')}
                  </span>

                  <ChevronEnd className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              </li>
            ))}
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
