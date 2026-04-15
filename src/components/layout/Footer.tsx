import { Link } from 'react-router-dom';
import { MessageCircle, Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-2xl font-bold text-background mb-4">
              Mini<span className="text-accent">Chic</span>
            </h3>
            <p className="text-sm leading-relaxed text-background/60 mb-4">
              Boutique premium de vêtements pour enfants de 0 à 16 ans. Élégance, qualité et confort pour vos petits trésors.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-primary transition-colors" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-primary transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Boutique */}
          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Boutique</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/boutique" className="hover:text-accent transition-colors">Tous les produits</Link></li>
              <li><Link to="/boutique?filtre=nouveau" className="hover:text-accent transition-colors">Nouveautés</Link></li>
              <li><Link to="/promotions" className="hover:text-accent transition-colors">Promotions</Link></li>
              <li><Link to="/boutique?cat=robes" className="hover:text-accent transition-colors">Robes</Link></li>
              <li><Link to="/boutique?cat=ensembles" className="hover:text-accent transition-colors">Ensembles</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Informations</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/a-propos" className="hover:text-accent transition-colors">À propos</Link></li>
              <li><Link to="/livraison" className="hover:text-accent transition-colors">Livraison</Link></li>
              <li><Link to="/retours" className="hover:text-accent transition-colors">Retours & échanges</Link></li>
              <li><Link to="/faq" className="hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Cocody Riviera, Abidjan, Côte d'Ivoire</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +225 07 08 09 10 11</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> contact@minichic.ci</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-background/10 text-center text-xs text-background/40">
          © {new Date().getFullYear()} MiniChic. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
