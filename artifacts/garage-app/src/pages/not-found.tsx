import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-8xl font-bold text-primary opacity-20">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Page not found</h2>
        <p className="text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
        <Button onClick={() => setLocation('/')} className="mt-4">
          Go back home
        </Button>
      </div>
    </div>
  );
}
