import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown when a logged-in user hits a route their role doesn't cover (e.g. a
// customer navigating to /admin by URL) - distinct from the unauthenticated
// case, which redirects to /login instead.
export default function NotAuthorized() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <div>
        <h1 className="font-heading text-xl font-semibold">You don't have access to this page</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This section is only available to certain account types. If you think this is a mistake, contact support.
        </p>
      </div>
      <Link to="/"><Button>Go to marketplace</Button></Link>
    </div>
  );
}
