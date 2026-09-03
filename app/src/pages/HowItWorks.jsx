import React from 'react';
import { ShieldCheck, MapPin, FileText, Satellite, Sprout, Users, Star } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STEPS = [
  { icon: Users, title: 'Farmer registration', desc: 'Farmers create an account with their details and contact information.' },
  { icon: ShieldCheck, title: 'Identity verification', desc: 'Farmer identity is checked through our verification process.' },
  { icon: MapPin, title: 'Farm boundary mapping', desc: 'Farmers mark their farm boundary on an interactive map. Area is calculated automatically.' },
  { icon: FileText, title: 'Land document submission', desc: 'Supporting land or lease documents are uploaded to a secure, encrypted documents vault.' },
  { icon: Satellite, title: 'Satellite & map validation', desc: 'Declared area is compared with the mapped polygon and available imagery as supporting evidence.' },
  { icon: ShieldCheck, title: 'Verification review', desc: 'Our team reviews all submissions. Flagged cases go through manual review.' },
  { icon: Sprout, title: 'Verified farmer tag', desc: 'Once all checks are complete, the farmer receives the verified badge visible to customers.' },
  { icon: Star, title: 'Marketplace & reviews', desc: 'Verified farmers publish products. Customers order, receive, and review their purchases.' },
];

export default function HowItWorks() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-br from-primary/5 to-background">
          <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Trust, verified
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              How FarmTrust verification works
            </h1>
            <p className="mt-3 text-muted-foreground">
              We don't just connect farmers and customers. We verify every farmer, map every farm, and review every document — so you know exactly where your food comes from.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <div className="space-y-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex gap-4 rounded-2xl border border-border p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">STEP {i + 1}</span>
                    </div>
                    <h3 className="font-heading text-base font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <h2 className="font-heading text-lg font-semibold">Verification is supporting evidence, not legal proof</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our verification process combines automated checks with human review. Satellite imagery is treated as supporting evidence, not proof of land ownership. Ownership and tenancy are determined from appropriate documents or authorized verification processes.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/"><Button size="lg">Browse marketplace</Button></Link>
            <Link to="/register?as=farmer"><Button size="lg" variant="outline">Become a verified farmer</Button></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
