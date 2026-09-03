import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/AuthContext';

export default function PublicNavbar() {
  const { count } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.account_type === 'farmer' ? '/farmer' : null;

  const links = [
    { label: 'Marketplace', to: '/' },
    { label: 'Market Prices', to: '/market-prices' },
    { label: 'How it works', to: '/how-it-works' },
    { label: 'For Farmers', to: '/farmer' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">
            Farm<span className="text-primary">Trust</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                  {count}
                </span>
              )}
            </Button>
          </Link>
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              {dashboardLink && (
                <Link to={dashboardLink}><Button variant="outline" size="sm">{user.role === 'admin' ? 'Admin' : 'Farmer portal'}</Button></Link>
              )}
              <Link to="/account">
                <Button variant="outline" size="sm"><User className="mr-1.5 h-3.5 w-3.5" />{user?.full_name?.split(' ')[0] || 'Account'}</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => logout()} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden md:block">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
              <Link to="/register" className="hidden md:block">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-card px-4 py-3 md:hidden">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted">
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="mt-2 space-y-2">
              {dashboardLink && (
                <Link to={dashboardLink} onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">{user.role === 'admin' ? 'Admin dashboard' : 'Farmer portal'}</Button>
                </Link>
              )}
              <Link to="/account" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full"><User className="mr-1.5 h-3.5 w-3.5" />My account</Button>
              </Link>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => { setOpen(false); logout(); }}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <Link to="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Sign in</Button></Link>
              <Link to="/register" className="flex-1"><Button size="sm" className="w-full">Get started</Button></Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
