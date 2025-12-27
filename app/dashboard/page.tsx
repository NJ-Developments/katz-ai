'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Users, BarChart3, Settings, Plus, Search, Edit, Trash2, MessageCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Link from 'next/link'

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  price: number
  stock: number
  aisle: string
  bin: string | null
}

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'analytics'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch products
      const res = await fetch('/api/inventory')
      if (res.status === 401) {
        router.push('/')
        return
      }
      const data = await res.json()
      setProducts(data.products || [])
      setUser(data.user || null)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  const lowStock = products.filter(p => p.stock < 10).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar user={user} />

      {/* Sub Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'products'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package size={18} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
            >
              <Users size={18} />
              Team
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Soon</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
            >
              <Settings size={18} />
              Settings
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Soon</span>
            </button>
            <div className="flex-1" />
            <Link
              href="/assistant"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
            >
              <MessageCircle size={18} />
              AI Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto">
        {activeTab === 'products' && (
          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Products</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your store inventory</p>
              </div>
              <button className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition">
                <Plus size={18} />
                Add Product
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5 border">
                <p className="text-gray-500 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border">
                <p className="text-gray-500 text-sm">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border">
                <p className="text-gray-500 text-sm">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-500 mt-1">{lowStock}</p>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">{product.sku}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{product.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">${product.price}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${product.stock < 10 ? 'text-orange-500' : 'text-gray-900'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.aisle}{product.bin ? ` / ${product.bin}` : ''}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-blue-500 transition">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No products found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 lg:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
              <p className="text-gray-500 text-sm mt-1">Track your store performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border">
                <h3 className="font-semibold text-gray-900 mb-4">Inventory by Category</h3>
                <div className="space-y-3">
                  {Object.entries(
                    products.reduce((acc, p) => {
                      acc[p.category] = (acc[p.category] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{category}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border">
                <h3 className="font-semibold text-gray-900 mb-4">Stock Levels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">In Stock (10+)</span>
                    <span className="text-sm font-medium text-green-600">{products.filter(p => p.stock >= 10).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Low Stock (1-9)</span>
                    <span className="text-sm font-medium text-orange-500">{products.filter(p => p.stock > 0 && p.stock < 10).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Out of Stock</span>
                    <span className="text-sm font-medium text-red-500">{products.filter(p => p.stock === 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}
