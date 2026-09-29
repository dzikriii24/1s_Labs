import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

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
  const { theme, toggleTheme } = useTheme() 

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
      {/* Lekukan (Inverted Corners) Pixel-Perfect using SVG */}
      <svg className={cn("absolute top-0 -left-6 w-6 h-6 text-white dark:text-gray-900 pointer-events-none transition-opacity duration-300", isScrolled ? "opacity-0" : "opacity-100")} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 24 C 24 10.745 13.255 0 0 0 H 24 V 24 Z" fill="currentColor"/>
      </svg>
      <svg className={cn("absolute top-0 -right-6 w-6 h-6 text-white dark:text-gray-900 pointer-events-none transition-opacity duration-300", isScrolled ? "opacity-0" : "opacity-100")} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 24 C 0 10.745 10.745 0 24 0 H 0 V 24 Z" fill="currentColor"/>
      </svg>

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
                  {item.name}
                </motion.button>
              ))}
              <div className="flex items-center text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm font-medium cursor-pointer transition-colors duration-200">
                Pages <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-full"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
            <button className="bg-[#1A1A1A] hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm">
                Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
             <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-full"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
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
                    {item.name}
                  </button>
                ))}
                 <button className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200">
                    Pages
                  </button>
                  <div className="pt-4 px-4">
                     <button className="w-full bg-[#1A1A1A] hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-all text-center">
                        Get Started
                    </button>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}