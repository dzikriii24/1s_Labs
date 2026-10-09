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
    <section id="stats" className="bg-white dark:bg-slate-900 py-16 sm:py-24 w-full min-h-[50vh] flex flex-col justify-center relative rounded-[2rem]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-2xl lg:max-w-none"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl font-sans">
              Trusted by businesses worldwide
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We consistently deliver outstanding results that help our clients scale and achieve their digital goals.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.id} 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="mx-auto flex w-full flex-col gap-y-3"
              >
                <dt className="text-base font-medium leading-7 text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.name}</dt>
                <dd className="order-first text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-['Mori',_sans-serif]">
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
