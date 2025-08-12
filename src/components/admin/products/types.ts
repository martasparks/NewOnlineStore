export interface Product {
  id?: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  sale_price?: number
  sku: string
  stock_quantity: number
  manage_stock: boolean
  status: 'active' | 'inactive' | 'draft'
  featured: boolean
  images: string[]
  gallery: string[]
  meta_title: string
  meta_description: string
  weight?: number
  dimensions?: ProductDimensions
  category_id?: string
  subcategory_id?: string
}

export interface ProductDimensions {
  length?: number
  width?: number
  height?: number
}

export interface ProductFormProps {
  product: Product
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  categories: Category[]
  subcategories: Subcategory[]
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  category_id: string
}

export interface ValidationError {
  field: string
  message: string
}