import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['lv', 'en', 'ru'],
 
  // Used when no locale matches
  defaultLocale: 'lv'
});