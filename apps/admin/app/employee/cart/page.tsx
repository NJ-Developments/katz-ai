'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { getCart, removeFromCart, clearCart } from '@/lib/api';
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  MapPin,
  Package,
  Loader2,
  Home,
} from 'lucide-react';

interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  location?: string;
}

export default function EmployeeCartPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'EMPLOYEE') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token && user?.role === 'EMPLOYEE') {
      loadCart();
    }
  }, [token, user]);

  async function loadCart() {
    try {
      const cart = await getCart(token!);
      setItems(cart.items || []);
      setTotal(cart.total || 0);
    } catch (e) {
      console.error('Failed to load cart:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(sku: string) {
    try {
      const result = await removeFromCart(token!, sku);
      setItems(result.items || []);
      setTotal(result.total || 0);
    } catch (e) {
      console.error('Failed to remove item:', e);
    }
  }

  async function handleClear() {
    try {
      await clearCart(token!);
      setItems([]);
      setTotal(0);
    } catch (e) {
      console.error('Failed to clear cart:', e);
    }
  }

  if (authLoading || loading) {
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
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Customer Cart</h1>
            <p className="text-xs text-gray-500">{items.length} items</p>
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

      {/* Cart Items */}
      <div className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Use the AI assistant to find products for customers
            </p>
            <button
              onClick={() => router.push('/employee/assistant')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
            >
              Start Customer Help
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.sku}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    {item.location && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {item.location}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(item.sku)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                  <span className="font-semibold text-primary-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Total & Actions */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary-600">${total.toFixed(2)}</span>
              </div>
              <div className="mt-4 space-y-3">
                <button className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700">
                  Complete Sale
                </button>
                <button
                  onClick={handleClear}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
