-- ============================================
-- PHASE 2 — RLS GRANULAIRE
-- ============================================

-- 1. SALES : restreindre UPDATE/DELETE aux admin/manager
DROP POLICY IF EXISTS "Staff manages sales" ON public.sales;

CREATE POLICY "Staff inserts sales"
ON public.sales FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff reads sales"
ON public.sales FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Manager updates sales"
ON public.sales FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin deletes sales"
ON public.sales FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 2. SALE_ITEMS : suivre la même logique
DROP POLICY IF EXISTS "Staff manages sale items" ON public.sale_items;

CREATE POLICY "Staff inserts sale items"
ON public.sale_items FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff reads sale items"
ON public.sale_items FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Manager updates sale items"
ON public.sale_items FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin deletes sale items"
ON public.sale_items FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 3. CASH_MOVEMENTS : restreindre DELETE aux admin/manager
DROP POLICY IF EXISTS "Staff manages cash movements" ON public.cash_movements;

CREATE POLICY "Staff inserts cash movements"
ON public.cash_movements FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff reads cash movements"
ON public.cash_movements FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Manager updates cash movements"
ON public.cash_movements FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Manager deletes cash movements"
ON public.cash_movements FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- 4. CASH_SESSIONS : restreindre DELETE aux admin/manager
DROP POLICY IF EXISTS "Staff manages cash sessions" ON public.cash_sessions;

CREATE POLICY "Staff inserts cash sessions"
ON public.cash_sessions FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff reads cash sessions"
ON public.cash_sessions FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff updates cash sessions"
ON public.cash_sessions FOR UPDATE
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Manager deletes cash sessions"
ON public.cash_sessions FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));