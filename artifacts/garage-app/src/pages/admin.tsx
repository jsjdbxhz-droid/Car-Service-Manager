import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  useAdminListUsers,
  useAdminGetUserRecords,
  useAdminGetUserInvoices,
} from '@workspace/api-client-react';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LogIn, Users, FileText, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper: call the impersonate endpoint directly (not in codegen)
async function callImpersonate(userId: number, token: string) {
  const basePath = (import.meta.env.BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  const res = await fetch(`${basePath}/api/admin/users/${userId}/impersonate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Impersonation failed');
  return res.json() as Promise<{
    token: string;
    user: { id: number; username: string; role: string; deviceId: string | null; createdAt: string };
  }>;
}

export default function OwnerPanel() {
  const { t } = useI18n();
  const { session, impersonate } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'invoices'>('records');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: users, isLoading: usersLoading } = useAdminListUsers();

  const { data: records, isLoading: recordsLoading } = useAdminGetUserRecords(
    selectedUserId as number,
    { query: { enabled: !!selectedUserId, queryKey: ['admin', 'user-records', selectedUserId] } }
  );

  const { data: invoices, isLoading: invoicesLoading } = useAdminGetUserInvoices(
    selectedUserId as number,
    { query: { enabled: !!selectedUserId, queryKey: ['admin', 'user-invoices', selectedUserId] } }
  );

  const filteredUsers = (users || []).filter((u) =>
    !search || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users?.find((u) => u.id === selectedUserId);

  const handleImpersonate = async (userId: number) => {
    if (!session?.token) return;
    try {
      const result = await callImpersonate(userId, session.token);
      impersonate({
        userId: result.user.id.toString(),
        token: result.token,
        username: result.user.username,
        role: result.user.role as 'user' | 'owner' | 'admin',
        deviceId: result.user.deviceId || undefined,
      });
      setLocation('/dashboard');
      toast({ title: `${t('owner.enter_as')} ${result.user.username}` });
    } catch {
      toast({ title: t('msg.error'), variant: 'destructive' });
    }
  };

  const handleCopyCode = (code: string, userId: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('owner.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Users list ── */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col h-[calc(100vh-160px)]">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold">{t('nav.records')}</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('owner.search_users')}
                className="ps-9 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {usersLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-sm">{t('owner.no_users')}</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <li
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedUserId === user.id
                        ? 'bg-primary/5 dark:bg-primary/10 border-s-4 border-primary'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-base text-slate-900 dark:text-white truncate">{user.username}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {(user.role as string) === 'owner' || (user.role as string) === 'admin' ? '👑 أونر' : '👤 مستخدم'}
                        </p>
                        {/* Login code with copy */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-wider" dir="ltr">
                            {user.loginCode}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(user.loginCode, user.id); }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            {copiedId === user.id
                              ? <Check className="w-3 h-3 text-emerald-500" />
                              : <Copy className="w-3 h-3" />
                            }
                          </button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleImpersonate(user.id); }}
                      >
                        <LogIn className="w-3 h-3 me-1" />
                        {t('owner.enter_as')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── User data ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {selectedUser ? (
            <>
              {/* Tabs */}
              <div className="flex gap-2 items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 me-2">
                  {selectedUser.username}
                </h2>
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setActiveTab('records')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === 'records'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {t('owner.records')}
                  </button>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-s border-slate-200 dark:border-slate-700 transition-colors ${
                      activeTab === 'invoices'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t('owner.invoices')}
                  </button>
                </div>
              </div>

              <Card className="shadow-sm flex-1">
                <CardContent className="p-0">
                  {activeTab === 'records' ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead className="font-bold text-sm">{t('field.firstName')}</TableHead>
                          <TableHead className="font-bold text-sm">{t('field.carType')}</TableHead>
                          <TableHead className="font-bold text-sm">{t('field.licensePlate')}</TableHead>
                          <TableHead className="font-bold text-sm">{t('field.totalAmount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recordsLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">...</TableCell></TableRow>
                        ) : records && records.length > 0 ? (
                          records.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium text-base">{r.firstName} {r.lastName}</TableCell>
                              <TableCell className="text-base">{r.carType}</TableCell>
                              <TableCell className="font-mono text-sm" dir="ltr">{r.licensePlate}</TableCell>
                              <TableCell className="font-bold text-emerald-600">{r.totalAmount.toLocaleString()} DZD</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">{t('msg.empty_state')}</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead className="font-bold text-sm">رقم</TableHead>
                          <TableHead className="font-bold text-sm">{t('field.firstName')}</TableHead>
                          <TableHead className="font-bold text-sm">{t('field.workshopName')}</TableHead>
                          <TableHead className="font-bold text-sm">{t('field.amount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoicesLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">...</TableCell></TableRow>
                        ) : invoices && invoices.length > 0 ? (
                          invoices.map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-mono text-sm text-slate-500">#{inv.id.toString().padStart(4, '0')}</TableCell>
                              <TableCell className="font-medium text-base">{inv.firstName} {inv.lastName}</TableCell>
                              <TableCell className="text-base">{inv.workshopName}</TableCell>
                              <TableCell className="font-bold text-emerald-600">{inv.amount.toLocaleString()} DZD</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">{t('msg.empty_state')}</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center text-slate-400 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8">
              <div>
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-base">{t('owner.select_user')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
