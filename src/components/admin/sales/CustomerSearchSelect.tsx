import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, X, Check, ChevronDown } from 'lucide-react';
import { formatPhone } from '@/lib/format';

export type CustomerOption = { id: string; nom: string; telephone?: string | null };

export default function CustomerSearchSelect({
  customers,
  value,
  onChange,
  placeholder = 'Rechercher un client (nom, téléphone)…',
}: {
  customers: CustomerOption[];
  value: string; // 'walkin' ou id
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 10);
    return customers
      .filter(
        (c) =>
          c.nom.toLowerCase().includes(q) ||
          (c.telephone ?? '').toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [customers, query]);

  // Affichage compact quand un client est sélectionné
  if (value !== 'walkin' && selected && !open) {
    return (
      <div ref={boxRef} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 h-10">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{selected.nom}</p>
          {selected.telephone && (
            <p className="text-[11px] text-muted-foreground truncate leading-tight">{formatPhone(selected.telephone)}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            onChange('walkin');
            setQuery('');
            setOpen(true);
          }}
          title="Changer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 pr-8"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          tabIndex={-1}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-md">
          <button
            type="button"
            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 ${
              value === 'walkin' ? 'bg-muted/50' : ''
            }`}
            onClick={() => {
              onChange('walkin');
              setOpen(false);
              setQuery('');
            }}
          >
            {value === 'walkin' && <Check className="h-3.5 w-3.5 text-primary" />}
            <span className={value === 'walkin' ? '' : 'ml-[1.125rem]'}>Client de passage</span>
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground border-t border-border">
              Aucun client trouvé
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-t border-border"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <div className="font-medium truncate">{c.nom}</div>
                {c.telephone && (
                  <div className="text-xs text-muted-foreground truncate">{c.telephone}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
