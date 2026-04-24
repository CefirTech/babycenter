import { useEffect, useState, useCallback } from 'react';

const LS_KEY = 'babycenter_recent';
const MAX = 8;

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { setIds(read()); }, []);
  const push = useCallback((id: string) => {
    setIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, MAX);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return { ids, push };
}
