import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Copy, Check, Globe, ShieldOff, ShieldCheck, Pencil, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getApiBase() {
  return ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
}

export default function Settings() {
  const { t, language, setLanguage } = useI18n();
  const { session, updateUsername } = useAuth();
  const { toast } = useToast();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

  // Username edit state
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);

  // Load current privacy setting from /me
  useEffect(() => {
    if (!session?.token) return;
    fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(r => r.json())
      .then((me: { hideFromLeaderboard?: boolean }) => {
        setHidden(me.hideFromLeaderboard ?? false);
      })
      .catch(() => {});
  }, [session?.token]);

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (trimmed.length < 2) {
      toast({ title: t('settings.username_short'), variant: 'destructive' });
      return;
    }
    if (!session?.token) return;
    setUsernameSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/username`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });
      if (res.status === 409) {
        toast({ title: t('settings.username_taken'), variant: 'destructive' });
        return;
      }
      if (!res.ok) throw new Error();
      updateUsername(trimmed);
      setEditingUsername(false);
      setNewUsername('');
      toast({ title: t('settings.username_saved') });
    } catch {
      toast({ title: 'msg.error', variant: 'destructive' });
    } finally {
      setUsernameSaving(false);
    }
  };

  const togglePrivacy = async () => {
    if (!session?.token || privacySaving) return;
    const next = !hidden;
    setPrivacySaving(true);
    try {
      const res = await fetch(`${getApiBase()}/api/leaderboard/privacy`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: next }),
      });
      if (res.ok) setHidden(next);
    } catch {}
    finally { setPrivacySaving(false); }
  };

  const { data: me } = useGetMe({ query: { enabled: !!session, queryKey: getGetMeQueryKey() } });
  const loginCode = me?.loginCode ?? '--------';

  const handleCopy = () => {
    navigator.clipboard.writeText(loginCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const roleLabel =
    session?.role === 'owner' || session?.role === 'admin'
      ? t('settings.role_owner')
      : t('settings.role_user');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('settings.title')}</h1>

      {/* ── Account card ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold">{t('settings.account')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('auth.username')}</span>
              {!editingUsername ? (
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-slate-900 dark:text-white">{session?.username}</span>
                  <button
                    onClick={() => { setEditingUsername(true); setNewUsername(session?.username ?? ''); }}
                    className="p-1 text-slate-400 hover:text-primary transition-colors rounded"
                    title={t('settings.change_username')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                    className="h-8 text-sm w-36"
                    autoFocus
                    disabled={usernameSaving}
                  />
                  <button
                    onClick={() => void handleSaveUsername()}
                    disabled={usernameSaving || !newUsername.trim()}
                    className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-40"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditingUsername(false); setNewUsername(''); }}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('settings.role')}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              session?.role === 'owner' || session?.role === 'admin'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {roleLabel}
            </span>
          </div>

          {/* Login code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('settings.your_code')}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode
                  ? <><EyeOff className="w-3.5 h-3.5 me-1" />{t('settings.hide_code')}</>
                  : <><Eye className="w-3.5 h-3.5 me-1" />{t('settings.show_code')}</>
                }
              </Button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`font-mono text-2xl font-black tracking-[0.2em] transition-all select-all ${
                    showCode ? 'text-slate-900 dark:text-white' : 'blur-sm text-slate-400 pointer-events-none'
                  }`}
                  dir="ltr"
                >
                  {loginCode}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!showCode}
                  className="h-8 shrink-0"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5 me-1 text-emerald-600" />{t('auth.code_copied')}</>
                    : <><Copy className="w-3.5 h-3.5 me-1" />{t('auth.copy_code')}</>
                  }
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">{t('settings.code_info')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Privacy card ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            {hidden ? <ShieldOff className="w-4 h-4 text-slate-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
            {t('settings.privacy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('settings.hide_from_leaderboard')}
              </p>
              <p className="text-xs text-slate-400">{t('settings.hide_from_leaderboard_desc')}</p>
            </div>
            <button
              onClick={togglePrivacy}
              disabled={privacySaving}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                hidden ? 'bg-slate-300 dark:bg-slate-600' : 'bg-emerald-500'
              } ${privacySaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              role="switch"
              aria-checked={hidden}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                hidden ? 'start-0.5' : 'start-6'
              }`} />
            </button>
          </div>
          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
            hidden
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          }`}>
            {hidden ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {hidden ? t('settings.privacy_hidden') : t('settings.privacy_visible')}
          </div>
        </CardContent>
      </Card>

      {/* ── Language card ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-3 gap-3">
            {(['ar', 'en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  language === lang
                    ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : 'Français'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
