import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '@/components/storefront/ChatWidget';
import PageTransition from '@/components/storefront/PageTransition';
import { useAuth } from '@/contexts/AuthContext';

export default function StorefrontLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      {!user && <Footer />}
      <ChatWidget />
    </div>
  );
}


