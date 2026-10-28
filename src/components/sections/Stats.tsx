import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { id: 1, name: 'Active Clients', value: '200+' },
  { id: 2, name: 'Projects Delivered', value: '500+' },
  { id: 3, name: 'Years Experience', value: '10+' },
  { id: 4, name: 'Team Experts', value: '25+' },
];

export const Stats = () => {
  return (
    <section id="stats" className="bg-white dark:bg-slate-900 py-10 sm:py-16 md:py-20 w-full flex flex-col justify-center relative rounded-[2rem]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-2xl lg:max-w-none"
        >
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-['Mori',_sans-serif]">
              Trusted by Businesses &amp; Enterprises
            </h2>
            <p className="mt-2 sm:mt-4 text-xs sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Dedikasi kami tercermin dari stabilitas sistem, kepuasan klien, dan rekayasa software teruji.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-6 sm:gap-y-12 text-center lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.id} 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="mx-auto flex w-full flex-col gap-y-1.5 sm:gap-y-3 p-3 sm:p-4 rounded-2xl bg-neutral-50/50 dark:bg-slate-800/40 border border-neutral-100 dark:border-slate-800/80"
              >
                <dt className="text-[11px] sm:text-sm font-medium leading-tight text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.name}</dt>
                <dd className="order-first text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white font-['Mori',_sans-serif]">
                  {stat.value}
                </dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
};
