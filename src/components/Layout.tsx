import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* App Header */}
      <header className="bg-black border-b border-gray-800 py-4 px-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto">
          <h1 className="text-2xl font-light text-white tracking-wide" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.025em' }}>
            Glide Invoice Generator
          </h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

export default Layout; 