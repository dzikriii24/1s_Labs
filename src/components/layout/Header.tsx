import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, User, Server, ShieldCheck, LogOut, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { ThemeTogglerButton } from '../ui/ThemeTogglerButton'
import { cn } from '../../lib/utils'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

const navigation = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Hosting', href: '#hosting' },
  { name: 'Portfolio', href: '#portfolio' },
  { name: 'Contact', href: '#contact' },
]

const serviceLandingLinks = [
  { name: 'Jasa Pembuatan Website', href: '/jasa-pembuatan-website', desc: 'Company profile & landing page modern' },
  { name: 'Custom Software Development', href: '/software-development', desc: 'Aplikasi web enterprise, ERP & POS' },
  { name: 'IT Consulting & Architecture', href: '/it-consulting', desc: 'Audit teknologi & arsitektur sistem' },
  { name: 'Managed Cloud Hosting', href: '/hosting', desc: 'Hosting cepat NVMe & bantuan setup' },
]

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false);
    setIsServicesDropdownOpen(false);
    if (window.location.pathname !== '/') {
      window.location.href = `/${href}`;
      return;
    }
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'sticky z-50 transition-all duration-300 mx-auto w-full max-w-[1000px]',
        isScrolled 
          ? 'top-4 py-2 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/20 dark:bg-gray-900/20 backdrop-blur-lg border border-white/60 dark:border-white/10' 
          : 'top-0 py-3 sm:py-4 rounded-b-[2rem] bg-white dark:bg-gray-900'
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

      <nav className="px-4 sm:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo with SEO Alt Text and Accessible Link */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex items-center"
          >
            <a
              href="/"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center"
              aria-label="1sLabs Home"
            >
              <img
                src="https://image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                alt="1sLabs — Jasa Pembuatan Website &amp; IT Consulting"
                className="h-9 sm:h-12 flex dark:hidden w-auto"
                width="120"
                height="48"
              />
              <img
                src="https://image2url.com/images/1757349257406-33f427d1-9c4b-43ab-951a-623b6ffade7d.png"
                alt="1sLabs — Jasa Pembuatan Website &amp; IT Consulting"
                className="h-9 sm:h-12 hidden dark:flex w-auto"
                width="120"
                height="48"
              />
            </a>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center space-x-7">
              {navigation.map((item) => {
                if (item.name === 'Services') {
                  return (
                    <div
                      key={item.name}
                      className="relative"
                      onMouseEnter={() => setIsServicesDropdownOpen(true)}
                      onMouseLeave={() => setIsServicesDropdownOpen(false)}
                    >
                      <button
                        onClick={() => scrollToSection(item.href)}
                        className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer py-1"
                      >
                        {t(`nav.${item.name.toLowerCase()}`)}
                        <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isServicesDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isServicesDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-2 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl z-50 text-left"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                              Halaman Layanan Khusus
                            </div>
                            {serviceLandingLinks.map((link) => (
                              <a
                                key={link.href}
                                href={link.href}
                                className="block p-2 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-colors group/item"
                              >
                                <div className="text-xs font-semibold text-neutral-900 dark:text-white group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400">
                                  {link.name}
                                </div>
                                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                  {link.desc}
                                </div>
                              </a>
                            ))}
                            <div className="mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
                              <button
                                onClick={() => {
                                  setIsServicesDropdownOpen(false);
                                  scrollToSection('#services');
                                }}
                                className="w-full text-left p-2 rounded-xl text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              >
                                Lihat Semua di Beranda &rarr;
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={item.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => scrollToSection(item.href)}
                    className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer"
                  >
                    {t(`nav.${item.name.toLowerCase()}`)}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(prev => prev === 'EN' ? 'ID' : 'EN')}
              className="p-2 rounded-full font-semibold text-gray-700 dark:text-gray-300 w-10 min-w-[40px] min-h-[40px]"
              aria-label="Ganti Bahasa"
            >
              {language}
            </Button>
            <ThemeTogglerButton direction="btt" aria-label="Ganti Tema Gelap/Terang" />

            {/* Customer / Admin Profile & Portal Dropdown */}
            {user ? (
              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center text-[11px] font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[110px] truncate">{user.name || 'Akun'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 text-xs"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        <span className={`mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {user.role === 'admin' ? 'Administrator' : 'Pelanggan 1sLabs'}
                        </span>
                      </div>

                      <div className="py-1">
                        {user.role === 'admin' ? (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                          >
                            <ShieldCheck className="w-4 h-4 text-rose-500" />
                            <span>Dashboard Admin</span>
                          </Link>
                        ) : (
                          <>
                            <Link
                              to="/portal?tab=services"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                            >
                              <Server className="w-4 h-4 text-emerald-500" />
                              <span>Layanan Hosting Saya</span>
                            </Link>

                            <Link
                              to="/portal?tab=orders"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                            >
                              <CreditCard className="w-4 h-4 text-blue-500" />
                              <span>Riwayat Pesanan</span>
                            </Link>

                            <Link
                              to="/portal?tab=profile"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                            >
                              <User className="w-4 h-4 text-purple-500" />
                              <span>Profil Akun & Keamanan</span>
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar / Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-xs ml-1 flex items-center space-x-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            )}

            <a 
              href="https://wa.me/6285156296580" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-3.5 py-2 rounded-full text-xs font-medium transition-all ml-1"
            >
              {t('nav.bookNow')}
            </a>
          </div>

          {/* Mobile menu button with 44x44px touch area */}
          <div className="md:hidden flex items-center space-x-1">
             <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(prev => prev === 'EN' ? 'ID' : 'EN')}
              className="p-2 rounded-full font-semibold text-gray-700 dark:text-gray-300 w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-xs"
              aria-label="Ganti Bahasa"
            >
              {language}
            </Button>
            <ThemeTogglerButton direction="btt" aria-label="Ganti Tema Gelap/Terang" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isMobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 mt-3 rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="pt-2 pb-3 px-2 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left px-3.5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors duration-200 min-h-[42px]"
                  >
                    {t(`nav.${item.name.toLowerCase()}`)}
                  </button>
                ))}

                {/* Account / Portal Mobile Links */}
                <div className="pt-2 pb-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Akun & Layanan:
                  </div>
                  {user ? (
                    <div className="space-y-1">
                      <div className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl mb-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                      </div>

                      {user.role === 'admin' ? (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Panel Administrator</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/portal?tab=services"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <Server className="w-4 h-4 text-emerald-500" />
                            <span>Layanan Hosting Saya</span>
                          </Link>

                          <Link
                            to="/portal?tab=orders"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <CreditCard className="w-4 h-4 text-blue-500" />
                            <span>Riwayat Pesanan</span>
                          </Link>

                          <Link
                            to="/portal?tab=profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <User className="w-4 h-4 text-purple-500" />
                            <span>Profil Akun & Keamanan</span>
                          </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar / Logout</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3.5 py-2 text-xs font-semibold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      Masuk ke Portal Hosting
                    </Link>
                  )}
                </div>

                {/* Subpage SEO Links */}
                <div className="pt-2 pb-1 border-t border-gray-100 dark:border-gray-800">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Halaman Layanan Khusus:
                  </div>
                  {serviceLandingLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3.5 py-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>

                <div className="pt-3 px-2 pb-1">
                  <a 
                    href="https://wa.me/6285156296580" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-[#1A1A1A] hover:bg-black text-white px-5 py-3 rounded-full text-xs font-semibold transition-all text-center min-h-[44px] flex items-center justify-center"
                  >
                    {t('nav.bookNow')} (WhatsApp)
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