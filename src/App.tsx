import React, { Suspense } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Stats } from './components/sections/Stats'
import { About } from './components/sections/About'
import { Services } from './components/sections/Services'
import { Hosting } from './components/sections/Hosting'
import { Portfolio } from './components/sections/Portfolio'
import { ExperiencePartners } from './components/sections/ExperiencePartners'
import { Contact } from './components/sections/Contact'
import { Footer } from './components/layout/Footer'
import { HeroParallax } from "./components/layout/hero-paralax"
import { AccordionDemo } from './components/sections/Faq'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'

// Lazy-loaded routes for performance optimization & smaller initial bundle size
const ServiceLandingPage = React.lazy(() => import('./pages/ServiceLandingPage').then(m => ({ default: m.ServiceLandingPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const HostingPlanDetailPage = React.lazy(() => import('./pages/HostingPlanDetailPage').then(m => ({ default: m.HostingPlanDetailPage })));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const DomainCheckoutPage = React.lazy(() => import('./pages/DomainCheckoutPage').then(m => ({ default: m.DomainCheckoutPage })));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage').then(m => ({ default: m.PaymentPage })));
const SetupDomainPage = React.lazy(() => import('./pages/SetupDomainPage').then(m => ({ default: m.SetupDomainPage })));
const CustomerPortalPage = React.lazy(() => import('./pages/CustomerPortalPage').then(m => ({ default: m.CustomerPortalPage })));
const InvoicePage = React.lazy(() => import('./pages/InvoicePage').then(m => ({ default: m.InvoicePage })));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const ProofViewerPage = React.lazy(() => import('./pages/ProofViewerPage').then(m => ({ default: m.ProofViewerPage })));
const DocumentationPage = React.lazy(() => import('./pages/DocumentationPage').then(m => ({ default: m.DocumentationPage })));

// Loading spinner fallback during chunk loading
function PageLoadingFallback() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-sans tracking-wide">
          Memuat halaman 1sLabs...
        </span>
      </div>
    </div>
  );
}

// Automatically scrolls to top on route change unless an anchor hash is present
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  React.useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 py-4 px-4 sm:px-8">
      <Header />
      
      {/* Main content wrapper shifted slightly up to integrate seamlessly with sticky header */}
      <div className="max-w-[1400px] mx-auto min-h-screen relative -mt-[80px]">
        <main className="flex flex-col gap-6">
          
          {/* Hero Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <HeroParallax />
          </div>

          {/* Stats Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Stats />
          </div>

          {/* About & Pay Once Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <About />
          </div>

          {/* Comprehensive IT Services Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Services />
          </div>

          {/* Dedicated Commercial Hosting Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Hosting />
          </div>

          {/* Verified Real Portfolio Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Portfolio />
          </div>

          {/* Company Experience & Enterprise Clients */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <ExperiencePartners />
          </div>

          {/* FAQ Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <AccordionDemo />
          </div>

          {/* Contact Section with Interactive Inquiry Form */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Contact />
          </div>

        </main>

        {/* Footer */}
        <div className="mt-6 rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Footer />
        </div>

      </div>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HelmetProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/jasa-pembuatan-website" element={<ServiceLandingPage serviceKey="web-dev" />} />
                <Route path="/software-development" element={<ServiceLandingPage serviceKey="custom-software" />} />
                <Route path="/it-consulting" element={<ServiceLandingPage serviceKey="it-consulting" />} />
                <Route path="/hosting" element={<ServiceLandingPage serviceKey="hosting" />} />
                
                {/* Documentation Center Routes */}
                <Route path="/docs" element={<DocumentationPage />} />
                <Route path="/docs/:slug" element={<DocumentationPage />} />
                <Route path="/docs/:category/:slug" element={<DocumentationPage />} />
                <Route path="/dokumentasi" element={<Navigate to="/docs" replace />} />

                {/* Customer & Hosting Platform Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/hosting/plan/:planSlug" element={<HostingPlanDetailPage />} />
                <Route path="/checkout/:planSlug" element={<CheckoutPage />} />
                <Route path="/domain/checkout" element={<DomainCheckoutPage />} />
                <Route path="/payment/:orderNumber" element={<PaymentPage />} />
                <Route path="/services/:serviceCode/setup-domain" element={<SetupDomainPage />} />
                <Route path="/portal" element={<CustomerPortalPage />} />
                <Route path="/invoice/:invoiceNumber" element={<InvoicePage />} />
                <Route path="/invoices/:invoiceNumber" element={<InvoicePage />} />
                <Route path="/proof-viewer" element={<ProofViewerPage />} />
                <Route path="/proof/:filename" element={<ProofViewerPage />} />

                {/* Admin Portal Route */}
                <Route path="/admin" element={<AdminDashboardPage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </HelmetProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
