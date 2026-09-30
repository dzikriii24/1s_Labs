import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'EN' | 'ID';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language | ((prev: Language) => Language)) => void;
  t: (key: string) => string;
}

const translations = {
  EN: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.portfolio': 'Portfolio',
    'nav.contact': 'Contact',
    'nav.pages': 'Pages',
    'nav.bookNow': 'Book Now',
  },
  ID: {
    'nav.home': 'Beranda',
    'nav.about': 'Tentang',
    'nav.services': 'Layanan',
    'nav.portfolio': 'Portofolio',
    'nav.contact': 'Kontak',
    'nav.pages': 'Halaman',
    'nav.bookNow': 'Pesan Sekarang',
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('EN');

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['EN']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
