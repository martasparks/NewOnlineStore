'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ruler, Package } from 'lucide-react'
import { ProductDimensions } from './types'

interface DimensionsFormProps {
  dimensions: ProductDimensions
  weight?: number
  onDimensionChange: (key: keyof ProductDimensions, value: number | undefined) => void
  onWeightChange: (weight: number) => void
}

export default function DimensionsForm({
  dimensions,
  weight,
  onDimensionChange,
  onWeightChange
}: DimensionsFormProps) {
  
  const handleDimensionChange = (key: keyof ProductDimensions) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    onDimensionChange(key, value ? parseFloat(value) : undefined)
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onWeightChange(value ? parseFloat(value) : 0)
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-center mb-4">
        <Ruler className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-blue-900">Izmēri un svars</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Garums */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Garums (cm)
          </Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={dimensions.length || ''}
              onChange={handleDimensionChange('length')}
              placeholder="0.0"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              cm
            </span>
          </div>
        </div>

        {/* Platums */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Platums (cm)
          </Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={dimensions.width || ''}
              onChange={handleDimensionChange('width')}
              placeholder="0.0"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              cm
            </span>
          </div>
        </div>

        {/* Augstums */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Augstums (cm)
          </Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={dimensions.height || ''}
              onChange={handleDimensionChange('height')}
              placeholder="0.0"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              cm
            </span>
          </div>
        </div>

        {/* Svars */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Svars (kg)
          </Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={weight || ''}
              onChange={handleWeightChange}
              placeholder="0.0"
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
              kg
            </span>
          </div>
        </div>
      </div>

      {/* Aprēķinātais tilpums */}
      {dimensions.length && dimensions.width && dimensions.height && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center text-sm">
            <Package className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-gray-700">Tilpums:</span>
            <span className="ml-2 font-semibold text-blue-900">
              {((dimensions.length * dimensions.width * dimensions.height) / 1000000).toFixed(3)} m³
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-600">
        💡 Izmēri tiek izmantoti piegādes izmaksu aprēķiniem un iepakojuma izvēlē
      </div>
    </div>
  )
}