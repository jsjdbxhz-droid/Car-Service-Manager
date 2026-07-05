import { useState } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Copy, Check, Globe } from 'lucide-react';

export default function Settings() {
  const { t, language, setLanguage } = useI18n();
  const { session } = useAuth();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

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
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('auth.username')}</span>
            <span className="font-black text-lg text-slate-900 dark:text-white">{session?.username}</span>
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
