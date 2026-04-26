import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '@/components/storefront/ChatWidget';
import PageTransition from '@/components/storefront/PageTransition';

export default function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

