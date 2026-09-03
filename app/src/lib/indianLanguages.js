// The 22 languages of the Eighth Schedule of the Indian Constitution, plus
// English (the app's base language). Codes are ISO 639-1 where one exists,
// else the closest common ISO 639-2/3 code - these are also the keys used
// under src/i18n/locales/.
export const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ks', name: 'Kashmiri', native: 'कॉशुर' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी' },
  { code: 'mni', name: 'Manipuri', native: 'ꯃꯤꯇꯩꯂꯣꯟ' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
];

export const LANGUAGE_BY_CODE = Object.fromEntries(INDIAN_LANGUAGES.map(l => [l.code, l]));
