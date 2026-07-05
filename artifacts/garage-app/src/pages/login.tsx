import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { useLogin } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [loginCode, setLoginCode] = useState('');
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { login: authenticate } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode.trim()) return;

    loginMutation.mutate({ data: { loginCode: loginCode.trim() } }, {
      onSuccess: (res) => {
        authenticate({
          userId: res.user.id.toString(),
          token: res.token,
          username: res.user.username,
          role: res.user.role as 'user' | 'owner' | 'admin',
          deviceId: res.user.deviceId || undefined,
        });
        setLocation('/dashboard');
      },
      onError: () => {
        toast({ title: t('msg.error'), description: 'رمز الدخول غير صحيح', variant: 'destructive' });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Wrench className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center mb-2 text-slate-900 dark:text-white">
          {t('auth.login')}
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-base">
          {t('auth.or_login')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {t('auth.login_code')}
            </label>
            <Input
              type="text"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder={t('auth.login_code_placeholder')}
              className="text-center text-xl tracking-widest h-13 font-mono"
              dir="ltr"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold"
            disabled={loginMutation.isPending || loginCode.trim().length < 4}
          >
            {loginMutation.isPending ? '...' : t('auth.login')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/register" className="text-base font-medium text-primary hover:underline">
            {t('auth.no_account')}
          </Link>
        </div>
      </div>
    </div>
  );
}
