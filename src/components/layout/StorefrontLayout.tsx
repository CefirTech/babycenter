import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '@/components/storefront/ChatWidget';
import CookieBanner from '@/components/storefront/CookieBanner';

export default function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
      <CookieBanner />
    </div>
  );
}
