import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
import { createClient } from '@lib/supabase/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load from database only
  try {
    const supabase = await createClient();
    const { data: translations } = await supabase
      .from('translations')
      .select('*')
      .eq('locale', locale);

    if (translations && translations.length > 0) {
      // Convert database translations to nested object
      const namespaces: Record<string, any> = {};
      
      translations.forEach(t => {
        const { namespace, key, value } = t;
        if (!namespaces[namespace]) namespaces[namespace] = {};
        
        const keyParts = key.split('.');
        let current = namespaces[namespace];
        
        for (let i = 0; i < keyParts.length - 1; i++) {
          if (!current[keyParts[i]]) current[keyParts[i]] = {};
          current = current[keyParts[i]];
        }
        
        current[keyParts[keyParts.length - 1]] = value;
      });

      // Merge namespaces properly
      const result: Record<string, any> = {};
      
      // First add default namespace content to root
      if (namespaces.default) {
        Object.assign(result, namespaces.default);
      }
      
      // Then add other namespaces as separate objects
      Object.keys(namespaces).forEach(ns => {
        if (ns !== 'default') {
          result[ns] = namespaces[ns];
        }
      });

      return { locale, messages: result };
    }
  } catch (error) {
    console.error('Failed to load translations from database:', error);
  }

  // Return empty messages if database fails
  return {
    locale,
    messages: {}
  };
});