"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare, ArrowUp } from 'lucide-react';

const footerNav = [
  {
    title: 'Services',
    links: [
      { name: 'Web Development', href: '#services' },
      { name: 'Custom Software & POS', href: '#services' },
      { name: 'AI & Data Processing', href: '#services' },
      { name: 'Cloud & Infrastructure', href: '#services' }
    ]
  },
  {
    title: 'Solutions',
    links: [
      { name: 'Managed Web Hosting', href: '/hosting' },
      { name: 'Pusat Dokumentasi & Panduan', href: '/docs' },
      { name: 'Annual Website Maintenance', href: '/#contact' },
      { name: 'Pay Once Software', href: '/#about' }
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About 1sLabs', href: '#about' },
      { name: 'Verified Portfolio', href: '#portfolio' },
      { name: 'Experience & Partners', href: '#experience-partners' },
      { name: 'FAQ & Consultation', href: '#contact' }
    ]
  }
];

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-10 md:gap-12">
          
          {/* --- Brand & About --- */}
          <div className="col-span-2 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
            >
              <a href="/" className="inline-block mb-3 sm:mb-4" aria-label="1sLabs Home">
                <img
                  src="https://r0.image2url.com/images/1757349056783-832654d1-b551-403e-9291-8aff487b3668.png"
                  alt="1sLabs Logo"
                  className="h-9 sm:h-10 w-auto object-contain flex dark:hidden"
                />
                <img
                  src="https://image2url.com/images/1757349257406-33f427d1-9c4b-43ab-951a-623b6ffade7d.png"
                  alt="1sLabs Logo"
                  className="h-9 sm:h-10 w-auto object-contain hidden dark:flex"
                />
              </a>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-5 max-w-md leading-relaxed">
                Engineering high-quality web applications, bespoke business software, AI automations, and managed hosting with transparent pricing and full digital ownership.
              </p>

              {/* Direct Contact Info */}
              <div className="space-y-2 mb-5 text-xs text-neutral-600 dark:text-neutral-400">
                <a
                  href="mailto:info@1slabs.my.id"
                  className="flex items-center space-x-2.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>info@1slabs.my.id</span>
                </a>
                <a
                  href="https://wa.me/6285156296580"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>+62 851-5629-6580 (Hotline &amp; WhatsApp)</span>
                </a>
              </div>

              {/* Quick Actions Buttons */}
              <div className="flex items-center space-x-2.5">
                <a
                  href="mailto:info@1slabs.my.id"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  aria-label="Email 1sLabs"
                  title="Email: info@1slabs.my.id"
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
                <a
                  href="https://wa.me/6285156296580"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  aria-label="WhatsApp 1sLabs"
                  title="WhatsApp: +62 851-5629-6580"
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* --- Navigation Columns --- */}
          {footerNav.map((col, index) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: (index * 0.1) + 0.1 }}
              className="col-span-1"
            >
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-2 sm:mb-4">
                {col.title}
              </h4>
              <ul className="space-y-1.5 sm:space-y-2.5">
                {col.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-[11px] sm:text-xs md:text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* --- Bottom Bar --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="border-t border-neutral-200 dark:border-neutral-800 mt-14 pt-8 flex flex-col sm:flex-row justify-between items-center"
        >
          <p className="text-neutral-500 dark:text-neutral-500 text-xs mb-4 sm:mb-0">
            © {new Date().getFullYear()} 1sLabs. All rights reserved.
          </p>
          
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-blue-600 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 border border-neutral-300 dark:border-neutral-700 cursor-pointer"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;