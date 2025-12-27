'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getStore, updateStorePolicies } from '@/lib/api';
import { Settings, Save, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface StorePolicy {
  preferNoDamage: boolean;
  preferNoTools: boolean;
  suggestDrillingFirst: boolean;
  safetyDisclaimers: boolean;
  maxBudgetDefault?: number;
  customInstructions?: string;
}

export default function SettingsPage() {
  const { token, user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [policies, setPolicies] = useState<StorePolicy>({
    preferNoDamage: false,
    preferNoTools: false,
    suggestDrillingFirst: false,
    safetyDisclaimers: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (token) {
      loadStore();
    }
  }, [token]);

  async function loadStore() {
    try {
      const data = await getStore(token!);
      setStore(data);
      setPolicies(data.policies || {});
    } catch (error) {
      console.error('Failed to load store:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      await updateStorePolicies(token!, store.id, policies);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save policies:', error);
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your store and AI assistant behavior</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700',
            saving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </>
          )}
        </button>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Store Name</p>
            <p className="font-medium">{store?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Store Slug</p>
            <p className="font-mono text-gray-600">{store?.slug}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{store?.address || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* AI Assistant Policies */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Assistant Policies</h2>
        <p className="text-sm text-gray-500 mb-6">
          These settings control how the AI assistant makes recommendations
        </p>

        <div className="space-y-6">
          {/* Toggle Options */}
          <div className="space-y-4">
            <PolicyToggle
              label="Prefer No-Damage Solutions"
              description="Prioritize rental-friendly and removable options when recommending products"
              checked={policies.preferNoDamage}
              onChange={(checked) => setPolicies({ ...policies, preferNoDamage: checked })}
            />

            <PolicyToggle
              label="Prefer No-Tools Options"
              description="Prioritize products that don't require tools for installation"
              checked={policies.preferNoTools}
              onChange={(checked) => setPolicies({ ...policies, preferNoTools: checked })}
            />

            <PolicyToggle
              label="Suggest Drilling First"
              description="When drilling is the best solution, suggest it as the primary option"
              checked={policies.suggestDrillingFirst}
              onChange={(checked) => setPolicies({ ...policies, suggestDrillingFirst: checked })}
            />

            <PolicyToggle
              label="Safety Disclaimers"
              description="Add safety warnings for electrical, plumbing, and structural tasks"
              checked={policies.safetyDisclaimers}
              onChange={(checked) => setPolicies({ ...policies, safetyDisclaimers: checked })}
            />
          </div>

          {/* Budget Default */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Budget Limit (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              If set, the AI will prefer products under this price point
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={policies.maxBudgetDefault || ''}
                onChange={(e) =>
                  setPolicies({
                    ...policies,
                    maxBudgetDefault: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="50.00"
              />
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Instructions
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Additional instructions for the AI assistant (e.g., store-specific policies)
            </p>
            <textarea
              value={policies.customInstructions || ''}
              onChange={(e) =>
                setPolicies({ ...policies, customInstructions: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Always offer to walk customers to the product location. Mention our price match guarantee."
            />
          </div>
        </div>
      </div>

      {/* Truth Mode Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">🛡️ Truth Mode Active</h3>
        <p className="text-sm text-blue-800">
          The AI assistant is configured with Truth Mode enabled. It will:
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
          <li>Only recommend products that are verified in-stock</li>
          <li>Never hallucinate or make up product information</li>
          <li>Clearly state when it cannot find a matching product</li>
          <li>Ask employees to verify stock when uncertain</li>
        </ul>
      </div>
    </div>
  );
}

function PolicyToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          checked ? 'bg-primary-600' : 'bg-gray-200'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
