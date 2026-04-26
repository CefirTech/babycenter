import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  /** Tableau d'objets JSON-LD (schema.org). Chaque entrée → balise <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  /** og:type — par défaut "website", utiliser "product" pour les fiches. */
  ogType?: string;
}

const SITE_URL = 'https://babycenter.lovable.app';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

/**
 * Met à jour title + meta + canonical + OG/Twitter + JSON-LD pour la page courante.
 * Restaure le titre et nettoie les scripts JSON-LD au démontage.
 */
export function useSEO({ title, description, canonical, image, jsonLd, ogType = 'website' }: SEOOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title.length > 60 ? title.slice(0, 57) + '…' : title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const match = selector.match(/\[(\w+)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    if (description) {
      const desc = description.length > 160 ? description.slice(0, 157) + '…' : description;
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[property="og:description"]', 'content', desc);
      setMeta('meta[name="twitter:description"]', 'content', desc);
    }

    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');

    const imgUrl = image || DEFAULT_IMAGE;
    setMeta('meta[property="og:image"]', 'content', imgUrl);
    setMeta('meta[name="twitter:image"]', 'content', imgUrl);

    let linkEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.setAttribute('rel', 'canonical');
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute('href', canonical);
      setMeta('meta[property="og:url"]', 'content', canonical);
    }

    // JSON-LD : injecter un script par schéma, marqué pour nettoyage
    const scripts: HTMLScriptElement[] = [];
    if (jsonLd) {
      const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      arr.forEach((schema) => {
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.dataset.seo = 'page';
        s.text = JSON.stringify(schema);
        document.head.appendChild(s);
        scripts.push(s);
      });
    }

    return () => {
      document.title = prevTitle;
      scripts.forEach((s) => s.remove());
    };
  }, [title, description, canonical, image, ogType, JSON.stringify(jsonLd)]);
}
