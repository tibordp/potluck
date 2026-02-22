import { useRef, useState } from 'react';
import { clearAllData, exportData, importData } from '../api';
import { useUnitSystem } from '../helpers';
import type { UnitSystem } from '../helpers';
import { useToast } from './Toast';

const UNIT_OPTIONS: { value: UnitSystem; label: string; description: string }[] = [
  { value: 'original', label: 'Original', description: 'Show units as written in the recipe' },
  { value: 'metric', label: 'Metric', description: 'Convert to grams, milliliters, etc.' },
];

export default function Settings({ onLogout }: { onLogout: () => void }) {
  const [unitSystem, setUnitSystem] = useUnitSystem();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clearing, setClearing] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading('export');
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `potluck-export-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported successfully');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading('import');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importData(data);
      toast(
        `Imported: ${result.ingredients_created} ingredients created, ${result.ingredients_updated} updated, ${result.recipes_created} recipes created`
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import failed', 'error');
    } finally {
      setLoading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = async () => {
    setLoading('clear');
    try {
      await clearAllData(clearConfirmText);
      toast('All data cleared');
      setClearing(false);
      setClearConfirmText('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Clear failed', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Unit system</h2>
        <p className="text-sm text-gray-500 mb-3">
          Choose how ingredient amounts are displayed in recipes.
        </p>
        <div className="flex gap-2">
          {UNIT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setUnitSystem(opt.value)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                unitSystem === opt.value
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-800">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Data management</h2>
        <p className="text-sm text-gray-500 mb-3">Export, import, or clear all your data.</p>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={loading !== null}
              className="bg-brand-50 text-brand-600 px-4 py-2 rounded-lg font-medium hover:bg-brand-100 transition-colors text-sm disabled:opacity-50"
            >
              {loading === 'export' ? 'Exporting...' : 'Export data'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading !== null}
              className="bg-brand-50 text-brand-600 px-4 py-2 rounded-lg font-medium hover:bg-brand-100 transition-colors text-sm disabled:opacity-50"
            >
              {loading === 'import' ? 'Importing...' : 'Import data'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {!clearing ? (
            <button
              onClick={() => setClearing(true)}
              className="self-start bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
            >
              Clear all data
            </button>
          ) : (
            <div className="border border-red-200 rounded-lg p-3 bg-red-50">
              <p className="text-sm text-red-700 mb-2">
                Type <strong>yes I'm sure</strong> to confirm deletion of all data.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value)}
                  placeholder="yes I'm sure"
                  className="flex-1 px-3 py-2 rounded-lg border border-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  onClick={handleClear}
                  disabled={clearConfirmText !== "yes I'm sure" || loading !== null}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-red-700 transition-colors"
                >
                  {loading === 'clear' ? 'Clearing...' : 'Clear'}
                </button>
                <button
                  onClick={() => {
                    setClearing(false);
                    setClearConfirmText('');
                  }}
                  className="text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Account</h2>
        <button
          onClick={onLogout}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
