import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { Sprout, LayoutDashboard, ShieldCheck, MapPin, FileText, Package, ShoppingCart, Users, BarChart3, LogOut, Menu, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/farmers', label: 'Farmers', icon: Users },
  { to: '/admin/farms', label: 'Farms', icon: MapPin },
  { to: '/admin/documents', label: 'Documents', icon: FileText },
  { to: '/admin/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/market-data', label: 'Market Data', icon: TrendingUp },
];

export default function AdminPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const handleLogout = () => base44.auth.logout('/login');

  const pageTitle = [...NAV].reverse().find(item =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )?.label || 'Admin';

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar transition-transform md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-4 w-4" />
          </div>
          <div>
            <div className="font-heading text-lg font-bold leading-none">FarmTrust</div>
            <div className="text-xs text-muted-foreground">Admin</div>
          </div>
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
                <Icon className="h-4 w-4" /> {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-border p-3">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-md p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate font-heading text-lg font-semibold">{pageTitle}</h1>
          <Link to="/" className="shrink-0"><Button variant="outline" size="sm">View marketplace</Button></Link>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
