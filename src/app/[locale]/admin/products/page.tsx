'use client'

import { Product } from '@/components/admin/products/types'
import { useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Pencil, 
  Trash, 
  Package, 
  Search, 
  Eye,
  EyeOff,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react'
import ProductModal from '@/components/admin/products/ProductModal'
import { useAlert } from '@lib/store/alert'
import { useLoading } from '@hooks/useLoading'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ProductsData {
  products: Product[]
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Network response was not ok')
  return res.json()
})

export default function ProductsAdminPage() {
  const { data: productsData, mutate, error } = useSWR<ProductsData>('/api/products?admin=true', fetcher)
  const [selected, setSelected] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const { setAlert } = useAlert()
  const { isLoading, withLoading } = useLoading()

  const handleAdd = () => {
    setSelected(null)
    setModalOpen(true)
  }

  const handleEdit = (item: Product) => {
    setSelected(item)
    setModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Vai tiešām dzēst produktu "${name}"?`)) return

    await withLoading(async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ id })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Kļūda dzēšot produktu')
        }

        setAlert(data.message || 'Produkts dzēsts', 'success')
        mutate()
      } catch (err) {
        setAlert(
          err instanceof Error ? err.message : 'Kļūda dzēšot produktu', 
          'error'
        )
      }
    })
  }

  const toggleStatus = async (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    await withLoading(async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ id, status: newStatus })
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Neizdevās mainīt statusu')
        }

        setAlert(
          `Produkts "${name}" ${newStatus === 'active' ? 'aktivizēts' : 'deaktivizēts'}`, 
          'success'
        )
        mutate()
      } catch (err) {
        setAlert(
          err instanceof Error ? err.message : 'Neizdevās mainīt statusu', 
          'error'
        )
      }
    })
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/products/export', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `produkti_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      setAlert('Neizdevās eksportēt produktus', 'error')
    }
  }

if (error) {
  console.error('Products loading error:', error)
  return (
    <div className="space-y-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-red-900 mb-2">Kļūda ielādējot produktus</h2>
        <p className="text-red-700">Lūdzu atsvaidziniet lapu vai mēģiniet vēlāk.</p>
        {error && (
          <p className="text-sm text-red-600 mt-2">
            Detaļas: {error.message || 'Nezināma kļūda'}
          </p>
        )}
        <Button 
          onClick={() => mutate()}
          className="mt-4"
          variant="outline"
        >
          Mēģināt vēlreiz
        </Button>
      </div>
    </div>
  )
}

  const products = productsData?.products || []
  
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    
    const matchesCategory = categoryFilter === 'all' || 
      product.category_id === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const stats = {
    total: products.length,
    active: products.filter((p: Product) => p.status === 'active').length,
    inactive: products.filter((p: Product) => p.status === 'inactive').length,
    outOfStock: products.filter((p: Product) => p.manage_stock && p.stock_quantity === 0).length
  }

  return (
    <div className="space-y-8">
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
          <div className="flex space-x-3">
            <Button 
              onClick={handleExport}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download className="w-4 h-4 mr-2" />
              Eksportēt
            </Button>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <Badge variant="secondary">{stats.total}</Badge>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Kopā produktu</h3>
          <p className="text-sm text-gray-600">Visi produkti sistēmā</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">{stats.active}</Badge>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Aktīvi</h3>
          <p className="text-sm text-gray-600">Redzami veikalā</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
              <EyeOff className="w-6 h-6 text-white" />
            </div>
            <Badge variant="secondary">{stats.inactive}</Badge>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Neaktīvi</h3>
          <p className="text-sm text-gray-600">Slēpti no veikala</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <Badge variant="destructive">{stats.outOfStock}</Badge>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Nav krājumā</h3>
          <p className="text-sm text-gray-600">Nepieejami pirkšanai</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Meklēt produktus vai SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Visi statusi</option>
              <option value="active">Aktīvi</option>
              <option value="inactive">Neaktīvi</option>
              <option value="draft">Melnraksti</option>
            </select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtri
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-3">
                  <h4 className="font-medium">Papildu filtri</h4>
                  <div>
                    <label className="text-sm text-gray-600">Kategorija</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">Visas kategorijas</option>
                    </select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Rāda {filteredProducts.length} no {stats.total} produktiem
          </span>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
            >
              Notīrīt meklēšanu
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {!productsData ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ielādē produktus...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nav atrasti produkti' : 'Nav produktu'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Mēģiniet mainīt meklēšanas kritērijus' 
                : 'Pievienojiet pirmo produktu, lai sāktu'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Pievienot produktu
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produkts
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Krājumi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statuss
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Darbības
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">{product.slug}</p>
                          {product.featured && (
                            <Badge variant="default" className="mt-1 text-xs">
                              Izceltais
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        {product.sale_price ? (
                          <>
                            <span className="line-through text-gray-500">€{product.price}</span>
                            <span className="ml-2 text-red-600 font-semibold">€{product.sale_price}</span>
                          </>
                        ) : (
                          <span className="font-semibold">€{product.price}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.manage_stock ? (
                        <div className={`flex items-center ${
                          product.stock_quantity === 0 ? 'text-red-600' : 
                          product.stock_quantity < 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          <span className="font-medium">{product.stock_quantity}</span>
                          <span className="ml-1 text-xs">gab.</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Nav ierobežots
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          product.status === 'active' ? 'default' : 
                          product.status === 'inactive' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {product.status === 'active' ? 'Aktīvs' : 
                         product.status === 'inactive' ? 'Neaktīvs' : 'Melnraksts'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                          disabled={isLoading}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => product.id && toggleStatus(product.id, product.status, product.name)}
                          disabled={isLoading}
                          className={product.status === 'active' ? 'hover:bg-yellow-50' : 'hover:bg-green-50'}
                        >
                          {product.status === 'active' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => product.id && handleDelete(product.id, product.name)}
                              disabled={isLoading}
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Dzēst
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSave={() => {
          mutate()
          setSelected(null)
        }}
      />
    </div>
  )
}