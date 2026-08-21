import React from 'react';
import { ShieldCheck, MapPin, FileText, Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVELS = {
  identity: { icon: ShieldCheck, label: 'Identity Verified', color: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200' },
  location: { icon: MapPin, label: 'Farm Location Verified', color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  documents: { icon: FileText, label: 'Land Documents Verified', color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' },
  fully_verified: { icon: ShieldCheck, label: 'Fully Verified', color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20' },
};

export default function VerifiedBadge({ level = 'none', size = 'md', showLabel = true, className }) {
  if (level === 'none' || !level) {
    return showLabel ? (
      <span className={cn('inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground', className)}>
        Unverified
      </span>
    ) : null;
  }

  const config = LEVELS[level] || LEVELS.fully_verified;
  const Icon = config.icon;
  const sizeCls = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full ring-1 font-semibold', config.bg, config.color, config.ring, sizeCls, className)}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {showLabel && config.label}
    </span>
  );
}
