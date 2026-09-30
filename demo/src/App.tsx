import React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { Header } from './components/layout/Header'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Services } from './components/sections/Services'
import { Portfolio } from './components/sections/Portfolio'
import { Contact } from './components/sections/Contact'
import { Footer } from './components/layout/Footer'
import { HeroParallax } from "./components/layout/hero-paralax"
import { AccordionDemo } from './components/sections/Faq'
import { VideoText } from './components/ui/video-text'
import { LanguageProvider } from './contexts/LanguageContext'

function App() {
  return (
    <LanguageProvider>
    <HelmetProvider>

      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 py-4 px-4 sm:px-8">
        <Header />
        
        {/* Kontainer utama digeser ke atas pakai -mt-[80px] agar pas dengan tinggi Header */}
        <div className="max-w-[1400px] mx-auto bg-gray-50 dark:bg-gray-800 min-h-screen rounded-[2rem] shadow-xl overflow-hidden relative border border-gray-200 dark:border-gray-700 -mt-[80px]">
          <main>
            <HeroParallax />
            <About />
            <Services />
            <Portfolio />

            <VideoText
              src="https://www.pexels.com/download/video/3125427/"
              fontSize={10}
              fontWeight={800}
              fontFamily="inter, sans-serif"
              className="w-full h-[20vh] text-left" // Example: full width, 50% viewport height
              autoPlay
              muted
              loop
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              FAQ
            </VideoText>
            <AccordionDemo />
            <Contact />
          </main>
          <Footer />
        </div>
      </div>
    </HelmetProvider>
    </LanguageProvider>
  )
}


export default App