"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { SlidingLogoMarquee, SlidingLogoMarqueeItem } from './KerjaSama';
import lazismuImg from '../assets/lazismu.png';
import himatifImg from '../assets/himatif.png';

interface OrganizationEntity {
  id: string;
  name: string;
  logoElement: React.ReactNode;
  url?: string;
}

const verifiedOrganizations: OrganizationEntity[] = [
  {
    id: 'inpartner',
    name: 'Inpartner Consulting',
    url: 'https://inpartner.id',
    logoElement: (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <img
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAMFBMVEVHcEwZdtIZdtIZdtIYdtL///8Ab9EAas9Pjtm5zu2QtOXo8Po1gtZzot/z9/3L2/ISDX22AAAABHRSTlMA+6WnkcCETAAAAKFJREFUKJGdk1kOwyAMRB3wws79b1uWpFELjtTOl+HJkhkPAObArQ4DYPaoy4DSN3pBZ4gD8qz51AdMIQ8WprITvqEj309CbwVZYcTU5EKkyCucDSx+3uxgKwvpkD25/6BUShpkpCIrHA5JipSXgcpwyNfLha1D1bHmEF7WrgPdO9Ge8jMsG9iW3WFbNq8Qz2TwF8PngD1G8yHUFsBq38HCC/PVD3xL5H7OAAAAAElFTkSuQmCC"
          alt="Inpartner Consulting"
          className="h-7 w-7 object-contain rounded-sm"
        />
        <div className="flex flex-col text-left">
          <span className="font-extrabold tracking-wider text-xs sm:text-sm text-slate-800 dark:text-white font-['Mori',_sans-serif] leading-tight">
            INPARTNER
          </span>
          <span className="text-[9px] tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium leading-none">
            CONSULTING
          </span>
        </div>
      </div>
    )
  },
  {
    id: 'dpd-ri',
    name: 'DPD RI Jawa Barat',
    logoElement: (
      <div className="flex items-center gap-2.5 px-3 py-1">
        <img
          src="https://i.pinimg.com/736x/05/c2/13/05c213954aab8dbdd4e10dcf0634e0f1.jpg"
          alt="DPD RI Jawa Barat"
          className="h-8 sm:h-9 w-8 sm:w-9 object-contain rounded-full shadow-xs"
        />
        <div className="text-left">
          <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white leading-tight">
            DPD RI
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Jawa Barat
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'saffix',
    name: 'Saka Access Fix (Saffix)',
    url: 'https://saffix.id',
    logoElement: (
      <div className="flex flex-col items-center justify-center text-center px-4 py-2">
        <span className="font-black text-sm sm:text-base tracking-tight text-blue-600 dark:text-blue-400">
          SAFFIX<span className="text-slate-800 dark:text-white">.ID</span>
        </span>
        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Saka Access Fix
        </span>
      </div>
    )
  },
  {
    id: 'yukmari',
    name: 'Yuk-Mari',
    url: 'https://yuk-mari.com/',
    logoElement: (
      <div className="flex items-center px-3 py-1">
        <img
          src="https://yuk-mari.com/assets/img/logo.png"
          alt="Yuk-Mari"
          className="h-8 sm:h-10 w-auto max-w-[130px] object-contain filter dark:brightness-110"
        />
      </div>
    )
  },
  {
    id: 'dicoding-dbs',
    name: 'Dicoding × DBS Foundation',
    url: 'https://www.dicoding.com/',
    logoElement: (
      <div className="flex flex-col items-center justify-center text-center px-3 py-1">
        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white tracking-tight">
          Dicoding × DBS Foundation
        </span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
          Top 15 Capstone Project
        </span>
      </div>
    )
  },
  {
    id: 'uin-perpustakaan',
    name: 'Perpustakaan Pusat UIN Bandung',
    logoElement: (
      <div className="flex flex-col items-center justify-center text-center px-3 py-1">
        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
          Perpustakaan UIN SGD
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          Central Library IT Services
        </span>
      </div>
    )
  },
  {
    id: 'himatif',
    name: 'HIMATIF UIN Bandung',
    logoElement: (
      <div className="flex items-center gap-2 px-3 py-1">
        <img
          src={himatifImg}
          alt="HIMATIF UIN Sunan Gunung Djati"
          className="h-8 w-8 object-contain"
        />
        <div className="text-left">
          <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white leading-tight">
            HIMATIF
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Informatics Organization
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'lazismu',
    name: 'LAZISMU',
    logoElement: (
      <div className="flex items-center px-3 py-1">
        <img
          src={lazismuImg}
          alt="LAZISMU"
          className="h-7 sm:h-8 w-auto object-contain"
        />
      </div>
    )
  },
  {
    id: 'menu1s',
    name: 'Menu1s',
    url: 'https://menu1s.my.id/menu-fullpack/',
    logoElement: (
      <div className="flex items-center px-3 py-1">
        <img
          src="./src/assets/logo/menu1s.svg"
          alt="Menu1s"
          className="h-8 sm:h-9 w-auto max-w-[120px] object-contain filter dark:brightness-110"
        />
      </div>
    )
  }
];

export const ExperiencePartners: React.FC = () => {
  const marqueeItems: SlidingLogoMarqueeItem[] = verifiedOrganizations.map(org => ({
    id: org.id,
    content: (
      <div className="flex items-center justify-center h-full px-4 py-2">
        {org.logoElement}
      </div>
    ),
    href: org.url
  }));

  return (
    <section id="experience-partners" className="py-10 sm:py-16 md:py-20 bg-white dark:bg-gray-900 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2.5 sm:mb-4 tracking-tight font-['Mori',_sans-serif]">
            Companies, Clients &amp; Tech Ecosystem
          </h2>
          <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed px-2">
            Rekam jejak pengalaman profesional, institusi tempat kami berkontribusi, serta perusahaan dan mitra yang telah berkolaborasi bersama kami.
          </p>
        </motion.div>

        {/* Dynamic Infinite Marquee for verified partners */}
        <div className="rounded-2xl sm:rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 p-2 sm:p-4 shadow-xs">
          <SlidingLogoMarquee
            items={marqueeItems}
            speed={25}
            height="85px"
            enableBlur={true}
            blurIntensity={2}
            pauseOnHover={true}
            showGridBackground={false}
            showControls={false}
          />
        </div>

      </div>
    </section>
  );
};

export default ExperiencePartners;
