import { useState } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import { useUpdateCompany } from '@workspace/api-client-react';
import { Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function CompanySetupBanner() {
  const { t } = useI18n();
  const { session, updateCompany } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState(session?.companyName ?? '');
  const [phone, setPhone] = useState(session?.companyPhone ?? '');
  const updateMutation = useUpdateCompany();
  const { toast } = useToast();

  // Show banner only when companyName or companyPhone is missing
  const needsSetup = !session?.companyName || !session?.companyPhone;
  if (!needsSetup || dismissed) return null;

  const handleSave = () => {
    updateMutation.mutate(
      { data: { companyName: name.trim(), companyPhone: phone.trim() } },
      {
        onSuccess: () => {
          updateCompany(name.trim(), phone.trim());
          toast({ title: t('company.saved') });
          setOpen(false);
        },
        onError: () => toast({ title: t('msg.error'), variant: 'destructive' }),
      },
    );
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 px-4 py-3 text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              {t('company.setup_title')}
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5 truncate">
              {t('company.setup_desc')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 text-xs"
            onClick={() => setOpen(true)}
          >
            {t('company.save')}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {t('company.setup_title')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">
            {t('company.setup_desc')}
          </p>
          <div className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('company.name')}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Garage Atlas..."
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('company.phone')}
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0550 123 456"
                dir="ltr"
                className="text-start"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {t('company.skip')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={updateMutation.isPending || !name.trim()}
            >
              {updateMutation.isPending ? '...' : t('company.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
