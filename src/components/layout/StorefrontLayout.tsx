import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '@/components/storefront/ChatWidget';
import CookieBanner from '@/components/storefront/CookieBanner';

const HIDE_CHROME_ROUTES = ['/connexion', '/inscription', '/compte'];

export default function StorefrontLayout() {
  const { pathname } = useLocation();
  const hideChrome = HIDE_CHROME_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideChrome && <Header />}
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      {!hideChrome && <Footer />}
      <ChatWidget />
      <CookieBanner />
    </div>
  );
}
