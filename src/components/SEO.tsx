import { Helmet } from 'react-helmet-async';

interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: object | object[];
  canonical?: string;
}

const SITE = 'BABYCENTER';
const DEFAULT_DESC = 'Boutique premium vêtements enfants 0-16 ans à Abidjan. Élégance, qualité, livraison rapide en Côte d\'Ivoire.';

export default function SEO({ title, description, image, type = 'website', jsonLd, canonical }: Props) {
  const fullTitle = title.includes(SITE) ? title : `${title} — ${SITE}`;
  const desc = description ?? DEFAULT_DESC;
  const url = canonical ?? (typeof window !== 'undefined' ? window.location.href : '');
  const img = image ?? (typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : '');
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {img && <meta property="og:image" content={img} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {img && <meta name="twitter:image" content={img} />}
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
