import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { useRegister } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Copy, Check, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const [username, setUsername] = useState('');
  const [phase, setPhase] = useState<'input' | 'success'>('input');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { login: authenticate, deviceId } = useAuth();
  const registerMutation = useRegister();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    // Send only username — server auto-generates the code (loginCode sent as empty, ignored by server)
    registerMutation.mutate({ data: { username: username.trim(), loginCode: '', deviceId } }, {
      onSuccess: (res) => {
        setGeneratedCode(res.user.loginCode);
        setPhase('success');
        // Authenticate right away — user is logged in after registration
        authenticate({
          userId: res.user.id.toString(),
          token: res.token,
          username: res.user.username,
          role: res.user.role as 'user' | 'owner' | 'admin',
          deviceId: res.user.deviceId || undefined,
          companyName: res.user.companyName ?? undefined,
          companyPhone: res.user.companyPhone ?? undefined,
        });
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message :
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
        toast({ title: t('msg.error'), description: message, variant: 'destructive' });
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Phase 2: show generated code ─────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-100 dark:border-slate-800 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full">
              <Wrench className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {t('auth.your_code')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('auth.save_code_warning')}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border-2 border-dashed border-emerald-300 dark:border-emerald-700">
            <p className="text-4xl font-black tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-mono select-all" dir="ltr">
              {generatedCode}
            </p>
          </div>

          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full h-11 text-base font-medium"
          >
            {copied
              ? <><Check className="w-4 h-4 me-2 text-emerald-600" />{t('auth.code_copied')}</>
              : <><Copy className="w-4 h-4 me-2" />{t('auth.copy_code')}</>
            }
          </Button>

          <Button
            onClick={() => setLocation('/dashboard')}
            className="w-full h-12 text-base font-bold"
          >
            {t('auth.start_using')}
            <ArrowRight className="w-4 h-4 ms-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Phase 1: username input ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Wrench className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center mb-2 text-slate-900 dark:text-white">
          {t('auth.register')}
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-base">
          {t('auth.landing_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {t('auth.username')}
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-13 text-lg px-4"
              placeholder="أدخل اسمك..."
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold mt-2"
            disabled={registerMutation.isPending || username.trim().length < 2}
          >
            {registerMutation.isPending ? '...' : t('auth.register')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-base font-medium text-primary hover:underline"
          >
            {t('auth.have_code')}
          </Link>
        </div>

        {/* Hidden Z2013 easter-egg link */}
        <div className="mt-3 text-center">
          <span
            className="text-xs text-slate-300 dark:text-slate-700 cursor-pointer hover:text-slate-400 transition-colors select-none"
            title="Z2013"
            onClick={() => {
              const code = prompt('أدخل الكود:');
              if (code?.trim().toUpperCase() === 'Z2013') {
                window.location.href = (import.meta.env.BASE_URL?.replace(/\/$/, '') || '') + '/download';
              }
            }}
          >
            ···
          </span>
        </div>
      </div>
    </div>
  );
}
