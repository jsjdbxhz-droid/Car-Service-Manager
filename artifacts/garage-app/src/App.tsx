import { useEffect } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { I18nProvider } from '@/contexts/i18n-context';

// Register PWA install prompt listener early
import '@/lib/pwa';

import Landing from '@/pages/landing';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Download from '@/pages/download';
import Dashboard from '@/pages/dashboard';
import RecordsList from '@/pages/records/list';
import RecordForm from '@/pages/records/form';
import InvoicesList from '@/pages/invoices/list';
import InvoiceForm from '@/pages/invoices/form';
import InvoiceDetail from '@/pages/invoices/detail';
import OwnerPanel from '@/pages/admin';
import Settings from '@/pages/settings';
import NotFound from '@/pages/not-found';

import AppShell from '@/components/app-shell';
import { AuthInterceptor } from '@/components/auth-interceptor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// Gate: user must have passed the gateway (or already be authenticated)
function GatewayRoute({ component: Component }: { component: React.ComponentType }) {
  const { isGatewayPassed, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !isGatewayPassed) setLocation('/');
  }, [isAuthenticated, isGatewayPassed, setLocation]);

  if (!isAuthenticated && !isGatewayPassed) return null;
  return <Component />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation('/');
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;
  return <AppShell><Component /></AppShell>;
}

function OwnerRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isOwner } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation('/');
    else if (!isOwner) setLocation('/dashboard');
  }, [isAuthenticated, isOwner, setLocation]);

  if (!isAuthenticated || !isOwner) return null;
  return <AppShell><Component /></AppShell>;
}

function Router() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  // Authenticated users skip gateway and go straight to dashboard
  useEffect(() => {
    if (isAuthenticated && (location === '/' || location === '/login' || location === '/register')) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, location, setLocation]);

  return (
    <Switch>
      {/* Gateway entry point */}
      <Route path="/" component={Landing} />

      {/* Login / Register gated behind gateway */}
      <Route path="/login"><GatewayRoute component={Login} /></Route>
      <Route path="/register"><GatewayRoute component={Register} /></Route>

      <Route path="/download" component={Download} />

      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>

      <Route path="/records"><ProtectedRoute component={RecordsList} /></Route>
      <Route path="/records/new"><ProtectedRoute component={RecordForm} /></Route>
      <Route path="/records/:id/edit"><ProtectedRoute component={RecordForm} /></Route>

      <Route path="/invoices"><ProtectedRoute component={InvoicesList} /></Route>
      <Route path="/invoices/new"><ProtectedRoute component={InvoiceForm} /></Route>
      <Route path="/invoices/:id"><ProtectedRoute component={InvoiceDetail} /></Route>
      <Route path="/invoices/:id/edit"><ProtectedRoute component={InvoiceForm} /></Route>

      <Route path="/admin"><OwnerRoute component={OwnerPanel} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <I18nProvider>
            <AuthInterceptor />
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
              <Router />
            </WouterRouter>
            <Toaster />
          </I18nProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
