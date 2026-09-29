import React from 'react'
import { motion } from 'framer-motion'
import { Github, Twitter, Linkedin, Mail, ArrowUp } from 'lucide-react'


const footerLinks = {
  Services: ['Web Development', 'Mobile Apps', 'UI/UX Design'],
}

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-white dark:bg-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          
          {/* --- Brand & Social Media --- */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-black to-neutral-600 dark:from-white dark:to-neutral-400 mb-4">
                1s Labs
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
                Custom digital solutions with maximum quality, minimum cost, and lifetime use. Let's build something amazing together.
              </p>
             
            </motion.div>
          </div>

          {/* --- Kolom Tautan --- */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: (index * 0.1) + 0.1 }}
            >
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* --- Bar Bawah (Copyright & Scroll to Top) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="border-t border-neutral-200 dark:border-neutral-800 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center"
        >
          <p className="text-neutral-500 dark:text-neutral-500 text-sm mb-4 sm:mb-0">
            © {new Date().getFullYear()} 1s Labs. All rights reserved.
          </p>
          
          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 border border-neutral-300 dark:border-neutral-700"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </footer>
  )
}