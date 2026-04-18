import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PHONE = '2250151310606';

interface Msg { from: 'bot' | 'user'; text: string; }

const QUICK = [
  'Quels sont vos horaires ?',
  'Où êtes-vous situés ?',
  'Comment commander ?',
  'Modes de paiement ?',
];

const REPONSES: Record<string, string> = {
  'horaires': 'Nous sommes ouverts du lundi au samedi de 9h à 19h.',
  'situ': 'Nous sommes à Abidjan, Palmeraie Marché, Côte d\'Ivoire.',
  'command': 'Vous pouvez commander directement sur le site (bouton "Passer la commande") ou via WhatsApp.',
  'paiement': 'Nous acceptons Orange Money, Wave, MTN Money, Moov Money et le paiement à la livraison.',
  'livraison': 'Livraison en 24-72h à Abidjan, gratuite à partir de certains montants.',
  'prix': 'Tous nos prix sont affichés sur la fiche produit, en FCFA.',
};

function botReply(text: string): string {
  const t = text.toLowerCase();
  for (const k in REPONSES) if (t.includes(k)) return REPONSES[k];
  return 'Merci pour votre message ! Pour une réponse rapide, cliquez sur "Continuer sur WhatsApp" ci-dessous.';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'bot', text: 'Bonjour 👋 Bienvenue chez BABYCENTER ! Comment puis-je vous aider ?' },
  ]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { from: 'user', text }, { from: 'bot', text: botReply(text) }]);
    setInput('');
  };

  const waLink = `https://wa.me/${PHONE}?text=${encodeURIComponent('Bonjour, j\'ai une question')}`;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
          aria-label="Ouvrir le chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[500px] max-h-[calc(100vh-2.5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">BABYCENTER</p>
              <p className="text-xs opacity-80">En ligne · Réponse rapide</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="p-1 hover:bg-primary-foreground/10 rounded">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-secondary/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.from === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-background text-foreground rounded-bl-sm border border-border'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {QUICK.map(q => (
                  <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 bg-background border border-border rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border p-2 bg-card">
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="block mb-2">
              <Button variant="outline" size="sm" className="w-full text-xs border-green-600 text-green-600 hover:bg-green-50">
                <MessageCircle className="h-3 w-3 mr-1" /> Continuer sur WhatsApp
              </Button>
            </a>
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-1">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Votre message..."
                className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="icon" aria-label="Envoyer">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
