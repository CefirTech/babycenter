DO $$
DECLARE
  t text;
  tables text[] := ARRAY['products','product_variants','categories','customers','orders','expenses','promotions','profiles','settings','reviews'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%1$s BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;