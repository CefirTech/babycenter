import { Heart, Award, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">À propos de BABYCENTER</h1>
          <p className="text-muted-foreground mt-3 text-lg">L'élégance pour vos enfants, depuis 2020</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-foreground/80 leading-relaxed mb-6">
            BABYCENTER est née d'une passion : habiller les enfants avec style et qualité. Fondée à Abidjan, notre boutique propose une sélection soigneuse de vêtements premium pour enfants de 0 à 16 ans. Chaque pièce est choisie pour son confort, sa durabilité et son élégance.
          </p>
          <p className="text-foreground/80 leading-relaxed mb-10">
            Nous croyons que les enfants méritent le meilleur. C'est pourquoi nous sélectionnons des marques reconnues et des créateurs talentueux pour offrir à vos petits trésors des vêtements qui allient style, confort et qualité.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Heart, title: 'Passion', desc: 'Chaque article est choisi avec amour et attention pour vos enfants.' },
            { icon: Award, title: 'Qualité', desc: 'Nous ne proposons que des matières douces, durables et certifiées.' },
            { icon: Sparkles, title: 'Style', desc: 'Des collections tendance qui font briller vos petits fashionistas.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6 bg-card border border-border rounded-xl">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
