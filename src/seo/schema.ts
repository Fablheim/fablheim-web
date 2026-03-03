import { buildCanonicalUrl } from './seo.config';

type FaqItem = { question: string; answer: string };
type HowToStep = { name: string; text: string; url?: string };
type BreadcrumbItem = { name: string; path: string };

export function softwareApplicationSchema(input: {
  name: string;
  path: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    applicationCategory: input.applicationCategory ?? 'GameApplication',
    operatingSystem: input.operatingSystem ?? 'Web',
    url: buildCanonicalUrl(input.path),
  };
}

export function faqPageSchema(path: string, items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: buildCanonicalUrl(path),
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function howToSchema(input: { name: string; path: string; description: string; steps: HowToStep[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    url: buildCanonicalUrl(input.path),
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
    })),
  };
}

export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}

export function collectionPageSchema(input: { name: string; path: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: buildCanonicalUrl(input.path),
  };
}

export function blogSchema(input: { name: string; path: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: input.name,
    description: input.description,
    url: buildCanonicalUrl(input.path),
  };
}

export function articleSchema(input: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: buildCanonicalUrl(input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      '@type': 'Organization',
      name: input.authorName,
    },
  };
}

