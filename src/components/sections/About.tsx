"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Sparkles, CheckCircle2, KeyRound, Coins, Shield, FileCode2 } from 'lucide-react';

// --- Data untuk "Our Values" Section ---
const values = [
  {
    icon: Award,
    title: 'Quality First',
    description: 'We build professional websites and software that look great, run fast, and are engineered to scale—without compromise.'
  },
  {
    icon: ShieldCheck,
    title: 'Long-Term Trust',
    description: 'Your growth is our priority. We achieve it through transparent communication, clean code standards, and reliable solutions.'
  },
  {
    icon: Sparkles,
    title: 'Affordable & Transparent',
    description: 'Get maximum engineering quality with transparent pricing. Full digital ownership with zero hidden recurring fees.'
  }
];

export const About = () => {
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

  const payOnceHighlights = [
    {
      icon: KeyRound,
      title: 'Full Solution Ownership',
      desc: '100% full source code, database, and digital asset ownership in your hands.'
    },
    {
      icon: Coins,
      title: 'Zero Recurring Platform Fees',
      desc: 'Say goodbye to restrictive monthly SaaS rents. Pay once for your custom build.'
    },
    {
      icon: FileCode2,
      title: 'Built with Modern Tech',
      desc: 'Engineered on industry-standard stacks designed for long-term durability and scale.'
    }
  ];

  return (
    <div>
      <section id="about" className="relative antialiased bg-white dark:bg-gray-900 font-sans py-10 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-500">
        <div className="max-w-6xl mx-auto">

          {/* --- HERO/INTRO SECTION --- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-10 sm:mb-16 md:mb-20"
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-black to-neutral-600 dark:from-white dark:to-neutral-400 font-['Mori',_sans-serif]">
              We Build Websites That Work For You.
            </h2>
            <p className="text-xs sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mt-3 sm:mt-6 leading-relaxed">
              1s Labs creates high-performing websites, custom business software, and scalable digital solutions. From growing businesses to enterprise teams, we deliver technology built for life.
            </p>
          </motion.div>

          {/* --- OUR MISSION & PAY ONCE SECTION --- */}
          <div className="grid lg:grid-cols-12 gap-4 sm:gap-8 items-stretch mb-12 sm:mb-20">
            
            {/* Story / Journey Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-6 flex flex-col justify-center bg-gray-50/60 dark:bg-neutral-900/60 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800"
            >
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4 sm:mb-6 font-['Mori',_sans-serif]">
                Our Engineering Journey
              </h3>
              <div className="space-y-3 sm:space-y-4 text-neutral-600 dark:text-neutral-300 text-xs sm:text-base leading-relaxed">
                <p>
                  Started with a passion for software craftsmanship and problem-solving, 1s Labs bridges the gap between robust engineering and accessible digital transformation.
                </p>
                <p>
                  We have built enterprise tracking platforms for government institutions, scalable web architectures for high-traffic platforms, AI research implementations, and dedicated digital solutions for expanding businesses.
                </p>
                <p>
                  We believe technology should be an asset you truly own and control, not an endless monthly liability.
                </p>
              </div>
            </motion.div>

            {/* Pay Once Card - Enhanced with professional Lucide icons & clear value proposition */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-6 relative bg-gradient-to-br from-neutral-50 via-white to-blue-50/30 dark:from-neutral-900 dark:via-gray-900 dark:to-blue-950/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 flex flex-col justify-between border border-blue-500/20 dark:border-blue-500/30 shadow-xl shadow-blue-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-purple-500/0 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Header Badge */}
                

                <div className="text-3xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 mb-1 sm:mb-2 font-['Mori',_sans-serif]">
                  Pay Once.
                </div>
                <div className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2 sm:mb-4 font-['Mori',_sans-serif]">
                  Own &amp; Use Forever.
                </div>
                <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-8 leading-relaxed">
                  A transparent, client-first approach to digital investment. Stop paying recurring rental subscriptions for software you should already own.
                </p>

                {/* Key Benefits with Lucide SVG Icons */}
                <div className="space-y-2.5 sm:space-y-4">
                  {payOnceHighlights.map((item, idx) => {
                    const HighlightIcon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 shadow-xs">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-800/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 mt-0.5">
                          <HighlightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-normal">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Assurance */}
              <div className="mt-5 sm:mt-8 pt-4 sm:pt-5 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Verified Transparent Billing
                </span>
                <span>No Hidden Fees</span>
              </div>
            </motion.div>
          </div>

          {/* --- OUR VALUES SECTION --- */}
          <div className="text-center mb-8 sm:mb-14">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2 sm:mb-4 font-['Mori',_sans-serif]"
            >
              The Principles That Guide Us
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
            >
              These core principles shape how we architect software, innovate, and build long-lasting partnerships with our clients.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6"
          >
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <motion.div key={value.title} variants={itemVariants} whileHover={cardHoverEffect}>
                  <div className="h-full bg-white/70 dark:bg-neutral-900/60 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-neutral-200 dark:border-neutral-800 backdrop-blur-sm transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg dark:hover:shadow-2xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-sm shadow-blue-500/20">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h4 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white mb-1.5 sm:mb-2">
                      {value.title}
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-xs sm:text-sm">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

        </div>
      </section>
    </div>
  );
};

export default About;
