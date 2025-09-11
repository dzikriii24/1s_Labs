"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Sparkles } from 'lucide-react';

// --- Data untuk "Our Values" Section ---
// Menggunakan konten yang relevan untuk 1s Labs
const values = [
  {
    icon: Award,
    title: 'Quality First',
    description: 'We build professional websites that look great, run fast, and are built to last—without compromise.'
  },
  {
    icon: ShieldCheck,
    title: 'Long-Term Trust',
    description: 'Your success is our priority. We achieve it through transparent processes and reliable, lasting solutions.'
  },
  {
    icon: Sparkles,
    title: 'Affordable & Transparent',
    description: 'Get maximum quality at a minimum cost. We offer lifetime use with no hidden fees or monthly charges.'
  }
];

// --- Komponen About ---
export const About = () => {
  // --- Konfigurasi Animasi untuk Framer Motion ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardHoverEffect = {
    scale: 1.03,
    transition: { duration: 0.3 }
  };

  return (
    // Wrapper untuk mengontrol kelas 'dark' pada Tailwind
    <div>
      <section id="about" className="relative antialiased bg-white dark:bg-gray-900 font-sans py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-500">

        {/* --- TOMBOL GANTI TEMA --- */}

        <div className="max-w-6xl mx-auto">

          {/* --- HERO/INTRO SECTION --- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-24 md:mb-32"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-black to-neutral-600 dark:from-white dark:to-neutral-400">
              We Build Websites That Work For You.
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mt-6">
              1s Labs creates affordable, high-quality websites that help businesses grow. From SMEs to startups, we bring ideas online with solutions built to last.
            </p>

          </motion.div>

          {/* --- OUR MISSION SECTION --- */}
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center mb-24 md:mb-32">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6">
                Our Journey
              </h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed">
                <p>
                  We started with a passion to help local businesses unlock their potential through digital solutions. Today, 1s Labs has grown into a full-service agency that combines quality, creativity, and affordability.
                </p>
                <p>
                  We’ve worked with startups, SMEs, and corporates across industries, delivering impactful solutions built for growth.
                </p>
                <p>
                  Our approach blends technical expertise with creative thinking, making us a trusted partner for businesses in the digital era.
                </p>

              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative aspect-square bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-8 flex flex-col justify-center items-center text-center border border-neutral-200 dark:border-neutral-800"
            >
              <div className="absolute inset-0 bg-grid-pattern opacity-100"></div>
              <div className="relative z-10">
                <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700 dark:from-purple-400 dark:to-blue-400 mb-4">Pay Once.</div>
                <div className="text-3xl font-semibold text-neutral-900 dark:text-white mb-6 mt-1">Use Forever.</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
                  A revolutionary approach. No monthly fees, no hidden costs. Just a powerful, permanent digital asset for your business.
                </div>
              </div>
            </motion.div>
          </div>

          {/* --- OUR VALUES SECTION --- */}
          <div className="text-center mb-16 md:mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4"
            >
              The Principles That Guide Us
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
            >
              These core principles shape how we work, innovate, and build partnerships with our clients.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <motion.div key={value.title} variants={itemVariants} whileHover={cardHoverEffect}>
                  <div className="h-full bg-white/50 dark:bg-neutral-900/50 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 backdrop-blur-sm transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-900/20">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                      {value.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="text-center mt-24 md:mt-32"
          >
            {/* Placeholder for potential future content like a CTA */}
          </motion.div>

        </div>
        {/* CSS untuk efek background grid yang subtle dan dinamis */}
        <style jsx global>{`
          :root { --grid-line-color: rgba(0, 0, 0, 0.04); }
          .dark { --grid-line-color: rgba(255, 255, 255, 0.05); }
          .bg-grid-pattern {
            background-image:
              linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
              linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px);
            background-size: 2rem 2rem;
          }
        `}</style>
      </section>
    </div>
  );
};

