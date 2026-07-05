import { useLocation } from 'wouter';
import { useI18n } from '@/contexts/i18n-context';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Download as DownloadIcon, Smartphone } from 'lucide-react';

export default function Download() {
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();

  const handleInstall = () => {
    // In a real PWA, this would trigger the beforeinstallprompt prompt.
    alert('PWA installation prompt would appear here.');
  };

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

        <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-xl mb-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
          {/* Placeholder for real QR code */}
          <div className="w-48 h-48 bg-white dark:bg-slate-950 rounded-lg p-2 shadow-sm flex items-center justify-center">
            <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://garagemanager.app')] bg-contain bg-no-repeat opacity-80 mix-blend-multiply dark:mix-blend-screen dark:invert" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
            {t('download.qr_instruction')}
          </p>
        </div>

        <Button onClick={handleInstall} className="w-full h-14 text-lg">
          <DownloadIcon className="w-5 h-5 me-2" />
          {t('download.install_pwa')}
        </Button>
      </div>
    </div>
  );
}
