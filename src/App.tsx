import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { DesignSystemShowcase } from './components/ui/DesignSystemShowcase';

import { AdminAuthProvider } from './context/AdminAuthContext';
import { ContentProvider } from './context/ContentContext';
import { ProtectedAdminRoute } from './pages/admin/ProtectedAdminRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminPageSkeleton } from './components/admin/AdminSkeleton';
import { ParticipantAuthProvider } from './context/ParticipantAuthContext';
import { ProtectedParticipantRoute } from './pages/ProtectedParticipantRoute';
import { ProtectedJudgeRoute } from './pages/judge/ProtectedJudgeRoute';
import { ProtectedJuryRoute } from './pages/jury/ProtectedJuryRoute';
import { HomePathProvider } from './context/HomePathContext';

// Lazy-loaded Public Secondary & Participant Routes
const About = React.lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Register = React.lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Contact = React.lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const TestimonialsPage = React.lazy(() => import('./pages/Testimonials').then((m) => ({ default: m.TestimonialsPage })));
const ComingSoon = React.lazy(() => import('./pages/ComingSoon').then((m) => ({ default: m.ComingSoon })));
const ParticipantLogin = React.lazy(() => import('./pages/ParticipantLogin').then((m) => ({ default: m.ParticipantLogin })));
const Login = React.lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const ParticipantDashboard = React.lazy(() => import('./pages/ParticipantDashboard').then((m) => ({ default: m.ParticipantDashboard })));
const JuryDashboard = React.lazy(() => import('./pages/jury/JuryDashboard').then((m) => ({ default: m.JuryDashboard })));
const JudgeDashboard = React.lazy(() => import('./pages/judge/JudgeDashboard').then((m) => ({ default: m.JudgeDashboard })));

// Lazy-loaded Admin Routes for code splitting & faster initial page load
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
const ResultsAdmin = React.lazy(() => import('./pages/admin/ResultsAdmin').then((m) => ({ default: m.ResultsAdmin })));
const SettingsAdmin = React.lazy(() => import('./pages/admin/SettingsAdmin').then((m) => ({ default: m.SettingsAdmin })));

export default function App() {
  const neutralLoader = (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
    </div>
  );

  return (
    <ParticipantAuthProvider>
    <AdminAuthProvider>
      <ContentProvider>
        <BrowserRouter>
          <HomePathProvider>
            <Routes>
              {/* Public Routes wrapped in MainLayout */}
              <Route
                path="/*"
                element={
                  <MainLayout>
                    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
                      <Routes>
                        {/* Root Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/testimonials" element={<TestimonialsPage />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/coming-soon" element={<ComingSoon />} />
                        <Route path="/design-system" element={<DesignSystemShowcase />} />
                        <Route path="/domains" element={<Navigate to="/#categories" replace />} />
                        <Route path="/schedule" element={<Navigate to="/#schedule" replace />} />
                        <Route path="/rules" element={<Navigate to="/about#rules" replace />} />
                        <Route path="/faqs" element={<Navigate to="/#faq" replace />} />

                        {/* PRAGATHI 2.0 Prefixed Public Routes */}
                        <Route path="/pragathi-2.0" element={<Home />} />
                        <Route path="/pragathi-2.0/about" element={<About />} />
                        <Route path="/pragathi-2.0/testimonials" element={<TestimonialsPage />} />
                        <Route path="/pragathi-2.0/register" element={<Register />} />
                        <Route path="/pragathi-2.0/contact" element={<Contact />} />
                        <Route path="/pragathi-2.0/coming-soon" element={<ComingSoon />} />
                        <Route path="/pragathi-2.0/design-system" element={<DesignSystemShowcase />} />
                        <Route path="/pragathi-2.0/domains" element={<Navigate to="/pragathi-2.0#categories" replace />} />
                        <Route path="/pragathi-2.0/schedule" element={<Navigate to="/pragathi-2.0#schedule" replace />} />
                        <Route path="/pragathi-2.0/rules" element={<Navigate to="/pragathi-2.0/about#rules" replace />} />
                        <Route path="/pragathi-2.0/faqs" element={<Navigate to="/pragathi-2.0#faq" replace />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </MainLayout>
                }
              />

              {/* Common Single Login */}
              <Route
                path="/login"
                element={
                  <Suspense fallback={neutralLoader}>
                    <Login />
                  </Suspense>
                }
              />
              <Route
                path="/pragathi-2.0/login"
                element={
                  <Suspense fallback={neutralLoader}>
                    <Login />
                  </Suspense>
                }
              />

              {/* Participant Protected Dashboard */}
              <Route
                path="/participant"
                element={
                  <ProtectedParticipantRoute>
                    <Suspense fallback={neutralLoader}>
                      <ParticipantDashboard />
                    </Suspense>
                  </ProtectedParticipantRoute>
                }
              />

              {/* Jury Protected Single-Page Portal */}
              <Route
                path="/jury"
                element={
                  <ProtectedJuryRoute>
                    <Suspense fallback={neutralLoader}>
                      <JuryDashboard />
                    </Suspense>
                  </ProtectedJuryRoute>
                }
              />

              {/* Judge Protected Dashboard (compatibility alias to /jury) */}
              <Route
                path="/judge"
                element={
                  <ProtectedJuryRoute>
                    <Suspense fallback={neutralLoader}>
                      <JuryDashboard />
                    </Suspense>
                  </ProtectedJuryRoute>
                }
              />

              {/* Legacy Login Redirects */}
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/jury/login" element={<Navigate to="/login" replace />} />
              <Route path="/judge/login" element={<Navigate to="/login" replace />} />
              <Route path="/participant/login" element={<Navigate to="/login" replace />} />

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
                          <Route path="/results" element={<ResultsAdmin />} />
                          <Route path="/settings" element={<SettingsAdmin />} />

                          <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Routes>
                      </Suspense>
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />

              {/* PRAGATHI 2.0 Admin Protected Routes wrapped in AdminLayout */}
              <Route
                path="/pragathi-2.0/admin/*"
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
                          <Route path="/results" element={<ResultsAdmin />} />
                          <Route path="/settings" element={<SettingsAdmin />} />

                          <Route path="*" element={<Navigate to="/pragathi-2.0/admin" replace />} />
                        </Routes>
                      </Suspense>
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
            </Routes>
          </HomePathProvider>
        </BrowserRouter>
    </ContentProvider>
  </AdminAuthProvider>
  </ParticipantAuthProvider>
);
}
