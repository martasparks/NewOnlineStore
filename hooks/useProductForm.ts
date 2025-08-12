'use client'

import { useState, useCallback } from 'react'
import { Product, ValidationError } from '@/components/admin/products/types'
import { ProductValidation } from '@/components/admin/products/ProductValidation'

export const useProductForm = (initialProduct?: Product) => {
  const [product, setProduct] = useState<Product>(
    initialProduct || {
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: 0,
      sku: '',
      stock_quantity: 0,
      manage_stock: true,
      status: 'active',
      featured: false,
      images: [],
      gallery: [],
      meta_title: '',
      meta_description: '',
      weight: 0,
      dimensions: {}
    }
  )

    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

    const validateForm = useCallback(() => {
        const errors = ProductValidation.validateProduct(product)
        setValidationErrors(errors)
        return errors.length === 0
    }, [product])

    const updateProduct = useCallback((updates: Partial<Product>) => {
        setProduct(prev => ({ ...prev, ...updates }))
    }, [])

    const resetForm = useCallback(() => {
        setProduct({
        name: '',
        slug: '',
        description: '',
        short_description: '',
        price: 0,
        sku: '',
        stock_quantity: 0,
        manage_stock: true,
        status: 'active',
        featured: false,
        images: [],
        gallery: [],
        meta_title: '',
        meta_description: '',
        weight: 0,
        dimensions: {}
        })
        setValidationErrors([])
    }, [])

    const getFieldError = useCallback((fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message
    }, [validationErrors])

    return {
    product,
    validationErrors,
    isValid: validationErrors.length === 0,
    updateProduct,
    validateForm,
    resetForm,
    getFieldError
    }
}