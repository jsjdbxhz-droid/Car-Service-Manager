import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function AuthInterceptor() {
  const { logout } = useAuth();
  
  useEffect(() => {
    // We could add a global error listener here if needed to handle 401s
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error?.status === 401) {
        logout();
      }
    };
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, [logout]);
  
  return null;
}
