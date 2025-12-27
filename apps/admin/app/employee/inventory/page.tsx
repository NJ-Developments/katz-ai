'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { searchInventory } from '@/lib/api';
import {
  Search,
  ArrowLeft,
  Package,
  MapPin,
  Loader2,
  Home,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  aisle: string;
  bin?: string;
}

export default function EmployeeInventoryPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Redirect if not logged in or not employee
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'EMPLOYEE') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await searchInventory(token!, query);
      setResults(response.items || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user || user.role !== 'EMPLOYEE') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/employee')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Search Inventory</h1>
            <p className="text-xs text-gray-500">{user.storeName}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/employee')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          title="Home"
        >
          <Home className="h-5 w-5" />
        </button>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU, or category..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 p-4">
        {!searched ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Search for products
            </h2>
            <p className="text-gray-600">
              Enter a product name, SKU, or category to find items
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h2>
            <p className="text-gray-600">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Found {results.length} product{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">
                      ${item.price.toFixed(2)}
                    </p>
                    <p className={`text-xs ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                    </p>
                  </div>
                </div>
                {item.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  <span className="font-medium">
                    Aisle {item.aisle}
                    {item.bin && `, Bin ${item.bin}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
