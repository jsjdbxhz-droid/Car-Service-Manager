import { ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/contexts/i18n-context';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Wrench,
  Globe,
  Menu,
  Crown,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { session, logout, isOwner, isImpersonating, originalSession, exitImpersonation } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleExitImpersonation = () => {
    exitImpersonation();
    setLocation('/admin');
  };

  const navItems = [
    { href: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
    { href: '/records', label: 'nav.records', icon: Users },
    { href: '/invoices', label: 'nav.invoices', icon: FileText },
    { href: '/settings', label: 'nav.settings', icon: Settings },
  ];

  // Only show owner panel for the real owner (not while impersonating a regular user)
  if (isOwner && !isImpersonating) {
    navItems.splice(navItems.length - 1, 0, { href: '/admin', label: 'nav.owner', icon: Crown });
  }

  const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-semibold text-sm ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{t(item.label)}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* ── Sidebar – Desktop ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 fixed h-full z-10">
        <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="font-black text-lg text-slate-900 dark:text-white">
            {t('app.name')}
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-4">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Username + role badge */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{session?.username}</p>
            {isOwner && !isImpersonating && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3" /> أونر
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 me-3" />
            {t('nav.logout')}
          </Button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 md:ms-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-64 p-0">
                <div className="p-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
                  <Wrench className="w-5 h-5 text-primary" />
                  <span className="font-black text-lg">{t('app.name')}</span>
                </div>
                <nav className="p-3 space-y-1">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>
            <span className="font-black text-base">{t('app.name')}</span>
          </div>

          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="w-5 h-5 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(['ar', 'en', 'fr'] as const).map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={language === lang ? 'bg-slate-100 dark:bg-slate-800 font-bold' : ''}
                  >
                    {lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : 'Français'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile logout */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={handleLogout}>
              <LogOut className="w-5 h-5 text-destructive" />
            </Button>
          </div>
        </header>

        {/* ── Impersonation banner ── */}
        {isImpersonating && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-4 text-sm font-bold">
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              {t('owner.impersonating')}: <span className="underline">{session?.username}</span>
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 bg-white/20 border-white/40 text-white hover:bg-white/30 hover:text-white font-bold"
              onClick={handleExitImpersonation}
            >
              {t('owner.exit')} → {originalSession?.username}
            </Button>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
