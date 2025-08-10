'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash, Package, Search, Eye, MoreHorizontal } from 'lucide-react'
import ProductModal from '@/components/admin/ProductModal'
import { useAlert } from '@lib/store/alert'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProductsAdminPage() {
  const { data: productsData, mutate } = useSWR('/api/products?admin=true', fetcher)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { setAlert } = useAlert()

  const handleAdd = () => {
    setSelected(null)
    setModalOpen(true)
  }

  const handleEdit = (item: any) => {
    setSelected(item)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Vai tiešām dzēst šo produktu?')) return

    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (res.ok) {
      setAlert('Produkts dzēsts', 'success')
      mutate()
    } else {
      const err = await res.json()
      setAlert(err.error || 'Kļūda dzēšot produktu', 'error')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    const res = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    })

    if (res.ok) {
      setAlert(`Produkts ${newStatus === 'active' ? 'aktivizēts' : 'deaktivizēts'}`, 'success')
      mutate()
    } else {
      setAlert('Neizdevās mainīt statusu', 'error')
    }
  }

  const products = productsData?.products || []
  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Package className="w-8 h-8 mr-3" />
              Produktu pārvaldība
            </h1>
            <p className="text-emerald-100 text-lg">
              Pārvaldiet veikala produktus, cenas un pieejamību
            </p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Pievienot produktu
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-gray-600 text-sm">Kopā produkti</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {products.filter((p: any) => p.status === 'active').length}
              </p>
              <p className="text-gray-600 text-sm">Aktīvie</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {products.filter((p: any) => p.stock_quantity < 5).length}
              </p>
              <p className="text-gray-600 text-sm">Zemi krājumi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {products.filter((p: any) => p.featured).length}
              </p>
              <p className="text-gray-600 text-sm">Populārie</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Meklēt produktus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
            <option value="">Visi statusi</option>
            <option value="active">Aktīvs</option>
            <option value="inactive">Neaktīvs</option>
            <option value="draft">Melnraksts</option>
          </select>

          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
            <option value="">Visas kategorijas</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Produkts</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Kategorija</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Cena</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Krājumi</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Statuss</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">Darbības</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.short_description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.navigation_categories?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          €{(product.sale_price || product.price).toFixed(2)}
                        </span>
                        {product.sale_price && (
                          <span className="text-gray-500 line-through ml-2">
                            €{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        product.stock_quantity < 5 
                          ? 'text-red-600' 
                          : product.stock_quantity < 20 
                            ? 'text-orange-600' 
                            : 'text-green-600'
                      }`}>
                        {product.stock_quantity} gab.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(product.id, product.status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.status === 'active' ? 'Aktīvs' : 
                         product.status === 'inactive' ? 'Neaktīvs' : 'Melnraksts'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0" align="end">
                          <div className="py-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>Labot</span>
                            </button>
                            <a
                              href={`/produkti/${product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Skatīt</span>
                            </a>
                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                                <span>Dzēst</span>
                              </button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nav produktu</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Nav atrasts neviens produkts ar norādītajiem kritērijiem' : 'Sāciet, pievienojot savu pirmo produktu'}
            </p>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-emerald-500 to-teal-600">
              <Plus className="w-4 h-4 mr-2" />
              Pievienot produktu
            </Button>
          </div>
        )}
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSave={mutate}
      />
    </div>
  )
}