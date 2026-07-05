import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useI18n } from '@/contexts/i18n-context';
import { useGetRecord, useCreateRecord, useUpdateRecord, getListRecordsQueryKey, getGetRecordQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft, Mic, MicOff, RotateCcw, SkipForward, Keyboard, CheckCircle2 } from 'lucide-react';

// ── Form schema ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  carType: z.string().min(1, 'Required'),
  licensePlate: z.string().min(1, 'Required'),
  breakdownType: z.string().min(1, 'Required'),
  totalAmount: z.coerce.number().min(0),
  customerNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type FieldName = keyof FormValues;

// ── Voice field sequence ─────────────────────────────────────────────────────
interface VoiceField { name: FieldName; optional?: boolean }

// ── Helpers ──────────────────────────────────────────────────────────────────
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((event: any) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSR = (): (new () => ISpeechRecognition) | null =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) as (new () => ISpeechRecognition) | null;

// ── Component ────────────────────────────────────────────────────────────────
export default function RecordForm() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Voice state ────────────────────────────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceResult, setVoiceResult] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voiceFields: VoiceField[] = [
    { name: 'firstName' },
    { name: 'lastName' },
    { name: 'carType' },
    { name: 'licensePlate' },
    { name: 'customerNumber', optional: true },
    { name: 'totalAmount' },
    { name: 'breakdownType' },
  ];

  const currentVF = voiceFields[voiceIdx];

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: record, isLoading } = useGetRecord(id as number, {
    query: { enabled: isEdit, queryKey: getGetRecordQueryKey(id as number) }
  });

  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '', lastName: '', carType: '', licensePlate: '',
      breakdownType: '', totalAmount: 0, customerNumber: '',
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        firstName: record.firstName, lastName: record.lastName,
        carType: record.carType, licensePlate: record.licensePlate,
        breakdownType: record.breakdownType, totalAmount: record.totalAmount,
        customerNumber: record.customerNumber || '',
      });
    }
  }, [record, form]);

  // ── Voice logic ────────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setListening(false);
  }, []);

  useEffect(() => { return () => stopListening(); }, [stopListening]);

  const applyResult = useCallback((value: string, field: VoiceField) => {
    if (field.name === 'totalAmount') {
      const num = parseFloat(value.replace(/[^\d.]/g, ''));
      form.setValue('totalAmount', isNaN(num) ? 0 : num);
    } else {
      form.setValue(field.name, value, { shouldValidate: true });
    }
  }, [form]);

  const advanceVoice = useCallback(() => {
    setVoiceResult('');
    if (voiceIdx < voiceFields.length - 1) {
      setVoiceIdx((i) => i + 1);
    } else {
      // All done → go back to text mode for review
      setVoiceMode(false);
      setVoiceIdx(0);
      toast({ title: t('voice.done') });
    }
  }, [voiceIdx, voiceFields.length, toast, t]);

  const acceptResult = useCallback((value: string, field: VoiceField) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    applyResult(value, field);
    advanceVoice();
  }, [applyResult, advanceVoice]);

  const startListening = useCallback(() => {
    const SR = getSR();
    if (!SR) {
      toast({ title: t('voice.not_supported'), variant: 'destructive' });
      setVoiceMode(false);
      return;
    }
    setVoiceResult('');
    const recognition = new SR();
    recognition.lang = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? '';
      setVoiceResult(text);
      setListening(false);
      // Auto-accept after 1.5 s
      timerRef.current = setTimeout(() => {
        acceptResult(text, currentVF);
      }, 1500);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [language, currentVF, acceptResult, toast, t]);

  const handleSkip = () => {
    stopListening();
    setVoiceResult('');
    advanceVoice();
  };

  const handleRetry = () => {
    stopListening();
    setVoiceResult('');
    startListening();
  };

  const handleManualAccept = () => {
    if (!voiceResult) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    applyResult(voiceResult, currentVF);
    advanceVoice();
  };

  const enterVoiceMode = () => {
    if (!getSR()) {
      toast({ title: t('voice.not_supported'), variant: 'destructive' });
      return;
    }
    setVoiceIdx(0);
    setVoiceResult('');
    setVoiceMode(true);
  };

  const exitVoiceMode = () => {
    stopListening();
    setVoiceMode(false);
    setVoiceIdx(0);
    setVoiceResult('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      updateMutation.mutate({ id: id as number, data: values }, {
        onSuccess: () => {
          toast({ title: t('msg.success') });
          queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setLocation('/records');
        },
        onError: () => toast({ title: t('msg.error'), variant: 'destructive' })
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: t('msg.success') });
          queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setLocation('/records');
        },
        onError: () => toast({ title: t('msg.error'), variant: 'destructive' })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) return <div className="p-8 text-center text-slate-400">...</div>;

  // ── Voice Mode UI ──────────────────────────────────────────────────────────
  if (voiceMode && !isEdit) {
    const fieldLabel = (() => {
      const k = `field.${currentVF.name}` as const;
      return t(k as Parameters<typeof t>[0]);
    })();
    const stepLabel = `${voiceIdx + 1} / ${voiceFields.length}`;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={exitVoiceMode}>
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('records.add_new')}</h1>
          <Button variant="outline" size="sm" className="ms-auto" onClick={exitVoiceMode}>
            <Keyboard className="w-4 h-4 me-1.5" />
            {t('voice.switch_text')}
          </Button>
        </div>

        {/* Voice card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col items-center gap-6">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {voiceFields.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < voiceIdx ? 'bg-emerald-400 w-5' :
                  i === voiceIdx ? 'bg-primary w-8' : 'bg-slate-200 dark:bg-slate-700 w-5'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 -mt-3">{stepLabel}</p>

          {/* Field name */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">{t('voice.current_field')}</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{fieldLabel}</h2>
            {currentVF.optional && (
              <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                {t('voice.optional')}
              </span>
            )}
          </div>

          {/* Mic button */}
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
              listening
                ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                : voiceResult
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {listening ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : voiceResult ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>

          {/* Status / result */}
          {listening && !voiceResult && (
            <p className="text-slate-500 animate-pulse">{t('voice.listening')}</p>
          )}
          {!listening && !voiceResult && (
            <p className="text-slate-400 text-sm">{t('voice.tap_mic')}</p>
          )}
          {voiceResult && (
            <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{t('voice.recognized')}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{voiceResult}</p>
              <p className="text-xs text-slate-400 mt-1">{t('voice.auto_accept')}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 w-full">
            {voiceResult ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4 me-1.5" />
                  {t('voice.retry')}
                </Button>
                <Button className="flex-1" onClick={handleManualAccept}>
                  <CheckCircle2 className="w-4 h-4 me-1.5" />
                  {t('voice.accept')}
                </Button>
              </>
            ) : (
              currentVF.optional && (
                <Button variant="outline" className="w-full" onClick={handleSkip}>
                  <SkipForward className="w-4 h-4 me-1.5" />
                  {t('voice.skip')}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Preview of already-filled fields */}
        {voiceIdx > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">{t('voice.filled')}</p>
            <div className="space-y-1.5">
              {voiceFields.slice(0, voiceIdx).map((f) => {
                const val = form.getValues(f.name);
                if (!val && val !== 0) return null;
                const lk = `field.${f.name}` as Parameters<typeof t>[0];
                return (
                  <div key={f.name} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-slate-500">{t(lk)}:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{String(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Text Mode UI ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation('/records')}>
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEdit ? t('records.edit') : t('records.add_new')}
        </h1>
        {/* Voice toggle — only for new records */}
        {!isEdit && (
          <Button variant="outline" size="sm" className="ms-auto gap-1.5" onClick={enterVoiceMode}>
            <Mic className="w-4 h-4" />
            {t('voice.switch_voice')}
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.firstName')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.lastName')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="carType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.carType')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="licensePlate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.licensePlate')}</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="text-end font-mono" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customerNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.customerNumber')}</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="text-end" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="totalAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.totalAmount')}</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="breakdownType" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('field.breakdownType')}</FormLabel>
                <FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full h-12" disabled={isPending}>
              {isPending ? '...' : t('records.save')}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
