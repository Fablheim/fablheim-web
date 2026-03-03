import { Helmet } from 'react-helmet-async';
import { DEFAULT_OG_IMAGE, SITE_NAME, buildCanonicalUrl, getSiteUrl } from '@/seo/seo.config';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  noindex?: boolean;
  ogType?: 'website' | 'article';
  imagePath?: string;
}

export function SEO({
  title,
  description,
  canonicalPath,
  noindex = false,
  ogType = 'website',
  imagePath = DEFAULT_OG_IMAGE,
}: SEOProps) {
  const canonical = buildCanonicalUrl(canonicalPath);
  const image = new URL(imagePath, getSiteUrl()).toString();
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}

