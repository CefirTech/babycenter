import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import ScrollToTop from "@/components/ScrollToTop";

import StorefrontLayout from "@/components/layout/StorefrontLayout";
import AdminLayout from "@/components/layout/AdminLayout";

import HomePage from "@/pages/HomePage";
import BoutiquePage from "@/pages/BoutiquePage";
import CategoriesPage from "@/pages/CategoriesPage";
import AgeRangesPage from "@/pages/AgeRangesPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PromotionsPage from "@/pages/PromotionsPage";
import ContactPage from "@/pages/ContactPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "@/pages/NotFound";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminSales from "@/pages/admin/AdminSales";
import AdminExpenses from "@/pages/admin/AdminExpenses";
import AdminCash from "@/pages/admin/AdminCash";
import AdminPromotions from "@/pages/admin/AdminPromotions";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminActivityLog from "@/pages/admin/AdminActivityLog";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminProfile from "@/pages/admin/AdminProfile";
import AdminDiscussion from "@/pages/admin/AdminDiscussion";
import AdminLogin from "@/pages/admin/AdminLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
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
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
