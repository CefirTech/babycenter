import { useEffect, useState, useCallback } from 'react';
import { safeStorageGetJson, safeStorageSet } from '@/lib/safe-storage';

const LS_KEY = 'babycenter_recent';
const MAX = 8;

function read(): string[] {
  return safeStorageGetJson<string[]>(LS_KEY, []);
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
  }, []);

  const push = useCallback((id: string) => {
    setIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, MAX);
      safeStorageSet(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { ids, push };
}
