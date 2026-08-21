import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sprout className="h-4 w-4" />
              </div>
              <span className="font-heading text-lg font-bold">FarmTrust</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Know your farmer. Know the farm. Know where your food comes from.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">Marketplace</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground">Browse</Link></li>
                <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Farmers</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/farmer" className="hover:text-foreground">Farmer portal</Link></li>
                <li><Link to="/register" className="hover:text-foreground">Join</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Trust</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/how-it-works" className="hover:text-foreground">Verification</Link></li>
                <li><span>Verified farmers</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} FarmTrust. Built for trust in every harvest.
        </div>
      </div>
    </footer>
  );
}
