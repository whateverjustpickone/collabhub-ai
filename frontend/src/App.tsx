// CollabHub AI - Main Application Component

import { useState } from 'react';
import { useAppStore } from './store/index.ts';
import LeftSidebar from './components/layout/LeftSidebar.tsx';
import MainContent from './components/layout/MainContent.tsx';
import RightSidebar from './components/layout/RightSidebar.tsx';

function App() {
  const { auth, leftSidebarCollapsed, rightSidebarCollapsed } = useAppStore();
  const [showAuthModal, setShowAuthModal] = useState(!auth.isAuthenticated);

  // For demo purposes, auto-login
  // TODO: Replace with real authentication in Week 2
  if (!auth.isAuthenticated && !showAuthModal) {
    useAppStore.getState().login(
      {
        id: 'demo-user',
        email: 'demo@digitalmuse.com',
        name: 'John Doe',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      'demo-token'
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Left Sidebar */}
      <div
        className={`${
          leftSidebarCollapsed ? 'w-16' : 'w-64'
        } flex-shrink-0 border-r border-gray-800 transition-all duration-300`}
      >
        <LeftSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MainContent />
      </div>

      {/* Right Sidebar */}
      <div
        className={`${
          rightSidebarCollapsed ? 'w-0' : 'w-80'
        } flex-shrink-0 border-l border-gray-800 transition-all duration-300 overflow-hidden`}
      >
        <RightSidebar />
      </div>
    </div>
  );
}

export default App;
