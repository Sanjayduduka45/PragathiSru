import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { DesignSystemShowcase } from './components/ui/DesignSystemShowcase';

import { AdminAuthProvider } from './context/AdminAuthContext';
import { ContentProvider } from './context/ContentContext';
import { ProtectedAdminRoute } from './pages/admin/ProtectedAdminRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminPageSkeleton, AuthLoadingScreen } from './components/admin/AdminSkeleton';
import { ParticipantAuthProvider } from './context/ParticipantAuthContext';
import { ProtectedParticipantRoute } from './pages/ProtectedParticipantRoute';

// Lazy-loaded Public Secondary & Participant Routes
const About = React.lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Register = React.lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Contact = React.lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const TestimonialsPage = React.lazy(() => import('./pages/Testimonials').then((m) => ({ default: m.TestimonialsPage })));
const ComingSoon = React.lazy(() => import('./pages/ComingSoon').then((m) => ({ default: m.ComingSoon })));
const ParticipantLogin = React.lazy(() => import('./pages/ParticipantLogin').then((m) => ({ default: m.ParticipantLogin })));
const ParticipantDashboard = React.lazy(() => import('./pages/ParticipantDashboard').then((m) => ({ default: m.ParticipantDashboard })));

// Lazy-loaded Admin Routes for code splitting & faster initial page load
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const RegistrationsAdmin = React.lazy(() => import('./pages/admin/RegistrationsAdmin').then((m) => ({ default: m.RegistrationsAdmin })));
const EventDetailsAdmin = React.lazy(() => import('./pages/admin/content/EventDetailsAdmin').then((m) => ({ default: m.EventDetailsAdmin })));
const AboutAdmin = React.lazy(() => import('./pages/admin/content/AboutAdmin').then((m) => ({ default: m.AboutAdmin })));
const DomainsAdmin = React.lazy(() => import('./pages/admin/content/DomainsAdmin').then((m) => ({ default: m.DomainsAdmin })));
const ScheduleAdmin = React.lazy(() => import('./pages/admin/content/ScheduleAdmin').then((m) => ({ default: m.ScheduleAdmin })));
const RulesAdmin = React.lazy(() => import('./pages/admin/content/RulesAdmin').then((m) => ({ default: m.RulesAdmin })));
const FAQsAdmin = React.lazy(() => import('./pages/admin/content/FAQsAdmin').then((m) => ({ default: m.FAQsAdmin })));
const SponsorsAdmin = React.lazy(() => import('./pages/admin/content/SponsorsAdmin').then((m) => ({ default: m.SponsorsAdmin })));
const ContactAdmin = React.lazy(() => import('./pages/admin/content/ContactAdmin').then((m) => ({ default: m.ContactAdmin })));
const TestimonialsAdmin = React.lazy(() => import('./pages/admin/content/TestimonialsAdmin').then((m) => ({ default: m.TestimonialsAdmin })));
const AdminComingSoon = React.lazy(() => import('./pages/admin/AdminComingSoon').then((m) => ({ default: m.AdminComingSoon })));
const PostersAdmin = React.lazy(() => import('./pages/admin/PostersAdmin').then((m) => ({ default: m.PostersAdmin })));

export default function App() {
  return (
    <ParticipantAuthProvider>
    <AdminAuthProvider>
      <ContentProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes wrapped in MainLayout */}
          <Route
            path="/*"
            element={
              <MainLayout>
                <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/testimonials" element={<TestimonialsPage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/coming-soon" element={<ComingSoon />} />
                    <Route path="/design-system" element={<DesignSystemShowcase />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </MainLayout>
            }
          />

          {/* Participant Routes (outside MainLayout) */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<AuthLoadingScreen />}>
                <ParticipantLogin />
              </Suspense>
            }
          />
          <Route
            path="/participant"
            element={
              <ProtectedParticipantRoute>
                <Suspense fallback={<AuthLoadingScreen />}>
                  <ParticipantDashboard />
                </Suspense>
              </ProtectedParticipantRoute>
            }
          />

          {/* Admin Unprotected Route */}
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<AuthLoadingScreen />}>
                <AdminLogin />
              </Suspense>
            }
          />

          {/* Admin Protected Routes wrapped in AdminLayout */}
          <Route
            path="/admin/*"
            element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <Suspense fallback={<AdminPageSkeleton />}>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/content/event-details" element={<EventDetailsAdmin />} />
                      <Route path="/content/about" element={<AboutAdmin />} />
                      <Route path="/content/domains" element={<DomainsAdmin />} />
                      <Route path="/content/schedule" element={<ScheduleAdmin />} />
                      <Route path="/content/rules" element={<RulesAdmin />} />
                      <Route path="/content/testimonials" element={<TestimonialsAdmin />} />
                      <Route path="/testimonials" element={<TestimonialsAdmin />} />
                      <Route path="/content/faqs" element={<FAQsAdmin />} />
                      <Route path="/content/sponsors" element={<SponsorsAdmin />} />
                      <Route path="/content/contact" element={<ContactAdmin />} />

                      {/* Operational Modules */}
                      <Route path="/registrations" element={<RegistrationsAdmin />} />
                      <Route path="/posters" element={<PostersAdmin />} />
                      <Route path="/participants" element={<AdminComingSoon module="Participants Management" />} />
                      <Route path="/judges" element={<AdminComingSoon module="Judges Portal" />} />
                      <Route path="/results" element={<AdminComingSoon module="Results & Leaders" />} />
                      <Route path="/settings" element={<AdminComingSoon module="System Settings" />} />

                      <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                  </Suspense>
                </AdminLayout>
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ContentProvider>
  </AdminAuthProvider>
  </ParticipantAuthProvider>
);
}
