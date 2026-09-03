import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import te from './locales/te.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import gu from './locales/gu.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import or_ from './locales/or.json';
import pa from './locales/pa.json';
import as_ from './locales/as.json';
import mai from './locales/mai.json';
import sat from './locales/sat.json';
import ks from './locales/ks.json';
import ne from './locales/ne.json';
import sd from './locales/sd.json';
import kok from './locales/kok.json';
import doi from './locales/doi.json';
import mni from './locales/mni.json';
import brx from './locales/brx.json';
import sa from './locales/sa.json';

// preferred_language on the user record stores one of these codes (see
// lib/indianLanguages.js for the full list with native display names).
// resources keyed to match - i18next falls back to `en` for any key a
// locale file hasn't got yet, so partial translation coverage never
// breaks rendering, it just shows English for the missing bits.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    bn: { translation: bn },
    te: { translation: te },
    mr: { translation: mr },
    ta: { translation: ta },
    gu: { translation: gu },
    kn: { translation: kn },
    ml: { translation: ml },
    or: { translation: or_ },
    pa: { translation: pa },
    as: { translation: as_ },
    mai: { translation: mai },
    sat: { translation: sat },
    ks: { translation: ks },
    ne: { translation: ne },
    sd: { translation: sd },
    kok: { translation: kok },
    doi: { translation: doi },
    mni: { translation: mni },
    brx: { translation: brx },
    sa: { translation: sa },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
