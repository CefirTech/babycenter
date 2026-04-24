import { Link } from 'react-router-dom';
import { MessageCircle, MapPin, Phone, Mail } from 'lucide-react';
import NewsletterSignup from '@/components/storefront/NewsletterSignup';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading text-2xl font-bold text-background mb-4">BABY<span className="text-accent">CENTER</span></h3>
            <p className="text-sm leading-relaxed text-background/60 mb-4">Boutique premium de vêtements pour enfants de 0 à 16 ans. Élégance, qualité et confort pour vos petits trésors.</p>
            <div className="flex gap-3">
              <a href="https://wa.me/2250151310606" className="p-2 rounded-full bg-background/10 hover:bg-primary transition-colors" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold text-background mb-2">Newsletter</p>
              <NewsletterSignup />
            </div>
          </div>
          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Boutique</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/boutique" className="hover:text-accent">Tous les produits</Link></li>
              <li><Link to="/boutique?filtre=nouveau" className="hover:text-accent">Nouveautés</Link></li>
              <li><Link to="/promotions" className="hover:text-accent">Promotions</Link></li>
              <li><Link to="/categories" className="hover:text-accent">Catégories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Aide</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/livraison" className="hover:text-accent">Livraison</Link></li>
              <li><Link to="/retours" className="hover:text-accent">Retours & échanges</Link></li>
              <li><Link to="/guide-tailles" className="hover:text-accent">Guide des tailles</Link></li>
              <li><Link to="/faq" className="hover:text-accent">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Légal & Contact</h4>
            <ul className="space-y-2 text-sm mb-4">
              <li><Link to="/cgv" className="hover:text-accent">CGV</Link></li>
              <li><Link to="/mentions-legales" className="hover:text-accent">Mentions légales</Link></li>
              <li><Link to="/confidentialite" className="hover:text-accent">Confidentialité</Link></li>
            </ul>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Abidjan, Palmeraie Marché</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> (+225) 01 51 31 06 06</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> contact@babycenter.ci</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-background/10 text-center text-xs text-background/40">
          © {new Date().getFullYear()} BABYCENTER. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
