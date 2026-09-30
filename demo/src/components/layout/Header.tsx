import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { ThemeTogglerButton } from '../ui/ThemeTogglerButton'
import { cn } from '../../lib/utils'
import { useLanguage } from '../../contexts/LanguageContext'

const navigation = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Portfolio', href: '#portfolio' },
  { name: 'Contact', href: '#contact' },
]

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 mx-auto w-full max-w-[1000px] relative',
        'bg-white dark:bg-gray-900',
        isScrolled ? 'py-2 rounded-[2rem] shadow-sm mt-4' : 'py-4 rounded-b-[2rem]'
      )}
    >
      {/* Lekukan (Inverted Corners) using CSS Masks for perfect transition sync */}
      <div 
        className={cn(
          "absolute top-0 -left-6 w-6 h-6 bg-white dark:bg-gray-900 pointer-events-none transition-all duration-300", 
          isScrolled ? "opacity-0" : "opacity-100"
        )}
        style={{
          WebkitMaskImage: 'radial-gradient(circle at 0% 100%, transparent 23.5px, black 24px)',
          maskImage: 'radial-gradient(circle at 0% 100%, transparent 23.5px, black 24px)'
        }}
      />
      <div 
        className={cn(
          "absolute top-0 -right-6 w-6 h-6 bg-white dark:bg-gray-900 pointer-events-none transition-all duration-300", 
          isScrolled ? "opacity-0" : "opacity-100"
        )}
        style={{
          WebkitMaskImage: 'radial-gradient(circle at 100% 100%, transparent 23.5px, black 24px)',
          maskImage: 'radial-gradient(circle at 100% 100%, transparent 23.5px, black 24px)'
        }}
      />

      <nav className="px-6 sm:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex items-center"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <img src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png" alt="" className="h-12 flex dark:hidden"/>
              <img src="https://image2url.com/images/1757349257406-33f427d1-9c4b-43ab-951a-623b6ffade7d.png" alt="" className='h-12 hidden dark:flex' />
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center space-x-8">
              {navigation.map((item) => (
                <motion.button
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection(item.href)}
                  className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm font-medium transition-colors duration-200"
                >
                  {t(`nav.${item.name.toLowerCase()}`)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(prev => prev === 'EN' ? 'ID' : 'EN')}
              className="p-2 rounded-full font-semibold text-gray-700 dark:text-gray-300 w-10"
            >
              {language}
            </Button>
            <ThemeTogglerButton direction="btt" />
            <a 
              href="https://wa.me/6285156296580" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#1A1A1A] hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm ml-2"
            >
                {t('nav.bookNow')}
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-1">
             <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(prev => prev === 'EN' ? 'ID' : 'EN')}
              className="p-2 rounded-full font-semibold text-gray-700 dark:text-gray-300 w-10"
            >
              {language}
            </Button>
             <ThemeTogglerButton direction="btt" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-4"
            >
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  >
                    {t(`nav.${item.name.toLowerCase()}`)}
                  </button>
                ))}
                 <button className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200">
                    {t('nav.pages')}
                  </button>
                  <div className="pt-4 px-4">
                     <a 
                        href="https://wa.me/6285156296580" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full bg-[#1A1A1A] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-all text-center"
                      >
                        {t('nav.bookNow')}
                    </a>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}