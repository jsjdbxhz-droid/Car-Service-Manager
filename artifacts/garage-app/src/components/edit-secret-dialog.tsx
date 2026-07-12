import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/contexts/i18n-context';
import { useAuth } from '@/contexts/auth-context';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';

function getApiBase() {
  return ((import.meta.env.BASE_URL as string | undefined) ?? '').replace(/\/$/, '');
}

interface EditSecretDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSecretDialog({ open, onClose, onSuccess }: EditSecretDialogProps) {
  const { t } = useI18n();
  const { session } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // focus input when dialog opens
  useEffect(() => {
    if (open) {
      setCode('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiBase()}/api/config/verify-edit-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(t('edit_secret.wrong_code'));
      }
    } catch {
      setError(t('msg.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleVerify();
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4 text-amber-500" />
            {t('edit_secret.title')}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('edit_secret.hint')}</p>
          <Input
            ref={inputRef}
            type="password"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            placeholder="••••••"
            dir="ltr"
            className="text-center font-mono tracking-widest text-lg h-12"
          />
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            {t('msg.cancel')}
          </AlertDialogCancel>
          <Button onClick={handleVerify} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('edit_secret.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
