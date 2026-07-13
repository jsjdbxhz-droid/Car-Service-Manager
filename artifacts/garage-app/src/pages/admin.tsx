import { useState, useEffect } from 'react';
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
import { Search, LogIn, Users, FileText, Copy, Check, Lock, Eye, EyeOff, AlertTriangle, RefreshCw, ShieldCheck, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getApiBase() {
  return ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
}

async function callKick(userId: number, token: string, unkick = false) {
  const action = unkick ? 'unkick' : 'kick';
  const res = await fetch(`${getApiBase()}/api/admin/users/${userId}/${action}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed');
  return res.json() as Promise<{ ok: boolean }>;
}

async function callImpersonate(userId: number, token: string) {
  const res = await fetch(`${getApiBase()}/api/admin/users/${userId}/impersonate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Impersonation failed');
  return res.json() as Promise<{
    token: string;
    user: { id: number; username: string; role: string; deviceId: string | null; createdAt: string };
  }>;
}

async function fetchConfig(token: string) {
  const res = await fetch(`${getApiBase()}/api/config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json() as Promise<{ accessCode: string; sessionRevision: number; editCodeEnabled: boolean; editCode: string | null }>;
}

async function changeEditCode(code: string | null, token: string) {
  const res = await fetch(`${getApiBase()}/api/config/edit-code`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code ?? '' }),
  });
  if (!res.ok) throw new Error('Failed to update edit code');
  return res.json() as Promise<{ editCodeEnabled: boolean }>;
}

async function changeAccessCode(code: string, token: string) {
  const res = await fetch(`${getApiBase()}/api/config/access-code`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to change code');
  }
  return res.json() as Promise<{ accessCode: string; sessionRevision: number }>;
}

// ── Access Code Card ─────────────────────────────────────────────────────────
function AccessCodeCard() {
  const { t } = useI18n();
  const { session } = useAuth();
  const { toast } = useToast();
  const [currentCode, setCurrentCode] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    fetchConfig(session.token)
      .then((cfg) => setCurrentCode(cfg.accessCode))
      .catch(() => setLoadError(true));
  }, [session?.token]);

  const maskedCode = currentCode ? '•'.repeat(currentCode.length) : '------';

  const handleChange = async () => {
    if (!newCode.trim() || !session?.token) return;
    setSaving(true);
    try {
      const updated = await changeAccessCode(newCode.trim(), session.token);
      setCurrentCode(updated.accessCode);
      setNewCode('');
      setRevealed(false);
      toast({ title: t('owner.access_code_changed') });
    } catch (err) {
      toast({ title: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm border-amber-200 dark:border-amber-800/50">
      <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-800/30">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600" />
          {t('owner.access_code')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {loadError ? (
          <p className="text-sm text-slate-400">{t('msg.error')}</p>
        ) : (
          <>
            {/* Current code */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{t('owner.access_code_current')}</span>
              <span
                className="font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg"
                dir="ltr"
              >
                {revealed ? currentCode || '...' : maskedCode}
              </span>
              <button
                onClick={() => setRevealed((r) => !r)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Change code */}
            <div className="flex gap-2">
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder={t('owner.access_code_placeholder')}
                className="font-mono tracking-widest uppercase flex-1"
                dir="ltr"
                maxLength={16}
              />
              <Button
                onClick={handleChange}
                disabled={saving || newCode.trim().length < 4}
                className="shrink-0"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('owner.access_code_save')}
              </Button>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {t('owner.access_code_warning')}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Edit Code Card ───────────────────────────────────────────────────────────
function EditCodeCard() {
  const { t } = useI18n();
  const { session } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [currentCode, setCurrentCode] = useState<string | null>(null);  // kept local only, never sent back from server
  const [newCode, setNewCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    fetchConfig(session.token)
      .then((cfg) => { setEnabled(cfg.editCodeEnabled); setCurrentCode(null); })
      .catch(() => { /* silent */ });
  }, [session?.token]);

  const handleSave = async () => {
    if (!session?.token || newCode.trim().length < 4) return;
    setSaving(true);
    try {
      await changeEditCode(newCode.trim(), session.token);
      setEnabled(true);
      setCurrentCode(newCode.trim());
      setNewCode('');
      setRevealed(false);
      toast({ title: t('owner.edit_code_saved') });
    } catch {
      toast({ title: t('msg.error'), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!session?.token) return;
    setSaving(true);
    try {
      await changeEditCode(null, session.token);
      setEnabled(false);
      setCurrentCode(null);
      toast({ title: t('owner.edit_code_removed') });
    } catch {
      toast({ title: t('msg.error'), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const maskedCode = currentCode ? '•'.repeat(currentCode.length) : '------';

  return (
    <Card className="shadow-sm border-blue-200 dark:border-blue-800/50">
      <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-800/30">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          {enabled
            ? <ShieldCheck className="w-4 h-4 text-blue-600" />
            : <ShieldOff className="w-4 h-4 text-slate-400" />}
          {t('owner.edit_code')}
          <span className={`ms-auto text-xs font-semibold px-2 py-0.5 rounded-full ${enabled ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {enabled ? t('owner.edit_code_on') : t('owner.edit_code_off')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {enabled && currentCode && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{t('owner.access_code_current')}</span>
            <span className="font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg" dir="ltr">
              {revealed ? currentCode : maskedCode}
            </span>
            <button onClick={() => setRevealed(r => !r)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder={t('owner.edit_code_placeholder')}
            className="flex-1 font-mono tracking-widest"
            dir="ltr"
            maxLength={32}
            type="password"
          />
          <Button onClick={handleSave} disabled={saving || newCode.trim().length < 4} className="shrink-0">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('owner.edit_code_save')}
          </Button>
          {enabled && (
            <Button onClick={handleRemove} disabled={saving} variant="outline" className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">
              {t('owner.edit_code_remove')}
            </Button>
          )}
        </div>
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          {t('owner.edit_code_hint')}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────
type AdminUser = {
  id: number;
  username: string;
  loginCode: string;
  role: string;
  deviceId: string | null;
  kickedAt: string | null;
  createdAt: string;
};

export default function OwnerPanel() {
  const { t } = useI18n();
  const { session, impersonate } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'invoices'>('records');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [kickingId, setKickingId] = useState<number | null>(null);
  const [localKickedAt, setLocalKickedAt] = useState<Record<number, string | null>>({});

  const { data: rawUsers, isLoading: usersLoading } = useAdminListUsers();
  const users = rawUsers as AdminUser[] | undefined;

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

  const handleKick = async (userId: number, isKicked: boolean) => {
    if (!session?.token) return;
    setKickingId(userId);
    try {
      await callKick(userId, session.token, isKicked);
      setLocalKickedAt((prev) => ({ ...prev, [userId]: isKicked ? null : new Date().toISOString() }));
      toast({ title: isKicked ? t('owner.unkick_success') : t('owner.kick_success') });
    } catch {
      toast({ title: t('msg.error'), variant: 'destructive' });
    } finally {
      setKickingId(null);
    }
  };

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

      {/* Access Code Card */}
      <AccessCodeCard />

      {/* Edit Code Card */}
      <EditCodeCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Users list ── */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col h-[calc(100vh-320px)]">
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
                      <div className="flex gap-1">
                        {(() => {
                          const isKicked = localKickedAt[user.id] !== undefined
                            ? localKickedAt[user.id] !== null
                            : user.kickedAt !== null;
                          const isOwnerUser = (user.role as string) === 'owner' || (user.role as string) === 'admin';
                          return !isOwnerUser ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-7 px-2 text-xs shrink-0 ${isKicked ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20' : 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20'}`}
                              onClick={(e) => { e.stopPropagation(); void handleKick(user.id, isKicked); }}
                              disabled={kickingId === user.id}
                            >
                              {kickingId === user.id
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : isKicked
                                  ? <><UserCheck className="w-3 h-3 me-1" />{t('owner.unkick')}</>
                                  : <><UserX className="w-3 h-3 me-1" />{t('owner.kick')}</>
                              }
                            </Button>
                          ) : null;
                        })()}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs shrink-0"
                          onClick={(e) => { e.stopPropagation(); void handleImpersonate(user.id); }}
                        >
                          <LogIn className="w-3 h-3 me-1" />
                          {t('owner.enter_as')}
                        </Button>
                      </div>
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
