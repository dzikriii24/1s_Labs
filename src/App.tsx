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
function App() {
  return (

    <HelmetProvider>

      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">

        <Header />
        <main>
          <HeroParallax products={products} />
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
    </HelmetProvider>
  )
}




export const products = [
  {
    title: "KampEase",
    link: "https://github.com/dzikriii24/KampEase",
    thumbnail: "https://images.pexels.com/photos/33314541/pexels-photo-33314541.jpeg",
  },
  {
    title: "Smart POS System",
    link: "https://github.com/dzikriii24/supermarketGUI",
    thumbnail: "https://images.pexels.com/photos/33319037/pexels-photo-33319037.jpeg",
  },
  {
    title: "Smart Laundry App",
    link: "https://github.com/dzikriii24/SpringBoot",
    thumbnail: "https://images.pexels.com/photos/33319538/pexels-photo-33319538.jpeg",
  },
  {
    title: "Tanduria",
    link: "https://github.com/dzikriii24/tanduria",
    thumbnail: "https://images.pexels.com/photos/33320664/pexels-photo-33320664.jpeg",
  },
];




export default App