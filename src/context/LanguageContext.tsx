"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { COUNTRIES, getCountryData } from "@/utils/countries";

type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getCountryName: (originalName: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("es");

  const getCountryName = (originalName: string) => {
    if (language === "es") return originalName;
    const country = getCountryData(originalName);
    return country?.enName || originalName;
  };

  const t = (key: string) => {
    // Placeholder for future dictionary
    // For now we just return the key if it's not a country name
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, getCountryName }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
