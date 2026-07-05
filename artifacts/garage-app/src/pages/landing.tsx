import { useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, AlertCircle, Loader2 } from 'lucide-react';

function getApiBase() {
  return ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
}

export default function Landing() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { passGateway } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiBase()}/api/config/verify-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; revision?: number; error?: string };
      if (!res.ok) {
        if (res.status === 429) {
          setError(t('auth.gateway_rate_limit'));
        } else {
          setError(t('auth.gateway_wrong_code'));
        }
      } else {
        passGateway(data.revision!);
        setLocation('/login');
      }
    } catch {
      setError(t('msg.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-xl p-8 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Wrench className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          {t('auth.landing_title')}
        </h1>
        <p className="text-center text-slate-500 mb-8">
          {t('auth.gateway_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder={t('auth.enter_code')}
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            className="text-center text-xl tracking-widest h-14 uppercase"
            autoFocus
            disabled={loading}
          />
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full h-12 text-lg" disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
