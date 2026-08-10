import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Register } from './pages/Register';
import { Contact } from './pages/Contact';
import { ComingSoon } from './pages/ComingSoon';
import { DesignSystemShowcase } from './components/ui/DesignSystemShowcase';

import { AdminAuthProvider } from './context/AdminAuthContext';
import { ProtectedAdminRoute } from './pages/admin/ProtectedAdminRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComingSoon } from './pages/admin/AdminComingSoon';
import { EventDetailsAdmin } from './pages/admin/content/EventDetailsAdmin';
import { AboutAdmin } from './pages/admin/content/AboutAdmin';
import { DomainsAdmin } from './pages/admin/content/DomainsAdmin';
import { ScheduleAdmin } from './pages/admin/content/ScheduleAdmin';
import { RulesAdmin } from './pages/admin/content/RulesAdmin';
import { FAQsAdmin } from './pages/admin/content/FAQsAdmin';
import { SponsorsAdmin } from './pages/admin/content/SponsorsAdmin';
import { ContactAdmin } from './pages/admin/content/ContactAdmin';
import { RegistrationsAdmin } from './pages/admin/RegistrationsAdmin';

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes wrapped in MainLayout */}
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/coming-soon" element={<ComingSoon />} />
                  <Route path="/design-system" element={<DesignSystemShowcase />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            }
          />

          {/* Admin Unprotected Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Protected Routes wrapped in AdminLayout */}
          <Route
            path="/admin/*"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/content/event-details" element={<EventDetailsAdmin />} />
                    <Route path="/content/about" element={<AboutAdmin />} />
                    <Route path="/content/domains" element={<DomainsAdmin />} />
                    <Route path="/content/schedule" element={<ScheduleAdmin />} />
                    <Route path="/content/rules" element={<RulesAdmin />} />
                    <Route path="/content/faqs" element={<FAQsAdmin />} />
                    <Route path="/content/sponsors" element={<SponsorsAdmin />} />
                    <Route path="/content/contact" element={<ContactAdmin />} />

                    {/* Operational Modules */}
                    <Route path="/registrations" element={<RegistrationsAdmin />} />
                    <Route path="/participants" element={<AdminComingSoon module="Participants Management" />} />
                    <Route path="/judges" element={<AdminComingSoon module="Judges Portal" />} />
                    <Route path="/results" element={<AdminComingSoon module="Results & Leaders" />} />
                    <Route path="/settings" element={<AdminComingSoon module="System Settings" />} />

                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
