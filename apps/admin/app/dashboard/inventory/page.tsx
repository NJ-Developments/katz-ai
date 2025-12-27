'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getInventory, searchInventory, uploadInventoryCSV } from '@/lib/api';
import {
  Upload,
  Search,
  Package,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import clsx from 'clsx';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  aisle: string;
  bin: string;
  tags: string[];
}

interface UploadResult {
  message: string;
  results: {
    created: number;
    updated: number;
    errors: Array<{ row: number; error: string }>;
  };
}

export default function InventoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      loadInventory();
    }
  }, [token]);

  async function loadInventory(page = 1) {
    setLoading(true);
    try {
      const response = await getInventory(token!, page);
      setItems(response.data);
      setPagination({
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems,
      });
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadInventory();
      return;
    }

    setLoading(true);
    try {
      const response = await searchInventory(token!, searchQuery);
      setItems(response.items);
      setPagination({ page: 1, totalPages: 1, totalItems: response.items.length });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadInventoryCSV(token!, file);
      setUploadResult(result);
      loadInventory(); // Refresh inventory after upload
    } catch (error: any) {
      setUploadResult({
        message: 'Upload failed',
        results: { created: 0, updated: 0, errors: [{ row: 0, error: error.message }] },
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">{pagination.totalItems} items in stock</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors',
              uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            )}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </label>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div
          className={clsx(
            'p-4 rounded-lg flex items-start gap-3',
            uploadResult.results.errors.length > 0
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-green-50 border border-green-200'
          )}
        >
          {uploadResult.results.errors.length > 0 ? (
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              Created: {uploadResult.results.created} | Updated: {uploadResult.results.updated}
            </p>
            {uploadResult.results.errors.length > 0 && (
              <div className="mt-2 text-sm text-yellow-700">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside">
                  {uploadResult.results.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button onClick={() => setUploadResult(null)}>
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              loadInventory();
            }}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </form>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="h-12 w-12 mb-4" />
            <p>No inventory items found</p>
            <p className="text-sm">Upload a CSV to add products</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.sku}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-gray-700">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">${item.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          item.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : item.stock < 10
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        )}
                      >
                        {item.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>
                          {item.aisle}
                          {item.bin && ` / ${item.bin}`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadInventory(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadInventory(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSV Template Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">CSV Format</h3>
        <p className="text-sm text-blue-800 mb-3">
          Upload a CSV file with the following columns:
        </p>
        <code className="text-xs bg-blue-100 px-3 py-2 rounded block overflow-x-auto">
          sku,name,description,category,price,stock,aisle,bin,tags,attributes
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Tags should be comma-separated. Attributes should be a JSON object.
        </p>
      </div>
    </div>
  );
}
