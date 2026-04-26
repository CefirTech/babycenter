import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";
import ProtectedClientRoute from "@/components/auth/ProtectedClientRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import ScrollToTop from "@/components/ScrollToTop";

import StorefrontLayout from "@/components/layout/StorefrontLayout";
import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/NotFound";

// Lazy storefront (secondary)
const BoutiquePage = lazy(() => import("@/pages/BoutiquePage"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const AgeRangesPage = lazy(() => import("@/pages/AgeRangesPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const PromotionsPage = lazy(() => import("@/pages/PromotionsPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const OrderDetailPage = lazy(() => import("@/pages/OrderDetailPage"));

// Lazy admin
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("@/pages/admin/AdminCustomers"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminSales = lazy(() => import("@/pages/admin/AdminSales"));
const AdminExpenses = lazy(() => import("@/pages/admin/AdminExpenses"));
const AdminCash = lazy(() => import("@/pages/admin/AdminCash"));
const AdminPromotions = lazy(() => import("@/pages/admin/AdminPromotions"));
const AdminReports = lazy(() => import("@/pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminActivityLog = lazy(() => import("@/pages/admin/AdminActivityLog"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminProfile = lazy(() => import("@/pages/admin/AdminProfile"));
const AdminDiscussion = lazy(() => import("@/pages/admin/AdminDiscussion"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Site Web */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/boutique" element={<BoutiquePage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/tranches-age" element={<AgeRangesPage />} />
                  <Route path="/produit/:slug" element={<ProductDetailPage />} />
                  <Route path="/panier" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/promotions" element={<PromotionsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/a-propos" element={<AboutPage />} />
                  <Route path="/faq" element={<AboutPage />} />
                  <Route path="/livraison" element={<AboutPage />} />
                  <Route path="/retours" element={<AboutPage />} />
                  <Route path="/connexion" element={<AuthPage />} />
                  <Route element={<ProtectedClientRoute />}>
                    <Route path="/compte" element={<AccountPage />} />
                    <Route path="/compte/commandes/:id" element={<OrderDetailPage />} />
                  </Route>
                </Route>

                {/* Back-office */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<ProtectedAdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    {/* Tous staff (admin/manager/vendeur) */}
                    <Route path="ventes" element={<AdminSales />} />
                    <Route path="caisse" element={<AdminCash />} />
                    <Route path="clientes" element={<AdminCustomers />} />
                    <Route path="discussion" element={<AdminDiscussion />} />
                    <Route path="profil" element={<AdminProfile />} />

                    {/* Admin + manager */}
                    <Route element={<RoleGuard allow={['admin', 'manager']} />}>
                      <Route path="produits" element={<AdminProducts />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="commandes" element={<AdminOrders />} />
                      <Route path="depenses" element={<AdminExpenses />} />
                      <Route path="promotions" element={<AdminPromotions />} />
                      <Route path="rapports" element={<AdminReports />} />
                    </Route>

                    {/* Admin uniquement */}
                    <Route element={<RoleGuard allow={['admin']} />}>
                      <Route path="parametres" element={<AdminSettings />} />
                      <Route path="utilisateurs" element={<AdminUsers />} />
                      <Route path="journal" element={<AdminActivityLog />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
