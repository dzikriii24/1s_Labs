import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Instagram, Linkedin, ArrowUpRight, Sun, Moon } from 'lucide-react';

// --- Data untuk Metode Kontak ---
const contactMethods = [
  {
    icon: MessageSquare,
    title: 'WhatsApp',
    handle: '+62 851-5629-6580',
    href: 'https://wa.me/6285156296580', // Ganti dengan nomor WhatsApp-mu
    cta: 'Start a Conversation'
  },
  {
    icon: Mail,
    title: 'Email',
    handle: '1slabs.id@gmail.com',
    href: 'mailto:1slabs.id@gmail.com',
    cta: 'Send a Message'
  },
  {
    icon: Instagram,
    title: 'Instagram',
    handle: '@1slabs.id',
    href: 'https://instagram.com/1slabs.id', // Ganti dengan username Instagram-mu
    cta: 'Follow for Updates'
  }
];

// --- Komponen Kontak ---
export const Contact = () => {

  // --- Konfigurasi Animasi ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } // Kurva easing yang lebih sinematik
    }
  };

  return (
    <div>
      <section id="contact" className="relative antialiased bg-white dark:bg-gray-900 font-sans py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-500">
      

        <div className="max-w-4xl mx-auto">
          
          {/* Judul Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 md:mb-20"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-black to-neutral-600 dark:from-white dark:to-neutral-400">
              Let's Connect.
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-6">
              Have a project in mind or just want to say hello? We'd love to hear from you. Choose your preferred way to get in touch below.
            </p>
          </motion.div>

          {/* Grid Kartu Kontak */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid sm:grid-cols-3 gap-6"
          >
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <motion.a 
                  key={method.title} 
                  variants={itemVariants} 
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="h-full bg-white/50 dark:bg-neutral-900/50 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-900/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                       <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                        <Icon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <ArrowUpRight className="w-6 h-6 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 group-hover:text-blue-500 group-hover:rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                        {method.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        {method.handle}
                      </p>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                        {method.cta}
                      </span>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

