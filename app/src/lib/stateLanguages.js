// Maps an Indian state/UT to its principal official language code (see
// indianLanguages.js), used to suggest a sensible default when a farmer
// picks their state and hasn't chosen a language yet. A suggestion, never
// forced - the farmer's own language picker always wins if they set one.
export const STATE_LANGUAGE = {
  'Andhra Pradesh': 'te',
  'Arunachal Pradesh': 'en',
  'Assam': 'as',
  'Bihar': 'hi',
  'Chhattisgarh': 'hi',
  'Goa': 'kok',
  'Gujarat': 'gu',
  'Haryana': 'hi',
  'Himachal Pradesh': 'hi',
  'Jharkhand': 'hi',
  'Karnataka': 'kn',
  'Kerala': 'ml',
  'Madhya Pradesh': 'hi',
  'Maharashtra': 'mr',
  'Manipur': 'mni',
  'Meghalaya': 'en',
  'Mizoram': 'en',
  'Nagaland': 'en',
  'Odisha': 'or',
  'Punjab': 'pa',
  'Rajasthan': 'hi',
  'Sikkim': 'ne',
  'Tamil Nadu': 'ta',
  'Telangana': 'te',
  'Tripura': 'bn',
  'Uttar Pradesh': 'hi',
  'Uttarakhand': 'hi',
  'West Bengal': 'bn',
  // Union Territories
  'Andaman and Nicobar Islands': 'hi',
  'Chandigarh': 'pa',
  'Dadra and Nagar Haveli and Daman and Diu': 'gu',
  'Delhi': 'hi',
  'Jammu and Kashmir': 'ks',
  'Ladakh': 'en',
  'Lakshadweep': 'ml',
  'Puducherry': 'ta',
};

export function suggestLanguageForState(state) {
  return STATE_LANGUAGE[state] || null;
}
