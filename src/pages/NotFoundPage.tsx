import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import { SEO } from '@/components/seo/SEO';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <SEO title="Page Not Found | Fablheim" description="The page you are looking for does not exist." canonicalPath="/404" noindex />
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-muted bg-muted/30">
          <MapPinOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-['IM_Fell_English'] text-3xl font-bold text-foreground">
          Page Not Found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The path you seek does not exist in this realm.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-md border border-iron bg-accent px-4 py-2 text-sm text-muted-foreground hover:bg-accent/80 transition-all font-[Cinzel] uppercase tracking-wider"
          >
            Home
          </Link>
          <Link
            to="/app"
            className="rounded-md border border-gold/30 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/15 transition-all font-[Cinzel] uppercase tracking-wider"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
