import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useI18n } from '@/contexts/i18n-context';
import { useGetInvoice, useCreateInvoice, useUpdateInvoice, getListInvoicesQueryKey, getGetInvoiceQueryKey } from '@workspace/api-client-react';
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
import { ArrowRight, ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  carType: z.string().min(1, 'Required'),
  licensePlate: z.string().min(1, 'Required'),
  workshopName: z.string().min(1, 'Required'),
  breakdownType: z.string().min(1, 'Required'),
  paymentMethod: z.string().min(1, 'Required'),
  amount: z.coerce.number().min(0),
  customerNumber: z.string().optional(),
});

export default function InvoiceForm() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const isEdit = !!id;
  const [, setLocation] = useLocation();
  const { t, language } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useGetInvoice(id as number, {
    query: { enabled: isEdit, queryKey: getGetInvoiceQueryKey(id as number) }
  });

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      carType: '',
      licensePlate: '',
      workshopName: '',
      breakdownType: '',
      paymentMethod: 'نقد / Espèce',
      amount: 0,
      customerNumber: '',
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        firstName: invoice.firstName,
        lastName: invoice.lastName,
        carType: invoice.carType,
        licensePlate: invoice.licensePlate,
        workshopName: invoice.workshopName,
        breakdownType: invoice.breakdownType,
        paymentMethod: invoice.paymentMethod,
        amount: invoice.amount,
        customerNumber: invoice.customerNumber || '',
      });
    }
  }, [invoice, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEdit) {
      updateMutation.mutate({ id: id as number, data: values }, {
        onSuccess: () => {
          toast({ title: t('msg.success') });
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          setLocation('/invoices');
        },
        onError: () => toast({ title: t('msg.error'), variant: 'destructive' })
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: (res) => {
          toast({ title: t('msg.success') });
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          // Redirect to print view instead of list
          setLocation(`/invoices/${res.id}`);
        },
        onError: () => toast({ title: t('msg.error'), variant: 'destructive' })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation('/invoices')}>
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEdit ? t('invoices.edit') : t('invoices.add_new')}
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-semibold text-primary">{t('invoice.workshop_name')}</h3>
                <FormField
                  control={form.control}
                  name="workshopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Garage XYZ..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="font-semibold text-primary mb-2">{t('invoice.customer_info')}</h3>
              </div>
              
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('field.firstName')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('field.lastName')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('field.customerNumber')}</FormLabel>
                    <FormControl><Input {...field} dir="ltr" className="text-end" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 mt-4">
                <h3 className="font-semibold text-primary mb-2">{t('invoice.car_info')}</h3>
              </div>

              <FormField
                control={form.control}
                name="carType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('field.carType')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('field.licensePlate')}</FormLabel>
                    <FormControl><Input {...field} dir="ltr" className="text-end font-mono" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 mt-4">
                <h3 className="font-semibold text-primary mb-2">{t('invoice.details')}</h3>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('field.amount')}</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('field.paymentMethod')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="breakdownType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('field.breakdownType')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px]" placeholder="Detailed description of repairs..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12" disabled={isPending}>
              {isPending ? '...' : (isEdit ? t('invoices.save') : t('invoices.save') + " & " + t('invoices.print'))}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
