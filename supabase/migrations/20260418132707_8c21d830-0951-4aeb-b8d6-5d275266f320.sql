-- Table pour stocker les messages laissés par les visiteurs via le chat du site
CREATE TABLE public.chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT,
  telephone TEXT NOT NULL,
  message TEXT NOT NULL,
  contexte TEXT, -- ex: 'panier', 'chat', 'commande'
  traite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;

-- Tout visiteur peut créer un lead (formulaire public)
CREATE POLICY "Public creates chat leads"
ON public.chat_leads FOR INSERT
WITH CHECK (true);

-- Seul le staff peut voir/gérer
CREATE POLICY "Staff manages chat leads"
ON public.chat_leads FOR ALL
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_chat_leads_created_at ON public.chat_leads(created_at DESC);
CREATE INDEX idx_chat_leads_traite ON public.chat_leads(traite);