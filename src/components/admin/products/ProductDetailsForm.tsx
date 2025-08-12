'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  DollarSign, 
  Hash, 
  Package, 
  Star,
  Eye,
  Search
} from 'lucide-react'
import { Product } from './types'

interface ProductDetailsFormProps {
  product: Product
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onSwitchChange: (field: string, value: boolean) => void
  isEdit: boolean
}

export default function ProductDetailsForm({
  product,
  onChange,
  onSwitchChange,
  isEdit
}: ProductDetailsFormProps) {

  return (
    <div className="space-y-8">
      {/* Pamata informācija */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <FileText className="w-5 h-5 text-emerald-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Pamata informācija</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Produkta nosaukums *
            </Label>
            <Input
              name="name"
              value={product.name}
              onChange={onChange}
              placeholder="Produkta nosaukums"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              URL Slug *
            </Label>
            <Input
              name="slug"
              value={product.slug}
              onChange={onChange}
              placeholder="produkta-slug"
              className="w-full"
              disabled={!isEdit} // Auto-generate for new products
            />
            {!isEdit && (
              <p className="text-xs text-gray-500">
                Slug tiks automātiski ģenerēts no nosaukuma
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Īss apraksts
          </Label>
          <Textarea
            name="short_description"
            value={product.short_description}
            onChange={onChange}
            placeholder="Īss produkta apraksts (parādās kartītēs)"
            rows={2}
            className="w-full"
          />
        </div>

        <div className="mt-6 space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Pilns apraksts
          </Label>
          <Textarea
            name="description"
            value={product.description}
            onChange={onChange}
            placeholder="Detalizēts produkta apraksts"
            rows={4}
            className="w-full"
          />
        </div>
      </div>

      {/* Cenas un krājumi */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <DollarSign className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Cenas un krājumi</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Cena (EUR) *
            </Label>
            <div className="relative">
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={product.price}
                onChange={onChange}
                placeholder="0.00"
                className="pl-8"
                required
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                €
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Akcijas cena (EUR)
            </Label>
            <div className="relative">
              <Input
                name="sale_price"
                type="number"
                step="0.01"
                min="0"
                value={product.sale_price || ''}
                onChange={onChange}
                placeholder="0.00"
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                €
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              SKU kods *
            </Label>
            <div className="relative">
              <Input
                name="sku"
                value={product.sku}
                onChange={onChange}
                placeholder="SKU-123"
                className="pl-8"
                required
              />
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Krājumu pārvaldība */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Pārvaldīt krājumus</p>
                <p className="text-xs text-gray-500">Ieslēdziet, lai sekotu preču daudzumam</p>
              </div>
            </div>
            <Switch
              checked={product.manage_stock}
              onCheckedChange={(checked) => onSwitchChange('manage_stock', checked)}
            />
          </div>

          {product.manage_stock && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Krājumu daudzums
              </Label>
              <Input
                name="stock_quantity"
                type="number"
                min="0"
                value={product.stock_quantity}
                onChange={onChange}
                placeholder="0"
                className="w-full md:w-48"
              />
            </div>
          )}
        </div>
      </div>

      {/* SEO un statusss */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
          <Search className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">SEO un statuss</h3>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Meta nosaukums
              </Label>
              <Input
                name="meta_title"
                value={product.meta_title}
                onChange={onChange}
                placeholder="SEO nosaukums (60 simboli)"
                maxLength={60}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                {product.meta_title.length}/60 simboli
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Statuss
              </Label>
              <select
                name="status"
                value={product.status}
                onChange={onChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Aktīvs</option>
                <option value="inactive">Neaktīvs</option>
                <option value="draft">Melnraksts</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Meta apraksts
            </Label>
            <Textarea
              name="meta_description"
              value={product.meta_description}
              onChange={onChange}
              placeholder="SEO apraksts (160 simboli)"
              maxLength={160}
              rows={3}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              {product.meta_description.length}/160 simboli
            </p>
          </div>

          {/* Statuss indikatori */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg flex-1">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Izcelt produktu</p>
                  <p className="text-xs text-yellow-700">Parādīt sākumlapā un akciju sadaļā</p>
                </div>
              </div>
              <Switch
                checked={product.featured}
                onCheckedChange={(checked) => onSwitchChange('featured', checked)}
              />
            </div>

            <Badge 
              variant={product.status === 'active' ? 'default' : 'secondary'}
              className="px-3 py-1"
            >
              {product.status === 'active' && <Eye className="w-3 h-3 mr-1" />}
              {product.status === 'active' ? 'Aktīvs' : 
               product.status === 'inactive' ? 'Neaktīvs' : 'Melnraksts'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}