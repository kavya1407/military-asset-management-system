import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { TransfersPage } from './pages/TransfersPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AssetsInventoryPage } from './pages/AssetsInventoryPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

function AppContent() {
  const { isAuthenticated, role } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0b111a]">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <DashboardPage onNavigate={setCurrentView} />
            )}
            {currentView === 'purchases' && (
              <PurchasesPage />
            )}
            {currentView === 'transfers' && (
              <TransfersPage />
            )}
            {currentView === 'assignments' && (
              <AssignmentsPage />
            )}
            {currentView === 'inventory' && (
              <AssetsInventoryPage />
            )}
            {currentView === 'audit' && (
              <AuditLogsPage />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <AppContent />
      </FilterProvider>
    </AuthProvider>
  );
}
