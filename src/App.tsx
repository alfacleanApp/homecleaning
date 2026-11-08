/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PromoMediaShowcase } from './components/PromoMediaShowcase';
import { BookingWizard } from './components/BookingWizard';
import { OrderTracking } from './components/OrderTracking';
import { SupervisorConsole } from './components/SupervisorConsole';
import { CleanerPortal } from './components/CleanerPortal';
import { CustomerProfile } from './components/CustomerProfile';
import { AuthModal } from './components/AuthModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

function MainLayout() {
  const { activeView } = useApp();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 overflow-x-hidden">
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      <main className="flex-1">
        <ErrorBoundary>
          {activeView === 'home' && (
            <>
              <Hero />
              <PromoMediaShowcase />
              <BookingWizard />
            </>
          )}

          {activeView === 'booking' && <BookingWizard />}

          {activeView === 'tracking' && <OrderTracking />}

          {activeView === 'supervisor' && <SupervisorConsole />}

          {activeView === 'cleaner' && <CleanerPortal />}

          {activeView === 'profile' && <CustomerProfile />}
        </ErrorBoundary>
      </main>

      <Footer />

      <LuckyWheelModal />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
