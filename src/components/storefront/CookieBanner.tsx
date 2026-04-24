import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { safeStorageGet, safeStorageSet } from '@/lib/safe-storage';

const KEY = 'babycenter_cookies';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!safeStorageGet(KEY));
  }, []);

  if (!show) return null;

  const accept = (val: 'all' | 'essential') => {
    safeStorageSet(KEY, val);
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center">
      <p className="text-sm text-foreground/80 flex-1">
        Nous utilisons des cookies pour améliorer votre expérience. En cliquant sur « Accepter », vous consentez à leur utilisation. <a href="/confidentialite" className="text-primary underline">En savoir plus</a>
      </p>
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={() => accept('essential')}>Rejeter</Button>
        <Button size="sm" onClick={() => accept('all')}>Accepter</Button>
      </div>
    </div>
  );
}
