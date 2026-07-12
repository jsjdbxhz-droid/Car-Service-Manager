import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ChevronDown, ChevronUp, FileText, Users, Receipt } from 'lucide-react';

function getApiBase() {
  return ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
}

type LeaderboardRow = {
  userId: number;
  username: string;
  recordCount: number;
  invoiceCount: number;
  customerCount: number;
};

const STORAGE_KEY = 'leaderboard_collapsed';

const medals = ['🥇', '🥈', '🥉'];

export function LeaderboardCard() {
  const { t } = useI18n();
  const { session } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    if (!session?.token) return;
    setLoading(true);
    fetch(`${getApiBase()}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(r => r.json())
      .then((data: LeaderboardRow[]) => setRows(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.token]);

  const toggle = () => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer select-none" onClick={toggle}>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          {t('leaderboard.title')}
          <span className="ms-auto text-slate-400">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </CardTitle>
      </CardHeader>

      {!collapsed && (
        <CardContent className="p-0">
          {/* Column headers */}
          <div className="grid grid-cols-[1.5rem_1fr_auto_auto_auto] gap-2 px-4 py-2 text-xs font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <span />
            <span>{t('auth.username')}</span>
            <span className="text-center w-14">{t('leaderboard.col_records')}</span>
            <span className="text-center w-14">{t('leaderboard.col_invoices')}</span>
            <span className="text-center w-14">{t('leaderboard.col_customers')}</span>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1.5rem_1fr_auto_auto_auto] gap-2 items-center px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">{t('msg.empty_state')}</div>
          ) : (
            rows.map((row, idx) => {
              const isMe = String(row.userId) === session?.userId;
              return (
                <div
                  key={row.userId}
                  className={`grid grid-cols-[1.5rem_1fr_auto_auto_auto] gap-2 items-center px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors
                    ${isMe ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                >
                  <span className="text-base leading-none">
                    {idx < 3 ? medals[idx] : <span className="text-xs font-bold text-slate-400">{idx + 1}</span>}
                  </span>
                  <span className={`font-semibold text-sm truncate ${isMe ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                    {row.username}
                    {isMe && <span className="ms-1 text-xs font-normal opacity-60">{t('leaderboard.you')}</span>}
                  </span>
                  <StatChip icon={<Users className="w-3 h-3" />} value={row.recordCount} color="blue" />
                  <StatChip icon={<Receipt className="w-3 h-3" />} value={row.invoiceCount} color="emerald" />
                  <StatChip icon={<FileText className="w-3 h-3" />} value={row.customerCount} color="amber" />
                </div>
              );
            })
          )}
        </CardContent>
      )}
    </Card>
  );
}

function StatChip({ icon, value, color }: { icon: React.ReactNode; value: number; color: 'blue' | 'emerald' | 'amber' }) {
  const cls = {
    blue:    'bg-blue-50    text-blue-600    dark:bg-blue-900/20    dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber:   'bg-amber-50   text-amber-600   dark:bg-amber-900/20   dark:text-amber-400',
  }[color];
  return (
    <span className={`flex items-center gap-1 justify-center w-14 px-1.5 py-1 rounded-lg text-xs font-bold ${cls}`}>
      {icon}{value}
    </span>
  );
}
