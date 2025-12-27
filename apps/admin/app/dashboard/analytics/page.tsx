'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAnalytics, getConversationLogs } from '@/lib/api';
import {
  BarChart3,
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

interface ConversationLog {
  id: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
  recommendedSkus: string[];
  latencyMs: number;
  intent: string;
  createdAt: string;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  async function loadData() {
    try {
      const [analyticsData, logsData] = await Promise.all([
        getAnalytics(token!),
        getConversationLogs(token!, 20),
      ]);
      setAnalytics(analyticsData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Insights into assistant performance and usage</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Conversations"
          value={analytics?.totalConversations || 0}
          icon={MessageSquare}
          change={`${analytics?.conversationsThisWeek || 0} this week`}
        />
        <StatCard
          title="Today"
          value={analytics?.conversationsToday || 0}
          icon={TrendingUp}
          change="conversations"
        />
        <StatCard
          title="Avg Response Time"
          value={`${((analytics?.averageLatencyMs || 0) / 1000).toFixed(1)}s`}
          icon={Clock}
          change="seconds"
        />
        <StatCard
          title="Conversion Rate"
          value={`${Math.round((analytics?.conversionRate || 0) * 100)}%`}
          icon={BarChart3}
          change="to cart"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Intents */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customer Intents</h2>
          {analytics?.topIntents?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topIntents.map((intent: any, idx: number) => {
                const maxCount = analytics.topIntents[0].count;
                const percentage = (intent.count / maxCount) * 100;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 capitalize">
                        {intent.intent.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-500">{intent.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No intent data yet</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Recommended Products</h2>
          {analytics?.topRecommendedSkus?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topRecommendedSkus.map((product: any, idx: number) => {
                const maxCount = analytics.topRecommendedSkus[0].count;
                const percentage = (product.count / maxCount) * 100;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate flex-1 mr-2">
                        {product.name}
                      </span>
                      <span className="text-gray-500">{product.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No product data yet</p>
          )}
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
        </div>

        {logs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={clsx(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          'bg-gray-100 text-gray-600'
                        )}
                      >
                        {log.intent?.replace(/_/g, ' ') || 'general'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {log.latencyMs}ms
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Customer asked:</p>
                        <p className="text-sm text-gray-900">{log.userMessage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Assistant response:</p>
                        <p className="text-sm text-gray-700">{log.assistantMessage}</p>
                      </div>
                    </div>

                    {log.recommendedSkus.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Recommended:</span>
                        <div className="flex gap-1">
                          {log.recommendedSkus.slice(0, 3).map((sku) => (
                            <code
                              key={sku}
                              className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded"
                            >
                              {sku}
                            </code>
                          ))}
                          {log.recommendedSkus.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{log.recommendedSkus.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations yet</p>
            <p className="text-sm">Start using the mobile app to see analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  change,
}: {
  title: string;
  value: string | number;
  icon: any;
  change: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-primary-100 p-2 rounded-lg">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{change}</p>
    </div>
  );
}
