'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAnalytics, getStore } from '@/lib/api';
import {
  MessageSquare,
  Clock,
  TrendingUp,
  Package,
  Users,
  Activity,
} from 'lucide-react';

interface Analytics {
  totalConversations: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  averageLatencyMs: number;
  topIntents: Array<{ intent: string; count: number }>;
  topRecommendedSkus: Array<{ sku: string; name: string; count: number }>;
  conversionRate: number;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  policies: any;
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  async function loadData() {
    try {
      const [analyticsData, storeData] = await Promise.all([
        getAnalytics(token!).catch(() => null),
        getStore(token!),
      ]);
      setAnalytics(analyticsData);
      setStore(storeData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Conversations"
          value={analytics?.totalConversations || 0}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Today"
          value={analytics?.conversationsToday || 0}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Avg Response Time"
          value={`${Math.round((analytics?.averageLatencyMs || 0) / 1000)}s`}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Conversion Rate"
          value={`${Math.round((analytics?.conversionRate || 0) * 100)}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Store Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Store Name</p>
            <p className="text-lg font-medium">{store?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Store ID</p>
            <p className="text-lg font-mono text-gray-600">{store?.slug}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Intents */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customer Intents</h2>
          {analytics?.topIntents && analytics.topIntents.length > 0 ? (
            <div className="space-y-3">
              {analytics.topIntents.map((intent, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize">
                    {intent.intent.replace(/_/g, ' ')}
                  </span>
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm">
                    {intent.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data yet. Start some conversations!</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Recommended Products</h2>
          {analytics?.topRecommendedSkus && analytics.topRecommendedSkus.length > 0 ? (
            <div className="space-y-3">
              {analytics.topRecommendedSkus.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-700">{product.name}</span>
                    <span className="text-gray-400 text-sm ml-2">({product.sku})</span>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
                    {product.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recommendations yet.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            href="/dashboard/inventory"
            icon={Package}
            title="Upload Inventory"
            description="Add or update products via CSV"
          />
          <QuickAction
            href="/dashboard/users"
            icon={Users}
            title="Manage Users"
            description="Add employees and managers"
          />
          <QuickAction
            href="/dashboard/settings"
            icon={Activity}
            title="Store Policies"
            description="Configure AI assistant behavior"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
    >
      <div className="bg-primary-100 p-2 rounded-lg mr-4">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </a>
  );
}
