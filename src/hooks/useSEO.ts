import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description?: string;
  canonical?: string;
}

/**
 * Met à jour title + meta description + canonical pour la page courante.
 * Restaure les valeurs précédentes au démontage.
 */
export function useSEO({ title, description, canonical }: SEOOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title.length > 60 ? title.slice(0, 57) + '…' : title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
        if (key && name) el.setAttribute(key, name);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    if (description) {
      const desc = description.length > 160 ? description.slice(0, 157) + '…' : description;
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[property="og:description"]', 'content', desc);
    }
    setMeta('meta[property="og:title"]', 'content', title);

    let linkEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.setAttribute('rel', 'canonical');
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute('href', canonical);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, canonical]);
}
