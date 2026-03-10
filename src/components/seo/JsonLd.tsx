import { Helmet } from 'react-helmet-async';

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape closing script tags to prevent XSS via structured data injection
  const safeJson = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
  return (
    <Helmet>
      <script type="application/ld+json">{safeJson}</script>
    </Helmet>
  );
}

