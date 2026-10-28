"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';

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
      { name: 'Managed Web Hosting', href: '#hosting' },
      { name: 'Pay Once Software', href: '#about' },
      { name: 'API & SLiMS Integration', href: '#services' },
      { name: 'System Maintenance', href: '#services' }
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
              <h3 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-black to-neutral-600 dark:from-white dark:to-neutral-400 mb-2 sm:mb-4 font-['Mori',_sans-serif]">
                1s Labs
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6 max-w-md leading-relaxed">
                Engineering high-quality web applications, bespoke business software, AI automations, and managed hosting with transparent pricing and full digital ownership.
              </p>

              <div className="flex items-center space-x-3">
                <a
                  href="https://github.com/dzikriii24"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-200 transition-colors"
                  aria-label="GitHub Profile"
                >
                  <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
                <a
                  href="https://linkedin.com/in/dzikrirabbani"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-200 transition-colors"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
                <a
                  href="mailto:dzikrirabbani2401@gmail.com"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-red-500 hover:bg-neutral-200 transition-colors"
                  aria-label="Email Dzikri Rabbani"
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
            © {new Date().getFullYear()} 1s Labs &bull; Engineered by Dzikri Rabbani. All rights reserved.
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