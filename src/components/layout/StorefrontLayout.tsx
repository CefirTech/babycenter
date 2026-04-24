import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '@/components/storefront/ChatWidget';
import CookieBanner from '@/components/storefront/CookieBanner';

const HIDE_FOOTER_ROUTES = ['/connexion', '/inscription'];

export default function StorefrontLayout() {
  const { pathname } = useLocation();
  const hideFooter = HIDE_FOOTER_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <ChatWidget />
      <CookieBanner />
    </div>
  );
}
