import { useUnitSystem } from '../helpers';
import type { UnitSystem } from '../helpers';

const UNIT_OPTIONS: { value: UnitSystem; label: string; description: string }[] = [
  { value: 'original', label: 'Original', description: 'Show units as written in the recipe' },
  { value: 'metric', label: 'Metric', description: 'Convert to grams, milliliters, etc.' },
];

export default function Settings({ onLogout }: { onLogout: () => void }) {
  const [unitSystem, setUnitSystem] = useUnitSystem();

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
