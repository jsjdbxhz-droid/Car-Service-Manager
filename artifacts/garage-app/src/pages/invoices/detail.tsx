import { useLocation, useParams } from 'wouter';
import { useGetInvoice, getGetInvoiceQueryKey } from '@workspace/api-client-react';
import { useI18n } from '@/contexts/i18n-context';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, ArrowRight, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function InvoiceDetail() {
  const params = useParams();
  const id = parseInt(params.id || '0', 10);
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();

  const { data: invoice, isLoading } = useGetInvoice(id, {
    query: { enabled: !!id, queryKey: getGetInvoiceQueryKey(id) },
  });

  const handlePrint = () => window.print();

  const handlePdf = () => {
    // Open print dialog — user selects "Save as PDF"
    document.title = `فاتورة-${invoice?.id?.toString().padStart(5, '0') ?? ''}`;
    window.print();
    // Restore title after delay
    setTimeout(() => { document.title = 'إدارة الورشة'; }, 3000);
  };

  if (isLoading || !invoice) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Non-printable controls */}
      <div className="flex items-center justify-between mb-6 print:hidden gap-2 flex-wrap">
        <Button variant="outline" onClick={() => setLocation('/invoices')}>
          {language === 'ar'
            ? <ArrowRight className="w-4 h-4 me-2" />
            : <ArrowLeft className="w-4 h-4 me-2" />
          }
          {t('invoices.title')}
        </Button>

        <div className="flex gap-2">
          {/* PDF export */}
          <Button
            onClick={handlePdf}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileDown className="w-4 h-4 me-2" />
            {t('invoices.pdf')}
          </Button>
          {/* Print */}
          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Printer className="w-4 h-4 me-2" />
            {t('invoices.print')}
          </Button>
        </div>
      </div>

      {/* PDF hint (non-print) */}
      <p className="text-xs text-slate-400 text-center mb-4 print:hidden">
        لتحويل إلى PDF: اضغط &ldquo;تحويل إلى PDF&rdquo; ثم اختر &ldquo;حفظ كـ PDF&rdquo; من نافذة الطباعة
      </p>

      {/* Printable Invoice */}
      <Card className="bg-white rounded-none sm:rounded-xl shadow-sm border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0">
        <CardContent className="p-8 sm:p-12 text-slate-900 font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                {invoice.workshopName}
              </h1>
              {invoice.companyPhone && (
                <p className="text-slate-600 font-medium text-base mb-1" dir="ltr">
                  {invoice.companyPhone}
                </p>
              )}
              <p className="text-slate-500 font-medium text-base">
                {t('invoice.date')}: {new Date(invoice.createdAt).toLocaleDateString('ar-DZ')}
              </p>
            </div>
            <div className="text-end">
              <h2 className="text-2xl font-bold text-slate-300">FACTURE</h2>
              <p className="text-xl font-mono mt-1 text-slate-900">
                N° {invoice.id.toString().padStart(5, '0')}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {t('invoice.customer_info')}
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-black text-xl mb-1">{invoice.firstName} {invoice.lastName}</p>
                {invoice.customerNumber && (
                  <p className="text-slate-500 font-mono text-sm" dir="ltr">{invoice.customerNumber}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {t('invoice.car_info')}
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-black text-xl mb-1">{invoice.carType}</p>
                <p className="text-slate-500 font-mono text-sm" dir="ltr">{invoice.licensePlate}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="mb-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
              {t('invoice.details')}
            </h3>
            <div className="min-h-[120px] text-lg whitespace-pre-wrap text-slate-800 leading-relaxed">
              {invoice.breakdownType}
            </div>
          </div>

          {/* Total Footer */}
          <div className="border-t-2 border-slate-200 pt-8 flex justify-between items-end">
            <div>
              <p className="text-slate-400 text-sm mb-1 font-medium">{t('field.paymentMethod')}</p>
              <p className="font-bold text-lg text-slate-800">{invoice.paymentMethod}</p>
            </div>
            <div className="text-end">
              <p className="text-slate-400 uppercase tracking-wider font-bold text-xs mb-1">Total</p>
              <p className="text-5xl font-black text-emerald-600">
                {invoice.amount.toLocaleString()}
                <span className="text-2xl text-emerald-700/60 ms-2">DZD</span>
              </p>
            </div>
          </div>

          <div className="mt-16 text-center text-slate-300 text-sm border-t border-slate-100 pt-4 print:mt-24">
            شكراً لثقتكم &nbsp;·&nbsp; Merci pour votre confiance
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          @page { margin: 0.8cm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }

          /* Hide navigation */
          aside, header, nav { display: none !important; }

          /* Fix overflow clipping — this is why content was cut off */
          html, body { overflow: visible !important; height: auto !important; }
          main {
            margin-inline-start: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            display: block !important;
          }
          main > * { overflow: visible !important; height: auto !important; }
          main > div { padding: 0 !important; overflow: visible !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
}
