export type Language = 'en' | 'it';

export type LanguageLabel = { [key: string]: string | LanguageLabel };

export type DictionaryLabel = { [key in Language]: LanguageLabel };
