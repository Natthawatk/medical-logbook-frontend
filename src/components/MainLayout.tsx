import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // Pages that should NOT have a sidebar
  const isAuthPage = ['/login', '/forgot-password', '/verify-code', '/reset-password', '/'].includes(path);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex">
      <Sidebar />
      
      <main className="relative z-10 flex-grow p-10 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
