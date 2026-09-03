import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, LayoutDashboard, MapPin, FileText, Package, ShoppingCart, Wallet, ShieldCheck, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import VerifiedBadge from '@/components/VerifiedBadge';
import LanguageSelector from '@/components/LanguageSelector';
import { LANGUAGE_BY_CODE } from '@/lib/indianLanguages';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const NAV = [
  { to: '/farmer', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/farmer/verification', labelKey: 'nav.verification', icon: ShieldCheck },
  { to: '/farmer/farms', labelKey: 'nav.myFarms', icon: MapPin },
  { to: '/farmer/documents', labelKey: 'nav.documents', icon: FileText },
  { to: '/farmer/products', labelKey: 'nav.products', icon: Package },
  { to: '/farmer/orders', labelKey: 'nav.orders', icon: ShoppingCart },
  { to: '/farmer/earnings', labelKey: 'nav.earnings', icon: Wallet },
  { to: '/farmer/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
];

export default function FarmerPortal() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      try {
        const u = await api.auth.me();
        setUser(u);
        // A farmer's saved language preference wins on load, so the portal
        // opens in their language without them re-picking it every visit.
        if (u?.preferred_language && LANGUAGE_BY_CODE[u.preferred_language]) i18n.changeLanguage(u.preferred_language);
      } catch {}
    })();
  }, [i18n]);

  const handleLogout = () => api.auth.logout('/login');

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar. aria-hidden only applies on mobile while the drawer is
          closed (off-screen); on desktop the sidebar is always visible so it
          must stay in the accessibility tree regardless of `sidebarOpen`,
          which only tracks the mobile drawer toggle. */}
      <aside
        aria-hidden={isMobile && !sidebarOpen ? 'true' : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar transition-transform md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="font-heading text-lg font-bold">FarmTrust</span>
        </div>

        <div className="border-b border-border p-4">
          <div className="text-xs text-muted-foreground">Farmer portal</div>
          <div className="mt-0.5 font-medium">{user?.full_name || '...'}</div>
          <div className="mt-1"><VerifiedBadge level={user?.verification_level || 'none'} size="sm" /></div>
          <LanguageSelector className="mt-3 w-full" />
        </div>

        <nav className="space-y-1 p-3">
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}>
                <Icon className="h-4 w-4" /> {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-border p-3">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" /> {t('nav.signOut')}
          </Button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-2 hover:bg-muted md:hidden"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="font-heading text-base font-semibold sm:text-lg">Farmer Portal</h1>
          <Link to="/"><Button variant="outline" size="sm">View marketplace</Button></Link>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
