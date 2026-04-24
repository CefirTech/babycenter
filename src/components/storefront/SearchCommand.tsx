import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useStorefrontData } from '@/hooks/useStorefrontData';

export default function SearchCommand({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { products, categories } = useStorefrontData();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onOpenChange(!open); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const matches = q.length < 2 ? [] : products.filter(p => p.nom.toLowerCase().includes(q.toLowerCase()) || p.marque?.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const catMatches = q.length < 2 ? categories.slice(0, 5) : categories.filter(c => c.nom.toLowerCase().includes(q.toLowerCase())).slice(0, 5);

  const go = (path: string) => { onOpenChange(false); setQ(''); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher un produit, une catégorie..." value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>Aucun résultat</CommandEmpty>
        {matches.length > 0 && (
          <CommandGroup heading="Produits">
            {matches.map(p => (
              <CommandItem key={p.id} value={p.nom} onSelect={() => go(`/produit/${p.slug}`)}>
                <img src={p.images[0]} alt="" className="w-8 h-10 object-cover rounded mr-3" />
                <div className="flex-1"><p className="text-sm">{p.nom}</p><p className="text-xs text-muted-foreground">{(p.prix_promo ?? p.prix_vente).toLocaleString('fr-FR')} FCFA</p></div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {catMatches.length > 0 && (
          <CommandGroup heading="Catégories">
            {catMatches.map(c => (
              <CommandItem key={c.id} value={c.nom} onSelect={() => go(`/boutique?cat=${c.id}`)}>
                {c.nom}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
