DROP POLICY IF EXISTS "Managers view expenses" ON public.expenses;
CREATE POLICY "Staff views expenses"
ON public.expenses FOR SELECT
USING (public.is_staff(auth.uid()));