import { Card, CardContent } from '@/components/ui/card';

export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Cette section sera bientôt disponible.</p>
          <p className="text-sm text-muted-foreground mt-1">Revenez prochainement pour accéder à cette fonctionnalité.</p>
        </CardContent>
      </Card>
    </div>
  );
}
