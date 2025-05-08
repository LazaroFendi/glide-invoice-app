import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* App Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
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