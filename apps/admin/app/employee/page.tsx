'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Search,
  QrCode,
  Package,
  MessageSquare,
  Clock,
  ChevronRight,
  LogOut,
  User,
  MapPin,
  Loader2,
} from 'lucide-react';
import { getRecentConversations, getRecentRecommendations } from '@/lib/api';

interface RecentConversation {
  id: string;
  preview: string;
  timestamp: string;
  itemCount: number;
}

interface RecentRecommendation {
  sku: string;
  name: string;
  price: number;
  location: string;
  recommendedAt: string;
}

export default function EmployeeHomePage() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [recentRecommendations, setRecentRecommendations] = useState<RecentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect managers to dashboard, non-auth to login
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'EMPLOYEE') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Load recent data
  useEffect(() => {
    if (token && user?.role === 'EMPLOYEE') {
      loadRecentData();
    }
  }, [token, user]);

  async function loadRecentData() {
    try {
      const [conversations, recommendations] = await Promise.all([
        getRecentConversations(token!, 5).catch(() => []),
        getRecentRecommendations(token!, 5).catch(() => []),
      ]);
      setRecentConversations(conversations);
      setRecentRecommendations(recommendations);
    } catch (e) {
      console.error('Failed to load recent data:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleStartHelp() {
    router.push('/employee/assistant');
  }

  function handleSearchInventory() {
    router.push('/employee/inventory');
  }

  function handleScanBarcode() {
    // Stub for now - would open camera/scanner
    alert('Barcode scanning coming soon!');
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
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">KatzAI</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{user.storeName}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  Employee
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/employee/profile')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Profile"
            >
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Welcome */}
        <div className="text-center py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 mt-1">How can I help you today?</p>
        </div>

        {/* Primary CTA - Start Customer Help */}
        <button
          onClick={handleStartHelp}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-2xl p-6 shadow-lg transition-all active:scale-[0.98] flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Mic className="h-8 w-8" />
          </div>
          <span className="text-xl font-semibold">Start Customer Help</span>
          <span className="text-primary-200 text-sm">Tap to start a conversation</span>
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSearchInventory}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-green-600" />
            </div>
            <span className="font-medium text-gray-900">Search Inventory</span>
          </button>
          <button
            onClick={handleScanBarcode}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <QrCode className="h-6 w-6 text-purple-600" />
            </div>
            <span className="font-medium text-gray-900">Scan Barcode</span>
          </button>
        </div>

        {/* Recent Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Conversations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">Recent Conversations</h3>
              </div>
              <button
                onClick={() => router.push('/employee/history')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : recentConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start one now!</p>
                </div>
              ) : (
                recentConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => router.push(`/employee/assistant?conversation=${conv.id}`)}
                    className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{conv.preview}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{conv.timestamp}</span>
                        {conv.itemCount > 0 && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {conv.itemCount} items
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Recent Recommendations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">Recent Recommendations</h3>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : recentRecommendations.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No recommendations yet</p>
                  <p className="text-gray-400 text-xs mt-1">Help a customer to see items here</p>
                </div>
              ) : (
                recentRecommendations.map((item, idx) => (
                  <div
                    key={`${item.sku}-${idx}`}
                    className="px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary-600">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
