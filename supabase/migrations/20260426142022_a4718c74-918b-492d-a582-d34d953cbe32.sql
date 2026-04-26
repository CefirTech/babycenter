-- Activer extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction de purge des logs > 90 jours
CREATE OR REPLACE FUNCTION public.purge_old_activity_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  WITH d AS (
    DELETE FROM public.activity_logs
    WHERE created_at < now() - interval '90 days'
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM d;
  RETURN v_deleted;
END;
$$;

-- Planifier l'exécution chaque jour à 03:00 UTC
SELECT cron.schedule(
  'purge-activity-logs-daily',
  '0 3 * * *',
  $$ SELECT public.purge_old_activity_logs(); $$
);