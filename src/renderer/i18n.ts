import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';


import enUS from '../locales/en-US.json';

const i18n = require('i18next');

const i18nextOptions = {
    resources: {
      
      'en-US': {
        translation: enUS,
      },
      
      en: {
        translation: enUS,
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    saveMissing: true,
    react: {
      useSuspense: false,
    },
  };
  
i18n.use(initReactI18next).use(LanguageDetector);
// initialize if not already initialized
if (!i18n.isInitialized) {
    i18n.init(i18nextOptions);
}
export default i18n;
