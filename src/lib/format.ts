export const fcfa = (n: number | null | undefined) =>
  `${Number(n ?? 0).toLocaleString('fr-FR')} FCFA`;

export const shortDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const shortDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Formate un numéro de téléphone (Côte d'Ivoire) pour l'affichage.
 * Ne modifie pas la donnée stockée. Tolère les formats variés.
 * Ex: "0707070723" -> "+225 07 07 07 07 23"
 *     "+225 07 08 09 10 12" -> "+225 07 08 09 10 12"
 */
export const formatPhone = (raw: string | null | undefined): string => {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;

  let cc = '';
  let local = digits;
  if (hasPlus || digits.startsWith('225')) {
    cc = '225';
    local = digits.startsWith('225') ? digits.slice(3) : digits;
  } else if (digits.length === 10) {
    cc = '225';
  }
  const grouped = local.match(/.{1,2}/g)?.join(' ') ?? local;
  return cc ? `+${cc} ${grouped}` : grouped;
};

