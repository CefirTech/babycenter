import { Construction } from 'lucide-react';

export default function PageStub({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Construction className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Section en cours de finalisation</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cette section sera disponible dans les prochains lots. Backend, schéma de données et droits d'accès sont déjà en place.
        </p>
      </div>
    </div>
  );
}
