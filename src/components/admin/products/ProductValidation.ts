import { Product, ValidationError } from './types'

export class ProductValidation {
  static validateProduct(product: Product): ValidationError[] {
    const errors: ValidationError[] = []

    // Obligātie lauki
    if (!product.name || product.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Nosaukums jābūt vismaz 2 simboli' })
    }

    if (!product.slug || product.slug.trim().length < 2) {
      errors.push({ field: 'slug', message: 'Slug ir obligāts' })
    }

    if (!product.sku || product.sku.trim().length < 1) {
      errors.push({ field: 'sku', message: 'SKU ir obligāts' })
    }

    // Cenas validācija
    if (!product.price || product.price < 0) {
      errors.push({ field: 'price', message: 'Cena jābūt pozitīvai' })
    }

    if (product.sale_price && product.sale_price >= product.price) {
      errors.push({ field: 'sale_price', message: 'Akcijas cena jābūt mazākai par parastā cenu' })
    }

    // Krājumu validācija
    if (product.manage_stock && product.stock_quantity < 0) {
      errors.push({ field: 'stock_quantity', message: 'Krājumi nevar būt negatīvi' })
    }

    // Izmēru validācija
    if (product.dimensions) {
      const { length, width, height } = product.dimensions
      if (length && length <= 0) {
        errors.push({ field: 'dimensions.length', message: 'Garums jābūt pozitīvs' })
      }
      if (width && width <= 0) {
        errors.push({ field: 'dimensions.width', message: 'Platums jābūt pozitīvs' })
      }
      if (height && height <= 0) {
        errors.push({ field: 'dimensions.height', message: 'Augstums jābūt pozitīvs' })
      }
    }

    // SEO validācija
    if (product.meta_title && product.meta_title.length > 60) {
      errors.push({ field: 'meta_title', message: 'Meta nosaukums pārāk garš (max 60 simboli)' })
    }

    if (product.meta_description && product.meta_description.length > 160) {
      errors.push({ field: 'meta_description', message: 'Meta apraksts pārāk garš (max 160 simboli)' })
    }

    return errors
  }

  static sanitizeSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[āăà]/g, 'a')
      .replace(/[čć]/g, 'c')
      .replace(/[ēèé]/g, 'e')
      .replace(/[īì]/g, 'i')
      .replace(/[ķ]/g, 'k')
      .replace(/[ļ]/g, 'l')
      .replace(/[ņ]/g, 'n')
      .replace(/[šś]/g, 's')
      .replace(/[ūù]/g, 'u')
      .replace(/[žź]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  static generateSKU(name: string): string {
    const prefix = name.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
  }
}