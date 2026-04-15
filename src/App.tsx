import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";

import StorefrontLayout from "@/components/layout/StorefrontLayout";
import AdminLayout from "@/components/layout/AdminLayout";

import HomePage from "@/pages/HomePage";
import BoutiquePage from "@/pages/BoutiquePage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import PromotionsPage from "@/pages/PromotionsPage";
import ContactPage from "@/pages/ContactPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "@/pages/NotFound";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminPlaceholder from "@/pages/admin/AdminPlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Vitrine */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/boutique" element={<BoutiquePage />} />
              <Route path="/produit/:slug" element={<ProductDetailPage />} />
              <Route path="/panier" element={<CartPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/faq" element={<AboutPage />} />
              <Route path="/livraison" element={<AboutPage />} />
              <Route path="/retours" element={<AboutPage />} />
            </Route>

            {/* Back-office */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="produits" element={<AdminProducts />} />
              <Route path="commandes" element={<AdminOrders />} />
              <Route path="clientes" element={<AdminCustomers />} />
              <Route path="categories" element={<AdminPlaceholder title="Catégories" />} />
              <Route path="ventes" element={<AdminPlaceholder title="Ventes" />} />
              <Route path="depenses" element={<AdminPlaceholder title="Dépenses" />} />
              <Route path="caisse" element={<AdminPlaceholder title="Caisse" />} />
              <Route path="promotions" element={<AdminPlaceholder title="Promotions" />} />
              <Route path="rapports" element={<AdminPlaceholder title="Rapports" />} />
              <Route path="parametres" element={<AdminPlaceholder title="Paramètres" />} />
              <Route path="journal" element={<AdminPlaceholder title="Journal d'activité" />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
