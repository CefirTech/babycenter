import { MessageCircle, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Contactez-nous</h1>
          <p className="text-muted-foreground mt-2">Nous sommes là pour vous aider</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Envoyez-nous un message</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground mb-1 block">Nom</label><Input placeholder="Votre nom" /></div>
                <div><label className="text-sm font-medium text-foreground mb-1 block">Prénom</label><Input placeholder="Votre prénom" /></div>
              </div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Email</label><Input type="email" placeholder="votre@email.com" /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Téléphone</label><Input placeholder="+225 XX XX XX XX XX" /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Message</label><Textarea placeholder="Votre message..." rows={5} /></div>
              <Button size="lg" className="w-full font-semibold">Envoyer</Button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Nos coordonnées</h2>
            {[
              { icon: MapPin, label: 'Adresse', value: 'Cocody Riviera, Abidjan, Côte d\'Ivoire' },
              { icon: Phone, label: 'Téléphone', value: '+225 07 08 09 10 11' },
              { icon: Mail, label: 'Email', value: 'contact@minichic.ci' },
              { icon: Clock, label: 'Horaires', value: 'Lun-Sam : 9h-19h' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium text-sm text-foreground">{label}</p><p className="text-sm text-muted-foreground">{value}</p></div>
              </div>
            ))}

            <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-600" /> WhatsApp</h3>
              <p className="text-sm text-muted-foreground mb-4">Contactez-nous directement sur WhatsApp pour une réponse rapide</p>
              <a href="https://wa.me/2250708091011" target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 text-primary-foreground w-full font-semibold">Écrire sur WhatsApp</Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
