// @/app/main/layout.tsx
'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { CustomThemeProvider } from '@/components/ThemeContext';
import { MainAppHeader, MainAppSidebar } from '@/components/mainapp/components';
import { useTheme } from '@/components/ThemeContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { themeClasses } = useTheme();

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      {/* Skip to content link for accessibility */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Skip to content
      </a>

      {/* Layout Grid */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <MainAppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <MainAppHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Main Content */}
          <main 
            id="content" 
            className="flex-1 overflow-auto p-6 focus:outline-none"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SessionProvider>
      <CustomThemeProvider>
        <MainLayoutContent>
          {children}
        </MainLayoutContent>
      </CustomThemeProvider>
    </SessionProvider>
  );
}