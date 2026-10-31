import React from 'react'
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
import { VideoText } from './components/ui/video-text'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import { ServiceLandingPage } from './pages/ServiceLandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HostingPlanDetailPage } from './pages/HostingPlanDetailPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { PaymentPage } from './pages/PaymentPage'
import { SetupDomainPage } from './pages/SetupDomainPage'
import { CustomerPortalPage } from './pages/CustomerPortalPage'
import { InvoicePage } from './pages/InvoicePage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { ProofViewerPage } from './pages/ProofViewerPage'

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

          {/* Company Experience, Enterprise Clients & Tech Ecosystem (Kim Holiday safely omitted) */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <ExperiencePartners />
          </div>

          {/* FAQ Section */}
          <div className="rounded-[2rem] overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <AccordionDemo />
          </div>

          {/* Contact Section */}
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
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/jasa-pembuatan-website" element={<ServiceLandingPage serviceKey="web-dev" />} />
              <Route path="/software-development" element={<ServiceLandingPage serviceKey="custom-software" />} />
              <Route path="/it-consulting" element={<ServiceLandingPage serviceKey="it-consulting" />} />
              <Route path="/hosting" element={<ServiceLandingPage serviceKey="hosting" />} />
              
              {/* Customer & Hosting Platform Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/hosting/plan/:planSlug" element={<HostingPlanDetailPage />} />
              <Route path="/checkout/:planSlug" element={<CheckoutPage />} />
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
          </BrowserRouter>
        </HelmetProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App