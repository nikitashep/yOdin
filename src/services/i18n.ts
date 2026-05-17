import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '../locales/en/translation.json';
import ru from '../locales/ru/translation.json';
import az from '../locales/az/translation.json';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLangs = ['en', 'ru', 'az'];
const lng = supportedLangs.includes(deviceLang) ? deviceLang : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    az: { translation: az },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
