import { useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/contexts/i18n-context';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Download as DownloadIcon, Smartphone, Check } from 'lucide-react';
import { getInstallPrompt, clearInstallPrompt } from '@/lib/pwa';

export default function Download() {
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const [installed, setInstalled] = useState(false);

  const handleInstall = async () => {
    const prompt = getInstallPrompt();
    if (!prompt) {
      // No prompt available: show platform-specific instructions
      const msg =
        /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? t('download.ios_instructions')
          : t('download.android_instructions');
      alert(msg);
      return;
    }
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      clearInstallPrompt();
      setInstalled(true);
    }
  };

  const appUrl = window.location.origin + (import.meta.env.BASE_URL ?? '/');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 start-4"
        onClick={() => setLocation('/')}
      >
        {language === 'ar' ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
      </Button>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-xl p-8 border border-slate-100 dark:border-slate-800 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-6 rounded-full">
            <Smartphone className="w-16 h-16 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
          {t('download.title')}
        </h1>
        <p className="text-slate-500 mb-8">
          {t('download.subtitle')}
        </p>

        {/* QR Code */}
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl mb-6 flex flex-col items-center border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-48 h-48 bg-white rounded-lg p-2 shadow-sm">
            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
            {t('download.qr_instruction')}
          </p>
        </div>

        {installed ? (
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-lg h-14">
            <Check className="w-6 h-6" />
            {t('download.installed')}
          </div>
        ) : (
          <Button onClick={handleInstall} className="w-full h-14 text-lg">
            <DownloadIcon className="w-5 h-5 me-2" />
            {t('download.install_pwa')}
          </Button>
        )}

        <p className="mt-4 text-xs text-slate-400">
          {t('download.install_hint')}
        </p>
      </div>
    </div>
  );
}
