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
import { ServiceLandingPage } from './pages/ServiceLandingPage'

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
      <HelmetProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/jasa-pembuatan-website" element={<ServiceLandingPage serviceKey="web-dev" />} />
            <Route path="/software-development" element={<ServiceLandingPage serviceKey="custom-software" />} />
            <Route path="/it-consulting" element={<ServiceLandingPage serviceKey="it-consulting" />} />
            <Route path="/hosting" element={<ServiceLandingPage serviceKey="hosting" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </LanguageProvider>
  )
}

export default App