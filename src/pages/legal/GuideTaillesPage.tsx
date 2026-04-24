import SEO from '@/components/SEO';

const tailles = [
  { age: '0-3 mois', taille: '50-60 cm', poids: '3-6 kg' },
  { age: '3-6 mois', taille: '60-67 cm', poids: '6-8 kg' },
  { age: '6-12 mois', taille: '67-76 cm', poids: '8-10 kg' },
  { age: '12-24 mois', taille: '76-86 cm', poids: '10-12 kg' },
  { age: '2-3 ans', taille: '86-94 cm', poids: '12-14 kg' },
  { age: '3-4 ans', taille: '94-104 cm', poids: '14-17 kg' },
  { age: '5-6 ans', taille: '104-116 cm', poids: '17-22 kg' },
  { age: '7-8 ans', taille: '116-128 cm', poids: '22-28 kg' },
  { age: '9-10 ans', taille: '128-140 cm', poids: '28-35 kg' },
  { age: '11-12 ans', taille: '140-152 cm', poids: '35-44 kg' },
  { age: '13-14 ans', taille: '152-164 cm', poids: '44-52 kg' },
  { age: '15-16 ans', taille: '164-172 cm', poids: '52-60 kg' },
];

export default function GuideTaillesPage() {
  return (
    <div className="container max-w-3xl py-12">
      <SEO title="Guide des tailles" description="Tableau de correspondance taille / âge pour vêtements enfants." />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">Guide des tailles</h1>
      <p className="text-muted-foreground mb-8">Repères indicatifs pour vous aider à choisir la bonne taille. En cas de doute, prenez la taille au-dessus.</p>
      <div className="overflow-x-auto bg-card border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr><th className="text-left p-3 font-semibold">Âge</th><th className="text-left p-3 font-semibold">Taille (cm)</th><th className="text-left p-3 font-semibold">Poids indicatif</th></tr>
          </thead>
          <tbody>
            {tailles.map(t => (
              <tr key={t.age} className="border-t border-border">
                <td className="p-3 font-medium">{t.age}</td><td className="p-3">{t.taille}</td><td className="p-3 text-muted-foreground">{t.poids}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
