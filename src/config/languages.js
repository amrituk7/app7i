export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pa", label: "Punjabi" },
  { code: "ur", label: "Urdu" },
];

export const getLanguage = (code) =>
  LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
