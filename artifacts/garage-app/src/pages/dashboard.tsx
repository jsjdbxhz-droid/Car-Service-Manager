import { useI18n } from '@/contexts/i18n-context';
import { useGetStats } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, DollarSign, Activity } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardCard } from '@/components/leaderboard-card';
import { CompanySetupBanner } from '@/components/company-setup-banner';

export default function Dashboard() {
  const { t } = useI18n();
  const { data: stats, isLoading } = useGetStats();

  const cards = [
    {
      title: t('dashboard.total_records'),
      value: stats?.totalRecords || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: t('dashboard.total_invoices'),
      value: stats?.totalInvoices || 0,
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20'
    },
    {
      title: t('dashboard.total_amount'),
      value: stats ? `${stats.totalAmount.toLocaleString()} DZD` : '0 DZD',
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('dashboard.title')}
        </h1>
      </div>

      <CompanySetupBanner />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col justify-center min-h-[140px]">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${card.bgColor}`}>
                    <card.icon className={`w-8 h-8 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <LeaderboardCard />

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('dashboard.recent_records')}
          </h2>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : stats?.recentRecords && stats.recentRecords.length > 0 ? (
              stats.recentRecords.map((record) => (
                <Link key={record.id} href={`/records/${record.id}/edit`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors block cursor-pointer">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {record.firstName} {record.lastName}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                      {record.carType} • {record.licensePlate}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {record.totalAmount.toLocaleString()} DZD
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                {t('msg.empty_state')}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
