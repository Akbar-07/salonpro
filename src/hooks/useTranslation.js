import { useState, useEffect } from 'react';
import translations from '../lang/Translatin';

export function useTranslation() {
  // localStorage dan til olish
  const [lang, setLangState] = useState(
    localStorage.getItem("lang") || "uz"
  );

  // Til o'zgarganda eshitish
  useEffect(() => {
    const handleStorageChange = () => {
      const newLang = localStorage.getItem("lang") || "uz";
      setLangState(newLang);
    };

    // Custom event eshitish
    window.addEventListener('languageChange', handleStorageChange);

    // Tozalash (cleanup)
    return () => {
      window.removeEventListener('languageChange', handleStorageChange);
    };
  }, []);

  // Tilni o'zgartirish funksiyasi
  const setLang = (newLang) => {
    localStorage.setItem("lang", newLang);
    setLangState(newLang);
    // Barcha komponentlarga signal yuborish
    window.dispatchEvent(new Event('languageChange'));
  };

  return { 
    lang,           // joriy til
    setLang,        // tilni o'zgartirish
    t: translations[lang]  // tarjimalar
  };
}