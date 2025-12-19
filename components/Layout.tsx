import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-50">
      {children}
    </div>
  );
};