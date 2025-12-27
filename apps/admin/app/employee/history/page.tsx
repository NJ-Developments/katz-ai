'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { getRecentConversations } from '@/lib/api';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  ChevronRight,
  Loader2,
  Home,
} from 'lucide-react';

interface Conversation {
  id: string;
  preview: string;
  timestamp: string;
  itemCount: number;
}

export default function EmployeeHistoryPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
      loadConversations();
    }
  }, [token, user]);

  async function loadConversations() {
    try {
      const data = await getRecentConversations(token!, 20);
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations:', e);
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
          <h1 className="font-semibold text-gray-900">Conversation History</h1>
        </div>
        <button
          onClick={() => router.push('/employee')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          title="Home"
        >
          <Home className="h-5 w-5" />
        </button>
      </header>

      {/* Conversations List */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              No conversations yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start helping customers to see your history here
            </p>
            <button
              onClick={() => router.push('/employee/assistant')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
            >
              Start Customer Help
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/employee/assistant?conversation=${conv.id}`)}
                className="w-full bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{conv.preview}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {conv.timestamp}
                    </div>
                    {conv.itemCount > 0 && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        {conv.itemCount} product{conv.itemCount !== 1 ? 's' : ''} recommended
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
