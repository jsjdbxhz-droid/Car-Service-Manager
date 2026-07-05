import { useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/contexts/i18n-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench } from 'lucide-react';

export default function Landing() {
  const [code, setCode] = useState('');
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'Z2013') {
      setLocation('/download');
    } else {
      setLocation('/login');
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
          {t('auth.landing_subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            type="text" 
            placeholder={t('auth.enter_code')} 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-lg tracking-widest h-14"
            autoFocus
          />
          <Button type="submit" className="w-full h-12 text-lg">
            {t('auth.submit')}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 flex flex-col items-center">
          <Button variant="outline" className="w-full h-12" onClick={() => setLocation('/login')}>
            {t('auth.or_login')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setLocation('/register')}>
            {t('auth.register_new')}
          </Button>
        </div>
      </div>
    </div>
  );
}
